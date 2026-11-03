import type { NextConfig } from "next";

const securityHeaders = [
  // Stops other sites from putting yours inside a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Stops browsers from guessing file types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Browsers only act on this over HTTPS, so it does nothing on localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cc/shared"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
