/**
 * Per-category custom style files
 *
 * Each style-preset category (h1, h2, h3, blockquote, list, link, image,
 * divider, table, inlineCode) can have a user-authored CSS file at
 * `.wechat/custom/<category>.css`. When a category's selected preset is its
 * "-custom" sentinel (see `getCustomPresetId` in ./stylePresets), the
 * renderer reads the CSS declarations from that file and inlines them into
 * the category's default HTML structure via `style="..."`.
 *
 * The file is authored as a normal, valid CSS rule — selector + { declarations }
 * — using the category's real selector (see `getCategorySelector`), so editors
 * can lint/highlight/autocomplete it like any other .css file. Only the
 * declarations inside the outermost { } are ever read; the selector itself is
 * documentation and is otherwise ignored.
 *
 * This module only touches the filesystem — no vscode API — so it stays
 * usable from both the extension host and (in principle) tests.
 */

import * as fs from 'fs';
import * as path from 'path';
import { StylePresetCategory, getCategorySelector } from './stylePresets';

const CUSTOM_DIR = path.join('.wechat', 'custom');

/**
 * Absolute path to the custom CSS file for a category, given a workspace root.
 * Does not guarantee the file exists.
 */
export function getCustomStylePath(category: StylePresetCategory, workspaceRoot: string | null): string | null {
  if (!workspaceRoot) return null;
  return path.join(workspaceRoot, CUSTOM_DIR, `${category}.css`);
}

/**
 * Read the custom CSS for a category and return just the declarations
 * (comments stripped, newlines collapsed to spaces) — ready to drop into a
 * style="..." attribute. Returns '' if the workspace/file doesn't exist or
 * has no declarations.
 */
export function loadCustomCSS(category: StylePresetCategory, workspaceRoot: string | null): string {
  const filePath = getCustomStylePath(category, workspaceRoot);
  if (!filePath || !fs.existsSync(filePath)) return '';

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return extractDeclarations(raw);
  } catch {
    return '';
  }
}

/**
 * Load custom CSS for every category at once, keyed by category.
 * Categories without a file (or with no declarations) are omitted.
 */
export function loadAllCustomCSS(
  categories: StylePresetCategory[],
  workspaceRoot: string | null
): Partial<Record<StylePresetCategory, string>> {
  const result: Partial<Record<StylePresetCategory, string>> = {};
  for (const category of categories) {
    const css = loadCustomCSS(category, workspaceRoot);
    if (css) result[category] = css;
  }
  return result;
}

/**
 * Ensure `.wechat/custom/<category>.css` exists for the given category,
 * creating the directory and a commented template rule if needed. Returns
 * the absolute file path, or null if there's no workspace to write into.
 */
export function ensureCustomStyleFile(category: StylePresetCategory, workspaceRoot: string | null): string | null {
  if (!workspaceRoot) return null;
  const dir = path.join(workspaceRoot, CUSTOM_DIR);
  const filePath = path.join(dir, `${category}.css`);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, buildTemplate(category), 'utf8');
  }
  return filePath;
}

function buildTemplate(category: StylePresetCategory): string {
  const selector = getCategorySelector(category) || category;
  return `/**
 * 自定义「${category}」样式
 *
 * 写一条正常的 CSS 规则（选择器仅供参考，实际渲染时只会取花括号里的声明，
 * 套到该类目的默认 HTML 结构上，作为 style="..." 属性内容）。
 *
 * 只有在样式面板里把「${category}」的预设选为「自定义」时，这份样式才会生效。
 * 支持 var(--wechat-accent) 等主题色变量，会自动替换成当前主题的实际颜色。
 */

${selector} {

}
`;
}

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Extract the declarations from a CSS rule: everything between the first "{"
 * and the last "}". Falls back to treating the whole (comment-stripped) file
 * as bare declarations if no braces are found, so older-style files (or a
 * quick "just paste some declarations") still work.
 */
function extractDeclarations(css: string): string {
  const withoutComments = stripCssComments(css);
  const openIdx = withoutComments.indexOf('{');
  const closeIdx = withoutComments.lastIndexOf('}');
  const body = (openIdx !== -1 && closeIdx > openIdx)
    ? withoutComments.slice(openIdx + 1, closeIdx)
    : withoutComments;
  return body.replace(/\s+/g, ' ').trim();
}
