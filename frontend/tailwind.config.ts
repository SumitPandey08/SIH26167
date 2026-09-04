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
      animation: {
        'spring-in': 'springIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-ping': 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
      },
      keyframes: {
        springIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.3))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 25px rgba(34, 211, 238, 0.7))' },
        },
        radarPing: {
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
