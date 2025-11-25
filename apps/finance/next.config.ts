import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack respects .gitignore files for file watching
  // Ensure root .gitignore properly excludes node_modules, dist, .next, .turbo, etc.
};

export default nextConfig;
