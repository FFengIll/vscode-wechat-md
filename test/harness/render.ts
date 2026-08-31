// Headless entry point into the WeChatRenderer pipeline — the thing this whole
// harness exists to drive without a running VS Code host. WeChatRenderer itself
// has no vscode import; only PresetManager/StylePresetManager do (for
// persisting selections into vscode.Memento), and the renderer only ever calls
// a couple of pure methods on them (see fakeStylePresetManager.ts), so a real
// extension host is never required to exercise the render pipeline.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WeChatRenderer } from '../../src/renderer/index';
import { buildTheme, defaultVars, ThemeVars } from '../../src/renderer/theme';
import { StylePresetCategory } from '../../src/renderer/stylePresets';
import { RenderMode } from '../../src/renderer/rules';
import { FakeStylePresetManager } from './fakeStylePresetManager';

// Renderer.reloadTheme() only ever reads theme vars back out of a
// `.wechat/theme.css` file on disk (see loadThemeVars() in theme.ts) — there
// is no direct "set these vars" API, by design, since that file is the real
// production input. To drive themeVars overrides through the exact same code
// path production uses, write them to a throwaway CSS file and reload from it.
function kebabCase(key: string): string {
  return key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

function writeTempThemeCss(vars: Partial<ThemeVars>): string {
  const dir = mkdtempSync(join(tmpdir(), 'wechat-md-harness-'));
  const path = join(dir, 'theme.css');
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  --wechat-${kebabCase(key)}: ${value};`)
    .join('\n');
  writeFileSync(path, `:root {\n${declarations}\n}\n`, 'utf-8');
  return path;
}

export interface RenderOptions {
  mode?: RenderMode;
  themeVars?: Partial<ThemeVars>;
  /** category -> selected preset id, e.g. { h1: 'h1-underline', blockquote: 'quote-custom' } */
  stylePresets?: Partial<Record<StylePresetCategory, string>>;
  /** user-authored CSS per category, keyed the same as .wechat/custom/<category>.css, for the "-custom" sentinel presets */
  customCSS?: Partial<Record<StylePresetCategory, string>>;
}

// Builds a fresh WeChatRenderer wired up exactly like the extension host would,
// minus anything that needs a real vscode.ExtensionContext.
export function createRenderer(options: RenderOptions = {}): WeChatRenderer {
  const renderer = new WeChatRenderer();
  const vars: ThemeVars = { ...defaultVars, ...options.themeVars };

  if (options.themeVars && Object.keys(options.themeVars).length > 0) {
    renderer.reloadTheme(writeTempThemeCss(options.themeVars));
  }

  if (options.stylePresets && Object.keys(options.stylePresets).length > 0) {
    const fakeManager = new FakeStylePresetManager(vars);
    renderer.setStylePresetManager(fakeManager);
    renderer.setStylePresetOverrides(options.stylePresets as Record<string, string>, options.customCSS);
  }

  return renderer;
}

// One-shot render: markdown in, WeChat-compatible HTML out. No shiki
// highlighter is initialized (initHighlighter() requires a network/package
// fetch for grammars) — 'preview' mode fence blocks fall back to the plain
// code_block rule in rules.ts, which is enough to validate structure/inline
// styles. Use mode: 'copy' to exercise the WeChat-editor-compatible code path
// via wechatTransformer.ts instead.
export function renderMarkdown(markdown: string, options: RenderOptions = {}): string {
  const renderer = createRenderer(options);
  return renderer.render(markdown, options.mode ?? 'preview');
}

export { buildTheme, defaultVars };
