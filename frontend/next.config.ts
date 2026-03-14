import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from any domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Proxy API requests to Django backend so we only need to expose one port
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
