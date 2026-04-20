/**
 * Comprehensive Style Presets System
 *
 * Defines all style presets for different elements:
 * - Heading styles (H1, H2, H3)
 * - Blockquote styles
 * - List marker styles
 * - Link styles
 * - Image styles
 * - Divider styles
 * - Table styles
 */

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  css: string;
}

// ============================================================================
// HEADING STYLES
// ============================================================================

export const h1Styles: StylePreset[] = [
  {
    id: 'h1-default',
    name: '默认',
    description: '简洁默认样式',
    css: ''
  },
  {
    id: 'h1-underline',
    name: '下划装饰',
    description: '底部装饰线',
    css: 'border-bottom: 3px solid currentColor; padding-bottom: 8px;'
  },
  {
    id: 'h1-underline-accent',
    name: '主题色下划',
    description: '主题色装饰线',
    css: 'border-bottom: 3px solid var(--wechat-accent); padding-bottom: 8px;'
  },
  {
    id: 'h1-left-bar',
    name: '左竖条',
    description: '左侧彩色竖条',
    css: 'border-left: 6px solid var(--wechat-accent); padding-left: 12px;'
  },
  {
    id: 'h1-background',
    name: '背景色块',
    description: '圆角背景色',
    css: 'background: var(--wechat-accent); color: #fff; padding: 12px 20px; border-radius: 8px;'
  },
  {
    id: 'h1-center-line',
    name: '中线装饰',
    description: '中间穿过线条',
    css: 'position: relative; display: inline-block;' +
          'padding: 0 20px;' +
          '&:before, &:after { content: ""; position: absolute; top: 50%; width: 40px; height: 2px; background: var(--wechat-accent); }' +
          '&:before { right: 100%; }' +
          '&:after { left: 100%; }'
  },
  {
    id: 'h1-quote',
    name: '引号装饰',
    description: '大引号装饰',
    css: 'position: relative; padding-left: 40px;' +
          '&:before { content: """; position: absolute; left: 0; top: -10px; font-size: 48px; color: var(--wechat-accent); opacity: 0.3; }'
  },
  {
    id: 'h1-number',
    name: '数字序号',
    description: '带圆圈数字',
    css: 'display: flex; align-items: center;' +
          '&:before { content: counter(h1); counter-increment: h1; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: var(--wechat-accent); color: #fff; border-radius: 50%; margin-right: 12px; font-weight: bold; }'
  },
  {
    id: 'h1-dashed-box',
    name: '虚线框',
    description: '虚线边框',
    css: 'border: 2px dashed var(--wechat-accent); padding: 12px 16px; border-radius: 8px;'
  },
  {
    id: 'h1-gradient-bg',
    name: '渐变背景',
    description: '渐变色背景',
    css: 'background: linear-gradient(135deg, var(--wechat-accent) 0%, #333 100%); color: #fff; padding: 16px 24px; border-radius: 12px;'
  },
  {
    id: 'h1-shadow',
    name: '阴影效果',
    description: '卡片阴影',
    css: 'background: #fff; padding: 16px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'
  },
  {
    id: 'h1-bracket',
    name: '方括号',
    description: '方括号装饰',
    css: 'display: inline-block;' +
          '&:before, &:after { content: "["; color: var(--wechat-accent); font-weight: bold; margin: 0 8px; }' +
          '&:after { content: "]"; }'
  },
  {
    id: 'h1-dot',
    name: '圆点装饰',
    description: '两侧圆点',
    css: 'display: flex; align-items: center; justify-content: center;' +
          '&:before, &:after { content: "●"; color: var(--wechat-accent); margin: 0 12px; }'
  }
];

