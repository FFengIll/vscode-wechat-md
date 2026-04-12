import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { WeChatRenderer } from '../renderer';
import { buildWebviewHtml } from './webview';
import { resolveImagesAsBase64 } from './imageUtils';

export class PreviewPanel {
  static currentPanel: PreviewPanel | undefined;
  private static readonly viewType = 'wechatMdPreview';

  private readonly panel: vscode.WebviewPanel;
  private readonly renderer: WeChatRenderer;
  private disposables: vscode.Disposable[] = [];

  // Track the last known markdown editor so we don't lose it when webview takes focus
  private lastMarkdownEditor: vscode.TextEditor | undefined;

  static createOrShow(extensionUri: vscode.Uri): PreviewPanel {
    if (PreviewPanel.currentPanel) {
      // Always reveal in Beside column, never steal the editor column
      PreviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside, true);
      PreviewPanel.currentPanel.refresh();
      return PreviewPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      PreviewPanel.viewType,
      'WeChat Markdown Preview',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        localResourceRoots: [
          extensionUri,
          // Allow loading images from anywhere on the filesystem
          vscode.Uri.file('/'),
        ],
      }
    );

    PreviewPanel.currentPanel = new PreviewPanel(panel);
    return PreviewPanel.currentPanel;
  }

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.renderer = new WeChatRenderer();

    // Initialize shiki highlighter — refresh again once ready so preview gets syntax highlighting
    this.renderer.initHighlighter().then(() => this.refresh()).catch(() => { /* use plain fallback */ });

    // Capture the current markdown editor before the panel takes focus
    const current = vscode.window.activeTextEditor;
    if (current && current.document.languageId === 'markdown') {
      this.lastMarkdownEditor = current;
    }

    this.refresh();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Only update lastMarkdownEditor when user switches to an actual text editor
    // (not when focus moves to the webview panel itself — webview gives undefined)
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'markdown') {
        this.lastMarkdownEditor = editor;
        this.refresh();
      }
      // If editor is undefined (webview gained focus) or non-markdown, keep showing last content
    }, null, this.disposables);

    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === this.lastMarkdownEditor?.document) {
        this.refresh();
      }
    }, null, this.disposables);

    // Watch .wechat/theme.css for changes and reload renderer
    this.watchCustomTheme();

    this.panel.webview.onDidReceiveMessage(
      async message => {
        if (message.command === 'copyRich') {
          const markdown = this.lastMarkdownEditor?.document.getText() ?? '';
          const copyHtml = this.renderer.render(markdown, 'copy');
          const docDir = this.lastMarkdownEditor ? path.dirname(this.lastMarkdownEditor.document.uri.fsPath) : '';
          const resolved = await resolveImagesAsBase64(copyHtml, docDir);
          this.panel.webview.postMessage({ command: 'doRichCopy', html: resolved });
        } else if (message.command === 'openTheme') {
          this.openOrCreateCustomTheme();
        } else if (message.command === 'refresh') {
          this.refresh();
        }
      },
      null,
      this.disposables
    );
  }

  refresh(): void {
    const editor = this.lastMarkdownEditor;
    if (!editor) {
      this.panel.webview.html = buildWebviewHtml(
        '<p style="color:#999;text-align:center;padding:40px;">请先打开一个 Markdown 文件</p>',
        getNonce()
      );
      return;
    }
    // Re-read custom theme on each refresh so edits apply immediately
    this.renderer.reloadTheme(this.getCustomThemePath());
    const markdown = editor.document.getText();
    const docDir = path.dirname(editor.document.uri.fsPath);
    const rendered = this.resolveLocalImages(this.renderer.render(markdown), docDir);
    this.panel.webview.html = buildWebviewHtml(rendered, getNonce());
  }

  // Replace local file paths in img src with webview URIs so the webview can load them.
  // Handles: relative paths (../foo.png), absolute paths (/Users/...)
  // Leaves http/https/data URIs untouched.
  private resolveLocalImages(html: string, docDir: string): string {
    return html.replace(/(<img[^>]+src=")([^"]+)(")/g, (_match, pre, src, post) => {
      if (/^https?:\/\/|^data:/i.test(src)) { return pre + src + post; }
      // Decode HTML entities from escapeHtml (&amp; → & etc.) before resolving
      const decoded = src.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const absolute = path.isAbsolute(decoded)
        ? decoded
        : path.resolve(docDir, decoded);
      const uri = this.panel.webview.asWebviewUri(vscode.Uri.file(absolute));
      return pre + uri.toString() + post;
    });
  }

  private getCustomThemePath(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) { return null; }
    const p = path.join(workspaceFolders[0].uri.fsPath, '.wechat', 'theme.css');
    return fs.existsSync(p) ? p : null;
  }

  private watchCustomTheme(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) { return; }
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolders[0], '.wechat/theme.css')
    );
    watcher.onDidChange(() => this.refresh(), null, this.disposables);
    watcher.onDidCreate(() => this.refresh(), null, this.disposables);
    watcher.onDidDelete(() => this.refresh(), null, this.disposables);
    this.disposables.push(watcher);
  }

  private openOrCreateCustomTheme(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('请先打开一个工作区文件夹。');
      return;
    }
    const dir = path.join(workspaceFolders[0].uri.fsPath, '.wechat');
    const filePath = path.join(dir, 'theme.css');
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
    if (!fs.existsSync(filePath)) {
      const defaultCssPath = path.join(__dirname, 'defaultTheme.css');
      fs.copyFileSync(defaultCssPath, filePath);
    }
    vscode.window.showTextDocument(vscode.Uri.file(filePath));
  }

  dispose(): void {
    PreviewPanel.currentPanel = undefined;
    this.panel.dispose();
    for (const d of this.disposables) { d.dispose(); }
    this.disposables = [];
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
