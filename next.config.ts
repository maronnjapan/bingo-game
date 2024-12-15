import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    buildActivity: false
  },
  serverRuntimeConfig: {
    maxDuration: 60
  }
};

export default nextConfig;
