const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Fix for MediaPipe WASM files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      '@ai-fitness-coach/coaching-engine': path.resolve(
        __dirname,
        '../coaching-engine/src/index.ts'
      ),
      '@ai-fitness-coach/pose-analysis-3d': path.resolve(
        __dirname,
        '../pose-analysis-3d/src/index.ts'
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
