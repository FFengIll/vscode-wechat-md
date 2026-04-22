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
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--vscode-font-family);
      font-size: 12px;
      background: var(--vscode-sideBar-background);
      color: var(--vscode-foreground);
      line-height: 1.5;
      overflow-x: hidden;
      overflow-y: auto;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .panel-header {
      padding: 12px 14px 0;
      flex-shrink: 0;
    }
    .panel-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 10px;
    }

    /* ── Tab bar ── */
    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--vscode-panelBorder);
      gap: 0;
      overflow-x: auto;
      scrollbar-width: none;
      flex-shrink: 0;
    }
    .tab-bar::-webkit-scrollbar { display: none; }

    .tab {
      flex: 1;
      min-width: 0;
      padding: 7px 6px 6px;
      font-size: 11px;
      font-weight: 500;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      border: none;
      background: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      text-align: center;
      transition: color 0.15s, border-color 0.15s;
      user-select: none;
    }
    .tab:hover { color: var(--vscode-foreground); }
    .tab.active {
      color: var(--vscode-foreground);
      border-bottom-color: var(--vscode-focusBorder, var(--vscode-buttonBackground));
      font-weight: 600;
    }

    /* ── Scroll area ── */
    .scroll-area {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px 80px;
    }

    /* ── Tab pane ── */
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    /* ── Section label ── */
    .group-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
      margin: 14px 0 6px;
    }
    .group-label:first-child { margin-top: 0; }

    /* ── Theme preset cards (horizontal strip) ── */
    .theme-strip {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .theme-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 5px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background 0.12s, border-color 0.12s;
      position: relative;
    }
    .theme-card:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    .theme-card.active {
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }
    .theme-card.active .theme-card-name {
      color: var(--vscode-list-activeSelectionForeground);
    }
    .theme-swatches {
      display: flex;
      gap: 3px;
      flex-shrink: 0;
    }
    .theme-swatch {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(128,128,128,0.2);
      flex-shrink: 0;
    }
    .theme-card-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--vscode-foreground);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .theme-card-check {
      font-size: 12px;
      color: var(--vscode-list-activeSelectionForeground);
      opacity: 0;
      flex-shrink: 0;
    }
    .theme-card.active .theme-card-check { opacity: 1; }

    /* ── Style preset chips ── */
    .chip-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
      margin-bottom: 4px;
    }
    .chip {
      padding: 7px 9px;
      border-radius: 4px;
      border: 1px solid var(--vscode-panelBorder);
      cursor: pointer;
      background: transparent;
      text-align: left;
      transition: background 0.1s, border-color 0.1s;
      position: relative;
      overflow: hidden;
    }
    .chip::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 2px;
      background: var(--vscode-focusBorder, var(--vscode-buttonBackground));
      opacity: 0;
      transition: opacity 0.12s;
    }
    .chip:hover {
      background: var(--vscode-toolbar-hoverBackground);
      border-color: var(--vscode-focusBorder);
    }
    .chip.active {
      background: var(--vscode-list-activeSelectionBackground);
      border-color: transparent;
    }
    .chip.active::before { opacity: 1; }
    .chip-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-foreground);
      display: block;
      margin-bottom: 1px;
    }
    .chip.active .chip-name {
      color: var(--vscode-list-activeSelectionForeground);
    }
    .chip-desc {
      font-size: 9px;
      color: var(--vscode-descriptionForeground);
      display: block;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chip.active .chip-desc {
      color: var(--vscode-list-activeSelectionForeground);
      opacity: 0.75;
    }

    /* ── Footer action bar ── */
    .action-bar {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      display: flex;
      gap: 6px;
      padding: 8px 14px;
      background: var(--vscode-sideBar-background);
      border-top: 1px solid var(--vscode-panelBorder);
    }
    .btn {
      flex: 1;
      padding: 6px 10px;
      border-radius: 3px;
      border: none;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary {
      background: var(--vscode-buttonBackground);
      color: var(--vscode-buttonForeground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="panel-header">
    <div class="panel-title">WeChat 样式</div>
    <div class="tab-bar" id="tab-bar">
      <button class="tab active" data-tab="theme">主题</button>
      <button class="tab" data-tab="heading">标题</button>
      <button class="tab" data-tab="block">引用</button>
      <button class="tab" data-tab="list">列表</button>
      <button class="tab" data-tab="misc">其他</button>
    </div>
  </div>

  <div class="scroll-area">
    <!-- Theme tab -->
    <div class="tab-pane active" id="pane-theme">
      <div class="group-label">主题预设</div>
      <div class="theme-strip" id="preset-grid"></div>
    </div>

    <!-- Heading tab -->
    <div class="tab-pane" id="pane-heading">
      <div class="group-label">H1 样式</div>
      <div class="chip-grid" id="h1-presets"></div>
      <div class="group-label">H2 样式</div>
      <div class="chip-grid" id="h2-presets"></div>
      <div class="group-label">H3 样式</div>
      <div class="chip-grid" id="h3-presets"></div>
    </div>

    <!-- Block tab -->
    <div class="tab-pane" id="pane-block">
      <div class="group-label">引用样式</div>
      <div class="chip-grid" id="blockquote-presets"></div>
    </div>

    <!-- List tab -->
    <div class="tab-pane" id="pane-list">
      <div class="group-label">列表样式</div>
      <div class="chip-grid" id="list-presets"></div>
    </div>

    <!-- Misc tab -->
    <div class="tab-pane" id="pane-misc">
      <div class="group-label">链接样式</div>
      <div class="chip-grid" id="link-presets"></div>
      <div class="group-label">图片样式</div>
      <div class="chip-grid" id="image-presets"></div>
      <div class="group-label">分割线样式</div>
      <div class="chip-grid" id="divider-presets"></div>
      <div class="group-label">表格样式</div>
      <div class="chip-grid" id="table-presets"></div>
    </div>
  </div>

  <div class="action-bar">
    <button class="btn btn-secondary" id="reset-btn">重置</button>
    <button class="btn btn-primary" id="apply-btn">应用预览</button>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      let themePresets = [];
      let stylePresetsState = {};

      // ── Tab switching ──
      const tabs = document.querySelectorAll('.tab');
      const panes = document.querySelectorAll('.tab-pane');
      const savedTab = vscode.getState()?.activeTab || 'theme';

      function switchTab(tabId) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
        panes.forEach(p => p.classList.toggle('active', p.id === 'pane-' + tabId));
        const state = vscode.getState() || {};
        state.activeTab = tabId;
        vscode.setState(state);
      }

      tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
      });
      switchTab(savedTab);

      // ── Actions ──
      document.getElementById('reset-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'resetStylePresets' });
      });
      document.getElementById('apply-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'applyToPreview' });
      });

      // ── Render theme cards ──
      function renderThemePresets() {
        const strip = document.getElementById('preset-grid');
        if (!strip) return;
        strip.innerHTML = themePresets.map(p => \`
          <div class="theme-card \${p.active ? 'active' : ''}" data-id="\${p.id}">
            <div class="theme-swatches">
              <div class="theme-swatch" style="background:\${p.preview.primary}"></div>
              <div class="theme-swatch" style="background:\${p.preview.background}"></div>
              <div class="theme-swatch" style="background:\${p.preview.accent}"></div>
            </div>
            <span class="theme-card-name">\${p.name}</span>
            <span class="theme-card-check">✓</span>
          </div>
        \`).join('');
        strip.querySelectorAll('.theme-card').forEach(card => {
          card.addEventListener('click', () => {
            vscode.postMessage({ type: 'selectThemePreset', presetId: card.dataset.id });
          });
        });
      }

      // ── Render style chips ──
      function renderStylePresets(category, presetList) {
        const container = document.getElementById(category + '-presets');
        if (!container) return;
        container.innerHTML = presetList.map(p => \`
          <div class="chip \${p.active ? 'active' : ''}" data-category="\${category}" data-id="\${p.id}">
            <span class="chip-name">\${p.name}</span>
            <span class="chip-desc">\${p.description}</span>
          </div>
        \`).join('');
        container.querySelectorAll('.chip').forEach(chip => {
          chip.addEventListener('click', function() {
            container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            vscode.postMessage({ type: 'setStylePreset', category: this.dataset.category, presetId: this.dataset.id });
          });
        });
      }

      // ── Messages ──
      window.addEventListener('message', ({ data: msg }) => {
        if (msg.type === 'updateThemePresets') {
          themePresets = msg.presets || [];
          renderThemePresets();
        } else if (msg.type === 'updateStylePresets') {
          if (msg.category && msg.presets) renderStylePresets(msg.category, msg.presets);
        } else if (msg.type === 'updateAllStylePresets') {
          stylePresetsState = msg.state || {};
          for (const cat in stylePresetsState) {
            renderStylePresets(cat, stylePresetsState[cat].presets);
          }
        }
      });

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
