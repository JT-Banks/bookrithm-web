import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Firebase Hosting deployment.
  output: 'export',
  trailingSlash: true,

  // next/image optimization requires a server — disable it for the static export.
  // External cover images already use plain <img>; local assets are served as-is.
  images: { unoptimized: true },
};

export default nextConfig;
