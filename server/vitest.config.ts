import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  test: {
    // The e2e files share one running server and its per-user / per-IP rate limits,
    // so run them one at a time.
    fileParallelism: false,
  },
});
