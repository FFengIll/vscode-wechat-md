// @ts-check
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').Plugin} */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',
  setup(build) {
    build.onStart(() => console.log('[watch] build started'));
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  }
};

/** @type {import('esbuild').Plugin} */
const copyAssetsPlugin = {
  name: 'copy-assets',
  setup(build) {
    build.onEnd(() => {
      // Copy defaultTheme.css next to the bundle output
      const src = path.join(__dirname, 'src/panel/defaultTheme.css');
      const dest = path.join(__dirname, 'dist/defaultTheme.css');
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    });
  }
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'warning',
    plugins: [esbuildProblemMatcherPlugin, copyAssetsPlugin],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
