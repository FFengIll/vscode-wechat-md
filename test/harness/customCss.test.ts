// Validates the "custom" preset sentinel mechanism (docs/custom-styles.md):
// selecting a category's "-custom" preset id should read user-authored CSS
// and layer it *on top of* that category's base theme style, not replace it —
// see CATEGORY_THEME_KEY and _applyStylePresetOverrides() in src/renderer/index.ts.
import { describe, expect, it } from 'vitest';
import { getCustomPresetId } from '../../src/renderer/stylePresets';
import { buildTheme, defaultVars } from '../../src/renderer/theme';
import { createRenderer } from './render';
import { assertWeChatCompatible } from './validators';

describe('custom style CSS layering', () => {
  it('layers custom h1 CSS on top of the theme base style, not in place of it', () => {
    const baseTheme = buildTheme(defaultVars);
    const renderer = createRenderer({
      stylePresets: { h1: getCustomPresetId('h1') },
      customCSS: { h1: 'letter-spacing: 4px;' },
    });
    const html = renderer.render('# 标题', 'copy');
    assertWeChatCompatible(html);
    // Base theme typography (font-size/weight/color) must survive alongside
    // the custom addition — otherwise pasting into WeChat loses the heading's
    // base look and keeps only the decoration (see CATEGORY_THEME_KEY comment).
    expect(html).toContain(baseTheme.h1);
    expect(html).toContain('letter-spacing: 4px;');
  });

  it('substitutes theme CSS variables inside custom CSS the same way built-in presets do', () => {
    const renderer = createRenderer({
      themeVars: { accent: '#123456' },
      stylePresets: { blockquote: getCustomPresetId('blockquote') },
      customCSS: { blockquote: 'border-left-color: var(--wechat-accent);' },
    });
    const html = renderer.render('> quoted', 'copy');
    assertWeChatCompatible(html);
    expect(html).toContain('border-left-color: #123456;');
    expect(html).not.toContain('var(--wechat-accent)');
  });

  it('falls back to an empty addition when no custom CSS is provided for the category', () => {
    const renderer = createRenderer({
      stylePresets: { h2: getCustomPresetId('h2') },
    });
    const html = renderer.render('## 标题', 'copy');
    assertWeChatCompatible(html);
  });
});
