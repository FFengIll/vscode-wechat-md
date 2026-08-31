// A vscode-free stand-in for StylePresetManager (src/renderer/StylePresetManager.ts).
//
// WeChatRenderer.setStylePresetManager() accepts the manager as `any` and only
// ever calls .getPresetCSS(category, presetId) and .replaceCSSVariables(css) on
// it (see _applyStylePresetOverrides() in src/renderer/index.ts) — everything
// else on the real class exists to persist selections into vscode.Memento,
// which the render pipeline itself never touches. Reimplementing just those
// two pure methods here lets the harness drive every style-preset code path
// without a running VS Code host.
import { getPresetById, StylePresetCategory } from '../../src/renderer/stylePresets';
import type { ThemeVars } from '../../src/renderer/theme';

export class FakeStylePresetManager {
  constructor(private themeVars: ThemeVars | null = null) {}

  replaceCSSVariables(css: string): string {
    if (!this.themeVars) return css;
    const vars = this.themeVars;
    const replacements: Record<string, string | undefined> = {
      '--wechat-accent': vars.accent,
      '--wechat-text-color': vars.textColor,
      '--wechat-code-bg': vars.codeBg,
      '--wechat-inline-code-color': vars.inlineCodeColor,
      '--wechat-blockquote-bg': vars.blockquoteBg,
      '--wechat-h1-color': vars.h1Color,
      '--wechat-h2-color': vars.h2Color,
      '--wechat-h3-color': vars.h3Color,
    };
    let result = css;
    for (const [variable, value] of Object.entries(replacements)) {
      if (value !== undefined) {
        result = result.replace(new RegExp(`var\\(${variable}\\)`, 'g'), value);
      }
    }
    return result;
  }

  getPresetCSS(category: StylePresetCategory, presetId?: string): string {
    if (!presetId) return '';
    const preset = getPresetById(category, presetId);
    if (!preset || !preset.css) return '';
    return this.replaceCSSVariables(preset.css);
  }
}
