import MarkdownIt from 'markdown-it';
import { buildTheme, loadThemeVars, loadThemeOverride, applyThemeOverride, Theme } from './theme';
import { applyWeChatRules, RenderMode } from './rules';
import { PresetManager } from './PresetManager';

// Shiki transformer: adds data-line-number to each line span and wraps the
// pre block with a card div + language label for the preview panel.
function lineNumberTransformer() {
  return {
    name: 'wechat-md:line-numbers',
    line(node: { properties: Record<string, unknown> }, line: number) {
      node.properties['data-line'] = line;
    },
    pre(node: { properties: Record<string, unknown>; children: unknown[] }) {
      const lang = (node.properties['data-language'] as string) || '';
      // Wrap the <pre> in a card div with a language label
      node.properties['class'] = ((node.properties['class'] as string) || '') + ' wmd-code-block';
      if (lang) {
        node.properties['data-lang-label'] = lang;
      }
    },
  };
}

export class WeChatRenderer {
  private mdPreview: MarkdownIt;
  private mdCopy: MarkdownIt;
  private _currentTheme = buildTheme(loadThemeVars(null));
  private _shikiPlugin: ((md: MarkdownIt) => void) | null = null;
  private _presetManager: PresetManager | null = null;
  private _cssOverridePath: string | null = null;
  private _stylePresetCSS: string = ''; // CSS from style presets
  private _stylePresetOverrides: Record<string, string> = {}; // Preset IDs for each category
  private _stylePresetManager: any = null; // Reference to StylePresetManager for getting CSS

  constructor() {
    this.mdPreview = new MarkdownIt({ html: true, linkify: true, typographer: true });
    this.mdCopy    = new MarkdownIt({ html: true, linkify: true, typographer: true });
    applyWeChatRules(this.mdPreview, this._currentTheme, 'preview');
    applyWeChatRules(this.mdCopy,    this._currentTheme, 'copy');
  }

  // Initialize shiki via @shikijs/markdown-it plugin — call once on activation.
  async initHighlighter(): Promise<void> {
    const { default: shikiPlugin } = await import('@shikijs/markdown-it');
    this._shikiPlugin = await shikiPlugin({
      theme: 'github-light',
      transformers: [lineNumberTransformer()],
    });
    this.mdPreview.use(this._shikiPlugin);
  }

  // Set the preset manager for theme management
  setPresetManager(manager: PresetManager | null): void {
    this._presetManager = manager;
  }

  // Set the CSS override path
  setCssOverridePath(cssPath: string | null): void {
    this._cssOverridePath = cssPath;
    if (this._presetManager) {
      this._presetManager.setCssOverridePath(cssPath);
    }
  }

  // Set style preset CSS
  setStylePresetCSS(css: string): void {
    this._stylePresetCSS = css;
  }

  // Set style preset overrides (key=category, value=preset ID)
  setStylePresetOverrides(overrides: Record<string, string>): void {
    this._stylePresetOverrides = overrides;
    this._applyStylePresetOverrides();
  }

  // Set reference to StylePresetManager for getting preset CSS
  setStylePresetManager(manager: any): void {
    this._stylePresetManager = manager;
  }

