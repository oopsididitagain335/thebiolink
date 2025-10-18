/** @type {import('next').NextConfig} */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        worker_threads: false,
      };

      // Add Monaco Editor Webpack Plugin
      config.plugins.push(
        new MonacoWebpackPlugin({
          // Specify languages to include (add more as needed)
          languages: ['json', 'javascript', 'typescript', 'css', 'html'],
          filename: 'static/[name].worker.js',
        })
      );

      // Handle worker files as assets
      config.module.rules.push({
        test: /monaco-editor[\\\/]esm[\\\/]vs[\\\/]editor[\\\/]editor\.worker\.js$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/workers/[name][ext]',
        },
      });

      config.module.rules.push({
        test: /monaco-editor[\\\/]esm[\\\/]vs[\\\/].*\.worker\.js$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/workers/[name][ext]',
        },
      });
    }

    return config;
  },
};

module.exports = nextConfig;
