import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cc/shared"],
  poweredByHeader: false,
};

export default nextConfig;