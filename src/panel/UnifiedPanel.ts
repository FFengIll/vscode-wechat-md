// Unified Panel - Three column layout with preview and comprehensive style dashboard
import * as vscode from 'vscode';
import { WeChatRenderer } from '../renderer';
import { PresetManager } from '../renderer/PresetManager';
import type { ThemeVars } from '../renderer/theme';
import { getNonce } from './PreviewPanel';

/**
 * Unified webview panel with preview (left) and comprehensive style dashboard (right)
 */
export class UnifiedPanel {
  static currentPanel: UnifiedPanel | undefined;
  private static readonly viewType = 'wechatMdUnified';

  private readonly panel: vscode.WebviewPanel;
  private readonly renderer: WeChatRenderer;
  private readonly presetManager: PresetManager | null;
  private disposables: vscode.Disposable[] = [];
  private lastMarkdownEditor: vscode.TextEditor | undefined;
  private updateTimer: NodeJS.Timeout | undefined;

  // Current style state (tracks all modifications)
  private currentStyleState: Partial<ThemeVars> = {};

  static createOrShow(
    extensionUri: vscode.Uri,
    presetManager: PresetManager | null
  ): UnifiedPanel {
    if (UnifiedPanel.currentPanel) {
      UnifiedPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside, true);
      UnifiedPanel.currentPanel.refresh();
      return UnifiedPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      UnifiedPanel.viewType,
      'WeChat Markdown',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri, vscode.Uri.file('/')]
      }
    );

    UnifiedPanel.currentPanel = new UnifiedPanel(panel, extensionUri, presetManager);
    return UnifiedPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    presetManager: PresetManager | null
  ) {
    this.panel = panel;
    this.renderer = new WeChatRenderer();
    this.presetManager = presetManager;

    if (presetManager) {
      this.renderer.setPresetManager(presetManager);
    }

    this.renderer.initHighlighter().then(() => this.refresh()).catch(() => {});

    const current = vscode.window.activeTextEditor;
    if (current && current.document.languageId === 'markdown') {
      this.lastMarkdownEditor = current;
    }

    this.refresh();
    this.setupEventHandlers();
    this.setupMessageHandlers();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private setupEventHandlers(): void {
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'markdown') {
        this.lastMarkdownEditor = editor;
        this.refresh();
      }
    }, null, this.disposables);

    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === this.lastMarkdownEditor?.document) {
        this.scheduleRefresh();
      }
    }, null, this.disposables);

    if (this.presetManager) {
      this.disposables.push(
        this.presetManager.onDidChangePreset(() => {
          this.currentStyleState = {}; // Reset custom modifications
          this.refresh();
        })
      );
    }
  }

  private scheduleRefresh(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = setTimeout(() => this.refresh(), 100);
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

      case 'selectPreset':
        if (this.presetManager && message.presetId) {
          this.presetManager.switchPreset(message.presetId);
          this.currentStyleState = {}; // Reset custom modifications when switching preset
          this.sendPresets();
          this.sendCurrentStyles();
          this.refreshPreview();
        }
        break;

      case 'updateStyle':
        // Track style modifications
        if (message.key && message.value !== undefined) {
          (this.currentStyleState as any)[message.key] = message.value;
          this.refreshPreview();
        }
        break;

      case 'resetStyles':
        this.currentStyleState = {};
        this.sendCurrentStyles();
        this.refreshPreview();
        break;

      case 'savePreset':
        if (this.presetManager && message.presetName) {
          // Merge current state with active preset
          const baseVars = this.presetManager.getActivePreset()?.vars;
          const mergedVars = baseVars ? { ...baseVars, ...this.currentStyleState } : this.currentStyleState;
          await this.presetManager.saveAsPreset(message.presetName, mergedVars as ThemeVars);
          this.sendPresets();
          vscode.window.showInformationMessage(`预设 "${message.presetName}" 已保存`);
        }
        break;

      case 'copyRich':
        await this.handleCopyRich();
        break;
    }
  }

  private sendInitialData(): void {
    this.sendPresets();
    this.sendCurrentStyles();
  }

  private sendPresets(): void {
    if (!this.presetManager) return;

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

  private sendCurrentStyles(): void {
    // Get base vars from preset
    let baseVars: ThemeVars;
    if (this.presetManager) {
      const preset = this.presetManager.getActivePreset();
      baseVars = preset ? preset.vars : (require('../renderer/theme') as any).defaultVars;
    } else {
      baseVars = (require('../renderer/theme') as any).defaultVars;
    }

    // Merge with current style state
    const mergedVars = { ...baseVars, ...this.currentStyleState };

    this.panel.webview.postMessage({
      type: 'updateStyles',
      styles: mergedVars
    });
  }

  private refreshPreview(): void {
    // Apply current style state to renderer
    this.applyStylesToRenderer();

    // Re-render preview
    const editor = this.lastMarkdownEditor;
    if (!editor) return;

    const markdown = editor.document.getText();
    const rendered = this.renderer.render(markdown);

    // Send updated preview to webview (replace preview section only)
    this.panel.webview.postMessage({
      type: 'updatePreview',
      html: rendered
    });
  }

  private applyStylesToRenderer(): void {
    if (!this.presetManager) return;

    // Get base vars from preset
    const preset = this.presetManager.getActivePreset();
    const baseVars = preset ? preset.vars : (require('../renderer/theme') as any).defaultVars;

    // Merge with current style state
    const mergedVars = { ...baseVars, ...this.currentStyleState };

    // Build theme
    const { buildTheme } = require('../renderer/theme');
    const theme = buildTheme(mergedVars);

    // Update renderer's theme
    (this.renderer as any)._currentTheme = theme;

    // Re-apply WeChat rules with new theme for BOTH preview and copy modes
    const { applyWeChatRules } = require('../renderer/rules');
    applyWeChatRules((this.renderer as any).mdPreview, theme, 'preview');
    applyWeChatRules((this.renderer as any).mdCopy, theme, 'copy');
  }

  private async handleCopyRich(): Promise<void> {
    if (!this.lastMarkdownEditor) return;

    const markdown = this.lastMarkdownEditor.document.getText();

    // Apply current styles before rendering for copy
    this.applyStylesToRenderer();

    const copyHtml = this.renderer.render(markdown, 'copy');

    const path = require('path');
    const { resolveImagesAsBase64 } = require('./imageUtils');
    const docDir = this.lastMarkdownEditor.document.uri.fsPath;
    const resolved = await resolveImagesAsBase64(copyHtml, path.dirname(docDir));

    this.panel.webview.postMessage({ command: 'doRichCopy', html: resolved });
    vscode.window.showInformationMessage('已复制到剪贴板');
  }

  refresh(): void {
    const editor = this.lastMarkdownEditor;
    if (!editor) {
      this.panel.webview.html = this.getHtmlContent(
        '<div class="empty-state">请打开一个 Markdown 文件</div>'
      );
      return;
    }

    const markdown = editor.document.getText();
    const rendered = this.renderer.render(markdown);
    this.panel.webview.html = this.getHtmlContent(rendered);
    this.sendCurrentStyles();
  }

  private getHtmlContent(previewHtml: string): string {
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
      overflow: hidden;
      height: 100vh;
    }

    .container {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Preview Section (60%) */
    .preview-section {
      flex: 0 0 60%;
      border-right: 1px solid var(--vscode-panelBorder, #3c3c3c);
      overflow-y: auto;
      padding: 20px;
      background: var(--vscode-editorBackground, #1e1e1e);
    }

    .preview-content {
      background: #ffffff;
      padding: 40px;
      border-radius: 8px;
      min-height: calc(100vh - 40px);
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-descriptionForeground, #888);
      font-size: 14px;
    }

    /* Dashboard Section (40%) */
    .dashboard-section {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background: var(--vscode-sideBarBackground, #252526);
    }

    .dashboard-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-foreground, #cccccc);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panelBorder, #3c3c3c);
    }

    /* Preset Grid */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-bottom: 16px;
    }

    .preset-card {
      background: var(--vscode-editorBackground, #1e1e1e);
      border: 2px solid var(--vscode-panelBorder, #3c3c3c);
      border-radius: 6px;
      padding: 8px;
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
      gap: 3px;
      margin-bottom: 4px;
    }

    .preset-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1px solid var(--vscode-widgetBorder, #3c3c3c);
    }

    .preset-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-foreground, #cccccc);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Accordion Sections */
    .accordion {
      border: 1px solid var(--vscode-panelBorder, #3c3c3c);
      border-radius: 6px;
      margin-bottom: 8px;
      overflow: hidden;
    }

    .accordion-header {
      background: var(--vscode-editorBackground, #1e1e1e);
      padding: 8px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
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
      max-height: 400px;
      overflow-y: auto;
    }

    .accordion-content.open {
      display: block;
    }

    /* Control Groups */
    .control-group {
      margin-bottom: 10px;
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .control-label {
      display: block;
      font-size: 10px;
      margin-bottom: 3px;
      color: var(--vscode-descriptionForeground, #888);
    }

    .control-input[type="color"] {
      width: 28px;
      height: 24px;
      border: 1px solid var(--vscode-inputBorder, #3c3c3c);
      border-radius: 3px;
      background: var(--vscode-editorBackground, #1e1e1e);
      cursor: pointer;
      padding: 0;
    }

    .control-input[type="text"],
    .control-input[type="number"] {
      flex: 1;
      background: var(--vscode-inputBackground, #3c3c3c);
      border: 1px solid var(--vscode-inputBorder, #3c3c3c);
      color: var(--vscode-inputForeground, #cccccc);
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-family: var(--vscode-editor-fontFamily, monospace);
    }

    .control-slider {
      flex: 1;
      height: 3px;
      -webkit-appearance: none;
      background: var(--vscode-sliderBackground, #3c3c3c);
      border-radius: 2px;
      outline: none;
    }

    .control-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      background: var(--vscode-buttonBackground, #0e639c);
      border-radius: 50%;
      cursor: pointer;
    }

    .control-select {
      flex: 1;
      background: var(--vscode-inputBackground, #3c3c3c);
      border: 1px solid var(--vscode-inputBorder, #3c3c3c);
      color: var(--vscode-inputForeground, #cccccc);
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 11px;
    }

    /* Section Dividers */
    .section-divider {
      border-top: 1px dashed var(--vscode-panelBorder, #3c3c3c);
      margin: 10px 0;
      padding-top: 10px;
    }

    .sub-section-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-foreground, #cccccc);
      margin-bottom: 6px;
    }

    /* Action Buttons */
    .action-bar {
      display: flex;
      gap: 6px;
      padding: 10px 0;
      border-top: 1px solid var(--vscode-panelBorder, #3c3c3c);
      margin-top: 12px;
    }

    .btn {
      flex: 1;
      background: var(--vscode-buttonBackground, #0e639c);
      color: var(--vscode-buttonForeground, #ffffff);
      border: none;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 11px;
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

    /* Heading Group Styles */
    .heading-group {
      padding: 8px;
      background: var(--vscode-editorBackground, #1e1e1e);
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .heading-label {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--vscode-foreground, #cccccc);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Preview Section -->
    <div class="preview-section">
      <div class="preview-content" id="preview-content">
        ${previewHtml}
      </div>
    </div>

    <!-- Dashboard Section -->
    <div class="dashboard-section" id="dashboard">
      <h2 class="dashboard-title">🎨 样式控制面板</h2>

      <!-- Presets -->
      <div class="accordion">
        <div class="accordion-header" data-section="presets">
          <span>🎨 主题预设</span>
          <span class="accordion-icon open">▼</span>
        </div>
        <div class="accordion-content open" id="presets-content">
          <div class="preset-grid" id="preset-grid"></div>
        </div>
      </div>

      <!-- Global Styles -->
      <div class="accordion">
        <div class="accordion-header" data-section="global">
          <span>🌐 全局样式</span>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="global-content"></div>
      </div>

      <!-- Heading Styles -->
      <div class="accordion">
        <div class="accordion-header" data-section="headings">
          <span>📄 标题样式</span>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="headings-content"></div>
      </div>

      <!-- Text Settings -->
      <div class="accordion">
        <div class="accordion-header" data-section="text">
          <span>📝 正文设置</span>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="text-content"></div>
      </div>

      <!-- Code Styles -->
      <div class="accordion">
        <div class="accordion-header" data-section="code">
          <span>💻 代码样式</span>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="code-content"></div>
      </div>

      <!-- Accents -->
      <div class="accordion">
        <div class="accordion-header" data-section="accents">
          <span>🎨 强调色 & 边框</span>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="accents-content"></div>
      </div>

      <!-- Spacing -->
      <div class="accordion">
        <div class="accordion-header" data-section="spacing">
          <span>📏 间距 & 布局</span>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content" id="spacing-content"></div>
      </div>

      <!-- Action Buttons -->
      <div class="action-bar">
        <button class="btn btn-secondary" id="reset-btn">重置</button>
        <button class="btn btn-secondary" id="save-btn">保存预设</button>
        <button class="btn" id="copy-btn">复制富文本</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      let currentStyles = {};
      let presets = [];

      function init() {
        setupAccordion();
        vscode.postMessage({ type: 'getInitialData' });
      }

      function setupAccordion() {
        document.querySelectorAll('.accordion-header').forEach(header => {
          header.addEventListener('click', (e) => {
            const icon = header.querySelector('.accordion-icon');
            const content = header.nextElementSibling;

            // Close others
            document.querySelectorAll('.accordion-content').forEach(c => {
              if (c !== content) {
                c.classList.remove('open');
                c.previousElementSibling?.querySelector('.accordion-icon')?.classList.remove('open');
              }
            });

            icon.classList.toggle('open');
            content.classList.toggle('open');
          });
        });
      }

      function renderPresets() {
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
            vscode.postMessage({ type: 'selectPreset', presetId: id });
          });
        });
      }

      function renderGlobalControls(styles) {
        const container = document.getElementById('global-content');
        if (!container) return;

        container.innerHTML = \`
          \${renderColorControl('accent', '主题色', styles.accent)}
          \${renderColorControl('textColor', '正文颜色', styles.textColor)}
          \${renderColorControl('codeBg', '代码背景', styles.codeBg)}
          \${renderSliderControl('fontSize', '正文字号', styles.fontSize, '12', '20', 'px')}
          \${renderSliderControl('lineHeight', '行高', styles.lineHeight, '1.0', '2.5', '')}
          \${renderSliderControl('maxWidth', '最大宽度', styles.maxWidth, '400', '900', 'px')}
        \`;
      }

      function renderHeadingControls(styles) {
        const container = document.getElementById('headings-content');
        if (!container) return;

        container.innerHTML = \`
          <div class="heading-group">
            <div class="heading-label">H1 标题</div>
            \${renderColorControl('h1Color', '颜色', styles.h1Color)}
            \${renderSliderControl('h1FontSize', '大小', styles.h1FontSize, '20', '40', 'px')}
            \${renderSelectControl('h1FontWeight', '字重', styles.h1FontWeight, ['normal', 'bold', '600', '700', '800'])}
            \${renderColorControl('h1Bg', '背景', styles.h1Bg)}
            \${renderSliderControl('h1Padding', '内边距', styles.h1Padding, '0', '24', 'px')}
            \${renderSliderControl('h1BorderRadius', '圆角', styles.h1BorderRadius, '0', '12', 'px')}
          </div>

          <div class="heading-group">
            <div class="heading-label">H2 标题</div>
            \${renderColorControl('h2Color', '颜色', styles.h2Color)}
            \${renderSliderControl('h2FontSize', '大小', styles.h2FontSize, '16', '32', 'px')}
            \${renderSelectControl('h2FontWeight', '字重', styles.h2FontWeight, ['normal', 'bold', '600', '700'])}
            \${renderColorControl('h2Bg', '背景', styles.h2Bg)}
            \${renderSliderControl('h2Padding', '内边距', styles.h2Padding, '0', '20', 'px')}
            \${renderSliderControl('h2BorderRadius', '圆角', styles.h2BorderRadius, '0', '12', 'px')}
          </div>

          <div class="section-divider"></div>

          \${renderColorControl('h3Color', 'H3 颜色', styles.h3Color)}
          \${renderSliderControl('h3FontSize', 'H3 大小', styles.h3FontSize, '14', '28', 'px')}
          \${renderSelectControl('h3FontWeight', 'H3 字重', styles.h3FontWeight, ['normal', 'bold', '600'])}
          \${renderColorControl('h3Bg', 'H3 背景', styles.h3Bg)}

          <div class="section-divider"></div>

          \${renderColorControl('h4Color', 'H4 颜色', styles.h4Color)}
          \${renderSliderControl('h4FontSize', 'H4 大小', styles.h4FontSize, '12', '24', 'px')}
          \${renderSelectControl('h4FontWeight', 'H4 字重', styles.h4FontWeight, ['normal', 'bold', '600'])}

          <div class="section-divider"></div>

          \${renderColorControl('h5Color', 'H5 颜色', styles.h5Color)}
          \${renderSliderControl('h5FontSize', 'H5 大小', styles.h5FontSize, '12', '20', 'px')}

          \${renderColorControl('h6Color', 'H6 颜色', styles.h6Color)}
          \${renderSliderControl('h6FontSize', 'H6 大小', styles.h6FontSize, '11', '18', 'px')}
        \`;
      }

      function renderTextControls(styles) {
        const container = document.getElementById('text-content');
        if (!container) return;

        container.innerHTML = \`
          \${renderSliderControl('fontSize', '字号', styles.fontSize, '12', '22', 'px')}
          \${renderSliderControl('lineHeight', '行高', styles.lineHeight, '1.0', '2.5', '')}
          \${renderColorControl('textColor', '文字颜色', styles.textColor)}
        \`;
      }

      function renderCodeControls(styles) {
        const container = document.getElementById('code-content');
        if (!container) return;

        container.innerHTML = \`
          \${renderColorControl('codeBg', '代码块背景', styles.codeBg)}
          \${renderColorControl('inlineCodeColor', '行内代码颜色', styles.inlineCodeColor)}
        \`;
      }

      function renderAccentControls(styles) {
        const container = document.getElementById('accents-content');
        if (!container) return;

        container.innerHTML = \`
          \${renderColorControl('accent', '主题色', styles.accent)}
          \${renderColorControl('blockquoteBg', '引用背景', styles.blockquoteBg)}
        \`;
      }

      function renderSpacingControls(styles) {
        const container = document.getElementById('spacing-content');
        if (!container) return;

        container.innerHTML = \`
          \${renderSliderControl('maxWidth', '内容最大宽度', styles.maxWidth, '400', '900', 'px')}
          \${renderSliderControl('lineHeight', '全局行高', styles.lineHeight, '1.0', '2.5', '')}
        \`;
      }

      function renderColorControl(key, label, value) {
        return \`
          <div class="control-group">
            <label class="control-label">\${label}</label>
            <div class="control-row">
              <input type="color" class="control-input color-picker" value="\${value}" data-key="\${key}">
              <input type="text" class="control-input" value="\${value}" data-key="\${key}">
            </div>
          </div>
        \`;
      }

      function renderSliderControl(key, label, value, min, max, unit) {
        const numValue = parseFloat(value) || parseFloat(min);
        return \`
          <div class="control-group">
            <label class="control-label">\${label}: \${value}</label>
            <div class="control-row">
              <input type="range" class="control-slider" min="\${min}" max="\${max}" value="\${numValue}" data-key="\${key}" data-unit="\${unit}">
              <input type="text" class="control-input" value="\${value}" data-key="\${key}" style="width: 50px; flex: none;">
            </div>
          </div>
        \`;
      }

      function renderSelectControl(key, label, value, options) {
        return \`
          <div class="control-group">
            <label class="control-label">\${label}</label>
            <div class="control-row">
              <select class="control-select" data-key="\${key}">
                \${options.map(opt => \`<option value="\${opt}" \${opt === value ? 'selected' : ''}>\${opt}</option>\`).join('')}
              </select>
            </div>
          </div>
        \`;
      }

      // Handle messages
      window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
          case 'updatePresets':
            presets = message.presets || [];
            renderPresets();
            break;
          case 'updateStyles':
            currentStyles = message.styles || {};
            renderGlobalControls(currentStyles);
            renderHeadingControls(currentStyles);
            renderTextControls(currentStyles);
            renderCodeControls(currentStyles);
            renderAccentControls(currentStyles);
            renderSpacingControls(currentStyles);
            setupControlListeners();
            break;
          case 'updatePreview':
            const previewContent = document.getElementById('preview-content');
            if (previewContent) {
              previewContent.innerHTML = message.html;
            }
            break;
          case 'command':
            if (message.command === 'doRichCopy') {
              // Use execCommand method for compatibility with WeChat editor
              var stage = document.createElement('div');
              stage.id = 'rich-copy-stage';
              stage.contentEditable = 'true';
              stage.style.position = 'absolute';
              stage.style.left = '-9999px';
              document.body.appendChild(stage);

              stage.innerHTML = message.html || '';

              var range = document.createRange();
              range.selectNodeContents(stage);
              var sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);

              var ok = document.execCommand('copy');
              sel.removeAllRanges();
              document.body.removeChild(stage);

              if (ok) {
                // Show success feedback
                var copyBtn = document.getElementById('copy-btn');
                if (copyBtn) {
                  var originalText = copyBtn.textContent;
                  copyBtn.textContent = '✓ 已复制';
                  copyBtn.style.background = 'var(--vscode-button-hoverBackground, #1177bb)';
                  setTimeout(function() {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '';
                  }, 2000);
                }
              } else {
                alert('复制失败，请手动复制预览区域内容');
              }
            }
            break;
        }
      });

      // Setup control change listeners
      function setupControlListeners() {
        // Remove old listeners
        document.querySelectorAll('.control-input').forEach(input => {
          input.replaceWith(input.cloneNode(true));
        });
        document.querySelectorAll('.control-slider').forEach(slider => {
          slider.replaceWith(slider.cloneNode(true));
        });
        document.querySelectorAll('.control-select').forEach(select => {
          select.replaceWith(select.cloneNode(true));
        });

        // Add new listeners
        document.querySelectorAll('.control-input:not(.control-slider)').forEach(input => {
          input.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const value = e.target.value;
            // Sync color picker with text input
            if (e.target.type === 'color') {
              const textInput = e.target.nextElementSibling;
              if (textInput) textInput.value = value;
            } else if (e.target.type === 'text' && e.target.previousElementSibling?.type === 'color') {
              const colorPicker = e.target.previousElementSibling;
              if (colorPicker) colorPicker.value = value;
            }
            vscode.postMessage({ type: 'updateStyle', key, value });
          });
        });

        document.querySelectorAll('.control-slider').forEach(slider => {
          slider.addEventListener('input', (e) => {
            const key = e.target.dataset.key;
            const unit = e.target.dataset.unit || '';
            const value = e.target.value + unit;
            const textInput = e.target.nextElementSibling;
            if (textInput) {
              textInput.value = value;
              // Update label
              const label = e.target.previousElementSibling;
              if (label && label.classList.contains('control-label')) {
                const labelText = label.textContent.split(':')[0];
                label.textContent = labelText + ': ' + value;
              }
            }
          });

          slider.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const unit = e.target.dataset.unit || '';
            const value = e.target.value + unit;
            vscode.postMessage({ type: 'updateStyle', key, value });
          });
        });

        document.querySelectorAll('.control-select').forEach(select => {
          select.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const value = e.target.value;
            vscode.postMessage({ type: 'updateStyle', key, value });
          });
        });
      }

      // Action buttons
      document.getElementById('reset-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'resetStyles' });
      });

      document.getElementById('save-btn').addEventListener('click', () => {
        const name = prompt('输入预设名称:');
        if (name) {
          vscode.postMessage({
            type: 'savePreset',
            presetName: name
          });
        }
      });

      document.getElementById('copy-btn').addEventListener('click', () => {
        vscode.postMessage({ type: 'copyRich' });
      });

      init();
    })();
  </script>
</body>
</html>`;
  }

  dispose(): void {
    UnifiedPanel.currentPanel = undefined;
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.panel.dispose();
    this.disposables.forEach(d => d.dispose());
    if (this.presetManager) {
      this.presetManager.dispose();
    }
  }
}
