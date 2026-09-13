import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Ensure uploads directory is served statically if placed in public
};

export default nextConfig;
