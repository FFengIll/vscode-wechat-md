import * as fs from 'fs';

// Default WeChat-compatible inline style values.
// All styles must be inline — WeChat strips <style> blocks and external CSS.
// Values here can be overridden by .wechat/theme.css CSS variables.

export interface ThemeVars {
  accent: string;
  fontSize: string;
  lineHeight: string;
  textColor: string;
  codeBg: string;
  inlineCodeColor: string;
  blockquoteBg: string;
  maxWidth: string;
}

export const defaultVars: ThemeVars = {
  accent: '#07C160',
  fontSize: '16px',
  lineHeight: '1.8',
  textColor: '#333',
  codeBg: '#f6f8fa',
  inlineCodeColor: '#d63384',
  blockquoteBg: '#f9f9f9',
  maxWidth: '680px',
};

// Parse CSS custom properties from a .wechat/theme.css file.
// Only reads :root { --wechat-* } declarations.
export function loadThemeVars(cssPath: string | null): ThemeVars {
  if (!cssPath) { return defaultVars; }
  try {
    const css = fs.readFileSync(cssPath, 'utf-8');
    const vars = { ...defaultVars };
    const pick = (name: string): string | undefined => {
      const m = css.match(new RegExp(`--wechat-${name}\\s*:\\s*([^;\\n]+)`));
      return m ? m[1].trim() : undefined;
    };
    vars.accent          = pick('accent')            ?? vars.accent;
    vars.fontSize        = pick('font-size')         ?? vars.fontSize;
    vars.lineHeight      = pick('line-height')       ?? vars.lineHeight;
    vars.textColor       = pick('text-color')        ?? vars.textColor;
    vars.codeBg          = pick('code-bg')           ?? vars.codeBg;
    vars.inlineCodeColor = pick('inline-code-color') ?? vars.inlineCodeColor;
    vars.blockquoteBg    = pick('blockquote-bg')     ?? vars.blockquoteBg;
    vars.maxWidth        = pick('max-width')         ?? vars.maxWidth;
    return vars;
  } catch {
    return defaultVars;
  }
}

export function buildTheme(v: ThemeVars) {
  return {
    container: [
      'font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
      `max-width: ${v.maxWidth}`,
      'margin: 0 auto',
      'padding: 0 16px',
      `color: ${v.textColor}`,
      `font-size: ${v.fontSize}`,
      `line-height: ${v.lineHeight}`,
    ].join('; '),

    h1: [
      'font-size: 24px', 'font-weight: bold', 'color: #1a1a1a',
      'margin: 1.5em 0 0.6em', 'line-height: 1.4',
      'padding-bottom: 8px', `border-bottom: 2px solid ${v.accent}`,
    ].join('; '),

    h2: [
      'font-size: 20px', 'font-weight: bold', 'color: #1a1a1a',
      'margin: 1.3em 0 0.5em', 'line-height: 1.4',
      'padding-left: 10px', `border-left: 4px solid ${v.accent}`,
    ].join('; '),

    h3: ['font-size: 18px', 'font-weight: bold', 'color: #1a1a1a', 'margin: 1.1em 0 0.4em', 'line-height: 1.4'].join('; '),
    h4: ['font-size: 16px', 'font-weight: bold', 'color: #333', 'margin: 1em 0 0.4em'].join('; '),
    h5: ['font-size: 15px', 'font-weight: bold', 'color: #555', 'margin: 0.8em 0 0.3em'].join('; '),
    h6: ['font-size: 14px', 'font-weight: bold', 'color: #666', 'margin: 0.8em 0 0.3em'].join('; '),

    p: [`font-size: ${v.fontSize}`, `line-height: ${v.lineHeight}`, `color: ${v.textColor}`, 'margin: 0.8em 0'].join('; '),

    strong: ['font-weight: bold', 'color: #1a1a1a'].join('; '),
    em:     ['font-style: italic', 'color: #555'].join('; '),

    inlineCode: [
      'font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      'background-color: #f4f4f4', 'padding: 2px 6px', 'border-radius: 3px',
      'font-size: 14px', `color: ${v.inlineCodeColor}`,
    ].join('; '),

    pre: [`background-color: ${v.codeBg}`, 'padding: 16px', 'border-radius: 6px', 'overflow-x: auto', 'margin: 1em 0'].join('; '),
    preCode: [
      'font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      'font-size: 14px', 'line-height: 1.6', 'color: #24292e', 'background: none', 'padding: 0',
    ].join('; '),

    blockquote: [
      `border-left: 4px solid ${v.accent}`, 'padding: 10px 16px',
      `background-color: ${v.blockquoteBg}`, 'color: #666', 'margin: 1em 0', 'font-style: italic',
    ].join('; '),

    ul: ['padding-left: 24px', 'margin: 0.8em 0', 'list-style-type: disc'].join('; '),
    ol: ['padding-left: 24px', 'margin: 0.8em 0', 'list-style-type: decimal'].join('; '),
    li: [`line-height: ${v.lineHeight}`, 'margin: 0.3em 0', `color: ${v.textColor}`].join('; '),

    hr:  ['border: none', 'border-top: 1px solid #eee', 'margin: 2em 0'].join('; '),
    a:   [`color: ${v.accent}`, 'text-decoration: none'].join('; '),
    img: ['max-width: 100%', 'display: block', 'margin: 1em auto', 'border-radius: 4px'].join('; '),

    table: ['width: 100%', 'border-collapse: collapse', 'margin: 1em 0', 'font-size: 15px'].join('; '),
    th:    ['background-color: #f0f0f0', 'padding: 10px 12px', 'border: 1px solid #ddd', 'text-align: left', 'font-weight: bold', 'color: #333'].join('; '),
    td:    ['padding: 8px 12px', 'border: 1px solid #ddd', `color: ${v.textColor}`].join('; '),
  };
}

export type Theme = ReturnType<typeof buildTheme>;
