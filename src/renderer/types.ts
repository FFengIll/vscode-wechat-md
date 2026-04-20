// Type definitions for the theme preset system
export type { Theme, ThemeVars } from './theme';

// Re-export commonly used types for convenience
import type { Theme, ThemeVars } from './theme';

/**
 * A theme preset with metadata and style variables
 */
export interface ThemePreset {
  // Identification
  id: string;
  name: string;
  description: string;
  author?: string;
  version?: string;

  // Style variables (extends existing ThemeVars)
  vars: ThemeVars;

  // Optional: Future expansion
  decorations?: {
    h1Divider?: boolean;
    h2Icon?: string;
    quoteStyle?: 'classic' | 'modern' | 'minimal';
  };

  // Preview colors for UI
  preview: {
    primary: string;
    background: string;
    accent: string;
  };
}

/**
 * Preset registry structure
 */
export interface PresetRegistry {
  presets: Map<string, ThemePreset>;
  activePresetId: string | null;
}

/**
 * Message types for dashboard communication
 */
export interface DashboardMessage {
  type: 'selectPreset' | 'updateColor' | 'savePreset' | 'resetColors' | 'getPresets' | 'apply';
  presetId?: string;
  colorKey?: keyof ThemeVars;
  colorValue?: string;
  presetName?: string;
}

/**
 * Response types from dashboard
 */
export interface DashboardResponse {
  type: 'updatePresets' | 'updateColors' | 'updatePreview' | 'error';
  presets?: Array<ThemePreset & { active?: boolean }>;
  colors?: Partial<ThemeVars>;
  previewHtml?: string;
  error?: string;
}

/**
 * Workspace configuration for themes
 */
export interface ThemeConfig {
  preset?: string;
  presetDir?: string;
  cssOverride?: string;
}

/**
 * Complete workspace configuration
 */
export interface WeChatConfig {
  theme?: ThemeConfig;
}
