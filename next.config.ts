import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the workspace-root lockfile warning
  outputFileTracingRoot: require("path").join(__dirname, "../../"),
  // Empty turbopack config to avoid Next.js 16 Turbopack/webpack conflict error
  turbopack: {},
  serverExternalPackages: [
    "whatsapp-web.js",
    "instagram-private-api",
    "puppeteer",
    "puppeteer-core",
    "unzipper",
    "@aws-sdk/client-s3",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(heic|HEIC)$/i,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });
    return config;
  },
};

export default nextConfig;
