// Default WeChat Green preset
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const defaultPreset: ThemePreset = {
  id: 'default',
  name: 'WeChat Green',
  description: 'Clean, professional WeChat default style',
  vars: { ...defaultVars },
  preview: {
    primary: '#07C160',
    background: '#ffffff',
    accent: '#07C160'
  }
};
