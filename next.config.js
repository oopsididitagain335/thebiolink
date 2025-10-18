/** @type {import('next').NextConfig} */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const nextConfig = {
  // Enable React Strict Mode for better error detection
  reactStrictMode: true,

  // Configure image optimization for Cloudinary
  images: {
    domains: ['res.cloudinary.com'],
  },

  // Enable Webpack Build Worker for Monaco Editor
  experimental: {
    webpackBuildWorker: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallback for server-side modules not needed on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        worker_threads: false,
      };

      // Add Monaco Editor Webpack Plugin
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ['json', 'javascript', 'typescript', 'css', 'html'], // Languages used in your editors
          filename: 'static/workers/[name].worker.js', // Output path for worker files
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;
