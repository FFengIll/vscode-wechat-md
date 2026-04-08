import MarkdownIt from 'markdown-it';
import { Theme } from './theme';

// Apply WeChat-compatible inline styles to all markdown-it renderer rules.
// WeChat strips <style> blocks, so every style must be on the element itself.
export function applyWeChatRules(md: MarkdownIt, theme: Theme): void {
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

  r['code_block'] = (tokens, idx) => {
    const lines = tokens[idx].content.replace(/\n$/, '').split('\n');
    const codeLines = lines.map(line =>
      line === ''
        ? `<code><span leaf=""><br class="ProseMirror-trailingBreak"></span></code>`
        : `<code><span leaf="">${escapeHtml(line)}</span></code>`
    ).join('');
    return `<section class="code-snippet__js"><pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="">${codeLines}</pre></section>\n`;
  };

  r['fence'] = (tokens, idx) => {
    const lang = tokens[idx].info.trim() || '';
    const lines = tokens[idx].content.replace(/\n$/, '').split('\n');
    const codeLines = lines.map(line =>
      line === ''
        ? `<code><span leaf=""><br class="ProseMirror-trailingBreak"></span></code>`
        : `<code><span leaf="">${escapeHtml(line)}</span></code>`
    ).join('');
    return `<section class="code-snippet__js"><pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="${escapeHtml(lang)}">${codeLines}</pre></section>\n`;
  };

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
