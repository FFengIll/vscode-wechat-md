import * as vscode from 'vscode';
import { PreviewPanel } from './panel/PreviewPanel';
import { StylePanel } from './panel/StylePanel';
import { PresetManager } from './renderer/PresetManager';
import { StylePresetManager } from './renderer/StylePresetManager';

// Global preset manager instances
let presetManager: PresetManager | null = null;
let stylePresetManager: StylePresetManager | null = null;

export async function activate(context: vscode.ExtensionContext) {
  // Initialize preset managers
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  presetManager = new PresetManager(context.workspaceState, workspaceRoot);
  await presetManager.loadCustomPresets();

  stylePresetManager = new StylePresetManager(context.workspaceState);

  // Open the WeChat Markdown preview panel (legacy, keeps backward compatibility)
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.preview', () => {
      const panel = PreviewPanel.createOrShow(context.extensionUri, presetManager || undefined);
      panel.setStylePresetManager(stylePresetManager);
    })
  );

  // Open the independent style management panel
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.openStylePanel', () => {
      StylePanel.createOrShow(context.extensionUri, presetManager, stylePresetManager);
    })
  );

  // Command to refresh preview (called by StylePanel)
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.refreshPreview', () => {
      if (PreviewPanel.currentPanel) {
        PreviewPanel.currentPanel.refresh();
      }
    })
  );

  // Dispose preset managers on deactivation
  context.subscriptions.push({
    dispose: () => {
      if (presetManager) {
        presetManager.dispose();
        presetManager = null;
      }
      if (stylePresetManager) {
        stylePresetManager.dispose();
        stylePresetManager = null;
      }
    }
  });
}

export function deactivate() {
  if (presetManager) {
    presetManager.dispose();
    presetManager = null;
  }
  if (stylePresetManager) {
    stylePresetManager.dispose();
    stylePresetManager = null;
  }
}