  // Apply style preset overrides to the renderer rules
  // NOTE: This must be called AFTER reloadTheme() to ensure overrides take precedence
  private _applyStylePresetOverrides(): void {
    if (Object.keys(this._stylePresetOverrides).length === 0) return;

    const overrides = this._stylePresetOverrides;
    const r = this.mdPreview.renderer.rules;

    // Helper to get preset CSS
    const getCSS = (category: string, presetId: string): string => {
      if (!this._stylePresetManager) return presetId;
      return this._stylePresetManager.getPresetCSS(category as any, presetId);
    };

    // Helper to check preset ID
    const isPreset = (presetId: string | undefined, targetId: string): boolean => {
      if (!presetId) return false;
      return presetId === targetId || presetId.includes(targetId);
    };

    // Get accent color from preset manager
    const getAccent = (): string => {
      return this._presetManager?.getVarsWithOverride()?.accent || '#07C160';
    };

    // Counters for numbered headings
    let h1Counter = 0;
    let h2Counter = 0;
    let h3Counter = 0;

    // ============================================================================
    // HEADING STYLES - Unified handler for all levels
    // ============================================================================
    const hasH1Override = overrides.h1 && overrides.h1 !== 'h1-default';
    const hasH2Override = overrides.h2 && overrides.h2 !== 'h2-default';
    const hasH3Override = overrides.h3 && overrides.h3 !== 'h3-default';

    if (hasH1Override || hasH2Override || hasH3Override) {
      const accent = getAccent();
      const h1Preset = overrides.h1;
      const h2Preset = overrides.h2;
      const h3Preset = overrides.h3;

      // Store close handlers for special presets
      let h1CloseHandler: ((tokens: any, idx: number) => string) | null = null;
      let h2CloseHandler: ((tokens: any, idx: number) => string) | null = null;
      let h3CloseHandler: ((tokens: any, idx: number) => string) | null = null;

      r['heading_open'] = (tokens: any, idx: number) => {
        const tag = tokens[idx].tag;

        // H1 handling
        if (tag === 'h1' && hasH1Override) {
          if (isPreset(h1Preset, 'h1-center-line')) {
            return `<h1 style="position: relative; display: inline-block; padding: 0 20px;"><span style="position: absolute; top: 50%; right: 100%; width: 40px; height: 2px; background: ${accent};"></span><span style="position: absolute; top: 50%; left: 100%; width: 40px; height: 2px; background: ${accent};"></span>`;
          } else if (isPreset(h1Preset, 'h1-quote')) {
            return `<h1 style="position: relative; padding-left: 40px;"><span style="position: absolute; left: 0; top: -10px; font-size: 48px; color: ${accent}; opacity: 0.3;">"</span>`;
          } else if (isPreset(h1Preset, 'h1-number')) {
            h1Counter++;
            return `<h1 style="display: flex; align-items: center;"><span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${accent}; color: #fff; border-radius: 50%; margin-right: 12px; font-weight: bold;">${h1Counter}</span>`;
          } else if (isPreset(h1Preset, 'h1-bracket')) {
            h1CloseHandler = (tokens: any, idx: number) => {
              if (tokens[idx].tag === 'h1') {
                return `</h1><span style="color: ${accent}; font-weight: bold; margin: 0 8px;">]</span>`;
              }
              return `</${tokens[idx].tag}>`;
            };
            return `<h1 style="display: inline-block;"><span style="color: ${accent}; font-weight: bold; margin: 0 8px;">[</span>`;
          } else if (isPreset(h1Preset, 'h1-dot')) {
            h1CloseHandler = (tokens: any, idx: number) => {
              if (tokens[idx].tag === 'h1') {
                return `<span style="color: ${accent}; margin: 0 12px;">●</span></h1>`;
              }
              return `</${tokens[idx].tag}>`;
            };
            return `<h1 style="display: flex; align-items: center; justify-content: center;"><span style="color: ${accent}; margin: 0 12px;">●</span>`;
          } else {
            const css = getCSS('h1', h1Preset);
            return `<h1 style="${css}">`;
          }
        }

        // H2 handling
        if (tag === 'h2' && hasH2Override) {
          if (isPreset(h2Preset, 'h2-icon-bullet')) {
            return `<h2 style="display: flex; align-items: center;"><span style="color: ${accent}; margin-right: 8px; font-size: 0.8em;">▶</span>`;
          } else if (isPreset(h2Preset, 'h2-number')) {
            h2Counter++;
            return `<h2><span style="color: ${accent}; font-weight: bold; margin-right: 6px;">${h2Counter}.</span>`;
          } else if (isPreset(h2Preset, 'h2-bracket')) {
            h2CloseHandler = (tokens: any, idx: number) => {
              if (tokens[idx].tag === 'h2') {
                return `</h2><span style="color: ${accent};"> ]</span>`;
              }
              return `</${tokens[idx].tag}>`;
            };
            return `<h2 style="display: inline-block;"><span style="color: ${accent};">[</span>`;
          } else {
            const css = getCSS('h2', h2Preset);
            return `<h2 style="${css}">`;
          }
        }

        // H3 handling
        if (tag === 'h3' && hasH3Override) {
          if (isPreset(h3Preset, 'h3-bullet')) {
            return `<h3 style="display: flex; align-items: center;"><span style="color: ${accent}; margin-right: 8px; font-size: 0.6em;">●</span>`;
          } else if (isPreset(h3Preset, 'h3-number')) {
            h3Counter++;
            return `<h3><span style="color: ${accent}; font-weight: bold;">${h3Counter}.</span> `;
          } else if (isPreset(h3Preset, 'h3-brace')) {
            h3CloseHandler = (tokens: any, idx: number) => {
              if (tokens[idx].tag === 'h3') {
                return ` <span style="color: ${accent};">}</span></h3>`;
              }
              return `</${tokens[idx].tag}>`;
            };
            return `<h3 style="display: inline-block;"><span style="color: ${accent};">{</span> `;
          } else if (isPreset(h3Preset, 'h3-arrow')) {
            return `<h3 style="display: flex; align-items: center;"><span style="color: ${accent}; margin-right: 8px;">→</span>`;
          } else {
            const css = getCSS('h3', h3Preset);
            return `<h3 style="${css}">`;
          }
        }

        // Default: use theme styles
        const theme = this._currentTheme;
        const styles: Record<number, string> = {
          1: theme.h1, 2: theme.h2, 3: theme.h3,
          4: theme.h4, 5: theme.h5, 6: theme.h6,
        };
        const level = parseInt(tag[1]);
        return `<${tag} style="${styles[level] ?? theme.h6}">`;
      };

      // Set close handler if needed
      if (h1CloseHandler || h2CloseHandler || h3CloseHandler) {
        r['heading_close'] = (tokens: any, idx: number) => {
          if (tokens[idx].tag === 'h1' && h1CloseHandler) {
            return h1CloseHandler(tokens, idx);
          }
          if (tokens[idx].tag === 'h2' && h2CloseHandler) {
            return h2CloseHandler(tokens, idx);
          }
          if (tokens[idx].tag === 'h3' && h3CloseHandler) {
            return h3CloseHandler(tokens, idx);
          }
          return `</${tokens[idx].tag}>\n`;
        };
      }
    }

    // ============================================================================
    // BLOCKQUOTE STYLES
    // ============================================================================
    if (overrides.blockquote && overrides.blockquote !== 'quote-default') {
      const presetId = overrides.blockquote;
      const accent = getAccent();

      if (isPreset(presetId, 'quote-quote-mark')) {
        r['blockquote_open'] = () => `<blockquote style="position: relative; padding: 16px 16px 16px 48px; margin: 16px 0; background: #f9f9f9; border-radius: 8px;"><span style="position: absolute; left: 12px; top: 8px; font-size: 32px; color: ${accent}; opacity: 0.3; font-family: Georgia;">"</span>`;
      } else {
        const css = getCSS('blockquote', presetId);
        r['blockquote_open'] = () => `<blockquote style="${css}">`;
      }
    }

    // ============================================================================
    // LIST STYLES
    // ============================================================================
    if (overrides.list && overrides.list !== 'list-default') {
      const presetId = overrides.list;
      const accent = getAccent();

      if (isPreset(presetId, 'list-arrow')) {
        r['bullet_list_open'] = () => `<ul style="list-style: none; padding-left: 0;">`;
        r['list_item_open'] = () => `<li style="padding-left: 0;">→ `;
      } else if (isPreset(presetId, 'list-star')) {
        r['bullet_list_open'] = () => `<ul style="list-style: none; padding-left: 0;">`;
        r['list_item_open'] = () => `<li style="padding-left: 0;">★ `;
      } else if (isPreset(presetId, 'list-diamond')) {
        r['bullet_list_open'] = () => `<ul style="list-style: none; padding-left: 0;">`;
        r['list_item_open'] = () => `<li style="padding-left: 0;">◆ `;
      } else if (isPreset(presetId, 'list-square')) {
        r['bullet_list_open'] = () => `<ul style="list-style-type: square;">`;
      } else if (isPreset(presetId, 'list-circle')) {
        r['bullet_list_open'] = () => `<ul style="list-style-type: circle;">`;
      } else if (isPreset(presetId, 'list-triangle')) {
        r['bullet_list_open'] = () => `<ul style="list-style: none; padding-left: 0;">`;
        r['list_item_open'] = () => `<li style="padding-left: 0;">▶ `;
      } else if (isPreset(presetId, 'list-dash')) {
        r['bullet_list_open'] = () => `<ul style="list-style: none; padding-left: 0;">`;
        r['list_item_open'] = () => `<li style="padding-left: 0;">— `;
      } else if (isPreset(presetId, 'list-accent-bullet')) {
        r['bullet_list_open'] = () => `<ul style="list-style: none; padding-left: 0;">`;
        r['list_item_open'] = () => `<li style="padding-left: 0;"><span style="color: ${accent}; margin-right: 10px;">●</span>`;
      } else if (isPreset(presetId, 'list-number-paren')) {
        let listCounter = 0;
        r['bullet_list_open'] = () => { listCounter = 0; return `<ul style="list-style: none; padding-left: 0;">`; };
        r['list_item_open'] = () => { listCounter++; return `<li style="padding-left: 0;"><span style="color: ${accent}; font-weight: bold; margin-right: 8px;">(${listCounter})</span>`; };
      } else if (isPreset(presetId, 'list-check')) {
        r['list_item_open'] = () => `<li style="position: relative; padding-left: 24px;"><span style="position: absolute; left: 0; color: ${accent}; font-weight: bold;">✓</span>`;
      } else if (isPreset(presetId, 'list-number-dot')) {
        r['bullet_list_open'] = () => `<ul style="list-style-type: decimal;">`;
      }
    }

    // ============================================================================
    // LINK STYLES
    // ============================================================================
    if (overrides.link && overrides.link !== 'link-default') {
      const presetId = overrides.link;
      const accent = getAccent();

      if (isPreset(presetId, 'link-arrow')) {
        r['link_open'] = (tokens: any, idx: number) => {
          const href = tokens[idx].attrGet('href') ?? '#';
          return `<a href="${this._escapeHtml(href)}" style="color: ${accent}; text-decoration: none;">`;
        };
        r['link_close'] = () => ` <span style="font-size: 0.9em;">→</span></a>`;
      } else {
        const css = getCSS('link', presetId);
        r['link_open'] = (tokens: any, idx: number) => {
          const href = tokens[idx].attrGet('href') ?? '#';
          return `<a href="${this._escapeHtml(href)}" style="${css}">`;
        };
      }
    }

    // ============================================================================
    // IMAGE STYLES
    // ============================================================================
    if (overrides.image && overrides.image !== 'img-default') {
      const css = getCSS('image', overrides.image);
      r['image'] = (tokens: any, idx: number, options: any, env: any, self: any) => {
        const src = tokens[idx].attrGet('src') ?? '';
        const alt = self.renderInlineAsText(tokens[idx].children ?? [], options, env);
        return `<img src="${this._escapeHtml(src)}" alt="${this._escapeHtml(alt)}" style="${css}">`;
      };
    }

    // ============================================================================
    // DIVIDER STYLES
    // ============================================================================
    if (overrides.divider && overrides.divider !== 'hr-default') {
      const presetId = overrides.divider;
      const accent = getAccent();

      if (isPreset(presetId, 'hr-text')) {
        r['hr'] = () => `<div style="border: none; text-align: center; margin: 24px 0;"><span style="color: #ccc; letter-spacing: 4px;">● ● ●</span></div>`;
      } else if (isPreset(presetId, 'hr-center-star')) {
        r['hr'] = () => `<div style="border: none; overflow: hidden; text-align: center; margin: 24px 0; position: relative;"><span style="display: inline-block; padding: 0 10px; color: ${accent}; font-size: 20px; position: relative; z-index: 1;">★</span><span style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #ddd; z-index: 0;"></span></div>`;
      } else if (isPreset(presetId, 'hr-arrow')) {
        r['hr'] = () => `<div style="border: none; text-align: center; margin: 24px 0;"><span style="color: ${accent}; letter-spacing: 8px; font-size: 12px;">↓↓↓</span></div>`;
      } else if (isPreset(presetId, 'hr-space')) {
        r['hr'] = () => `<div style="border: none; height: 32px; margin: 24px 0;"></div>`;
      } else {
        const css = getCSS('divider', presetId);
        r['hr'] = () => `<hr style="${css}">`;
      }
    }

    // ============================================================================
    // TABLE STYLES
    // ============================================================================
    if (overrides.table && overrides.table !== 'table-default') {
      const presetId = overrides.table;
      const accent = getAccent();

      // Reset default table rules and apply custom styles
      if (isPreset(presetId, 'table-striped')) {
        r['table_open'] = () => `<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">`;
        r['thead_open'] = () => `<thead>`;
        r['th_open'] = () => `<th style="border: 1px solid #ddd; padding: 8px 12px; background: #f5f5f5; font-weight: 600;">`;
        r['td_open'] = (tokens: any, idx: number) => {
          // Check if this is in an even row
          return `<td style="border: 1px solid #ddd; padding: 8px 12px; background: ${idx % 2 === 0 ? '#f9f9f9' : 'transparent'};">`;
        };
      } else if (isPreset(presetId, 'table-accent')) {
        r['table_open'] = () => `<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">`;
        r['th_open'] = () => `<th style="border: 1px solid #ddd; padding: 8px 12px; background: ${accent}; color: #fff; font-weight: 600;">`;
        r['td_open'] = () => `<td style="border: 1px solid #ddd; padding: 8px 12px;">`;
      } else if (isPreset(presetId, 'table-borderless')) {
        r['table_open'] = () => `<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">`;
        r['th_open'] = () => `<th style="border: none; padding: 8px 12px; font-weight: 600; border-bottom: 2px solid ${accent};">`;
        r['td_open'] = () => `<td style="border: none; padding: 8px 12px;">`;
      } else if (isPreset(presetId, 'table-card')) {
        r['table_open'] = () => `<table style="border-collapse: separate; border-spacing: 0; width: 100%; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">`;
        r['th_open'] = () => `<th style="padding: 12px; border-bottom: 1px solid #eee; background: #f5f5f5; font-weight: 600;">`;
        r['td_open'] = () => `<td style="padding: 12px; border-bottom: 1px solid #eee;">`;
      } else if (isPreset(presetId, 'table-modern')) {
        r['table_open'] = () => `<table style="border-collapse: collapse; width: 100%; margin: 16px 0;">`;
        r['th_open'] = () => `<th style="border: none; padding: 12px 16px; text-align: left; background: #333; color: #fff; font-weight: 600;">`;
        r['td_open'] = (tokens: any, idx: number) => {
          return `<td style="border: none; padding: 12px 16px; text-align: left; background: ${idx % 2 === 0 ? '#f9f9f9' : 'transparent'};">`;
        };
      }
    }

    // ============================================================================
    // COPY RENDERER - Apply same overrides
    // ============================================================================
    const rCopy = this.mdCopy.renderer.rules;

    if (overrides.h1 || overrides.h2 || overrides.h3) {
      rCopy['heading_open'] = r['heading_open'];
      if (overrides.h1 && isPreset(overrides.h1, 'h1-bracket')) {
        rCopy['heading_close'] = r['heading_close'];
      }
      if (overrides.h1 && isPreset(overrides.h1, 'h1-dot')) {
        rCopy['heading_close'] = r['heading_close'];
      }
      if (overrides.h2 && isPreset(overrides.h2, 'h2-bracket')) {
        rCopy['heading_close'] = r['heading_close'];
      }
      if (overrides.h3 && isPreset(overrides.h3, 'h3-brace')) {
        rCopy['heading_close'] = r['heading_close'];
      }
    }
    if (overrides.blockquote) {
      rCopy['blockquote_open'] = r['blockquote_open'];
    }
    if (overrides.list) {
      rCopy['bullet_list_open'] = r['bullet_list_open'];
      rCopy['list_item_open'] = r['list_item_open'];
    }
    if (overrides.link) {
      rCopy['link_open'] = r['link_open'];
      if (isPreset(overrides.link, 'link-arrow')) {
        rCopy['link_close'] = r['link_close'];
      }
    }
    if (overrides.image) {
      rCopy['image'] = r['image'];
    }
    if (overrides.divider) {
      rCopy['hr'] = r['hr'];
    }
    if (overrides.table) {
      rCopy['table_open'] = r['table_open'];
      rCopy['th_open'] = r['th_open'];
      rCopy['td_open'] = r['td_open'];
    }
  }

