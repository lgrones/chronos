import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "native",
          env: { TEMPORAL_IMPL: "native" },
          include: ["test/**/*.test.ts"],
          setupFiles: ["test/setup/native.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "polyfill",
          env: { TEMPORAL_IMPL: "polyfill" },
          include: ["test/**/*.test.ts"],
          setupFiles: ["test/setup/polyfill.ts"],
        },
      },
    ],
  },
  fmt: {},
});
