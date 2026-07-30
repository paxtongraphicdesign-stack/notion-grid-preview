import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow embedding in Notion iframes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Remove SAMEORIGIN restriction so Notion can embed this app
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ];
  },
  // Disable image optimisation to avoid remote-pattern allowlisting;
  // Notion CDN URLs are signed and vary per-fetch, so we use plain <img>.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
