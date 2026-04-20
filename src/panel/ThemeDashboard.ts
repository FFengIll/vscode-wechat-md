// Theme Dashboard Webview Panel
import * as vscode from 'vscode';
import type { ThemePreset, DashboardMessage, DashboardResponse } from '../renderer/types';
import type { ThemeVars } from '../renderer/theme';

/**
 * Visual dashboard for theme selection and customization
 */
export class ThemeDashboard {
  private static currentPanel: ThemeDashboard | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private presetManager: any; // PresetManager - using any to avoid circular deps
  private currentVars: ThemeVars;
  private extensionUri: vscode.Uri;

  private constructor(
    panel: vscode.WebviewPanel,
    presetManager: any,
    initialVars: ThemeVars,
    extensionUri: vscode.Uri
  ) {
    this.panel = panel;
    this.presetManager = presetManager;
    this.currentVars = initialVars;
    this.extensionUri = extensionUri;

    this.panel.webview.html = this.getHtmlContent();
    this.setupMessageHandlers();
    this.sendInitialData();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  static createOrShow(
    extensionUri: vscode.Uri,
    presetManager: any,
    currentVars: ThemeVars
  ): ThemeDashboard {
    const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.Two;

    if (ThemeDashboard.currentPanel) {
      ThemeDashboard.currentPanel.panel.reveal(column, true);
      return ThemeDashboard.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      'wechatThemeDashboard',
      'WeChat Theme Dashboard',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    ThemeDashboard.currentPanel = new ThemeDashboard(panel, presetManager, currentVars, extensionUri);
    return ThemeDashboard.currentPanel;
  }

  private getHtmlContent(): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' 'nonce-${nonce}';">
  <title>WeChat Theme Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-editor-foreground, #cccccc);
      padding: 20px;
      line-height: 1.5;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--vscode-foreground, #cccccc);
      border-bottom: 1px solid var(--vscode-panel-border, #3c3c3c);
      padding-bottom: 8px;
    }
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .preset-card {
      border: 2px solid var(--vscode-panel-border, #3c3c3c);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--vscode-editor-background, #1e1e1e);
    }
    .preset-card:hover {
      border-color: var(--vscode-button-hoverBackground, #3a3a3a);
      transform: translateY(-2px);
    }
    .preset-card.active {
      border-color: var(--vscode-button-background, #0e639c);
      box-shadow: 0 0 0 1px var(--vscode-button-background, #0e639c);
    }
    .color-preview {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
    }
    .color-swatch {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid var(--vscode-widget-border, #3c3c3c);
      flex-shrink: 0;
    }
    .preset-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
      color: var(--vscode-foreground, #cccccc);
    }
    .preset-desc {
      font-size: 12px;
      opacity: 0.7;
      color: var(--vscode-descriptionForeground, #cccccc);
    }
    .color-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .color-group {
      background: var(--vscode-editor-background, #1e1e1e);
      border: 1px solid var(--vscode-panel-border, #3c3c3c);
      border-radius: 8px;
      padding: 12px;
    }
    .color-group-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-foreground, #cccccc);
    }
    .color-input {
      margin-bottom: 10px;
    }
    .color-input label {
      display: block;
      font-size: 11px;
      margin-bottom: 4px;
      opacity: 0.8;
      color: var(--vscode-descriptionForeground, #cccccc);
    }
    .color-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .color-row input[type="color"] {
      width: 40px;
      height: 28px;
      border: 1px solid var(--vscode-input-border, #3c3c3c);
      border-radius: 4px;
      background: var(--vscode-editor-background, #1e1e1e);
      cursor: pointer;
      flex-shrink: 0;
    }
    .color-row input[type="text"] {
      flex: 1;
      background: var(--vscode-input-background, #3c3c3c);
      border: 1px solid var(--vscode-input-border, #3c3c3c);
      color: var(--vscode-input-foreground, #cccccc);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: var(--vscode-editor-font-family, monospace);
    }
    .actions {
      display: flex;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-panel-border, #3c3c3c);
    }
    .btn {
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #ffffff);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover {
      background: var(--vscode-button-hoverBackground, #1177bb);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #cccccc);
    }
    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground, #45494e);
    }
  </style>
</head>
<body>
  <h2>🎨 Theme Presets</h2>
  <div id="preset-grid" class="preset-grid"></div>

  <h2>🎨 Color Customization</h2>
  <div class="color-section" id="color-controls"></div>

  <div class="actions">
    <button class="btn btn-secondary" id="reset-btn">Reset to Preset</button>
    <button class="btn btn-secondary" id="save-btn">Save as Preset...</button>
    <button class="btn" id="apply-btn">Apply to Preview</button>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      let presets = [];
      let currentColors = {};

      function init() {
        vscode.postMessage({ type: 'getPresets' });
      }

      function renderPresets() {
        const grid = document.getElementById('preset-grid');
        if (!grid) return;

        grid.innerHTML = presets.map(preset => \`
          <div class="preset-card \${preset.active ? 'active' : ''}" data-id="\${preset.id}">
            <div class="color-preview">
              <div class="color-swatch" style="background: \${preset.preview.primary}"></div>
              <div class="color-swatch" style="background: \${preset.preview.background}"></div>
              <div class="color-swatch" style="background: \${preset.preview.accent}"></div>
            </div>
            <div class="preset-name">\${preset.name}</div>
            <div class="preset-desc">\${preset.description}</div>
          </div>
        \`).join('');

        document.querySelectorAll('.preset-card').forEach(card => {
          card.addEventListener('click', () => {
            const id = card.dataset.id;
            vscode.postMessage({ type: 'selectPreset', presetId: id });
          });
        });
      }

      function renderColorControls() {
        const container = document.getElementById('color-controls');
        if (!container) return;

        const mainColors = [
          { key: 'accent', label: 'Accent Color' },
          { key: 'textColor', label: 'Text Color' },
          { key: 'codeBg', label: 'Code Background' },
          { key: 'inlineCodeColor', label: 'Inline Code Color' },
          { key: 'blockquoteBg', label: 'Blockquote Background' }
        ];

        const headingColors = [
          { key: 'h1Color', label: 'H1 Color' },
          { key: 'h2Color', label: 'H2 Color' },
          { key: 'h3Color', label: 'H3 Color' }
        ];

        container.innerHTML = \`
          <div class="color-group">
            <div class="color-group-title">Main Colors</div>
            \${mainColors.map(c => renderColorInput(c)).join('')}
          </div>
          <div class="color-group">
            <div class="color-group-title">Heading Colors</div>
            \${headingColors.map(c => renderColorInput(c)).join('')}
          </div>
        \`;

        // Add change handlers
        document.querySelectorAll('input[type="color"]').forEach(input => {
          input.addEventListener('input', (e) => {
            const key = e.target.dataset.key;
            const value = e.target.value;
            document.getElementById('text-' + key)?.removeAttribute('value');
            vscode.postMessage({
              type: 'updateColor',
              colorKey: key,
              colorValue: value
            });
          });
        });

        document.querySelectorAll('input[type="text"]').forEach(input => {
          input.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const value = e.target.value;
            document.getElementById('color-' + key)?.removeAttribute('value');
            vscode.postMessage({
              type: 'updateColor',
              colorKey: key,
              colorValue: value
            });
          });
        });
      }

      function renderColorInput(colorDef) {
        const value = currentColors[colorDef.key] || '#000000';
        return \`
          <div class="color-input">
            <label>\${colorDef.label}</label>
            <div class="color-row">
              <input type="color" id="color-\${colorDef.key}" data-key="\${colorDef.key}" value="\${value}">
              <input type="text" id="text-\${colorDef.key}" data-key="\${colorDef.key}" value="\${value}">
            </div>
          </div>
        \`;
      }

      function updateColors(colors) {
        currentColors = { ...currentColors, ...colors };
        // Update input values
        Object.keys(colors).forEach(key => {
          const colorInput = document.getElementById('color-' + key);
          const textInput = document.getElementById('text-' + key);
          if (colorInput) colorInput.value = colors[key];
          if (textInput) textInput.value = colors[key];
        });
      }

      window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
          case 'updatePresets':
            presets = message.presets || [];
            renderPresets();
            break;
          case 'updateColors':
            updateColors(message.colors || {});
            break;
          case 'error':
            console.error('Dashboard error:', message.error);
            break;
        }
      });

      document.getElementById('reset-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'resetColors' });
      });

      document.getElementById('apply-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'apply' });
      });

      document.getElementById('save-btn').addEventListener('click', () => {
        const name = prompt('Enter preset name:');
        if (name) {
          vscode.postMessage({ type: 'savePreset', presetName: name });
        }
      });

      init();
    })();
  </script>
</body>
</html>`;
  }

  private setupMessageHandlers(): void {
    this.panel.webview.onDidReceiveMessage(
      async (message: DashboardMessage) => {
        try {
          switch (message.type) {
            case 'getPresets':
              this.sendPresets();
              this.sendColors();
              break;

            case 'selectPreset':
              if (message.presetId) {
                this.presetManager.switchPreset(message.presetId);
                this.sendPresets();
                this.sendColors();
              }
              break;

            case 'updateColor':
              if (message.colorKey && message.colorValue) {
                (this.currentVars as any)[message.colorKey] = message.colorValue;
                // Notify preview to update
                vscode.commands.executeCommand('wechat-md.preview');
              }
              break;

            case 'resetColors':
              const preset = this.presetManager.getActivePreset();
              if (preset) {
                this.currentVars = { ...preset.vars };
                this.sendColors();
                vscode.commands.executeCommand('wechat-md.preview');
              }
              break;

            case 'apply':
              vscode.commands.executeCommand('wechat-md.preview');
              vscode.window.showInformationMessage('Theme applied to preview');
              break;

            case 'savePreset':
              if (message.presetName) {
                const success = await this.presetManager.saveAsPreset(
                  message.presetName,
                  this.currentVars
                );
                if (success) {
                  vscode.window.showInformationMessage(`Preset "${message.presetName}" saved`);
                  this.sendPresets();
                }
              }
              break;
          }
        } catch (error) {
          this.panel.webview.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      },
      null,
      this.disposables
    );
  }

  private sendInitialData(): void {
    this.sendPresets();
    this.sendColors();
  }

  private sendPresets(): void {
    const presets = this.presetManager.listPresets();
    const activeId = this.presetManager.getActivePreset()?.id;

    this.panel.webview.postMessage({
      type: 'updatePresets',
      presets: presets.map((p: any) => ({
        ...p,
        active: p.id === activeId
      }))
    });
  }

  private sendColors(): void {
    this.panel.webview.postMessage({
      type: 'updateColors',
      colors: this.currentVars
    });
  }

  dispose(): void {
    ThemeDashboard.currentPanel = undefined;
    this.panel.dispose();
    this.disposables.forEach(d => d.dispose());
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
