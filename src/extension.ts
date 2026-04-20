import * as vscode from 'vscode';
import { PreviewPanel } from './panel/PreviewPanel';
import { UnifiedPanel } from './panel/UnifiedPanel';
import { ThemeDashboard } from './panel/ThemeDashboard';
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

  // New unified panel with preview + dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.openUnifiedPanel', () => {
      UnifiedPanel.createOrShow(context.extensionUri, presetManager);
    })
  );

  // Switch theme command
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.switchTheme', async () => {
      if (!presetManager) {
        vscode.window.showWarningMessage('Theme system not initialized');
        return;
      }

      const presets = presetManager.listPresets();
      const activePresetId = presetManager.getActivePreset()?.id;

      const items = presets.map(p => ({
        label: p.name,
        description: p.description,
        detail: `Colors: ${p.preview.primary}, ${p.preview.background}`,
        preset: p,
        picked: p.id === activePresetId
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a theme preset',
        matchOnDescription: true,
        matchOnDetail: true
      });

      if (selected) {
        presetManager.switchPreset(selected.preset.id);
        vscode.window.showInformationMessage(`Switched to ${selected.preset.name} theme`);
        // Trigger preview refresh if open
        vscode.commands.executeCommand('wechat-md.openUnifiedPanel');
      }
    })
  );

  // Open theme dashboard command (legacy standalone dashboard)
  context.subscriptions.push(
    vscode.commands.registerCommand('wechat-md.openThemeDashboard', async () => {
      if (!presetManager) {
        vscode.window.showWarningMessage('Theme system not initialized');
        return;
      }

      const currentVars = presetManager.getVarsWithOverride();
      ThemeDashboard.createOrShow(context.extensionUri, presetManager, currentVars);
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
