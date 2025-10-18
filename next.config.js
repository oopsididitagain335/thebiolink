/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better error detection
  reactStrictMode: true,

  // Webpack configuration to handle Monaco Editor and Web Workers
  webpack: (config, { isServer }) => {
    // Prevent Web Worker issues with Monaco Editor on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        worker_threads: false,
      };

      // Configure Webpack to handle Monaco Editor's Web Workers
      config.module.rules.push({
        test: /monaco-editor[\\\/]esm[\\\/]vs[\\\/]editor[\\\/]editor\.worker\.js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/workers/[name][ext]',
        },
      });

      // Ensure Monaco Editor's other workers are handled
      config.module.rules.push({
        test: /monaco-editor[\\\/]esm[\\\/]vs[\\\/].*\.worker\.js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/workers/[name][ext]',
        },
      });
    }

    return config;
  },

  // Enable async WebAssembly for better performance with Monaco Editor
  experimental: {
    webpackBuildWorker: true,
  },

  // Optional: Configure image optimization for Cloudinary (if used)
  images: {
    domains: ['res.cloudinary.com'],
  },

  // Optional: Add environment variables if needed
  env: {
    // Add any custom environment variables here
    // Example: CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  },
};

module.exports = nextConfig;
