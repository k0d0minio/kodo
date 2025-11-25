import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-email/render requires prettier at runtime, so we need to externalize it
  // even though we use biome for formatting
  serverExternalPackages: ["prettier", "prettier/plugins/html", "prettier/standalone"],
  // Transpile workspace packages for proper module resolution
  transpilePackages: ["@kodo/services", "@kodo/ui"],
  // Turbopack respects .gitignore files for file watching
  // Ensure root .gitignore properly excludes node_modules, dist, .next, .turbo, etc.
};

export default nextConfig;

