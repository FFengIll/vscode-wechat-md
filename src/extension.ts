import * as vscode from 'vscode';
import { PreviewPanel } from './panel/PreviewPanel';
import { WeChatRenderer } from './renderer';

export function activate(context: vscode.ExtensionContext) {
  const renderer = new WeChatRenderer();

  // Command 1: Open the WeChat Markdown preview panel
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.preview', () => {
      PreviewPanel.createOrShow(context.extensionUri);
    })
  );

  // Command 2: Copy rendered HTML directly to clipboard (no panel needed)
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.copyHtml', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') {
        vscode.window.showWarningMessage('请先打开一个 Markdown 文件。');
        return;
      }
      const html = renderer.render(editor.document.getText());
      await vscode.env.clipboard.writeText(html);
      vscode.window.showInformationMessage('已复制微信公众号 HTML！请前往编辑器粘贴。');
    })
  );
}

export function deactivate() {}