export const h2Styles: StylePreset[] = [
  {
    id: 'h2-default',
    name: '默认',
    description: '简洁默认样式',
    css: ''
  },
  {
    id: 'h2-underline',
    name: '下划线',
    description: '简单下划线',
    css: 'border-bottom: 2px solid var(--wechat-accent); padding-bottom: 6px;'
  },
  {
    id: 'h2-left-bar',
    name: '左竖条',
    description: '左侧竖条',
    css: 'border-left: 4px solid var(--wechat-accent); padding-left: 10px;'
  },
  {
    id: 'h2-icon-bullet',
    name: '图标子弹',
    description: '前置图标',
    css: 'display: flex; align-items: center;' +
          '&:before { content: "▶"; color: var(--wechat-accent); margin-right: 8px; font-size: 0.8em; }'
  },
  {
    id: 'h2-number',
    name: '数字序号',
    description: '数字编号',
    css: 'counter-increment: h2;' +
          '&:before { content: counter(h2) ". "; color: var(--wechat-accent); font-weight: bold; margin-right: 6px; }'
  },
  {
    id: 'h2-bracket',
    name: '括号',
    description: '方括号包围',
    css: 'display: inline-block;' +
          '&:before { content: "[ "; color: var(--wechat-accent); }' +
          '&:after { content: " ]"; color: var(--wechat-accent); }'
  },
  {
    id: 'h2-background',
    name: '浅色背景',
    description: '浅色背景块',
    css: 'background: rgba(0,0,0,0.03); padding: 8px 12px; border-radius: 6px;'
  },
  {
    id: 'h2-accent-bg',
    name: '主题背景',
    description: '主题色背景',
    css: 'background: var(--wechat-accent); color: #fff; padding: 8px 16px; border-radius: 6px; display: inline-block;'
  },
  {
    id: 'h2-border-box',
    name: '边框框',
    description: '边框包围',
    css: 'border: 1px solid var(--wechat-accent); padding: 8px 16px; border-radius: 6px; display: inline-block;'
  },
  {
    id: 'h2-center',
    name: '居中样式',
    description: '居中显示',
    css: 'text-align: center; padding: 8px 0;'
  },
  {
    id: 'h2-dashed',
    name: '虚线框',
    description: '虚线边框',
    css: 'border: 1px dashed var(--wechat-accent); padding: 8px 16px; border-radius: 6px;'
  },
  {
    id: 'h2-wave',
    name: '波浪线',
    description: '底部波浪',
    css: 'border-bottom: 2px wavy var(--wechat-accent); padding-bottom: 6px;'
  }
];

export const h3Styles: StylePreset[] = [
  {
    id: 'h3-default',
    name: '默认',
    description: '简洁默认样式',
    css: ''
  },
  {
    id: 'h3-underline',
    name: '下划线',
    description: '简单下划线',
    css: 'border-bottom: 1px solid var(--wechat-accent); padding-bottom: 4px;'
  },
  {
    id: 'h3-left-bar',
    name: '左竖条',
    description: '左侧细竖条',
    css: 'border-left: 3px solid var(--wechat-accent); padding-left: 8px;'
  },
  {
    id: 'h3-bullet',
    name: '圆点',
    description: '前置圆点',
    css: 'display: flex; align-items: center;' +
          '&:before { content: "●"; color: var(--wechat-accent); margin-right: 8px; font-size: 0.6em; }'
  },
  {
    id: 'h3-number',
    name: '数字',
    description: '数字编号',
    css: '&:before { content: attr(data-index) ". "; color: var(--wechat-accent); font-weight: bold; }'
  },
  {
    id: 'h3-background',
    name: '背景色',
    description: '浅色背景',
    css: 'background: rgba(0,0,0,0.02); padding: 4px 8px; border-radius: 4px; display: inline;'
  },
  {
    id: 'h3-inline',
    name: '内联',
    description: '内联样式',
    css: 'display: inline;'
  },
  {
    id: 'h3-brace',
    name: '大括号',
    description: '花括号装饰',
    css: 'display: inline-block;' +
          '&:before { content: "{ "; color: var(--wechat-accent); }' +
          '&:after { content: " }"; color: var(--wechat-accent); }'
  },
  {
    id: 'h3-arrow',
    name: '箭头',
    description: '箭头引导',
    css: 'display: flex; align-items: center;' +
          '&:before { content: "→"; color: var(--wechat-accent); margin-right: 8px; }'
  },
  {
    id: 'h3-tag',
    name: '标签',
    description: '标签样式',
    css: 'background: var(--wechat-accent); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.9em;'
  }
];

// ============================================================================
// BLOCKQUOTE STYLES
// ============================================================================

