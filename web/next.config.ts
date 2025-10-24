import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 🚀 This line tells Next.js to skip type errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
