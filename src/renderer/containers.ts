/**
 * Block-level "container" effects: `::: card ... :::` in markdown source.
 *
 * WeChat's editor strips <style>/class/external CSS, so any richer effect
 * (a card, a colored callout box) has to arrive as inline-styled HTML —
 * but writing that HTML by hand isn't something most users should have to
 * do, and an open-ended user-authored template mechanism just moves the
 * "don't break WeChat's paste target" problem onto the user instead of
 * solving it. Containers are the middle ground: a **closed, curated
 * catalog** of effects (see CONTAINER_TYPES below) that users invoke by
 * name — no CSS, no HTML — and content inside is real markdown (bold,
 * links, lists all still work), because markdown-it-container re-enters
 * the normal block parser for the container body instead of treating it
 * as raw text.
 *
 * Adding a new effect means adding one entry to CONTAINER_TYPES; the
 * style-preset sweep in test/harness/containers.test.ts (mirroring
 * test/harness/stylePresets.test.ts) picks it up automatically.
 */
import MarkdownIt from 'markdown-it';
import containerPlugin from 'markdown-it-container';

export interface ContainerType {
  /** The `:::` marker name, e.g. `::: card` — also its harness/docs id. */
  id: string;
  /** Human-readable name for docs/UI. */
  name: string;
  /** Inline style for the wrapping <section>. */
  wrapperStyle: string;
  /** Optional bold label line rendered as the first line inside the wrapper (e.g. "💡 提示"). */
  label?: string;
  /** Inline style for the label line, when `label` is set. */
  labelStyle?: string;
}

// Fixed semantic colors, independent of the active theme's accent color —
// like GitHub/VuePress alert callouts, a reader expects "warning" to always
// read as amber regardless of the document's brand color, so these don't
// need to be recomputed on reloadTheme() the way style-preset CSS does.
const GREEN = '#07C160';
const BLUE = '#1e88e5';
const AMBER = '#f59e0b';

export const CONTAINER_TYPES: ContainerType[] = [
  {
    id: 'card',
    name: '卡片',
    wrapperStyle: 'background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 16px 20px; margin: 1.2em 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);',
  },
  {
    id: 'center',
    name: '居中',
    wrapperStyle: 'text-align: center; margin: 1.2em 0;',
  },
  {
    id: 'tip',
    name: '提示',
    wrapperStyle: `background: #f0faf4; border-left: 4px solid ${GREEN}; border-radius: 6px; padding: 12px 16px; margin: 1em 0;`,
    label: '💡 提示',
    labelStyle: `margin: 0 0 6px; font-weight: bold; color: ${GREEN};`,
  },
  {
    id: 'info',
    name: '说明',
    wrapperStyle: `background: #eef6fd; border-left: 4px solid ${BLUE}; border-radius: 6px; padding: 12px 16px; margin: 1em 0;`,
    label: 'ℹ️ 说明',
    labelStyle: `margin: 0 0 6px; font-weight: bold; color: ${BLUE};`,
  },
  {
    id: 'warning',
    name: '注意',
    wrapperStyle: `background: #fff8ec; border-left: 4px solid ${AMBER}; border-radius: 6px; padding: 12px 16px; margin: 1em 0;`,
    label: '⚠️ 注意',
    labelStyle: `margin: 0 0 6px; font-weight: bold; color: ${AMBER};`,
  },
];

function makeRender(def: ContainerType) {
  return (tokens: any[], idx: number): string => {
    const token = tokens[idx];
    if (token.nesting === 1) {
      const label = def.label ? `<p style="${def.labelStyle}">${def.label}</p>` : '';
      return `<section style="${def.wrapperStyle}">${label}`;
    }
    return `</section>\n`;
  };
}

// Registers every catalog entry as its own `::: <id>` container. Call once
// per MarkdownIt instance at construction time — unlike style presets, a
// container's markup doesn't depend on runtime theme state, so it never
// needs to be re-registered on reloadTheme().
export function applyContainers(md: MarkdownIt): void {
  for (const def of CONTAINER_TYPES) {
    md.use(containerPlugin, def.id, { render: makeRender(def) });
  }
}