export const blockquoteStyles: StylePreset[] = [
  {
    id: 'quote-default',
    name: '默认',
    description: '左侧竖线',
    css: 'border-left: 4px solid var(--wechat-accent); padding-left: 16px; margin: 16px 0; color: #666;'
  },
  {
    id: 'quote-gray',
    name: '灰色背景',
    description: '浅灰背景',
    css: 'background: #f7f7f7; padding: 12px 16px; border-radius: 6px; margin: 16px 0; color: #666;'
  },
  {
    id: 'quote-card',
    name: '卡片式',
    description: '卡片阴影',
    css: 'background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin: 16px 0; border-left: 4px solid var(--wechat-accent);'
  },
  {
    id: 'quote-accent-bg',
    name: '主题背景',
    description: '主题色背景',
    css: 'background: var(--wechat-accent); color: #fff; padding: 12px 16px; border-radius: 6px; margin: 16px 0;'
  },
  {
    id: 'quote-double-line',
    name: '双线',
    description: '左侧双线',
    css: 'border-left: 6px double var(--wechat-accent); padding-left: 16px; margin: 16px 0;'
  },
  {
    id: 'quote-quote-mark',
    name: '引号',
    description: '大引号装饰',
    css: 'position: relative; padding: 16px 16px 16px 48px; margin: 16px 0; background: #f9f9f9; border-radius: 8px;' +
          '&:before { content: """; position: absolute; left: 12px; top: 8px; font-size: 32px; color: var(--wechat-accent); opacity: 0.3; font-family: Georgia; }'
  },
  {
    id: 'quote-border-box',
    name: '边框框',
    description: '完整边框',
    css: 'border: 1px solid var(--wechat-accent); padding: 12px 16px; border-radius: 6px; margin: 16px 0; background: rgba(0,0,0,0.02);'
  },
  {
    id: 'quote-dashed',
    name: '虚线框',
    description: '虚线边框',
    css: 'border: 2px dashed var(--wechat-accent); padding: 12px 16px; border-radius: 8px; margin: 16px 0; background: #fafafa;'
  },
  {
    id: 'quote-gradient',
    name: '渐变',
    description: '渐变背景',
    css: 'background: linear-gradient(135deg, var(--wechat-accent) 0%, rgba(255,255,255,1) 100%); padding: 12px 16px; border-radius: 8px; margin: 16px 0; color: #fff;'
  },
  {
    id: 'quote-left-bar-bg',
    name: '左条背景',
    description: '竖条+背景',
    css: 'background: #f0f0f0; border-left: 4px solid var(--wechat-accent); padding: 12px 16px; margin: 16px 0; border-radius: 0 6px 6px 0;'
  }
];

// ============================================================================
// LIST MARKER STYLES
// ============================================================================

export const listMarkerStyles: StylePreset[] = [
  {
    id: 'list-default',
    name: '默认',
    description: '默认圆点',
    css: ''
  },
  {
    id: 'list-check',
    name: '勾选',
    description: '✓ 勾选标记',
    css: '&.task-list-item { position: relative; padding-left: 24px; }' +
          '&.task-list-item:before { content: "✓"; position: absolute; left: 0; color: var(--wechat-accent); font-weight: bold; }'
  },
  {
    id: 'list-arrow',
    name: '箭头',
    description: '→ 箭头',
    css: 'list-style: none; padding-left: 0;' +
          'li:before { content: "→ "; color: var(--wechat-accent); margin-right: 8px; }'
  },
  {
    id: 'list-star',
    name: '星标',
    description: '★ 星星',
    css: 'list-style: none; padding-left: 0;' +
          'li:before { content: "★ "; color: #f5a623; margin-right: 8px; }'
  },
  {
    id: 'list-diamond',
    name: '菱形',
    description: '◆ 菱形',
    css: 'list-style: none; padding-left: 0;' +
          'li:before { content: "◆ "; color: var(--wechat-accent); margin-right: 8px; font-size: 0.8em; }'
  },
  {
    id: 'list-square',
    name: '方块',
    description: '■ 方块',
    css: 'list-style-type: square;'
  },
  {
    id: 'list-circle',
    name: '空心圆',
    description: '○ 空心圆',
    css: 'list-style-type: circle;'
  },
  {
    id: 'list-number-paren',
    name: '括号数字',
    description: '(1) 括号数字',
    css: 'list-style: none; counter-reset: list-item;' +
          'li { counter-increment: list-item; }' +
          'li:before { content: "(" counter(list-item) ") "; color: var(--wechat-accent); font-weight: bold; margin-right: 8px; }'
  },
  {
    id: 'list-accent-bullet',
    name: '主题点',
    description: '主题色圆点',
    css: 'list-style: none;' +
          'li:before { content: "●"; color: var(--wechat-accent); margin-right: 10px; font-size: 0.7em; }'
  },
  {
    id: 'list-dash',
    name: '横线',
    description: '— 横线',
    css: 'list-style: none;' +
          'li:before { content: "— "; color: #999; margin-right: 8px; }'
  },
  {
    id: 'list-triangle',
    name: '三角',
    description: '▶ 三角',
    css: 'list-style: none;' +
          'li:before { content: "▶ "; color: var(--wechat-accent); margin-right: 8px; font-size: 0.8em; }'
  },
  {
    id: 'list-number-dot',
    name: '点数字',
    description: '1. 数字',
    css: 'list-style-type: decimal;'
  }
];

