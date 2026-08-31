// Style Panel - Independent panel for style management
import * as vscode from 'vscode';
import { PresetManager } from '../state/PresetManager';
import { StylePresetManager } from '../state/StylePresetManager';
import { getStylePresets, StylePresetCategory, isCustomPresetId } from '../renderer/stylePresets';
import type { ThemeVars } from '../renderer/theme';
import { WeChatRenderer } from '../renderer';
import { getNonce } from './PreviewPanel';
import { ensureCustomStyleFile, loadCustomCSS } from '../renderer/customStyles';

// Small markdown snippets used to render a live preview of each style category.
// The snippet is rendered through the real WeChatRenderer so the tooltip shows
// exactly what the preset produces — including pseudo-element decorations.
const PREVIEW_MARKDOWN: Record<string, string> = {
  h1: '# 一级标题示例',
  h2: '## 二级标题示例',
  h3: '### 三级标题示例',
  blockquote: '> 这是一段引用文字示例',
  list: '- 列表项示例一\n- 列表项示例二',
  link: '[链接文字示例](https://example.com)',
  // base64 PNG (160x80 light-gray block) — survives HTML-escaping unlike an
  // SVG data URI, and needs no network access.
  image: '![示例图片](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABQCAIAAAD8c8osAAAAOklEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4GxbgAAFY4P9aAAAAAElFTkSuQmCC)',
  divider: '上文\n\n---\n\n下文',
  table: '| 列一 | 列二 |\n| --- | --- |\n| 内容 | 内容 |',
  inlineCode: '这是 `行内代码` 示例',
  codeBlock: '```js\nconst hello = () => "world";\n```'
};

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

  // Dedicated renderer for live style previews. Kept separate from the main
  // preview renderer so applying a candidate preset doesn't pollute its state.
  private previewRenderer: WeChatRenderer | null = null;

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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; script-src 'unsafe-inline' 'nonce-${nonce}';">
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

    /* ── Floating preview tooltip (shared by theme cards & style chips) ── */
    #preview-tooltip {
      position: fixed;
      z-index: 9999;
      min-width: 200px;
      max-width: 320px;
      padding: 10px 12px;
      background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      border: 1px solid var(--vscode-panelBorder);
      border-radius: 6px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.12s;
      font-size: 11px;
      color: var(--vscode-foreground);
      line-height: 1.5;
    }
    #preview-tooltip.visible { opacity: 1; }
    .tt-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
      margin-bottom: 6px;
    }
    /* Theme thumb inside tooltip */
    .tt-theme-thumb {
      border-radius: 5px;
      overflow: hidden;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .tt-thumb-title { font-size: 13px; font-weight: 700; line-height: 1.2; }
    .tt-thumb-bar   { height: 2px; border-radius: 1px; width: 55%; }
    .tt-thumb-body  { font-size: 10px; opacity: 0.75; }
    .tt-loading {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.75;
      padding: 4px 0;
    }
    /* Live-rendered preview gets a white canvas like the real WeChat preview */
    .tt-preview-body {
      background: #fff;
      color: #333;
      border-radius: 4px;
      padding: 8px 10px;
      max-height: 180px;
      overflow: hidden;
      font-size: 13px;
    }
    .tt-preview-body section { max-width: none !important; padding: 0 !important; }
    .tt-preview-body img { max-width: 100%; }
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

    /* ── Edit-custom-style link (shown under each category's chip grid) ── */
    .edit-custom-link {
      display: inline-block;
      font-size: 10px;
      color: var(--vscode-textLink-foreground);
      cursor: pointer;
      margin: -2px 0 12px;
      text-decoration: none;
      user-select: none;
    }
    .edit-custom-link:hover { text-decoration: underline; }
    .edit-custom-link::before { content: '✎ '; }

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
      <a class="edit-custom-link" data-category="h1">编辑自定义样式</a>
      <div class="group-label">H2 样式</div>
      <div class="chip-grid" id="h2-presets"></div>
      <a class="edit-custom-link" data-category="h2">编辑自定义样式</a>
      <div class="group-label">H3 样式</div>
      <div class="chip-grid" id="h3-presets"></div>
      <a class="edit-custom-link" data-category="h3">编辑自定义样式</a>
    </div>

    <!-- Block tab -->
    <div class="tab-pane" id="pane-block">
      <div class="group-label">引用样式</div>
      <div class="chip-grid" id="blockquote-presets"></div>
      <a class="edit-custom-link" data-category="blockquote">编辑自定义样式</a>
    </div>

    <!-- List tab -->
    <div class="tab-pane" id="pane-list">
      <div class="group-label">列表样式</div>
      <div class="chip-grid" id="list-presets"></div>
      <a class="edit-custom-link" data-category="list">编辑自定义样式</a>
    </div>

    <!-- Misc tab -->
    <div class="tab-pane" id="pane-misc">
      <div class="group-label">链接样式</div>
      <div class="chip-grid" id="link-presets"></div>
      <a class="edit-custom-link" data-category="link">编辑自定义样式</a>
      <div class="group-label">图片样式</div>
      <div class="chip-grid" id="image-presets"></div>
      <a class="edit-custom-link" data-category="image">编辑自定义样式</a>
      <div class="group-label">分割线样式</div>
      <div class="chip-grid" id="divider-presets"></div>
      <a class="edit-custom-link" data-category="divider">编辑自定义样式</a>
      <div class="group-label">表格样式</div>
      <div class="chip-grid" id="table-presets"></div>
      <a class="edit-custom-link" data-category="table">编辑自定义样式</a>
      <div class="group-label">行内代码样式</div>
      <div class="chip-grid" id="inlineCode-presets"></div>
      <a class="edit-custom-link" data-category="inlineCode">编辑自定义样式</a>
      <div class="group-label">代码块样式</div>
      <div class="chip-grid" id="codeBlock-presets"></div>
      <a class="edit-custom-link" data-category="codeBlock">编辑自定义样式</a>
    </div>
  </div>

  <div class="action-bar">
    <button class="btn btn-secondary" id="reset-btn">重置</button>
    <button class="btn btn-primary" id="apply-btn">应用预览</button>
  </div>

  <!-- Shared floating preview tooltip -->
  <div id="preview-tooltip"></div>

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

      // ── Edit-custom-style links ──
      document.querySelectorAll('.edit-custom-link').forEach(link => {
        link.addEventListener('click', () => {
          vscode.postMessage({ type: 'openCustomStyleFile', category: link.dataset.category });
        });
      });

      // ── Floating preview tooltip ──
      const tooltip = document.getElementById('preview-tooltip');
      let hideTimer = null;
      let currentAccent = '#07C160';

      function positionTooltip(anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        const ttW = 240;
        const ttH = 120; // estimated tooltip height
        // Horizontally: align to anchor left, clamp so it doesn't overflow right edge
        const left = Math.min(rect.left, window.innerWidth - ttW - 4);
        // Vertically: prefer below, fall back to above if not enough room
        const below = rect.bottom + 6;
        const above = rect.top - ttH - 6;
        const top = (below + ttH < window.innerHeight) ? below : Math.max(4, above);
        tooltip.style.left = left + 'px';
        tooltip.style.top  = top + 'px';
      }

      function showTooltip(anchorEl, html) {
        clearTimeout(hideTimer);
        tooltip.innerHTML = html;
        positionTooltip(anchorEl);
        tooltip.classList.add('visible');
      }

      function updateTooltipHtml(anchorEl, html) {
        tooltip.innerHTML = html;
        positionTooltip(anchorEl);
      }

      function hideTooltip() {
        hideTimer = setTimeout(() => tooltip.classList.remove('visible'), 80);
      }

      // ── Live style preview via real renderer ──
      // Each hover requests a freshly-rendered HTML snippet from the host so the
      // tooltip shows exactly what the preset produces (incl. pseudo-elements).
      let previewReqId = 0;
      let pendingAnchor = null;

      function requestStylePreview(anchorEl, category, preset) {
        const reqId = ++previewReqId;
        pendingAnchor = anchorEl;
        showTooltip(anchorEl, \`<div class="tt-label">\${preset.name}</div><div class="tt-loading">渲染中…</div>\`);
        vscode.postMessage({ type: 'previewStyle', category, presetId: preset.id, reqId });
      }

      function buildThemeTooltip(preset) {
        return \`
          <div class="tt-label">\${preset.name}</div>
          <div class="tt-theme-thumb" style="background:\${preset.preview.background}">
            <div class="tt-thumb-title" style="color:\${preset.preview.accent}">标题文字 Aa</div>
            <div class="tt-thumb-bar"   style="background:\${preset.preview.accent}"></div>
            <div class="tt-thumb-body"  style="color:\${preset.preview.primary}">正文内容预览文字</div>
          </div>
        \`;
      }

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
          const preset = themePresets.find(p => p.id === card.dataset.id);
          card.addEventListener('click', () => {
            vscode.postMessage({ type: 'selectThemePreset', presetId: card.dataset.id });
          });
          if (preset) {
            card.addEventListener('mouseenter', () => showTooltip(card, buildThemeTooltip(preset)));
            card.addEventListener('mouseleave', hideTooltip);
          }
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
          const preset = presetList.find(p => p.id === chip.dataset.id);
          chip.addEventListener('click', function() {
            container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            vscode.postMessage({ type: 'setStylePreset', category: this.dataset.category, presetId: this.dataset.id });
          });
          if (preset) {
            chip.addEventListener('mouseenter', () => requestStylePreview(chip, category, preset));
            chip.addEventListener('mouseleave', hideTooltip);
          }
        });
      }

      // ── Messages ──
      window.addEventListener('message', ({ data: msg }) => {
        if (msg.type === 'updateThemePresets') {
          themePresets = msg.presets || [];
          if (msg.accent) {
            currentAccent = msg.accent;
            tooltip.style.setProperty('--wechat-accent', currentAccent);
          }
          renderThemePresets();
        } else if (msg.type === 'stylePreviewHtml') {
          // Ignore stale results from earlier hovers
          if (msg.reqId === previewReqId && pendingAnchor) {
            const body = msg.html
              ? \`<div class="tt-preview-body">\${msg.html}</div>\`
              : '<div class="tt-loading">无预览</div>';
            const label = tooltip.querySelector('.tt-label');
            const labelHtml = label ? label.outerHTML : '';
            updateTooltipHtml(pendingAnchor, labelHtml + body);
          }
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

      case 'previewStyle':
        await this.handlePreviewStyle(message);
        break;

      case 'openCustomStyleFile':
        if (message.category) {
          this.openOrCreateCustomStyleFile(message.category as StylePresetCategory);
        }
        break;
    }
  }

  /**
   * Open (creating if needed) the .wechat/custom/<category>.css file for the
   * given category, mirroring PreviewPanel.openOrCreateCustomTheme()'s pattern.
   */
  private openOrCreateCustomStyleFile(category: StylePresetCategory): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('请先打开一个工作区文件夹。');
      return;
    }
    const filePath = ensureCustomStyleFile(category, workspaceFolders[0].uri.fsPath);
    if (filePath) {
      vscode.window.showTextDocument(vscode.Uri.file(filePath));
    }
  }

  /**
   * Render a single candidate style preset against a small markdown snippet
   * using a dedicated renderer, and post the resulting HTML back to the webview.
   * The reqId lets the webview ignore stale results when hovering quickly.
   */
  private async handlePreviewStyle(message: any): Promise<void> {
    const { category, presetId, reqId } = message;
    if (!category || presetId === undefined) return;

    const markdown = PREVIEW_MARKDOWN[category];
    if (!markdown) return;

    try {
      const html = await this.renderStylePreview(category, presetId, markdown);
      this.panel.webview.postMessage({ type: 'stylePreviewHtml', reqId, html });
    } catch (error) {
      console.error('Failed to render style preview:', error);
      this.panel.webview.postMessage({ type: 'stylePreviewHtml', reqId, html: '' });
    }
  }

  /**
   * Lazily build the dedicated preview renderer, then render the snippet with
   * only the requested preset applied for this category.
   */
  private async renderStylePreview(
    category: string,
    presetId: string,
    markdown: string
  ): Promise<string> {
    if (!this.previewRenderer) {
      this.previewRenderer = new WeChatRenderer();
      this.previewRenderer.setPresetManager(this.presetManager);
      this.previewRenderer.setStylePresetManager(this.stylePresetManager);
      try {
        await this.previewRenderer.initHighlighter();
      } catch {
        // Highlighter is optional; plain fallback is fine for previews.
      }
    }

    // Reload theme (picks up active preset vars/accent), then apply ONLY the
    // single candidate preset for this category so the preview is isolated.
    this.previewRenderer.reloadTheme(null);
    const cat = category as StylePresetCategory;
    const customCSS = isCustomPresetId(cat, presetId)
      ? { [cat]: loadCustomCSS(cat, this.getWorkspaceRoot()) }
      : undefined;
    this.previewRenderer.setStylePresetOverrides({ [category]: presetId }, customCSS);

    return this.previewRenderer.render(markdown, 'preview');
  }

  private sendInitialData(): void {
    this.sendThemePresets();
    this.sendAllStylePresets();
  }

  private sendThemePresets(): void {
    if (!this.presetManager) return;

    const presets = this.presetManager.listPresets();
    const activeId = this.presetManager.getActivePreset()?.id;
    const accent = this.presetManager.getVarsWithOverride()?.accent || '#07C160';

    this.panel.webview.postMessage({
      type: 'updateThemePresets',
      accent,
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

  private getWorkspaceRoot(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) { return null; }
    return workspaceFolders[0].uri.fsPath;
  }

  dispose(): void {
    StylePanel.currentPanel = undefined;
    this.panel.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
