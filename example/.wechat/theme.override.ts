/**
 * WeChat Markdown 高级主题覆盖
 *
 * 此文件允许你完全自定义渲染样式，不受 CSS 变量限制。
 * 所有样式会合并到 theme.css 的变量设置之上。
 *
 * 用法：修改 overrideTheme 函数返回你想要的样式覆盖
 *
 * 注意：此文件会被动态 require，修改后需要重启扩展或重新加载窗口
 */

import type { Theme } from '../../src/renderer/theme';

/**
 * 主题覆盖函数
 * @param theme - 基础主题（包含 theme.css 中的变量设置）
 * @returns 部分主题对象，只包含需要覆盖的样式
 */
export function overrideTheme(theme: Theme): Partial<Theme> {
  return {
    // 示例：给一级标题添加渐变背景
    // h1: `${theme.h1}; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; border-radius: 12px; border: none; padding-bottom: 15px;`,

    // 示例：给二级标题添加左侧渐变背景
    // h2: `${theme.h2}; background: linear-gradient(to right, #e0f7fa, transparent);`,

    // 示例：给引用块添加圆角和阴影效果
    // blockquote: `${theme.blockquote}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);`,

    // 示例：修改代码块样式
    // pre: `${theme.pre}; border: 1px solid #e1e4e8;`,

    // 取消注释上面的示例来启用自定义样式
  };
}
