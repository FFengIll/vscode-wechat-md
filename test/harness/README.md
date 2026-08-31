# Headless validation harness

Everything under `test/` renders and validates the WeChat markdown pipeline
(`src/renderer/**`) in plain Node — no VS Code, no Electron, no webview, no
human pasting output into WeChat's editor to eyeball it. It exists so a
change to a renderer rule or style preset can be checked by running a
command instead of by manual, one-off verification.

## Why this works without VS Code

`WeChatRenderer` (`src/renderer/index.ts`) and everything it calls into —
`rules.ts`, `wechatTransformer.ts`, `theme.ts`, `stylePresets.ts`,
`customStyles.ts`, `frontMatter.ts` — have no `vscode` import. Only
`PresetManager` and `StylePresetManager` do, purely to persist selections
into `vscode.Memento`; the renderer itself only ever calls two pure methods
on them (`getPresetCSS`, `replaceCSSVariables`). `test/harness/render.ts`
constructs a real `WeChatRenderer` and drives it through its actual public
API (`reloadTheme()` from a temp `.wechat/theme.css`-equivalent file,
`setStylePresetOverrides()` with a vscode-free `FakeStylePresetManager`) —
so a passing test is evidence the real extension host would behave the same
way, not a reimplementation of the logic under test.

## Commands

```bash
pnpm run test:harness          # run once
pnpm run test:harness:watch    # watch mode while iterating
pnpm run check-types:harness   # type-check test/ and scripts/
pnpm run render <file.md> [out.html] [--mode=preview|copy] [--theme=path.css]
                                # render any markdown file to a standalone
                                # HTML page you can open in a browser —
                                # a real visual check with no VS Code involved
```

## Layout

- `render.ts` — `createRenderer(options)` / `renderMarkdown(md, options)`:
  the single entry point every test uses to get real rendered HTML.
- `fakeStylePresetManager.ts` — vscode-free stand-in for
  `StylePresetManager`, reimplementing only the two pure methods the
  renderer actually calls.
- `validators.ts` — `validateWeChatHtml()` / `assertWeChatCompatible()`:
  parses rendered HTML and checks the invariants WeChat's paste target
  requires — no `<style>` blocks, no CSS classes (except WeChat's own
  recognized `code-snippet__*` code-block markup — see
  `wechatTransformer.ts`), every content element carries a non-empty
  `style="..."`, and all tags balance.
- `*.test.ts` — the actual suites:
  - `basic.test.ts` — one comprehensive fixture through preview/copy modes,
    frontmatter `header`, and the real Shiki highlighter.
  - `stylePresets.test.ts` — every built-in preset in every category from
    `stylePresets.ts` (100+ presets), in both render modes. This is what
    catches a broken hand-written HTML string in one of the decorative
    preset branches in `index.ts` (e.g. a heading preset that forgets to
    put `style=""` back on the tag it replaces).
  - `customCss.test.ts` — the "`-custom`" preset sentinel: user CSS must
    layer on top of the category's base theme style, and `var(--wechat-*)`
    substitution must work the same as it does for built-in presets.
  - `theme.test.ts` — `.wechat/theme.css`-driven `ThemeVars` overrides
    (accent color, max-width, ...) actually reach the rendered output.
  - `containers.test.ts` — every entry in `CONTAINER_TYPES`
    (`src/renderer/containers.ts`, the `::: card` / `::: tip` / ... block
    syntax): WeChat compatibility in both modes, that nested markdown
    (bold/link/list) inside the container still parses instead of being
    swallowed as raw text, and that an unregistered container name falls
    through to plain text rather than vanishing.
- `../fixtures/*.md` — shared markdown fixtures.

## Adding coverage for a new renderer feature

1. If it's a new style preset, it's covered automatically — the sweep in
   `stylePresets.test.ts` iterates `allStylePresets`, no per-preset test to
   add.
2. If it's a new container effect, same deal — add one entry to
   `CONTAINER_TYPES` in `containers.ts` and `containers.test.ts` picks it up.
3. If it's a new element or rendering mode, add or extend a fixture in
   `test/fixtures/`, then assert on it with `assertWeChatCompatible()` (or
   a narrower check if the element is legitimately preview-only, the way
   Shiki's highlighted `<pre>` is — see the comment in `basic.test.ts`).
3. Run `pnpm run render <fixture> --mode=copy` and open the output in a
   browser to sanity-check it looks right before trusting the assertions.
