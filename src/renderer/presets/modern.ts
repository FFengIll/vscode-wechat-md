// Modern - Bold contemporary preset
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const modernPreset: ThemePreset = {
  id: 'modern',
  name: 'Modern Bold',
  description: 'High contrast, bold headings, contemporary design',
  vars: {
    ...defaultVars,
    accent: '#2563EB',
    textColor: '#1F2937',
    codeBg: '#1E293B',
    inlineCodeColor: '#3B82F6',
    h1Color: '#111827',
    h1FontWeight: '800',
    h1FontSize: '28px',
    h2Color: '#2563EB',
    h2FontWeight: '700',
    h2Bg: 'rgba(37, 99, 235, 0.08)'
  },
  preview: {
    primary: '#2563EB',
    background: '#F8FAFC',
    accent: '#2563EB'
  }
};
