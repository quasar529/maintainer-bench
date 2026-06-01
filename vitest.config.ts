import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    pool: "forks"
  },
  resolve: {
    alias: {
      "@maintainer-bench/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@maintainer-bench/graders": new URL("./packages/graders/src/index.ts", import.meta.url).pathname,
      "@maintainer-bench/runners": new URL("./packages/runners/src/index.ts", import.meta.url).pathname,
      "@maintainer-bench/github-capture": new URL("./packages/github-capture/src/index.ts", import.meta.url).pathname
    }
  }
});
