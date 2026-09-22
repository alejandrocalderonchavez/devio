import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@devio/types", "@devio/validation"],
};

export default nextConfig;

