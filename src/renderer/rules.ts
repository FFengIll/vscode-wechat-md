import MarkdownIt from 'markdown-it';
import { Theme } from './theme';
import { transformToWeChatFormat, normalizeLang as wechatNormalizeLang } from './wechatTransformer';
import { parseVoteBlock, renderVoteHTML } from './vote';

export type RenderMode = 'preview' | 'copy';

// Apply WeChat-compatible inline styles to all markdown-it renderer rules.
// WeChat strips <style> blocks, so every style must be on the element itself.
// In 'preview' mode, fence/code_block are handled by @shikijs/markdown-it plugin — not here.
// In 'copy' mode, we output the WeChat editor-compatible DOM structure.
export function applyWeChatRules(md: MarkdownIt, theme: Theme, mode: RenderMode = 'preview'): void {
  const r = md.renderer.rules;

  r['heading_open'] = (tokens, idx) => {
    const tag = tokens[idx].tag;
    const level = parseInt(tag[1]);
    const styles: Record<number, string> = {
      1: theme.h1, 2: theme.h2, 3: theme.h3,
      4: theme.h4, 5: theme.h5, 6: theme.h6,
    };
    return `<${tag} style="${styles[level] ?? theme.h6}">`;
  };
  r['heading_close'] = (tokens, idx) => `</${tokens[idx].tag}>\n`;

  r['paragraph_open']  = () => `<p style="${theme.p}">`;
  r['paragraph_close'] = () => `</p>\n`;

  r['code_inline'] = (tokens, idx) =>
    `<code style="${theme.inlineCode}">${escapeHtml(tokens[idx].content)}</code>`;

  if (mode === 'copy') {
    r['code_block'] = (tokens, idx) => {
      const lang = '';
      const content = tokens[idx].content;
      return transformToWeChatFormat('', content, lang);
    };

    r['fence'] = (tokens, idx) => {
      const lang = wechatNormalizeLang(tokens[idx].info.trim());
      const content = tokens[idx].content;
      return transformToWeChatFormat('', content, lang);
    };
  } else {
    // preview mode: fence is handled by @shikijs/markdown-it plugin applied in index.ts
    // plain code_block fallback (indented code, no language info)
    r['code_block'] = (tokens, idx) =>
      `<pre style="${theme.pre}"><code style="${theme.preCode}">${escapeHtml(tokens[idx].content)}</code></pre>\n`;
  }

  r['blockquote_open']  = () => `<blockquote style="${theme.blockquote}">`;
  r['blockquote_close'] = () => `</blockquote>\n`;

  r['bullet_list_open']   = () => `<ul style="${theme.ul}">`;
  r['bullet_list_close']  = () => `</ul>\n`;
  r['ordered_list_open']  = () => `<ol style="${theme.ol}">`;
  r['ordered_list_close'] = () => `</ol>\n`;
  r['list_item_open']     = () => `<li style="${theme.li}">`;
  r['list_item_close']    = () => `</li>\n`;

  r['hr'] = () => `<hr style="${theme.hr}">\n`;

  r['strong_open']  = () => `<strong style="${theme.strong}">`;
  r['strong_close'] = () => `</strong>`;
  r['em_open']      = () => `<em style="${theme.em}">`;
  r['em_close']     = () => `</em>`;

  r['link_open'] = (tokens, idx) => {
    const href = tokens[idx].attrGet('href') ?? '#';
    return `<a href="${escapeHtml(href)}" style="${theme.a}">`;
  };
  r['link_close'] = () => `</a>`;

  r['image'] = (tokens, idx, options, _env, self) => {
    const src = tokens[idx].attrGet('src') ?? '';
    const alt = self.renderInlineAsText(tokens[idx].children ?? [], options, _env);
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="${theme.img}">`;
  };

  r['table_open']   = () => `<table style="${theme.table}">`;
  r['table_close']  = () => `</table>\n`;
  r['thead_open']   = () => `<thead>`;
  r['thead_close']  = () => `</thead>`;
  r['tbody_open']   = () => `<tbody>`;
  r['tbody_close']  = () => `</tbody>`;
  r['tr_open']      = () => `<tr>`;
  r['tr_close']     = () => `</tr>`;
  r['th_open']      = () => `<th style="${theme.th}">`;
  r['th_close']     = () => `</th>`;
  r['td_open']      = () => `<td style="${theme.td}">`;
  r['td_close']     = () => `</td>`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Normalize common language shorthands to WeChat's expected full names.
const LANG_ALIASES: Record<string, string> = {
  js:   'javascript',
  ts:   'typescript',
  py:   'python',
  rb:   'ruby',
  rs:   'rust',
  sh:   'bash',
  zsh:  'bash',
  yml:  'yaml',
  md:   'markdown',
  kt:   'kotlin',
  objc: 'objectivec',
  'c++': 'cpp',
};

function normalizeLang(lang: string): string {
  const lower = lang.toLowerCase();
  return LANG_ALIASES[lower] ?? lower;
}
