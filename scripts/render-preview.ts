// Headless render CLI — renders a Markdown file through the exact same
// WeChatRenderer pipeline the extension's preview panel uses, and writes a
// standalone HTML file you can open in any browser. This is the "no VS Code
// needed" visual-check path: point it at a fixture, open the output, look at
// it — no extension host, no webview, no manual "open in VS Code" step.
//
// Usage:
//   pnpm run render <input.md> [output.html] [--mode=preview|copy] [--theme=path/to/theme.css]
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WeChatRenderer } from '../src/renderer/index';

async function main() {
  const args = process.argv.slice(2);
  const positional = args.filter(a => !a.startsWith('--'));
  const flags = Object.fromEntries(
    args.filter(a => a.startsWith('--')).map(a => {
      const [key, value] = a.slice(2).split('=');
      return [key, value ?? 'true'];
    })
  );

  const inputPath = positional[0];
  if (!inputPath) {
    console.error('Usage: pnpm run render <input.md> [output.html] [--mode=preview|copy] [--theme=path/to/theme.css]');
    process.exit(1);
  }
  const outputPath = positional[1] ?? inputPath.replace(/\.md$/, '') + '.preview.html';
  const mode = (flags.mode as 'preview' | 'copy') ?? 'preview';
  const themePath = flags.theme ? resolve(flags.theme) : null;

  const resolvedInput = resolve(inputPath);
  if (!existsSync(resolvedInput)) {
    console.error(`Input file not found: ${resolvedInput}`);
    process.exit(1);
  }
  const markdown = readFileSync(resolvedInput, 'utf-8');

  const renderer = new WeChatRenderer();
  if (mode === 'preview') {
    await renderer.initHighlighter();
  }
  if (themePath) {
    renderer.reloadTheme(themePath);
  }

  const body = renderer.render(markdown, mode);
  const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>wechat-md preview: ${inputPath}</title>
<style>body { margin: 0; padding: 32px 16px; background: #f4f4f4; }</style>
</head>
<body>
${body}
</body>
</html>
`;

  writeFileSync(outputPath, page, 'utf-8');
  console.log(`Rendered ${inputPath} (mode=${mode}) -> ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
