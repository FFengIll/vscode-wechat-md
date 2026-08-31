/**
 * Minimal frontmatter parser.
 *
 * Parses the raw text between a leading `---` / `---` block (as extracted by
 * markdown-it-front-matter) into a flat key: value map. No nesting, arrays,
 * or multi-line values — just enough for simple fields like `header:`. If a
 * field ever needs real structure, swap this for `js-yaml` without touching
 * call sites (the shape — Record<string, string> — can stay the return type
 * for the fields that remain flat).
 */

export type FrontMatter = Record<string, string>;

export function parseFrontMatter(raw: string): FrontMatter {
  const result: FrontMatter = {};
  for (const line of raw.split('\n')) {
    const match = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, key, rawValue] = match;
    result[key] = rawValue.trim().replace(/^["']|["']$/g, '');
  }
  return result;
}
