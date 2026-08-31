import { describe, expect, it } from 'vitest';
import { createRenderer } from './render';
import { assertWeChatCompatible } from './validators';

describe('theme variable overrides', () => {
  it('reflects a custom accent color in link and blockquote styling', () => {
    const renderer = createRenderer({ themeVars: { accent: '#ff00aa' } });
    const html = renderer.render('[link](https://example.com)\n\n> quote', 'copy');
    assertWeChatCompatible(html);
    expect(html).toContain('#ff00aa');
  });

  it('reflects a custom max-width on the outer container', () => {
    const renderer = createRenderer({ themeVars: { maxWidth: '600px' } });
    const html = renderer.render('hello', 'copy');
    expect(html).toContain('max-width: 600px');
  });
});
