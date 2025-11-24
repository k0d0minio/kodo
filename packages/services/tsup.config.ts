import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/email/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
});
