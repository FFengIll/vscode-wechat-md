// Tech - Developer-focused preset
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const techPreset: ThemePreset = {
  id: 'tech',
  name: 'Tech Developer',
  description: 'Code-friendly colors, monospace-optimized, dark accent hints',
  vars: {
    ...defaultVars,
    accent: '#8B5CF6',
    textColor: '#E5E7EB',
    codeBg: '#1F2937',
    inlineCodeColor: '#A78BFA',
    blockquoteBg: '#374151',
    h1Color: '#F9FAFB',
    h2Color: '#A78BFA',
    h3Color: '#C4B5FD',
    fontSize: '15px',
    maxWidth: '720px'
  },
  preview: {
    primary: '#8B5CF6',
    background: '#111827',
    accent: '#A78BFA'
  }
};
