import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Google Sign-In popup to communicate back to the page.
  // Next.js sets Cross-Origin-Opener-Policy: same-origin by default,
  // which blocks the OAuth popup's postMessage. This relaxes it just enough.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
