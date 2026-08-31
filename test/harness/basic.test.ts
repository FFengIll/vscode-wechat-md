import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRenderer } from './render';
import { assertWeChatCompatible, validateWeChatHtml } from './validators';

const fixturePath = fileURLToPath(new URL('../fixtures/comprehensive.md', import.meta.url));
const markdown = readFileSync(fixturePath, 'utf-8');

// 'copy' mode is the only one that has to satisfy WeChat's paste contract
// (no <style>, no class, every element inline-styled) — see rules.ts and
// wechatTransformer.ts. 'preview' mode renders into this extension's own
// webview, a normal browser DOM, so its fenced code block is deliberately
// class-based (Shiki's own highlighting output) rather than inline-styled;
// only tag-balance is asserted there.
function assertBalancedTags(html: string): void {
  const structuralIssues = validateWeChatHtml(html).filter(
    i => i.rule === 'unbalanced-tags' || i.rule === 'unclosed-tag'
  );
  expect(structuralIssues).toEqual([]);
}

describe('WeChatRenderer — comprehensive fixture', () => {
  it('renders copy-mode HTML that is WeChat-compatible', () => {
    const renderer = createRenderer();
    const html = renderer.render(markdown, 'copy');
    assertWeChatCompatible(html);
    expect(html).toMatchSnapshot();
  });

  it('renders preview-mode HTML (no shiki) with well-formed markup', () => {
    const renderer = createRenderer();
    const html = renderer.render(markdown, 'preview');
    assertBalancedTags(html);
    // Everything outside the (display-only) fenced code block still owes the
    // full WeChat-compatibility contract, since preview reuses the same
    // rules.ts output for every other element.
    const withoutFence = html.replace(/<pre[\s\S]*?<\/pre>/, '');
    assertWeChatCompatible(withoutFence);
  });

  it('renders the frontmatter `header` field as a styled paragraph', () => {
    const renderer = createRenderer();
    const html = renderer.render(markdown, 'copy');
    expect(html).toContain('深入理解渲染管线');
  });

  it('produces syntax-highlighted, well-formed fenced code once shiki is initialized', async () => {
    const renderer = createRenderer();
    await renderer.initHighlighter();
    const html = renderer.render(markdown, 'preview');
    assertBalancedTags(html);
    expect(html).toContain('Hello');
  }, 20_000);
});
