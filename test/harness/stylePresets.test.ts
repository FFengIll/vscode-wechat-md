// Exercises every built-in style preset (see src/renderer/stylePresets.ts) for
// every category, through the real WeChatRenderer._applyStylePresetOverrides()
// code path in src/renderer/index.ts. Several presets replace whole renderer
// rules with hand-written HTML strings (e.g. h1-bracket, quote-card-dots,
// list-arrow, table-modern, codeBlock-mac-window) — this is the harness that
// catches a typo or unbalanced tag in one of those without a human pasting
// every combination into WeChat by hand.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { allStylePresets, StylePresetCategory } from '../../src/renderer/stylePresets';
import { createRenderer } from './render';
import { assertWeChatCompatible } from './validators';

const fixturePath = fileURLToPath(new URL('../fixtures/comprehensive.md', import.meta.url));
const markdown = readFileSync(fixturePath, 'utf-8');

const CUSTOM_CSS_BY_CATEGORY: Partial<Record<StylePresetCategory, string>> = {
  h1: 'letter-spacing: 2px;',
  h2: 'letter-spacing: 2px;',
  h3: 'letter-spacing: 2px;',
  blockquote: 'font-weight: bold;',
  list: 'color: #333;',
  link: 'text-decoration: underline;',
  image: 'border: 1px solid #eee;',
  divider: 'opacity: 0.5;',
  table: 'font-size: 13px;',
  inlineCode: 'letter-spacing: 1px;',
  codeBlock: 'border: 1px solid #eee;',
};

describe('style presets — WeChat compatibility sweep', () => {
  for (const category of Object.keys(allStylePresets) as StylePresetCategory[]) {
    describe(`category: ${category}`, () => {
      for (const preset of allStylePresets[category]) {
        it(`preset "${preset.id}" (${preset.name}) — copy mode`, () => {
          const renderer = createRenderer({
            stylePresets: { [category]: preset.id },
            customCSS: CUSTOM_CSS_BY_CATEGORY,
          });
          const html = renderer.render(markdown, 'copy');
          assertWeChatCompatible(html);
        });

        it(`preset "${preset.id}" (${preset.name}) — preview mode (pre-shiki)`, () => {
          const renderer = createRenderer({
            stylePresets: { [category]: preset.id },
            customCSS: CUSTOM_CSS_BY_CATEGORY,
          });
          const html = renderer.render(markdown, 'preview');
          // Preview mode's fenced code block is display-only (rendered in this
          // extension's own webview) and, without initHighlighter(), falls back
          // to plain markdown-it's class-based fence markup — never a WeChat
          // paste target, so it's excluded here (see basic.test.ts for the
          // dedicated shiki + tag-balance coverage of that path).
          const withoutFence = html.replace(/<pre[\s\S]*?<\/pre>/, '');
          assertWeChatCompatible(withoutFence);
        });
      }
    });
  }
});
