// Pikachu - playful yellow-and-red preset
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const pikachuPreset: ThemePreset = {
  id: 'pikachu',
  name: 'Pikachu',
  description: '明黄 + 脸颊红，活泼可爱的皮卡丘配色',
  vars: {
    ...defaultVars,
    accent: '#EE1C25',
    textColor: '#2B2B2B',
    codeBg: '#FFF6D8',
    inlineCodeColor: '#EE1C25',
    blockquoteBg: '#FFF6D8',
    h1Color: '#2B2B2B',
    h2Color: '#EE1C25',
    h3Color: '#F7941D',
    h2Bg: 'rgba(255, 203, 5, 0.3)'
  },
  preview: {
    primary: '#FFCB05',
    background: '#FFFDF3',
    accent: '#EE1C25'
  }
};
