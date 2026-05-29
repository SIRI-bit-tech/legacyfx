import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background Colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-elevated': 'var(--bg-elevated)',
        
        // Primary Yellow (Binance Brand)
        'color-primary': 'var(--color-primary)',
        'color-primary-alt': 'var(--color-primary-alt)',
        'color-primary-hover': 'var(--color-primary-hover)',
        
        // Text Colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        
        // Status Colors
        'color-success': 'var(--color-success)',
        'color-danger': 'var(--color-danger)',
        'color-warning': 'var(--color-warning)',
        'color-info': 'var(--color-info)',
        
        // Borders
        'color-border': 'var(--border)',
        'color-border-light': 'var(--border-light)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
        '4xl': '4rem',
        '4.5': '1.125rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        base: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(252, 213, 53, 0.3)',
      },
      keyframes: {
        'animate-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-right-10': {
          '0%': { transform: 'translateX(2.5rem)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'animate-in': 'animate-in 500ms ease-out forwards',
        'slide-in-from-right-10': 'slide-in-from-right-10 500ms ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
