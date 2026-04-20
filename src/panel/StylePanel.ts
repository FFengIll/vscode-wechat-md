// Style Panel - Independent panel for style management
import * as vscode from 'vscode';
import { PresetManager } from '../renderer/PresetManager';
import { StylePresetManager } from '../renderer/StylePresetManager';
import { getStylePresets, StylePresetCategory } from '../renderer/stylePresets';
import type { ThemeVars } from '../renderer/theme';
import { getNonce } from './PreviewPanel';

/**
 * Independent webview panel for style management
 * Completely separate from the preview panel to avoid refresh issues
 */
export class StylePanel {
  static currentPanel: StylePanel | undefined;
  private static readonly viewType = 'wechatMdStylePanel';

  private readonly panel: vscode.WebviewPanel;
  private readonly presetManager: PresetManager | null;
  private readonly stylePresetManager: StylePresetManager;
  private disposables: vscode.Disposable[] = [];

  static createOrShow(
    extensionUri: vscode.Uri,
    presetManager: PresetManager | null,
    stylePresetManager: StylePresetManager | null
  ): StylePanel {
    const column = vscode.ViewColumn.Three;

    if (StylePanel.currentPanel) {
      StylePanel.currentPanel.panel.reveal(column, true);
      return StylePanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      StylePanel.viewType,
      'WeChat 样式管理',
      { viewColumn: column, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    if (!stylePresetManager) {
      throw new Error('StylePresetManager is required');
    }

    StylePanel.currentPanel = new StylePanel(panel, presetManager, stylePresetManager);
    return StylePanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    presetManager: PresetManager | null,
    stylePresetManager: StylePresetManager
  ) {
    this.panel = panel;
    this.presetManager = presetManager;
    this.stylePresetManager = stylePresetManager;

    this.panel.webview.html = this.getHtmlContent();
    this.setupMessageHandlers();

    // Send initial data
    this.sendInitialData();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private getHtmlContent(): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' 'nonce-${nonce}';">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      background: var(--vscode-editorBackground, #1e1e1e);
      color: var(--vscode-editorForeground, #cccccc);
      padding: 16px;
      line-height: 1.5;
      overflow-y: auto;
    }

    h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--vscode-foreground, #cccccc);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panelBorder, #3c3c3c);
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-foreground, #cccccc);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Preset Grid */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }

    .preset-card {
      background: var(--vscode-editorBackground, #1e1e1e);
      border: 2px solid var(--vscode-panelBorder, #3c3c3c);
      border-radius: 6px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .preset-card:hover {
      border-color: var(--vscode-buttonHoverBackground, #3a3a3a);
    }

    .preset-card.active {
      border-color: var(--vscode-buttonBackground, #0e639c);
    }

    .preset-colors {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
    }

    .preset-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid var(--vscode-widgetBorder, #3c3c3c);
    }

    .preset-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-foreground, #cccccc);
    }

    /* Accordion */
    .accordion {
      border: 1px solid var(--vscode-panelBorder, #3c3c3c);
      border-radius: 6px;
      margin-bottom: 8px;
      overflow: hidden;
    }

    .accordion-header {
      background: var(--vscode-editorBackground, #252526);
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 500;
      user-select: none;
    }

    .accordion-header:hover {
      background: var(--vscode-toolbar-hoverBackground, #2a2d2e);
    }

    .accordion-icon {
      transition: transform 0.2s;
      font-size: 10px;
    }

    .accordion-icon.open {
      transform: rotate(180deg);
    }

    .accordion-content {
      display: none;
      padding: 10px;
      background: var(--vscode-sideBarBackground, #252526);
    }

    .accordion-content.open {
      display: block;
    }

    /* Preset Chips */
    .preset-chip-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }

    .preset-chip {
      background: var(--vscode-editorBackground, #1e1e1e);
      border: 1px solid var(--vscode-panelBorder, #3c3c3c);
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      text-align: left;
      font-size: 11px;
      color: var(--vscode-descriptionForeground, #cccccc);
      transition: all 0.15s;
      min-height: 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .preset-chip:hover {
      border-color: var(--vscode-buttonBackground, #0e639c);
    }

    .preset-chip.active {
      border-color: var(--vscode-buttonBackground, #0e639c);
      background: rgba(14, 99, 156, 0.1);
      color: var(--vscode-foreground, #cccccc);
    }

    .preset-chip-name {
      font-size: 11px;
      font-weight: 500;
      color: var(--vscode-foreground, #cccccc);
      margin-bottom: 2px;
    }

    .preset-chip.active .preset-chip-name {
      color: var(--vscode-buttonForeground, #ffffff);
    }

    .preset-chip-desc {
      font-size: 9px;
      color: var(--vscode-descriptionForeground, #888);
      line-height: 1.2;
    }

    /* Subsection titles */
    .subsection-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground, #888);
      margin: 8px 0 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Controls */
    .control-group {
      margin-bottom: 10px;
    }

    .control-label {
      display: block;
      font-size: 11px;
      margin-bottom: 4px;
      color: var(--vscode-descriptionForeground, #888);
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .control-input[type="color"] {
      width: 32px;
      height: 28px;
      border: 1px solid var(--vscode-inputBorder, #3c3c3c);
      border-radius: 4px;
      background: var(--vscode-editorBackground, #1e1e1e);
      cursor: pointer;
      padding: 0;
    }

    .control-input[type="text"] {
      flex: 1;
      background: var(--vscode-inputBackground, #3c3c3c);
      border: 1px solid var(--vscode-inputBorder, #3c3c3c);
      color: var(--vscode-inputForeground, #cccccc);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    /* Action buttons */
    .action-bar {
      display: flex;
      gap: 8px;
      padding: 12px 0;
      border-top: 1px solid var(--vscode-panelBorder, #3c3c3c);
      margin-top: 12px;
    }

    .btn {
      flex: 1;
      background: var(--vscode-buttonBackground, #0e639c);
      color: var(--vscode-buttonForeground, #ffffff);
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn:hover {
      background: var(--vscode-buttonHoverBackground, #1177bb);
    }

    .btn-secondary {
      background: var(--vscode-buttonSecondaryBackground, #3a3d41);
      color: var(--vscode-buttonSecondaryForeground, #cccccc);
    }

    .btn-secondary:hover {
      background: var(--vscode-buttonSecondaryHoverBackground, #45494e);
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--vscode-scrollbarSliderBackground, #3c3c3c);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSliderHoverBackground, #4c4c4c);
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h2>🎨 WeChat 样式管理</h2>

  <!-- Theme Presets -->
  <div class="section">
    <div class="section-title">主题预设</div>
    <div class="preset-grid" id="preset-grid"></div>
  </div>

  <!-- Heading Style Presets -->
  <div class="section">
    <div class="accordion">
      <div class="accordion-header open" data-section="heading-presets">
        <span>📄 标题样式预设</span>
        <span class="accordion-icon open">▼</span>
      </div>
      <div class="accordion-content open" id="heading-presets-content">
        <div class="subsection-title">H1 样式</div>
        <div class="preset-chip-grid" id="h1-presets"></div>
        <div class="subsection-title">H2 样式</div>
        <div class="preset-chip-grid" id="h2-presets"></div>
        <div class="subsection-title">H3 样式</div>
        <div class="preset-chip-grid" id="h3-presets"></div>
      </div>
    </div>
  </div>

  <!-- Other Element Presets -->
  <div class="section">
    <div class="accordion">
      <div class="accordion-header" data-section="blockquote-presets">
        <span>💬 引用样式</span>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content" id="blockquote-presets-content">
        <div class="preset-chip-grid" id="blockquote-presets"></div>
      </div>
    </div>

    <div class="accordion">
      <div class="accordion-header" data-section="list-presets">
        <span>📋 列表样式</span>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content" id="list-presets-content">
        <div class="preset-chip-grid" id="list-presets"></div>
      </div>
    </div>

    <div class="accordion">
      <div class="accordion-header" data-section="link-presets">
        <span>🔗 链接样式</span>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content" id="link-presets-content">
        <div class="preset-chip-grid" id="link-presets"></div>
      </div>
    </div>

    <div class="accordion">
      <div class="accordion-header" data-section="image-presets">
        <span>🖼️ 图片样式</span>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content" id="image-presets-content">
        <div class="preset-chip-grid" id="image-presets"></div>
      </div>
    </div>

    <div class="accordion">
      <div class="accordion-header" data-section="divider-presets">
        <span>➖ 分割线样式</span>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content" id="divider-presets-content">
        <div class="preset-chip-grid" id="divider-presets"></div>
      </div>
    </div>

    <div class="accordion">
      <div class="accordion-header" data-section="table-presets">
        <span>📊 表格样式</span>
        <span class="accordion-icon">▼</span>
      </div>
      <div class="accordion-content" id="table-presets-content">
        <div class="preset-chip-grid" id="table-presets"></div>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="action-bar">
    <button class="btn btn-secondary" id="reset-btn">重置所有</button>
    <button class="btn btn-secondary" id="apply-btn">应用并刷新预览</button>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      let presets = [];
      let stylePresetsState = {};

      // Initialize accordion state from VSCode state
      const accordionState = vscode.getState()?.accordionState || {};

      // Setup accordion with state persistence
      document.querySelectorAll('.accordion-header').forEach(header => {
        const section = header.dataset.section;

        // Restore state
        if (accordionState[section] !== undefined) {
          const icon = header.querySelector('.accordion-icon');
          const content = header.nextElementSibling;
          if (accordionState[section]) {
            icon.classList.add('open');
            content.classList.add('open');
          } else {
            icon.classList.remove('open');
            content.classList.remove('open');
          }
        }

        header.addEventListener('click', () => {
          const icon = header.querySelector('.accordion-icon');
          const content = header.nextElementSibling;
          const isOpen = icon.classList.toggle('open');
          content.classList.toggle('open', isOpen);

          // Save state
          const state = vscode.getState() || {};
          state.accordionState = state.accordionState || {};
          state.accordionState[section] = isOpen;
          vscode.setState(state);
        });
      });

      // Reset button
      document.getElementById('reset-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'resetStylePresets' });
      });

      // Apply button
      document.getElementById('apply-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'applyToPreview' });
      });

      // Render theme presets
      function renderThemePresets() {
        const grid = document.getElementById('preset-grid');
        if (!grid) return;

        grid.innerHTML = presets.map(preset => \`
          <div class="preset-card \${preset.active ? 'active' : ''}" data-id="\${preset.id}">
            <div class="preset-colors">
              <div class="preset-color" style="background: \${preset.preview.primary}"></div>
              <div class="preset-color" style="background: \${preset.preview.background}"></div>
              <div class="preset-color" style="background: \${preset.preview.accent}"></div>
            </div>
            <div class="preset-name">\${preset.name}</div>
          </div>
        \`).join('');

        document.querySelectorAll('.preset-card').forEach(card => {
          card.addEventListener('click', () => {
            const id = card.dataset.id;
            vscode.postMessage({ type: 'selectThemePreset', presetId: id });
          });
        });
      }

      // Render style presets for a category
      function renderStylePresets(category, presetList) {
        const container = document.getElementById(category + '-presets');
        if (!container) return;

        container.innerHTML = presetList.map(preset => \`
          <div class="preset-chip \${preset.active ? 'active' : ''}" data-category="\${category}" data-id="\${preset.id}">
            <div class="preset-chip-name">\${preset.name}</div>
            <div class="preset-chip-desc">\${preset.description}</div>
          </div>
        \`).join('');

        container.querySelectorAll('.preset-chip').forEach(chip => {
          chip.addEventListener('click', function() {
            const categoryId = this.dataset.category;
            const presetId = this.dataset.id;

            // Update active state
            container.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            // Send to extension
            vscode.postMessage({
              type: 'setStylePreset',
              category: categoryId,
              presetId: presetId
            });
          });
        });
      }

      // Handle messages from extension
      window.addEventListener('message', (event) => {
        const message = event.data;

        switch (message.type) {
          case 'updateThemePresets':
            presets = message.presets || [];
            renderThemePresets();
            break;
          case 'updateStylePresets':
            if (message.category && message.presets) {
              renderStylePresets(message.category, message.presets);
            }
            break;
          case 'updateAllStylePresets':
            stylePresetsState = message.state || {};
            for (const category in stylePresetsState) {
              renderStylePresets(category, stylePresetsState[category].presets);
            }
            break;
        }
      });

      // Request initial data
      vscode.postMessage({ type: 'getInitialData' });
    })();
  </script>
</body>
</html>`;
  }

  private setupMessageHandlers(): void {
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        try {
          await this.handleMessage(message);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      },
      null,
      this.disposables
    );
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'getInitialData':
        this.sendInitialData();
        break;

      case 'selectThemePreset':
        if (this.presetManager && message.presetId) {
          this.presetManager.switchPreset(message.presetId);
          this.sendThemePresets();
          // Notify preview panel to refresh
          vscode.commands.executeCommand('wechat-md.refreshPreview');
        }
        break;

      case 'setStylePreset':
        if (this.stylePresetManager && message.category && message.presetId !== undefined) {
          this.stylePresetManager.setSelectedPreset(message.category, message.presetId);
          this.sendStylePresets(message.category);
          // Notify preview panel to refresh
          vscode.commands.executeCommand('wechat-md.refreshPreview');
        }
        break;

      case 'resetStylePresets':
        if (this.stylePresetManager) {
          this.stylePresetManager.resetAll();
          this.sendAllStylePresets();
          // Notify preview panel to refresh
          vscode.commands.executeCommand('wechat-md.refreshPreview');
        }
        break;

      case 'applyToPreview':
        // Notify preview panel to refresh
        vscode.commands.executeCommand('wechat-md.refreshPreview');
        vscode.window.showInformationMessage('样式已应用到预览');
        break;
    }
  }

  private sendInitialData(): void {
    this.sendThemePresets();
    this.sendAllStylePresets();
  }

  private sendThemePresets(): void {
    if (!this.presetManager) return;

    const presets = this.presetManager.listPresets();
    const activeId = this.presetManager.getActivePreset()?.id;

    this.panel.webview.postMessage({
      type: 'updateThemePresets',
      presets: presets.map((p: any) => ({
        ...p,
        active: p.id === activeId
      }))
    });
  }

  private sendStylePresets(category: string): void {
    if (!this.stylePresetManager) return;

    const presets = this.stylePresetManager.getPresets(category as StylePresetCategory);
    const selectedId = this.stylePresetManager.getSelectedPreset(category as StylePresetCategory);

    this.panel.webview.postMessage({
      type: 'updateStylePresets',
      category,
      presets: presets.map((p: any) => ({
        ...p,
        active: p.id === selectedId
      }))
    });
  }

  private sendAllStylePresets(): void {
    if (!this.stylePresetManager) return;

    const categories = this.stylePresetManager.getCategories();
    const state: Record<string, any> = {};

    for (const category of categories) {
      state[category] = {
        selected: this.stylePresetManager.getSelectedPreset(category),
        presets: this.stylePresetManager.getPresets(category)
      };
    }

    this.panel.webview.postMessage({
      type: 'updateAllStylePresets',
      state
    });
  }

  dispose(): void {
    StylePanel.currentPanel = undefined;
    this.panel.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
