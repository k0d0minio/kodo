import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  external: ["react", "react-dom"],
  banner: {
    js: '"use client";',
  },
});