// ============================================================================
// LINK STYLES
// ============================================================================

export const linkStyles: StylePreset[] = [
  {
    id: 'link-default',
    name: '默认',
    description: '蓝色下划线',
    css: 'color: #576b95; text-decoration: underline;'
  },
  {
    id: 'link-accent',
    name: '主题色',
    description: '主题色链接',
    css: 'color: var(--wechat-accent); text-decoration: none; border-bottom: 1px solid var(--wechat-accent);'
  },
  {
    id: 'link-plain',
    name: '纯文本',
    description: '无下划线',
    css: 'color: var(--wechat-accent); text-decoration: none;'
  },
  {
    id: 'link-bold',
    name: '粗体',
    description: '粗体链接',
    css: 'color: var(--wechat-accent); font-weight: bold; text-decoration: none;'
  },
  {
    id: 'link-background',
    name: '背景色',
    description: '背景高亮',
    css: 'background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 3px; color: var(--wechat-accent); text-decoration: none;'
  },
  {
    id: 'link-dashed',
    name: '虚线下划',
    description: '虚线装饰',
    css: 'color: var(--wechat-accent); text-decoration: none; border-bottom: 1px dashed var(--wechat-accent);'
  },
  {
    id: 'link-arrow',
    name: '箭头后缀',
    description: '→ 箭头',
    css: 'color: var(--wechat-accent); text-decoration: none;' +
          '&:after { content: " →"; font-size: 0.9em; }'
  },
  {
    id: 'link-box',
    name: '按钮式',
    description: '按钮样式',
    css: 'display: inline-block; background: var(--wechat-accent); color: #fff; padding: 6px 16px; border-radius: 6px; text-decoration: none;'
  }
];

// ============================================================================
// IMAGE STYLES
// ============================================================================

export const imageStyles: StylePreset[] = [
  {
    id: 'img-default',
    name: '默认',
    description: '原始图片',
    css: ''
  },
  {
    id: 'img-rounded',
    name: '圆角',
    description: '圆角图片',
    css: 'border-radius: 8px;'
  },
  {
    id: 'img-circle',
    name: '圆形',
    description: '圆形裁剪',
    css: 'border-radius: 50%;'
  },
  {
    id: 'img-shadow',
    name: '阴影',
    description: '卡片阴影',
    css: 'border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
  },
  {
    id: 'img-bordered',
    name: '边框',
    description: '白色边框',
    css: 'border: 8px solid #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'
  },
  {
    id: 'img-polaroid',
    name: '拍立得',
    description: '拍立得效果',
    css: 'padding: 8px 8px 24px 8px; background: #fff; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
  },
  {
    id: 'img-tint',
    name: '色调',
    description: '主题色边框',
    css: 'border: 4px solid var(--wechat-accent); border-radius: 8px;'
  },
  {
    id: 'img-full-width',
    name: '全宽',
    description: '宽度100%',
    css: 'width: 100%; height: auto; display: block;'
  },
  {
    id: 'img-centered',
    name: '居中',
    description: '居中显示',
    css: 'display: block; margin: 16px auto;'
  }
];

// ============================================================================
// DIVIDER STYLES
// ============================================================================

