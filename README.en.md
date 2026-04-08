# vscode-wechat-md

WeChat Official Account Markdown renderer — live preview, one-click copy, precise style inlining, fast publishing.

> 中文文档请见 [README.md](README.md)

---

## Features

### Live Preview

A side panel renders your Markdown in WeChat-compatible styles as you type. The preview refreshes automatically on file switches and content edits.

### One-Click Rich-Text Copy

Click **✂️ Copy Content** in the toolbar to write fully inlined rich-text HTML to the clipboard. Local images are automatically converted to Base64. Paste directly into the WeChat editor — no manual cleanup needed.

### Copy Raw HTML

Click **📋 Copy HTML** in the toolbar to get the raw inline-styled HTML string, useful for custom publishing workflows or further processing.

### Custom Theme

Click **🎨 Custom Style** in the toolbar to generate and open `.wechat/theme.css` in your workspace. Edit CSS variables to control colors, font size, line height, and more. Changes take effect immediately in the preview on save.

### Supported Markdown Elements

| Element | Notes |
|---------|-------|
| Headings h1–h6 | Hierarchical styles; h1/h2 decorated with WeChat green borders |
| Paragraphs | Tuned for WeChat body text layout |
| Inline code | Highlighted with background tint |
| Code blocks | Both fenced and indented styles supported |
| Blockquotes | Left border + background color |
| Unordered / ordered lists | Full nesting support |
| Bold / italic | |
| Links | `href` preserved |
| Images | Auto-centered; local images work in both preview and copy |
| Tables | With header row and border styling |
| Horizontal rules | |

---

## Installation & Usage

### Install

Search for `vscode-wechat-md` in the VS Code Extension Marketplace and install, or install locally from a `.vsix` file.

### Open Preview

Open any `.md` file, then trigger the preview via:

- The preview icon in the editor title bar
- Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → `WeChat MD: Preview Markdown`

### Copy to WeChat Editor

1. Open the preview panel
2. Click **✂️ Copy Content** in the toolbar
3. Paste directly into the WeChat Official Account editor

---

## Custom Theme

Clicking **🎨 Custom Style** creates `.wechat/theme.css` at your workspace root with the following configurable variables:

```css
:root {
  --wechat-accent: #07C160;            /* Accent color (WeChat green) */
  --wechat-font-size: 16px;            /* Body font size */
  --wechat-line-height: 1.8;           /* Line height */
  --wechat-text-color: #333;           /* Body text color */
  --wechat-code-bg: #f6f8fa;           /* Code block background */
  --wechat-inline-code-color: #d63384; /* Inline code color */
  --wechat-blockquote-bg: #f9f9f9;     /* Blockquote background */
  --wechat-max-width: 680px;           /* Content max width */
}
```

Save the file and the preview updates instantly — no restart required.

---

## Commands

| Command | ID | Description |
|---------|----|-------------|
| Preview Markdown | `wechat-md.preview` | Open / focus the preview panel |
| Copy HTML to Clipboard | `wechat-md.copyHtml` | Copy raw HTML to clipboard |

---

## Notes

- WeChat's editor strips external CSS. This extension inlines **all styles** on every element, so formatting is preserved exactly after pasting.
- Local images are encoded as Base64 during rich-text copy, so they display correctly in the WeChat editor without manual uploads.
- Consider committing `.wechat/theme.css` to version control to share a consistent style across your team.

---

## Feedback

Bug reports and feature requests are welcome: [GitHub Issues](https://github.com/FFengIll/vscode-wechat-md/issues)
