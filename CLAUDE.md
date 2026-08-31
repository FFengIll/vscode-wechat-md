# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A VS Code extension (`vscode-wechat-md`) that renders Markdown into WeChat Official Account–compatible HTML: live preview in a webview, one-click rich-text copy to clipboard, all styling as **inline `style="..."` attributes** — WeChat's editor strips `<style>` blocks, external CSS, and class-based styles, so every renderer rule must emit inline styles.

## Commands

```bash
pnpm install                       # deps (pnpm, not npm/yarn)
pnpm run check-types               # tsc --noEmit
pnpm run lint                      # eslint src
pnpm run watch                     # esbuild + tsc, both in watch mode
pnpm run compile                   # check-types + esbuild (dev build)
pnpm run package                   # check-types + esbuild --production
pnpm test                          # compile-tests + lint + vscode-test (src/test/*.test.ts) — needs a downloaded VS Code/Electron host
pnpm run test:harness              # headless renderer validation (test/**) — no VS Code needed, see below
pnpm run render <file.md>          # render a markdown file to a standalone HTML page for a visual check, no VS Code
```

Packaging/publishing with `vsce` must pass `--no-dependencies`, otherwise it tries to `npm install` over the pnpm-managed `node_modules` and corrupts it:

```bash
npx @vscode/vsce package --no-dependencies
npx @vscode/vsce publish --no-dependencies
```

## Validating a renderer change without VS Code

Prefer `pnpm run test:harness` over manually opening the preview panel and eyeballing it. `WeChatRenderer` and everything it calls into (`rules.ts`, `wechatTransformer.ts`, `theme.ts`, `stylePresets.ts`, `customStyles.ts`, `frontMatter.ts`) has no `vscode` import, so `test/harness/render.ts` drives it directly through Node — see `test/harness/README.md` for the full layout. In particular `test/harness/stylePresets.test.ts` sweeps every built-in preset in every category and asserts WeChat-paste compatibility (no `<style>`/`class`, every element inline-styled, balanced tags), so a new or edited style preset in `src/renderer/index.ts`'s `_applyStylePresetOverrides()` is covered automatically without writing a new test. When in doubt whether a change is visually right, `pnpm run render <fixture> --mode=copy` and open the resulting HTML file in a browser.

## Architecture

### Rendering pipeline

`WeChatRenderer` (`src/renderer/index.ts`) wraps **two** markdown-it instances — `mdPreview` (with Shiki syntax highlighting) and `mdCopy` (WeChat-editor-compatible code block structure, via `wechatTransformer.ts`) — both driven by the same `applyWeChatRules()` (`rules.ts`), which turns a `Theme` object into inline-style renderer rule overrides.

Style resolution happens in two layers, applied in this order (second wins per-category):

1. **Baseline** — `reloadTheme()` builds a `Theme` from `.wechat/theme.css` CSS variables (`theme.ts`: `loadThemeVars`/`buildTheme`) plus the active whole-theme JSON preset from `PresetManager` (`.wechat/presets/*.json`, color vars only).
2. **Per-category override** — `_applyStylePresetOverrides()` (must run *after* `reloadTheme()`) selectively rewrites specific markdown-it rules (`heading_open`, `blockquote_open`, `hr`, `table_open`, etc.) for whichever categories have a non-default preset selected in `StylePresetManager` (`stylePresets.ts` defines the built-in preset catalog per category: h1/h2/h3, blockquote, list, link, image, divider, table, inlineCode).

Each category's preset list ends with a `"custom"` sentinel (`isCustomPresetId`/`getCustomPresetId`). Selecting it reads user-authored CSS from `.wechat/custom/<category>.css` (`customStyles.ts`) and **layers it on top of** that category's base theme style (`CATEGORY_THEME_KEY` in `index.ts`) rather than replacing it outright — full mechanism, file format, and known limitations are documented in `docs/custom-styles.md`.

### Block-level container effects

`::: card ... :::` / `::: tip ... :::` / etc. (`containers.ts`, via `markdown-it-container`) are a **closed catalog** (`CONTAINER_TYPES`) of block effects, registered once per `MarkdownIt` instance at construction — deliberately not a user-authored template mechanism. The tradeoff being made: users can't invent new HTML structure (that's what keeps every effect provably WeChat-paste-safe and harness-testable), but content *inside* a container still goes through the normal block parser, so `**bold**`/links/lists work — unlike a raw custom HTML tag (`<wmd-card>...</wmd-card>`), which CommonMark treats as an opaque HTML block and never reparses as markdown. Adding an effect means adding one `CONTAINER_TYPES` entry; `test/harness/containers.test.ts` covers it automatically. Container styling is currently fixed (not yet wired into the `.wechat/custom/` per-category override mechanism the way style presets are).

### Panels

- `PreviewPanel` (`src/panel/PreviewPanel.ts`) — the live preview webview; owns the single `WeChatRenderer`, watches `.wechat/theme.css` and `.wechat/custom/*.css` for hot reload, handles rich-text copy (base64-inlines local images via `imageUtils.ts`) and the "open WeChat platform" toolbar action.
- `StylePanel` (`src/panel/StylePanel.ts`) — dedicated preset-picker webview; renders chip grids per category from data pushed by the host, posts `setStylePreset`/`selectThemePreset`/`openCustomStyleFile` messages back, and does hover-preview by rendering a small markdown snippet through an isolated second `WeChatRenderer`.

Both webviews communicate with the extension host purely via `postMessage` — there's no shared state object between webview JS and the host beyond that.

### Two preset systems (don't confuse them)

- `PresetManager` — whole-theme color presets (`.wechat/presets/*.json`: accent/font/spacing vars + optional `customCSS` map). Persisted as files.
- `StylePresetManager` — per-category decoration presets + the `"custom"` sentinel described above. Selection state persisted in `context.workspaceState['selectedStylePresets']`, **not** a file.

There is no VS Code `configuration` contribution — no `wechat-md.*` settings.json keys exist; everything is either a workspace file under `.wechat/` or `workspaceState`.
