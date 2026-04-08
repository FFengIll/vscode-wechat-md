# Spec: WeChat Markdown Renderer VSCode Extension

**Date**: 2026-04-08  
**Status**: Draft  
**Scope**: Full feature implementation from scaffold to production

---

## Overview

将 VSCode 中的 Markdown 文件渲染为微信公众号完全兼容的 HTML，所有样式以内联 `style=""` 注入，用户一键复制后可直接粘贴到公众号编辑器保留完整排版。

---

## User Story

> 作为公众号作者，我在 VSCode 中写好 Markdown 后，执行一个命令，弹出预览面板，点击"复制"按钮，到公众号编辑器粘贴，排版与预览完全一致。

---

## Commands (package.json contributes)

| Command ID | Title | 触发方式 |
|---|---|---|
| `wechat-md.preview` | WeChat: Preview Markdown | 命令面板 / 编辑器右键 |
| `wechat-md.copyHtml` | WeChat: Copy HTML to Clipboard | 命令面板 |

---

## Architecture

```
src/
├── extension.ts          # activate(): 注册两个命令
├── renderer/
│   ├── index.ts          # WeChatRenderer class: md → HTML
│   ├── rules.ts          # markdown-it 自定义 renderer rules（带内联样式）
│   └── theme.ts          # 样式常量（所有内联CSS值集中管理）
└── panel/
    └── PreviewPanel.ts   # WebviewPanel 管理（单例）
```

---

## Core: WeChatRenderer

```typescript
class WeChatRenderer {
  render(markdown: string): string  // 返回完整 <section>...</section> HTML
}
```

- 基于 `markdown-it`，覆写所有 renderer rules
- 每个 rule 直接返回带 `style=""` 的 HTML 字符串
- 输出不含 `<html>/<body>`，只有内容片段（方便粘贴）

---

## Renderer Rules & Styles

| Markdown 元素 | HTML 标签 | 关键内联样式 |
|---|---|---|
| 标题 h1 | `<h2>` | font-size:24px; font-weight:bold; color:#1a1a1a; margin:1.2em 0 0.5em; |
| 标题 h2 | `<h3>` | font-size:20px; font-weight:bold; border-left:4px solid #07C160; padding-left:8px; |
| 标题 h3-h6 | `<h4>`-`<h6>` | font-size递减, font-weight:bold |
| 段落 | `<p>` | font-size:16px; line-height:1.8; color:#333; margin:0.8em 0; |
| 粗体 | `<strong>` | font-weight:bold; color:#1a1a1a; |
| 斜体 | `<em>` | font-style:italic; |
| 行内代码 | `<code>` | font-family:monospace; background-color:#f4f4f4; padding:2px 4px; border-radius:3px; font-size:14px; color:#d63384; |
| 代码块 | `<pre><code>` | background-color:#f6f8fa; padding:16px; overflow-x:auto; border-radius:4px; font-size:14px; line-height:1.5; |
| 引用 | `<blockquote>` | border-left:4px solid #07C160; padding:8px 16px; background-color:#f9f9f9; color:#666; margin:1em 0; |
| 无序列表 | `<ul>` | padding-left:20px; margin:0.8em 0; |
| 有序列表 | `<ol>` | padding-left:20px; margin:0.8em 0; |
| 列表项 | `<li>` | line-height:1.8; margin:0.3em 0; |
| 分割线 | `<hr>` | border:none; border-top:1px solid #eee; margin:2em 0; |
| 链接 | `<a>` | color:#07C160; text-decoration:none; |
| 图片 | `<img>` | max-width:100%; display:block; margin:0 auto; |
| 表格 | `<table>` | width:100%; border-collapse:collapse; margin:1em 0; |
| 表头 | `<th>` | background-color:#f0f0f0; padding:8px; border:1px solid #ddd; text-align:left; |
| 表格单元格 | `<td>` | padding:8px; border:1px solid #ddd; |

> **注**: h1 映射为 `<h2>` 因公众号文章标题已有 h1，内容区从 h2 开始更合适

外层容器:
```html
<section style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif; max-width:680px; margin:0 auto; padding:0 16px;">
  ...内容...
</section>
```

---

## PreviewPanel

- 单例 WebviewPanel（`PreviewPanel.currentPanel`）
- 监听活动编辑器变化 → 自动刷新渲染
- Webview HTML 结构：
  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  </head>
  <body>
    <!-- 工具栏：复制按钮 -->
    <div id="toolbar">
      <button onclick="copyHtml()">复制 HTML</button>
    </div>
    <!-- 渲染预览区 -->
    <div id="preview">${renderedHtml}</div>
    <script nonce="${nonce}">
      function copyHtml() {
        const html = document.getElementById('preview').innerHTML;
        navigator.clipboard.writeText(html);
      }
    </script>
  </body>
  </html>
  ```
- CSP: 允许 `'unsafe-inline'` style（预览用）、script 需 nonce

---

## Copy Flow

两种复制路径：
1. **Webview 内按钮** → `navigator.clipboard.writeText(innerHtml)` — 复制的是渲染后的HTML片段
2. **命令 `wechat-md.copyHtml`** → `vscode.env.clipboard.writeText(rendered)` — 无需打开预览即可复制

---

## Dependencies to Add

```json
"dependencies": {
  "markdown-it": "^14.x"
}
```

Types:
```json
"devDependencies": {
  "@types/markdown-it": "^14.x"
}
```

No juice, no DOMPurify (not needed — we control the renderer output, no user-injected HTML).

---

## File Changes

| File | Action | Change |
|---|---|---|
| `package.json` | Modify | 添加 dependencies、contributes.commands、activationEvents |
| `src/extension.ts` | Modify | 注册两个命令 |
| `src/renderer/index.ts` | Create | WeChatRenderer class |
| `src/renderer/rules.ts` | Create | markdown-it renderer rules |
| `src/renderer/theme.ts` | Create | 样式常量 |
| `src/panel/PreviewPanel.ts` | Create | WebviewPanel 单例管理 |

---

## Non-Goals (Out of Scope)

- LaTeX 数学公式（可作后续迭代）
- 多主题切换（先做默认主题）
- 图片上传到微信CDN（用户手动处理）
- 实时双向编辑
