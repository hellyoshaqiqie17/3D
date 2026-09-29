import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F7F5',
        card: '#FFFFFF',
        surface: {
          50: '#FAFAFA',
          100: '#F5F5F3',
          200: '#EBEBE7',
          300: '#DCDCD7',
          400: '#A3A39E',
        },
        border: '#E8E8E5',
        primary: {
          DEFAULT: '#171717',
          foreground: '#FFFFFF',
          hover: '#262626',
        },
        secondary: {
          DEFAULT: '#6B6B6B',
          foreground: '#171717',
        },
        accent: {
          DEFAULT: '#2563EB',
          warm: '#C28448',
          bronze: '#8C6D46',
        },
        muted: {
          DEFAULT: '#F0F0ED',
          foreground: '#737373',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        float: '0 12px 34px -10px rgba(0, 0, 0, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.03)',
        panel: '0 20px 40px -15px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
