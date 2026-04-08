import MarkdownIt from 'markdown-it';
import { buildTheme, loadThemeVars } from './theme';
import { applyWeChatRules, RenderMode } from './rules';

export class WeChatRenderer {
  private mdPreview: MarkdownIt;
  private mdCopy: MarkdownIt;
  private _currentTheme = buildTheme(loadThemeVars(null));
  private _shikiPlugin: ((md: MarkdownIt) => void) | null = null;

  constructor() {
    this.mdPreview = new MarkdownIt({ html: false, linkify: true, typographer: true });
    this.mdCopy    = new MarkdownIt({ html: false, linkify: true, typographer: true });
    applyWeChatRules(this.mdPreview, this._currentTheme, 'preview');
    applyWeChatRules(this.mdCopy,    this._currentTheme, 'copy');
  }

  // Initialize shiki via @shikijs/markdown-it plugin — call once on activation.
  async initHighlighter(): Promise<void> {
    const { default: shikiPlugin } = await import('@shikijs/markdown-it');
    this._shikiPlugin = await shikiPlugin({ theme: 'github-light' });
    this.mdPreview.use(this._shikiPlugin);
  }

  // Call this before render() to pick up the latest .wechat/theme.css.
  // Re-applies WeChat rules then re-applies shiki plugin so fence highlight is preserved.
  reloadTheme(cssPath: string | null): void {
    this._currentTheme = buildTheme(loadThemeVars(cssPath));
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
    return `<section style="${this._currentTheme.container}">\n${inner}</section>`;
  }
}
