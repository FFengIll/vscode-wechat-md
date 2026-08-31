import { defineConfig } from 'vitest/config';

// Headless validation harness for the WeChat markdown-rendering pipeline
// (src/renderer/**) — deliberately separate from the @vscode/test-cli suite
// under src/test, which needs a downloaded VS Code/Electron host to run.
// Everything under test/ imports src/renderer directly and needs nothing
// but Node, so it runs anywhere: CI, a container, or this session, with no
// VS Code involved. See test/harness/README.md.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: false,
  },
});
