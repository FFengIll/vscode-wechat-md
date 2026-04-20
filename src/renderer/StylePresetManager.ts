/**
 * Style Preset Manager
 *
 * Manages style presets for different elements and applies them to the renderer
 */

import * as vscode from 'vscode';
import { getStylePresets, StylePresetCategory, StylePreset, allStylePresets } from './stylePresets';
import type { ThemeVars } from './theme';

export interface SelectedPresets {
  h1?: string;
  h2?: string;
  h3?: string;
  blockquote?: string;
  list?: string;
  link?: string;
  image?: string;
  divider?: string;
  table?: string;
}

/**
 * Manages style presets selection and application
 */
export class StylePresetManager {
  private selectedPresets: SelectedPresets = {};
  private workspaceState: vscode.Memento;
  private _onDidChangePreset: vscode.EventEmitter<StylePresetCategory>;
  readonly onDidChangePreset: vscode.Event<StylePresetCategory>;
  private currentThemeVars: ThemeVars | null = null;

  constructor(workspaceState: vscode.Memento) {
    this.workspaceState = workspaceState;
    this._onDidChangePreset = new vscode.EventEmitter<StylePresetCategory>();
    this.onDidChangePreset = this._onDidChangePreset.event;

    // Load saved selections
    this.loadFromState();
  }

  /**
   * Set the current theme vars for CSS variable replacement
   */
  setThemeVars(vars: ThemeVars | null): void {
    this.currentThemeVars = vars;
  }

  /**
   * Replace CSS variables in preset CSS with actual values
   */
  private replaceCSSVariables(css: string): string {
    if (!this.currentThemeVars) return css;

    const vars = this.currentThemeVars;
    let result = css;

    // Replace common CSS variables
    const replacements: Record<string, string | undefined> = {
      '--wechat-accent': vars.accent,
      '--wechat-text-color': vars.textColor,
      '--wechat-code-bg': vars.codeBg,
      '--wechat-inline-code-color': vars.inlineCodeColor,
      '--wechat-blockquote-bg': vars.blockquoteBg,
      '--wechat-h1-color': vars.h1Color,
      '--wechat-h2-color': vars.h2Color,
      '--wechat-h3-color': vars.h3Color
    };

    for (const [variable, value] of Object.entries(replacements)) {
      if (value !== undefined) {
        result = result.replace(new RegExp(`var\\(${variable}\\)`, 'g'), value);
      }
    }

    return result;
  }

  /**
   * Get style overrides for a category as a style string
   * This returns the CSS directly without selectors, for inline application
   */
  getPresetStyleOverride(category: StylePresetCategory): string {
    const presetId = this.selectedPresets[category];
    if (!presetId) return '';

    const preset = this.getPresetById(category, presetId);
    if (!preset || !preset.css) return '';

    // Replace CSS variables and return
    return this.replaceCSSVariables(preset.css);
  }

  /**
   * Get all style overrides as a record of category -> style string
   */
  getAllStyleOverrides(): Record<string, string> {
    const overrides: Record<string, string> = {};

    for (const category of this.getCategories()) {
      const presetId = this.selectedPresets[category];
      if (presetId) {
        // Store the preset ID instead of CSS for special handling
        overrides[category] = presetId;
      }
    }

    return overrides;
  }

  /**
   * Load selected presets from workspace state
   */
  private loadFromState(): void {
    const saved = this.workspaceState.get<SelectedPresets>('selectedStylePresets');
    if (saved) {
      this.selectedPresets = saved;
    }
  }

  /**
   * Save selected presets to workspace state
   */
  private saveToState(): void {
    this.workspaceState.update('selectedStylePresets', this.selectedPresets);
  }

  /**
   * Get available presets for a category
   */
  getPresets(category: StylePresetCategory): StylePreset[] {
    return getStylePresets(category);
  }

  /**
   * Get all preset categories
   */
  getCategories(): StylePresetCategory[] {
    return Object.keys(allStylePresets) as StylePresetCategory[];
  }

  /**
   * Get selected preset for a category
   */
  getSelectedPreset(category: StylePresetCategory): string | undefined {
    return this.selectedPresets[category];
  }

  /**
   * Set selected preset for a category
   */
  setSelectedPreset(category: StylePresetCategory, presetId: string | undefined): void {
    this.selectedPresets[category] = presetId;
    this.saveToState();
    this._onDidChangePreset.fire(category);
  }

  /**
   * Get the CSS for a specific preset
   */
  getPresetCSS(category: StylePresetCategory, presetId?: string): string {
    const id = presetId ?? this.selectedPresets[category];
    if (!id) return '';

    const preset = this.getPresetById(category, id);
    if (!preset || !preset.css) return '';
    return this.replaceCSSVariables(preset.css);
  }

  /**
   * Get preset by ID
   */
  getPresetById(category: StylePresetCategory, id: string): StylePreset | undefined {
    return getStylePresets(category).find(p => p.id === id);
  }

  /**
   * Get all selected CSS combined
   */
  getAllCSS(): string {
    let css = '';

    for (const category of this.getCategories()) {
      const presetCSS = this.getPresetCSS(category);
      if (presetCSS) {
        const selector = this.getCategorySelector(category);
        css += `\n/* ${category} preset */\n`;
        css += `${selector} { ${presetCSS} }\n`;
      }
    }

    return css;
  }

  /**
   * Get CSS selector for a category
   */
  private getCategorySelector(category: StylePresetCategory): string {
    const selectors: Record<StylePresetCategory, string> = {
      h1: '.wmd-h1, h1',
      h2: '.wmd-h2, h2',
      h3: '.wmd-h3, h3',
      blockquote: '.wmd-blockquote, blockquote',
      list: '.wmd-ul, ul, .wmd-ol, ol',
      link: '.wmd-a, a',
      image: '.wmd-img, img',
      divider: '.wmd-hr, hr',
      table: '.wmd-table, table'
    };
    return selectors[category] || category;
  }

  /**
   * Reset all selections
   */
  resetAll(): void {
    this.selectedPresets = {};
    this.saveToState();
    for (const category of this.getCategories()) {
      this._onDidChangePreset.fire(category);
    }
  }

  /**
   * Get current selection state
   */
  getSelections(): SelectedPresets {
    return { ...this.selectedPresets };
  }

  /**
   * Set multiple selections at once
   */
  setSelections(selections: Partial<SelectedPresets>): void {
    Object.assign(this.selectedPresets, selections);
    this.saveToState();
    for (const category of Object.keys(selections)) {
      this._onDidChangePreset.fire(category as StylePresetCategory);
    }
  }

  /**
   * Export selections to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.selectedPresets, null, 2);
  }

  /**
   * Import selections from JSON
   */
  importFromJSON(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      this.setSelections(parsed);
      return true;
    } catch (error) {
      console.error('Failed to import style presets:', error);
      return false;
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    this._onDidChangePreset.dispose();
  }
}
