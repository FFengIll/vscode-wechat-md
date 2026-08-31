// Claude - Anthropic-brand-inspired preset
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const claudePreset: ThemePreset = {
  id: 'claude',
  name: 'Claude',
  description: '陶土橙主题色 + 暖调米白背景，简约克制的 Claude 风格',
  vars: {
    ...defaultVars,
    accent: '#D97757',
    textColor: '#3D3929',
    codeBg: '#F0EEE5',
    inlineCodeColor: '#BD5D3A',
    blockquoteBg: '#F5F4EE',
    h1Color: '#3D3929',
    h2Color: '#D97757',
    h3Color: '#BD5D3A',
    h2Bg: 'rgba(217, 119, 87, 0.08)'
  },
  preview: {
    primary: '#D97757',
    background: '#FAF9F5',
    accent: '#D97757'
  }
};
