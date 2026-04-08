import MarkdownIt from 'markdown-it';
import { buildTheme, loadThemeVars } from './theme';
import { applyWeChatRules } from './rules';

export class WeChatRenderer {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({ html: false, linkify: true, typographer: true });
    // Apply default theme on construction
    applyWeChatRules(this.md, buildTheme(loadThemeVars(null)));
  }

  // Call this before render() to pick up the latest .wechat/theme.css
  reloadTheme(cssPath: string | null): void {
    const theme = buildTheme(loadThemeVars(cssPath));
    applyWeChatRules(this.md, theme);
    this._currentTheme = theme;
  }

  private _currentTheme = buildTheme(loadThemeVars(null));

  // Render markdown string to WeChat-compatible HTML fragment.
  // Output is a <section> wrapper with all styles inlined — ready to paste.
  render(markdown: string): string {
    const inner = this.md.render(markdown);
    return `<section style="${this._currentTheme.container}">\n${inner}</section>`;
  }
}
