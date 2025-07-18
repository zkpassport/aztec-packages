import { esbuildPlugin } from '@web/dev-server-esbuild';
import { defaultReporter } from '@web/test-runner';
import { playwrightLauncher } from '@web/test-runner-playwright';
import { fileURLToPath } from 'url';

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    // playwrightLauncher({ product: "webkit" }),
    // playwrightLauncher({ product: "firefox" }),
  ],
  plugins: [
    esbuildPlugin({
      ts: true,
    }),
  ],
  files: ['./src/**/indexeddb/*.test.ts'],
  rootDir: fileURLToPath(new URL('../', import.meta.url)),
  nodeResolve: true,
  reporters: [defaultReporter()],
  concurrency: 1,
  concurrentBrowsers: 1,
};
