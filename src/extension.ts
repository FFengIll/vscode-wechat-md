import * as vscode from 'vscode';
import { PreviewPanel } from './panel/PreviewPanel';

export function activate(context: vscode.ExtensionContext) {
  // Open the WeChat Markdown preview panel
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.preview', () => {
      PreviewPanel.createOrShow(context.extensionUri);
    })
  );
}

export function deactivate() {}
