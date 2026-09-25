import type { NextConfig } from "next";

const rawApiUrl =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://devio-production.up.railway.app";

const cleanApiUrl = (
  rawApiUrl.startsWith("http://") || rawApiUrl.startsWith("https://")
    ? rawApiUrl
    : `https://${rawApiUrl}`
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@devio/types", "@devio/validation"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${cleanApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