export const dividerStyles: StylePreset[] = [
  {
    id: 'hr-default',
    name: '默认',
    description: '简单横线',
    css: 'border: none; border-top: 1px solid #eee; margin: 24px 0;'
  },
  {
    id: 'hr-dashed',
    name: '虚线',
    description: '虚线分割',
    css: 'border: none; border-top: 2px dashed #ddd; margin: 24px 0;'
  },
  {
    id: 'hr-dotted',
    name: '点线',
    description: '点线分割',
    css: 'border: none; border-top: 3px dotted #ccc; margin: 24px 0;'
  },
  {
    id: 'hr-accent',
    name: '主题色',
    description: '主题色线条',
    css: 'border: none; border-top: 2px solid var(--wechat-accent); margin: 24px 0;'
  },
  {
    id: 'hr-gradient',
    name: '渐变',
    description: '渐变线条',
    css: 'border: none; height: 2px; background: linear-gradient(90deg, transparent, var(--wechat-accent), transparent); margin: 24px 0;'
  },
  {
    id: 'hr-thick',
    name: '粗线',
    description: '粗线条',
    css: 'border: none; border-top: 4px solid #333; margin: 24px 0;'
  },
  {
    id: 'hr-text',
    name: '文字分割',
    description: '文字装饰',
    css: 'border: none; text-align: center; margin: 24px 0;' +
          '&:before { content: "● ● ●"; color: #ccc; letter-spacing: 4px; }'
  },
  {
    id: 'hr-wave',
    name: '波浪',
    description: '波浪线',
    css: 'border: none; border-top: 3px wavy #ccc; margin: 24px 0;'
  },
  {
    id: 'hr-double',
    name: '双线',
    description: '双线条',
    css: 'border: none; border-top: 3px double #999; margin: 24px 0;'
  },
  {
    id: 'hr-center-star',
    name: '中心星',
    description: '星星装饰',
    css: 'border: none; overflow: hidden; text-align: center; margin: 24px 0;' +
          '&:before { content: "★"; display: inline-block; padding: 0 10px; color: var(--wechat-accent); font-size: 20px; position: relative; }' +
          '&:after { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #ddd; z-index: -1; }'
  },
  {
    id: 'hr-arrow',
    name: '箭头',
    description: '箭头引导',
    css: 'border: none; text-align: center; margin: 24px 0;' +
          '&:before { content: "↓↓↓"; color: var(--wechat-accent); letter-spacing: 8px; font-size: 12px; }'
  },
  {
    id: 'hr-space',
    name: '空白',
    description: '仅留白',
    css: 'border: none; height: 32px; margin: 24px 0;'
  }
];

// ============================================================================
// TABLE STYLES
// ============================================================================

export const tableStyles: StylePreset[] = [
  {
    id: 'table-default',
    name: '默认',
    description: '基础表格',
    css: 'border-collapse: collapse; width: 100%; margin: 16px 0;' +
          'th, td { border: 1px solid #ddd; padding: 8px 12px; }' +
          'th { background: #f5f5f5; font-weight: 600; }'
  },
  {
    id: 'table-striped',
    name: '斑马纹',
    description: '隔行变色',
    css: 'border-collapse: collapse; width: 100%; margin: 16px 0;' +
          'th, td { border: 1px solid #ddd; padding: 8px 12px; }' +
          'th { background: #f5f5f5; font-weight: 600; }' +
          'tr:nth-child(even) { background: #f9f9f9; }'
  },
  {
    id: 'table-accent',
    name: '主题色',
    description: '主题色表头',
    css: 'border-collapse: collapse; width: 100%; margin: 16px 0;' +
          'th, td { border: 1px solid #ddd; padding: 8px 12px; }' +
          'th { background: var(--wechat-accent); color: #fff; font-weight: 600; }'
  },
  {
    id: 'table-borderless',
    name: '无边框',
    description: '简洁无边框',
    css: 'border-collapse: collapse; width: 100%; margin: 16px 0;' +
          'th, td { border: none; padding: 8px 12px; }' +
          'th { font-weight: 600; border-bottom: 2px solid var(--wechat-accent); }'
  },
  {
    id: 'table-card',
    name: '卡片式',
    description: '卡片阴影',
    css: 'border-collapse: separate; border-spacing: 0; width: 100%; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;' +
          'th, td { padding: 12px; border-bottom: 1px solid #eee; }' +
          'th { background: #f5f5f5; font-weight: 600; }' +
          'tr:last-child td { border-bottom: none; }'
  },
  {
    id: 'table-modern',
    name: '现代',
    description: '现代简约',
    css: 'border-collapse: collapse; width: 100%; margin: 16px 0;' +
          'th, td { border: none; padding: 12px 16px; text-align: left; }' +
          'th { background: #333; color: #fff; font-weight: 600; }' +
          'tr:nth-child(even) { background: #f9f9f9; }'
  }
];

// ============================================================================
// EXPORT ALL
// ============================================================================

export const allStylePresets = {
  h1: h1Styles,
  h2: h2Styles,
  h3: h3Styles,
  blockquote: blockquoteStyles,
  list: listMarkerStyles,
  link: linkStyles,
  image: imageStyles,
  divider: dividerStyles,
  table: tableStyles
};

export type StylePresetCategory = keyof typeof allStylePresets;

export function getStylePresets(category: StylePresetCategory): StylePreset[] {
  return allStylePresets[category] || [];
}

export function getPresetById(category: StylePresetCategory, id: string): StylePreset | undefined {
  return allStylePresets[category]?.find(p => p.id === id);
}
