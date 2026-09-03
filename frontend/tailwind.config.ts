import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#06090e',
          900: '#0b1017',
          850: '#101722',
          800: '#16202e',
          700: '#1f2e42',
          600: '#2c3e58',
        },
        isro: {
          blue: '#1a56db',
          orange: '#ff6b00',
          dark: '#0e1e38',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          accent: '#00f0ff',
        },
        radar: {
          yellow: '#facc15',
          green: '#22c55e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
