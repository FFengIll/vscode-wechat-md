import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { WeChatRenderer } from '../renderer';

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
          const resolved = await resolveImagesAsBase64(copyHtml);
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
      this.panel.webview.html = this.buildHtml('', '请先打开一个 Markdown 文件');
      return;
    }
    // Re-read custom theme on each refresh so edits apply immediately
    this.renderer.reloadTheme(this.getCustomThemePath());
    const markdown = editor.document.getText();
    const docDir = path.dirname(editor.document.uri.fsPath);
    const rendered = this.resolveLocalImages(this.renderer.render(markdown), docDir);
    this.panel.webview.html = this.buildHtml(rendered, null);
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
      fs.writeFileSync(filePath, DEFAULT_THEME_CSS, 'utf-8');
    }
    vscode.window.showTextDocument(vscode.Uri.file(filePath));
  }

  private buildHtml(rendered: string, placeholder: string | null): string {
    const nonce = getNonce();
    const content = placeholder
      ? `<p style="color:#999;text-align:center;padding:40px;">${placeholder}</p>`
      : rendered;

    return /* html */ `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src * data:;">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; font-family: sans-serif; }
    #toolbar {
      position: sticky; top: 0; z-index: 10;
      background: #07C160; padding: 8px 16px;
      display: flex; align-items: center; gap: 8px;
    }
    #toolbar button {
      background: #fff; color: #07C160;
      border: none; border-radius: 4px;
      padding: 5px 12px; font-size: 13px;
      cursor: pointer; font-weight: bold;
    }
    #toolbar button:hover { background: #e8f8ef; }
    #toolbar button.secondary {
      background: transparent; color: rgba(255,255,255,0.85);
      border: 1px solid rgba(255,255,255,0.5);
      font-weight: normal;
    }
    #toolbar button.secondary:hover { background: rgba(255,255,255,0.15); }
    #toolbar span { color: #fff; font-size: 12px; flex: 1; }
    #preview { padding: 24px 16px; }
    /* Shiki code block card */
    .shiki.wmd-code-block {
      position: relative;
      background: #fff !important;
      border: 1px solid #e3e3e3;
      border-radius: 8px;
      margin: 1em 0;
      padding: 0;
      overflow: hidden;
      counter-reset: line;
    }
    .shiki.wmd-code-block::before {
      content: attr(data-lang-label);
      position: absolute;
      top: 8px; right: 12px;
      font-size: 11px;
      color: #e3e3e3;
      font-family: sans-serif;
    }
    .shiki.wmd-code-block code {
      display: block;
      padding: 8px 16px 8px 0;
      overflow-x: auto;
    }
    .shiki.wmd-code-block .line {
      display: block;
      padding-left: 0;
      line-height: 1.7;
    }
    .shiki.wmd-code-block .line::before {
      counter-increment: line;
      content: counter(line);
      display: inline-block;
      width: 2.5em;
      padding-right: 1em;
      text-align: right;
      color: #e3e3e3;
      border-right: 1px solid #e1e4e8;
      margin-right: 1em;
      font-size: 12px;
      user-select: none;
    }
    /* Rich-copy staging area: must be in DOM and selectable, but invisible */
    #rich-copy-stage {
      position: fixed; top: -9999px; left: -9999px;
      opacity: 0; pointer-events: none;
      white-space: normal;
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <button id="copyRichBtn">✂️ 复制内容</button>
    <button id="themeBtn" class="secondary">🎨 自定义样式</button>
    <button id="refreshBtn" class="secondary">🔄 刷新</button>
    <span id="tip"></span>
  </div>
  <div id="preview">${content}</div>
  <!-- staging area for rich-text copy via execCommand -->
  <div id="rich-copy-stage" contenteditable="true"></div>
  <script nonce="${nonce}">
    const vscodeApi = window.acquireVsCodeApi();

    // Rich-text copy: send HTML to host for image base64 conversion,
    // then do execCommand('copy') on the resolved HTML when it comes back.
    document.getElementById('copyRichBtn').addEventListener('click', function() {
      var html = document.getElementById('preview').innerHTML;
      showTip('⏳ 处理中...');
      vscodeApi.postMessage({ command: 'copyRich', html: html });
    });

    document.getElementById('themeBtn').addEventListener('click', function() {
      vscodeApi.postMessage({ command: 'openTheme' });
    });

    document.getElementById('refreshBtn').addEventListener('click', function() {
      vscodeApi.postMessage({ command: 'refresh' });
    });

    window.addEventListener('message', function(event) {
      var msg = event.data;
      if (!msg) { return; }
      if (msg.command === 'doRichCopy') {
        var stage = document.getElementById('rich-copy-stage');
        stage.innerHTML = msg.html;
        var range = document.createRange();
        range.selectNodeContents(stage);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        var ok = document.execCommand('copy');
        sel.removeAllRanges();
        stage.innerHTML = '';
        showTip(ok ? '✅ 已复制，直接去公众号编辑器粘贴！' : '❌ 复制失败');
      }
    });

    function showTip(msg) {
      var tip = document.getElementById('tip');
      tip.textContent = msg;
      setTimeout(function() { tip.textContent = ''; }, 3000);
    }
  </script>
</body>
</html>`;
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

// Replace vscode-webview-resource: and local file URIs in img src with base64 data URIs.
// This is necessary because WeChat editor cannot load vscode-internal or file:// URLs.
async function resolveImagesAsBase64(html: string): Promise<string> {
  const pattern = /(<img[^>]+src=")([^"]+)(")/g;
  const matches: { full: string; pre: string; src: string; post: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html)) !== null) {
    matches.push({ full: m[0], pre: m[1], src: m[2], post: m[3] });
  }

  for (const match of matches) {
    const src = match.src;
    // Skip already-base64
    if (/^data:/i.test(src)) { continue; }

    try {
      let filePath: string;
      // Actual format: https://file+.vscode-resource.vscode-cdn.net/abs/path/to/file
      if (/vscode-resource\.vscode-cdn\.net/i.test(src)) {
        const pathPart = src.replace(/^https?:\/\/[^/]+/, '');
        filePath = decodeURIComponent(pathPart);
      } else if (src.startsWith('vscode-webview-resource:')) {
        const withoutScheme = src.replace(/^vscode-webview-resource:\/\/[^/]*/, '');
        filePath = decodeURIComponent(withoutScheme);
      } else if (src.startsWith('file://')) {
        filePath = decodeURIComponent(src.replace(/^file:\/\//, ''));
      } else {
        // Plain remote URL — leave as-is
        continue;
      }

      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      const mime = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
      const dataUri = `data:image/${mime};base64,${data.toString('base64')}`;
      html = html.replace(match.full, match.pre + dataUri + match.post);
    } catch {
      // If we can't read the file, leave it as-is
    }
  }
  return html;
}

// Default template written to .wechat/theme.css on first open
const DEFAULT_THEME_CSS = `/*
 * WeChat Markdown 自定义主题
 * 修改此文件中的 CSS 变量来调整渲染样式。
 * 保存后预览面板会自动刷新。
 *
 * 仅支持 CSS 自定义属性（变量）覆盖，不支持选择器。
 * 所有样式最终会转换为内联 style="" 注入到 HTML 中。
 */

:root {
  /* 主色调（标题下划线、引用左边框、链接颜色） */
  --wechat-accent: #07C160;

  /* 正文字体大小 */
  --wechat-font-size: 16px;

  /* 正文行高 */
  --wechat-line-height: 1.8;

  /* 正文颜色 */
  --wechat-text-color: #333;

  /* 代码块背景色 */
  --wechat-code-bg: #f6f8fa;

  /* 行内代码颜色 */
  --wechat-inline-code-color: #d63384;

  /* 引用块背景色 */
  --wechat-blockquote-bg: #f9f9f9;

  /* 内容最大宽度 */
  --wechat-max-width: 680px;

  /* ── 标题样式（各级可独立覆盖）─────────────────────── */

  /* H1 */
  --wechat-h1-font-size: 24px;
  --wechat-h1-font-weight: bold;
  --wechat-h1-color: #1a1a1a;

  /* H2 */
  --wechat-h2-font-size: 20px;
  --wechat-h2-font-weight: bold;
  --wechat-h2-color: #1a1a1a;

  /* H3 */
  --wechat-h3-font-size: 18px;
  --wechat-h3-font-weight: bold;
  --wechat-h3-color: #1a1a1a;

  /* H4 */
  --wechat-h4-font-size: 16px;
  --wechat-h4-font-weight: bold;
  --wechat-h4-color: #333;

  /* H5 */
  --wechat-h5-font-size: 15px;
  --wechat-h5-font-weight: bold;
  --wechat-h5-color: #555;

  /* H6 */
  --wechat-h6-font-size: 14px;
  --wechat-h6-font-weight: bold;
  --wechat-h6-color: #666;
}
`;
