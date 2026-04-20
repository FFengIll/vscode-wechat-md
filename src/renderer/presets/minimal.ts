// Minimal - Clean grayscale preset
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const minimalPreset: ThemePreset = {
  id: 'minimal',
  name: 'Minimal Clean',
  description: 'Grayscale palette, subtle decorations, content-focused',
  vars: {
    ...defaultVars,
    accent: '#6B7280',
    textColor: '#374151',
    h1Color: '#111827',
    h2Color: '#374151',
    h3Color: '#4B5563',
    blockquoteBg: '#F9FAFB',
    codeBg: '#F3F4F6',
    h2Bg: 'transparent'
  },
  preview: {
    primary: '#6B7280',
    background: '#FFFFFF',
    accent: '#9CA3AF'
  }
};
