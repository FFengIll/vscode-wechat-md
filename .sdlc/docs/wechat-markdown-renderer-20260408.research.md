# Research: WeChat Markdown Renderer - Technical Approach

**Date**: 2026-04-08
**Topic**: VSCode插件 - 微信公众号Markdown渲染器技术选型

---

## Key Findings

### 1. WeChat HTML Constraints

微信公众号编辑器的HTML约束（实测整理）：

**支持的标签**: section, div, p, span, h1-h6, ul, ol, li, table, thead, tbody, tr, th, td, img, a, strong, b, em, i, u, s, del, br, hr, blockquote, code, pre, audio, video

**不支持的标签**: script, style, link, iframe, form, input, button

**支持的内联CSS属性**: font-size, font-family, font-weight, font-style, color, background-color, text-align, text-decoration, line-height, letter-spacing, white-space, margin, padding, border, width, height, max-width, display (block/inline/inline-block/flex), flex相关属性, position: relative, float

**不支持的CSS**: position: fixed/absolute, z-index, @media, animation, transition, :hover伪类, @font-face

**核心约束**: 所有样式必须内联为 `style=""` 属性，不能使用外部CSS或<style>块

### 2. Markdown Parser: markdown-it (Recommended)

- VSCode内部使用markdown-it
- 丰富的插件生态（代码高亮、数学公式等）
- 可以自定义渲染器（renderer rules）
- 支持TypeScript类型定义

### 3. CSS Inlining Strategy

不使用juice库（会增加bundle复杂度），而是直接通过markdown-it的自定义renderer在生成HTML时就注入内联样式。这样每个元素在生成时就带有style属性，无需后处理CSS注入步骤。

### 4. Reference Projects

- [markdown-nice](https://github.com/mdnice/markdown-nice) - 业界标杆，支持主题自定义
- [doocs/md](https://github.com/doocs/md) - 开源微信Markdown编辑器
- [wechat-markdown (npm)](https://www.npmjs.com/package/wechat-markdown) - marked.js + juice

---

## Technical Decision

**选型**: markdown-it + 自定义renderer（内联样式直接注入）
- 无需juice，减少依赖
- 渲染结果直接是WeChat兼容的HTML
- 可通过主题配置灵活调整样式
