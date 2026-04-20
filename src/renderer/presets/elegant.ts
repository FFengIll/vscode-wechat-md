// Elegant - Classic editorial preset
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const elegantPreset: ThemePreset = {
  id: 'elegant',
  name: 'Elegant Classic',
  description: 'Warm tones, serif-friendly, classic editorial feel',
  vars: {
    ...defaultVars,
    accent: '#8B7355',
    textColor: '#2C2C2C',
    h1Color: '#1C1C1C',
    h2Color: '#8B7355',
    h2FontWeight: '600',
    h1FontSize: '26px',
    h2FontSize: '22px'
  },
  preview: {
    primary: '#8B7355',
    background: '#FFFEF9',
    accent: '#8B7355'
  }
};
