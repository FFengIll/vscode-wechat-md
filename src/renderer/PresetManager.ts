// PresetManager - manages theme presets and state
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { ThemePreset, ThemeVars } from './types';
import { loadThemeVars } from './theme';
import * as presets from './presets';

/**
 * Manages theme presets including loading, switching, and merging with CSS overrides
 */
export class PresetManager {
  private registry: Map<string, ThemePreset>;
  private activePresetId: string | null;
  private workspaceState: vscode.Memento;
  private customPresetDir: string | null;
  private _onDidChangePreset: vscode.EventEmitter<string | null>;
  private _cssOverridePath: string | null;

  readonly onDidChangePreset: vscode.Event<string | null>;

  constructor(workspaceState: vscode.Memento, workspaceRoot: string | undefined) {
    this.workspaceState = workspaceState;
    this.registry = new Map();
    this.activePresetId = workspaceState.get<string>('activePresetId') || null;
    this.customPresetDir = workspaceRoot ? path.join(workspaceRoot, '.wechat', 'presets') : null;
    this._onDidChangePreset = new vscode.EventEmitter<string | null>();
    this.onDidChangePreset = this._onDidChangePreset.event;
    this._cssOverridePath = null;

    this.loadBuiltinPresets();
  }

  /**
   * Load all built-in presets
   */
  private loadBuiltinPresets(): void {
    this.registry.set('default', presets.defaultPreset);
    this.registry.set('elegant', presets.elegantPreset);
    this.registry.set('modern', presets.modernPreset);
    this.registry.set('minimal', presets.minimalPreset);
    this.registry.set('tech', presets.techPreset);
  }

  /**
   * Load custom presets from .wechat/presets/ directory
   */
  async loadCustomPresets(): Promise<void> {
    if (!this.customPresetDir || !fs.existsSync(this.customPresetDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(this.customPresetDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.customPresetDir, file);
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const preset: ThemePreset = JSON.parse(content);

            // Validate preset has required fields
            if (preset.id && preset.name && preset.vars) {
              this.registry.set(preset.id, preset);
            } else {
              console.error(`Invalid preset file: ${file} - missing required fields`);
            }
          } catch (error) {
            console.error(`Failed to load preset ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  }

  /**
   * Set the CSS override path for merging with preset vars
   */
  setCssOverridePath(cssPath: string | null): void {
    this._cssOverridePath = cssPath;
  }

  /**
   * Get the currently active preset
   */
  getActivePreset(): ThemePreset | null {
    if (!this.activePresetId) {
      return null;
    }
    return this.registry.get(this.activePresetId) || null;
  }

  /**
   * Get a preset by ID
   */
  getPreset(id: string): ThemePreset | undefined {
    return this.registry.get(id);
  }

  /**
   * List all available presets
   */
  listPresets(): ThemePreset[] {
    return Array.from(this.registry.values());
  }

  /**
   * Switch to a different preset
   */
  switchPreset(presetId: string): boolean {
    if (!this.registry.has(presetId)) {
      return false;
    }

    this.activePresetId = presetId;
    this.workspaceState.update('activePresetId', presetId);
    this._onDidChangePreset.fire(presetId);
    return true;
  }

  /**
   * Get theme vars with preset and CSS overrides applied
   * Priority: Preset vars > CSS overrides (theme.ts should only override defaults, not presets)
   */
  getVarsWithOverride(cssPath: string | null = this._cssOverridePath): ThemeVars {
    const defaultVars = require('./theme').defaultVars || {};
    let cssVars: ThemeVars = { ...defaultVars };

    // Apply CSS overrides if they exist
    if (cssPath) {
      try {
        const loaded = loadThemeVars(cssPath);
        cssVars = { ...defaultVars, ...loaded };
      } catch (error) {
        console.error('Failed to load CSS overrides:', error);
      }
    }

    const preset = this.getActivePreset();
    // If preset is active, it should override CSS vars
    if (preset) {
      return { ...cssVars, ...preset.vars };
    }

    // No active preset, use CSS vars or defaults
    return cssVars;
  }

  /**
   * Update specific color values in the current preset
   * Returns the updated vars (doesn't modify the preset itself)
   */
  updateColorValues(updates: Partial<ThemeVars>): ThemeVars {
    const currentVars = this.getVarsWithOverride();
    return { ...currentVars, ...updates };
  }

  /**
   * Reset to current preset's default values
   */
  resetToPresetDefaults(): ThemeVars {
    const preset = this.getActivePreset();
    if (preset) {
      return { ...preset.vars };
    }
    return this.getVarsWithOverride();
  }

  /**
   * Save current color customizations as a new preset
   */
  async saveAsPreset(name: string, vars: ThemeVars): Promise<boolean> {
    if (!this.customPresetDir) {
      vscode.window.showErrorMessage('No workspace folder open');
      return false;
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(this.customPresetDir)) {
      fs.mkdirSync(this.customPresetDir, { recursive: true });
    }

    // Generate ID from name
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-custom';
    const filePath = path.join(this.customPresetDir, `${id}.json`);

    const newPreset: ThemePreset = {
      id,
      name,
      description: `Custom preset based on ${this.getActivePreset()?.name || 'default'}`,
      vars,
      preview: {
        primary: vars.accent,
        background: vars.codeBg,
        accent: vars.accent
      }
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(newPreset, null, 2), 'utf-8');
      this.registry.set(id, newPreset);
      return true;
    } catch (error) {
      console.error('Failed to save preset:', error);
      vscode.window.showErrorMessage(`Failed to save preset: ${error}`);
      return false;
    }
  }

  /**
   * Check if custom CSS overrides are active
   */
  hasCustomOverrides(): boolean {
    if (!this._cssOverridePath) {
      return false;
    }
    try {
      return fs.existsSync(this._cssOverridePath);
    } catch {
      return false;
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this._onDidChangePreset.dispose();
  }
}
