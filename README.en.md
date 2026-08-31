# vscode-wechat-md

WeChat Official Account Markdown renderer — live preview, one-click copy, precise style inlining, fast publishing.

> 中文文档请见 [README.md](README.md)

---

## Features

### Live Preview

A side panel renders your Markdown in WeChat-compatible styles as you type. The preview refreshes automatically on file switches and content edits.

### One-Click Rich-Text Copy

Click **✂️ Copy Content** in the toolbar to write fully inlined rich-text HTML to the clipboard. Local images are automatically converted to Base64. Paste directly into the WeChat editor — no manual cleanup needed.

### Style Management Panel

Click **🎨 Style Management** in the toolbar to open a dedicated panel where you can switch the built-in color theme, and pick a decoration style for each element category (headings, blockquote, lists, links, images, dividers, tables, inline code) — or pick "Custom" per category to use your own hand-written CSS. Hover any option for a live rendered preview. All changes apply instantly.

### Supported Markdown Elements

| Element | Notes |
|---------|-------|
| Headings h1–h6 | Hierarchical styles; clean by default, decorations (borders/backgrounds) available via style presets |
| Paragraphs | Tuned for WeChat body text layout |
| Inline code | Highlighted with background tint |
| Code blocks | Both fenced and indented styles supported |
| Blockquotes | Left border + background color |
| Unordered / ordered lists | Full nesting support; marker and text on the same line |
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

## Global Theme Colors

Create `.wechat/theme.css` at your workspace root (open it from the Style Management Panel, or create it by hand) to override the accent color, font size, line height and more via CSS custom properties:

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

## Per-Category Custom Style

Beyond the built-in decoration presets, every element category (headings, blockquote, list, link, image, divider, table, inline code) has a **"Custom"** option in the Style Management Panel. Selecting it switches that category over to CSS you write yourself. This is the quick-start version; for the full mechanism (layering rules, which theme variables are substituted, known limitations, and the source files involved) see [docs/custom-styles.md](docs/custom-styles.md) (Chinese):

1. Pick "Custom" for a category in the panel.
2. Click the **✎ Edit Custom Style** link under that category's options — it creates and opens `.wechat/custom/<category>.css` (e.g. `.wechat/custom/h1.css`).
3. The file is a normal, valid CSS rule (selector + `{ }`). The selector is for readability only — only the declarations inside the braces are read, and they're **layered on top of** that category's base font-size/color/spacing (not a full replacement), so a custom H1 still looks like a heading instead of falling back to body text:

   ```css
   /* .wechat/custom/h1.css */
   .wmd-h1, h1 {
     display: table;       /* shrink-wrap to the text width, centered via margin: auto */
     margin: 1.8em auto 1em;
     text-align: center;
     border-bottom: 4px solid var(--wechat-accent);
     padding-bottom: 12px;
   }
   ```

   (`h1` is a full-width block element by default, so a plain `border-bottom` would span the whole page; `display: table` shrinks it to just the heading text's width.)

4. Save and the preview hot-reloads. `var(--wechat-accent)` and friends are substituted with the active theme's actual color.

Category → file name: `h1` `h2` `h3` `blockquote` `list` `link` `image` `divider` `table` `inlineCode` (i.e. the file is always `.wechat/custom/<category key>.css`).

---

## Commands

| Command | ID | Description |
|---------|----|-------------|
| Preview Markdown | `wechat-md.preview` | Open / focus the preview panel |
| Open Style Management Panel | `wechat-md.openStylePanel` | Open the style management panel |

---

## Notes

- WeChat's editor strips external CSS. This extension inlines **all styles** on every element, so formatting is preserved exactly after pasting.
- Local images are encoded as Base64 during rich-text copy, so they display correctly in the WeChat editor without manual uploads.
- Consider committing `.wechat/theme.css` and `.wechat/custom/` to version control to share a consistent style across your team.

---

## Feedback

Bug reports and feature requests are welcome: [GitHub Issues](https://github.com/FFengIll/vscode-wechat-md/issues)
