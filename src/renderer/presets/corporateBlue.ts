// Corporate Blue - professional, trustworthy blue-toned preset
// (promoted from the .wechat/presets/custom-example.json tutorial file —
// that file stays in place as a documented example of the custom-preset
// JSON format; this is the same theme wired in as a built-in.)
import type { ThemePreset } from '../types';
import { defaultVars } from '../theme';

export const corporateBluePreset: ThemePreset = {
  id: 'corporate-blue',
  name: 'Corporate Blue',
  description: 'Professional corporate theme with blue accents and clean typography',
  vars: {
    ...defaultVars,
    accent: '#0066CC',
    fontSize: '16px',
    lineHeight: '1.75',
    textColor: '#2C3E50',
    codeBg: '#F0F7FF',
    inlineCodeColor: '#0052A3',
    blockquoteBg: '#E8F4FD',
    maxWidth: '680px',

    h1FontSize: '28px', h1FontWeight: '700', h1Color: '#003366',
    h1Bg: '#E8F4FD', h1Padding: '12px 16px', h1BorderRadius: '6px',

    h2FontSize: '24px', h2FontWeight: '600', h2Color: '#004080',
    h2Bg: 'transparent', h2Padding: '0', h2BorderRadius: '0',

    h3FontSize: '20px', h3FontWeight: '600', h3Color: '#0052A3',
    h3Bg: 'transparent', h3Padding: '0', h3BorderRadius: '0',

    h4FontSize: '18px', h4FontWeight: '600', h4Color: '#0066CC',
    h5FontSize: '16px', h5FontWeight: '600', h5Color: '#0073E6',
    h6FontSize: '15px', h6FontWeight: '600', h6Color: '#3385FF',
  },
  preview: {
    primary: '#0066CC',
    background: '#FFFFFF',
    accent: '#0052A3'
  }
};
