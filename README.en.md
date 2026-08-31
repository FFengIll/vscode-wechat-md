# wechat-md / vscode-wechat-md

A WeChat Official Account Markdown renderer — live preview, one-click copy, precise style inlining, fast publishing.

> 中文文档请见 [README.md](README.md)

---

> Repo: https://github.com/FFengIll/vscode-wechat-md
>
> Marketplace: https://marketplace.visualstudio.com/items?itemName=FFengIll.vscode-wechat-md
>
> VS Code: search `wechat-md` in the extension marketplace

---

## Features

### Live Preview

A side panel renders your Markdown in WeChat-compatible styles as you type. The preview refreshes automatically on file switches and content edits — no manual action needed.

### One-Click Rich-Text Copy

Click **✂️ Copy Content** in the toolbar to write fully inlined rich-text HTML to the clipboard (local images are automatically converted to Base64). Paste directly into the WeChat Official Account editor — no manual cleanup needed.

### Syntax Highlighting

The preview panel renders code blocks with [Shiki](https://shiki.style/), including line numbers, card styling, and language labels. Copying converts them to WeChat-compatible markup automatically.

### Custom Styles

Click **🎨 Style Management** in the toolbar to open the style management panel: switch the whole-theme color preset, pick a decoration style for each element category, or select "Custom" to use your own hand-written CSS. See "Style Management" and "Per-Category Custom Style" below for details.

### Supported Markdown Elements

| Element | Notes |
| --- | --- |
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

### Container Effects (Card / Tip / Center)

Wrap a block of content in `:::` fence syntax to apply a built-in container effect — content inside is still parsed as normal markdown (**bold**, links, lists all work), no CSS/HTML required:

```markdown
::: tip
Read the docs before you start.
:::

::: card
Card content, supports **bold**, [links](https://example.com), lists, and other normal markdown.
:::
```

| id | Effect |
| --- | --- |
| `card` | Card container (rounded corners, shadow, border) |
| `tip` | Green tip box (💡 tip) |
| `info` | Blue info box (ℹ️ info) |
| `warning` | Orange warning box (⚠️ warning) |
| `center` | Centered content (commonly used for images + captions) |

This is a **closed catalog** — you can't invent a custom id or write your own HTML structure, which is exactly what keeps every effect provably WeChat-paste-safe. An unrecognized `:::` name falls through to plain text.

### Frontmatter `header` Field

A frontmatter block at the top of the document supports a `header:` field, which renders as a line of text at the very top of the body (styled like a normal paragraph by default, customizable via `.wechat/custom/header.css`). The `---` block itself never appears in the rendered output:

```markdown
---
header: Welcome to this issue
---

# Title
```

Only flat `key: value` fields are supported — no nesting, arrays, or multi-line values. Full details (Chinese) in [docs/custom-styles.md](docs/custom-styles.md), section 8.

---

## Installation & Usage

### Install

Search for `vscode-wechat-md` in the VS Code Extension Marketplace and install, or install locally from a `.vsix` file.

### Open Preview

Open any `.md` file, then trigger the preview via:

- The preview icon in the editor title bar
- Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → `WeChat MD: Preview Markdown`

### Style Management

Command Palette → `WeChat MD: Open Style Management Panel`. Switch the theme preset and adjust per-element decoration styles from the panel; every change applies instantly.

### Copy to the WeChat Editor

1. Open the preview panel
2. Click **✂️ Copy Content** in the toolbar
3. Open the WeChat Official Account editor and paste directly

---

## Custom Themes

Customization has three layers, narrowing from global to local — each layer only overrides what it touches, everything else still inherits from the layer below:

1. **`.wechat/theme.css`** — global base variables (accent color, font size, line height, ...), affects every built-in decoration
2. **`.wechat/presets/*.json`** — a whole-theme preset that overrides those variables at once, and can optionally add `customCSS`
3. **Per-category selection in the Style Management panel** — on top of the two layers above, swap the decoration style for a single element category (headings, blockquote, list, ...); see "Style Management" below

### Layer 0: Global CSS Variables (`.wechat/theme.css`)

Create `.wechat/theme.css` at your workspace root (or open it from the Style Management Panel) and override the base variables — accent color, font size, line height, and more — with standard CSS custom properties:

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

  /* h1–h3 also each support font-size / font-weight / color / bg / padding /
     border-radius, e.g. --wechat-h1-color, --wechat-h1-bg; h4–h6 support
     font-size / font-weight / color */
}
```

Save the file and the preview updates instantly — no restart required. This layer is only the baseline: if a JSON preset (below) is also active, any variable its `vars` field defines overrides the value set here.

### Layer 1: JSON Preset Files

Create a JSON file under `.wechat/presets/` (e.g. `my-custom.json`):

```json
{
  "id": "my-custom",
  "name": "My Custom Theme",
  "description": "My custom theme",
  "vars": {
    "accent": "#FF6B6B",
    "textColor": "#2C3E50",
    "fontSize": "16px",
    "lineHeight": "1.8",
    "h1Color": "#1A1A1A",
    "h2Color": "#FF6B6B",
    "codeBg": "#F8F9FA",
    "inlineCodeColor": "#E74C3C"
  },
  "preview": {
    "primary": "#FF6B6B",
    "background": "#FFFFFF",
    "accent": "#FF6B6B"
  }
}
```

> After creating or editing a `.wechat/presets/*.json` file, reload the window (`Developer: Reload Window`) to pick it up — preset files are only read once at extension activation, unlike `.wechat/theme.css` and `.wechat/custom/*.css`, which hot-reload.

### Layer 1b: Advanced CSS Extension

For cases the JSON `vars` fields can't cover — complex gradients, custom fonts — add a `customCSS` field to a preset:

```json
{
  "id": "advanced-theme",
  "name": "Advanced Theme",
  "vars": {
    "accent": "#667eea"
  },
  "customCSS": {
    "h1": "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;",
    "blockquote": "font-family: 'Georgia', serif; font-style: italic;",
    "a": "text-decoration: underline;"
  }
}
```

**About `customCSS`**:
- Key: element type (`h1`, `h2`, `h3`, `p`, `blockquote`, `a`, `img`, `hr`, `table`, `inlineCode`, ...)
- Value: a raw CSS declaration string, appended to that element's inline style
- Note: the WeChat editor may not support some advanced CSS properties (complex gradients, custom fonts)

---

## Style Management

### The Style Management Panel

Open it via Command Palette → `WeChat MD: Open Style Management Panel`. From there you can:

- **Theme presets**: switch the built-in color theme (WeChat Green / Elegant Classic / Modern Bold / Minimal Clean / Tech Developer / Claude / Pikachu / Corporate Blue)
- **Per-element styles**: pick a decoration style for headings (H1/H2/H3), blockquote, list, link, image, divider, table, inline code, and code block, independently
- **Hover preview**: hover any theme or style option to see a live-rendered preview in a popover — no need to click to apply and check. The preview is generated through the real rendering pipeline, so what you see is what you get
- Every change applies instantly, no restart needed

### Theme Presets

8 built-in color themes:

| Preset | Style | Notes |
| --- | --- | --- |
| **WeChat Green** (default) | Clean and professional | Classic WeChat green, works for most content |
| **Elegant Classic** | Editorial | Warm tones, more prominent headings, good for long-form reading |
| **Modern Bold** | Bold and modern | High contrast, blue-dominant, strong visual impact |
| **Minimal Clean** | Minimalist | Grayscale palette, content-first, low visual noise |
| **Tech Developer** | Technical | Dark background, purple accent, optimized code readability |
| **Claude** | Warm terracotta | Anthropic Claude-style terracotta orange + warm off-white |
| **Pikachu** | Playful | Bright yellow + cheek red, Pikachu palette |
| **Corporate Blue** | Business blue | Professional blue tones + a H1/H2/H3 color hierarchy, good for corporate content |

### Per-Category Decoration Presets

Each element category offers multiple built-in decoration styles:

| Category | Example styles |
| --- | --- |
| H1 | underline, left bar, background block, gradient background, dashed border, shadow card, numbered label, ... |
| H2 | underline, left bar, theme background, boxed border, wavy line, numbered label, ... |
| H3 | underline, left bar, dot, arrow, tag, curly-brace label, ... |
| Blockquote | left bar, card style, gradient background, dashed border, quote-mark decoration, ... |
| List | arrow, star, diamond, triangle, checkmark, bracketed number, ... |
| Link | accent color, bold, background color, dashed underline, arrow suffix, button style, ... |
| Image | rounded corners, shadow, border, polaroid, full-width, centered, ... |
| Divider | dashed, dotted, gradient, wavy, double line, text decoration, ... |
| Table | zebra stripes, accent-colored header, borderless, card style, modern, ... |
| Inline code | accent color, border, card, highlight, dark, tag, dashed, gradient, ... |
| Code block | card with label, Mac window, accent border, minimal left bar, ... |

Every category's option list ends with a **"Custom"** entry; selecting it switches to CSS you write yourself — see below.

> There's also a `header` category (the frontmatter `header:` field's style) — it currently has no option list in the panel, and can only be customized by hand-writing `.wechat/custom/header.css`; it follows normal paragraph styling by default.

### Per-Category Custom Style

Beyond the built-in decoration presets, the 11 categories above (H1/H2/H3, blockquote, list, link, image, divider, table, inline code, code block) can all be switched to "Custom"; `header` has no panel option but supports the same custom-style mechanism. This section covers the basic workflow — for the full mechanism (layering rules, which theme variables get substituted, known limitations, and the source files involved), see [docs/custom-styles.md](docs/custom-styles.md) (Chinese):

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

Category → file name: `h1` `h2` `h3` `blockquote` `list` `link` `image` `divider` `table` `inlineCode` `codeBlock` `header` — the file is always `.wechat/custom/<category key>.css`.

> This per-category custom style mechanism is the currently recommended way to go deep on customization — finer-grained and lower-friction than the earlier global `.wechat/theme.override.ts` (now removed): no TypeScript or internal `Theme` type knowledge required, plain CSS declarations are enough.

### Creating a Custom Theme Preset

Create a JSON file under `.wechat/presets/` (e.g. `my-custom.json`) — hand-writing the JSON is currently the only way; there's no "save as new preset" button in the panel:

```json
{
  "id": "my-custom",
  "name": "My Custom Theme",
  "description": "My custom theme",
  "vars": {
    "accent": "#FF6B6B",
    "textColor": "#2C3E50",
    "fontSize": "16px",
    "lineHeight": "1.8",
    "h1Color": "#1A1A1A",
    "h2Color": "#FF6B6B",
    "codeBg": "#F8F9FA",
    "inlineCodeColor": "#E74C3C"
  },
  "preview": {
    "primary": "#FF6B6B",
    "background": "#FFFFFF",
    "accent": "#FF6B6B"
  }
}
```

### Preset File Format Reference

The full set of configurable style variables (the `vars` field):

```json
{
  "id": "theme-id",
  "name": "Theme name",
  "description": "Theme description",
  "vars": {
    "accent": "#07C160",
    "fontSize": "16px",
    "lineHeight": "1.8",
    "textColor": "#333",
    "codeBg": "#f6f8fa",
    "inlineCodeColor": "#d63384",
    "blockquoteBg": "#f9f9f9",
    "maxWidth": "680px",
    "h1FontSize": "24px",
    "h1FontWeight": "bold",
    "h1Color": "#1a1a1a",
    "h1Bg": "transparent",
    "h1Padding": "0",
    "h1BorderRadius": "0",
    "h2FontSize": "20px",
    "h2FontWeight": "bold",
    "h2Color": "#1a1a1a",
    "h2Bg": "transparent",
    "h2Padding": "0",
    "h2BorderRadius": "0",
    "h3FontSize": "18px",
    "h3FontWeight": "bold",
    "h3Color": "#1a1a1a",
    "h3Bg": "transparent",
    "h3Padding": "0",
    "h3BorderRadius": "0",
    "h4FontSize": "16px",
    "h4FontWeight": "bold",
    "h4Color": "#333",
    "h5FontSize": "15px",
    "h5FontWeight": "bold",
    "h5Color": "#555",
    "h6FontSize": "14px",
    "h6FontWeight": "bold",
    "h6Color": "#666"
  },
  "preview": {
    "primary": "#07C160",
    "background": "#ffffff",
    "accent": "#07C160"
  }
}
```

---

### Precedence Rules

When multiple configurations apply, scope narrows from global to local — each layer overrides the one before it:

1. **System defaults** — built-in default style variables
2. **`.wechat/theme.css`** — overrides same-named variables from layer 1
3. **Preset `vars`** — when a JSON theme preset is active, overrides same-named variables from layer 2
4. **Preset `customCSS`** — appended to the end of the matching element's inline style (later-declared CSS properties win)
5. **Per-category style presets / custom CSS in the Style Management panel** — an independent axis: swaps a single element category (H1, blockquote, list, ...) to an entirely different decoration structure, or layers your own CSS on top; see "Style Management" and "Per-Category Custom Style" above

Example: modify a preset's H1 background and add a gradient

```json
{
  "vars": {
    "accent": "#07C160",
    "h1Bg": "#f0f9ff",
    "h1Padding": "12px 16px",
    "h1BorderRadius": "8px"
  },
  "customCSS": {
    "h1": "background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);"
  }
}
```

---

## Commands

| Command | ID | Description |
| --- | --- | --- |
| Preview Markdown | `wechat-md.preview` | Open / focus the preview panel |
| Open Style Management Panel | `wechat-md.openStylePanel` | Open the style management panel |

---

## Notes

- WeChat's editor doesn't support external CSS. This extension inlines **all styles** on every element, so formatting is preserved exactly after pasting.
- Local images are encoded as Base64 during rich-text copy, so they display correctly in the WeChat editor without manual uploads.
- Consider committing `.wechat/presets/` to version control to share a consistent style across your team.
- Advanced styles in `customCSS` (complex gradients, custom fonts) may not render correctly in the WeChat editor.
- The same applies to per-category custom styles under `.wechat/custom/` — consider committing those too.

---

## Feedback

Bug reports and feature requests are welcome: [GitHub Issues](https://github.com/FFengIll/vscode-wechat-md/issues)

![](images/wechat.png)
