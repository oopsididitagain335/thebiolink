import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gradient-start': '#6366f1',
        'gradient-end': '#8b5cf6',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
};

export default config;
