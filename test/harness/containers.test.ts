// Sweeps every entry in CONTAINER_TYPES (src/renderer/containers.ts), the
// closed catalog behind `::: card` / `::: tip` / etc. block syntax — mirrors
// stylePresets.test.ts's sweep so a new container effect is covered
// automatically the moment it's added to the catalog.
import { describe, expect, it } from 'vitest';
import { CONTAINER_TYPES } from '../../src/renderer/containers';
import { createRenderer } from './render';
import { assertWeChatCompatible } from './validators';

// Nested markdown (bold, link, list) to prove container content re-enters
// the normal block parser instead of being swallowed as raw text — the
// whole reason to prefer `:::` containers over raw HTML tags (see the
// comment at the top of containers.ts).
const NESTED_CONTENT = [
  '这里有 **加粗** 和 [链接](https://example.com)。',
  '',
  '- 列表项一',
  '- 列表项二',
].join('\n');

function containerMarkdown(id: string, body: string): string {
  return `::: ${id}\n${body}\n:::\n`;
}

describe('containers — WeChat compatibility sweep', () => {
  for (const def of CONTAINER_TYPES) {
    describe(`container: ${def.id} (${def.name})`, () => {
      it('renders WeChat-compatible copy-mode HTML', () => {
        const renderer = createRenderer();
        const html = renderer.render(containerMarkdown(def.id, NESTED_CONTENT), 'copy');
        assertWeChatCompatible(html);
      });

      it('renders WeChat-compatible preview-mode HTML', () => {
        const renderer = createRenderer();
        const html = renderer.render(containerMarkdown(def.id, NESTED_CONTENT), 'preview');
        assertWeChatCompatible(html);
      });

      it('still parses nested markdown inside the container', () => {
        const renderer = createRenderer();
        const html = renderer.render(containerMarkdown(def.id, NESTED_CONTENT), 'copy');
        // Real <strong>/<a>/<li> tags, not literal '**'/'[...]'/'- ' text —
        // this is what a raw <div class="card"> HTML-tag approach can't do,
        // since CommonMark treats a bare custom HTML tag's body as an opaque
        // HTML block and never reparses it as markdown.
        expect(html).toContain('<strong');
        expect(html).toContain('<a href="https://example.com"');
        expect(html).toContain('<li');
        expect(html).not.toContain('**加粗**');
      });

      it('carries the container id as an inline-styled <section> wrapper', () => {
        const renderer = createRenderer();
        const html = renderer.render(containerMarkdown(def.id, '内容'), 'copy');
        expect(html).toContain(`<section style="${def.wrapperStyle}">`);
        if (def.label) {
          expect(html).toContain(def.label);
        }
      });
    });
  }

  it('leaves an unknown container name as plain text instead of silently eating it', () => {
    const renderer = createRenderer();
    const html = renderer.render(containerMarkdown('not-a-real-container', '内容'), 'copy');
    // markdown-it-container only intercepts names registered via applyContainers();
    // anything else falls through to ordinary paragraph/text handling, so the
    // literal ::: marker text is still visible rather than vanishing.
    expect(html).toContain(':::');
  });
});