  private _escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Call this before render() to pick up the latest .wechat/theme.css and .wechat/theme.override.ts.
  // Re-applies WeChat rules then re-applies shiki plugin so fence highlight is preserved.
  reloadTheme(cssPath: string | null, overridePath: string | null = null): void {
    let theme: Theme;

    if (this._presetManager) {
      // Use preset manager if available
      this._presetManager.setCssOverridePath(cssPath);
      const vars = this._presetManager.getVarsWithOverride();
      theme = buildTheme(vars);
    } else {
      // Fall back to original behavior
      let themeVars = loadThemeVars(cssPath);
      theme = buildTheme(themeVars);
    }

    // Apply override if exists
    const overrideFn = overridePath ? loadThemeOverride(overridePath) : null;
    this._currentTheme = overrideFn ? applyThemeOverride(theme, overrideFn) : theme;

    applyWeChatRules(this.mdPreview, this._currentTheme, 'preview');
    if (this._shikiPlugin) {
      this.mdPreview.use(this._shikiPlugin);
    }
    applyWeChatRules(this.mdCopy, this._currentTheme, 'copy');
  }

  // Render markdown string to HTML.
  // mode='preview': shiki syntax highlighting via plugin
  // mode='copy': WeChat editor-compatible structure for pasting
  render(markdown: string, mode: RenderMode = 'preview'): string {
    const md = mode === 'copy' ? this.mdCopy : this.mdPreview;
    const inner = md.render(markdown);

    // Include style preset CSS if present
    let styleAttr = this._currentTheme.container;
    if (this._stylePresetCSS) {
      // Wrap the content with style preset CSS
      return `<section style="${styleAttr}">
<style type="text/css">${this._stylePresetCSS}</style>
${inner}
</section>`;
    }

    return `<section style="${styleAttr}">\n${inner}</section>`;
  }
}
