// next.config.ts
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Serwist ON only in production
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // This silences Next’s “webpack config but no turbopack config” warning for dev.
  turbopack: {},
};

export default withSerwist(nextConfig);
