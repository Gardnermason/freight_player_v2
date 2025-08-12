import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve our static HTML for the root path
      { source: '/', destination: '/index.html' },
    ];
  },
};

export default nextConfig;
