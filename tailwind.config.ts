import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        evergreen: '#1F3A2E',
        harvest: '#D96B2B',
        'harvest-hover': '#BF5A22',
        'harvest-active': '#A94F1E',
        'warm-white': '#F6F7F4',
        sage: '#6F8F7A',
        moss: '#4E6B58',
        charcoal: '#2E2E2E',
        stone: '#D8DAD6',
        'soft-clay': '#E7C2A8',
        'olive-tint': '#A9B8A6'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Times New Roman', 'serif']
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.05)'
      },
      borderRadius: {
        card: '12px'
      }
    }
  },
  plugins: []
};

export default config;
