import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'hsl(var(--color-primary-50) / <alpha-value>)',
          100: 'hsl(var(--color-primary-100) / <alpha-value>)',
          200: 'hsl(var(--color-primary-200) / <alpha-value>)',
          300: 'hsl(var(--color-primary-300) / <alpha-value>)',
          400: 'hsl(var(--color-primary-400) / <alpha-value>)',
          500: 'hsl(var(--color-primary-500) / <alpha-value>)',
          600: 'hsl(var(--color-primary-600) / <alpha-value>)',
          700: 'hsl(var(--color-primary-700) / <alpha-value>)',
          800: 'hsl(var(--color-primary-800) / <alpha-value>)',
          900: 'hsl(var(--color-primary-900) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-primary-600) / <alpha-value>)',
        },
        accent: {
          50:  'hsl(var(--color-accent-50) / <alpha-value>)',
          400: 'hsl(var(--color-accent-400) / <alpha-value>)',
          500: 'hsl(var(--color-accent-500) / <alpha-value>)',
          600: 'hsl(var(--color-accent-600) / <alpha-value>)',
          DEFAULT: 'hsl(var(--color-accent-500) / <alpha-value>)',
        },
        partner: {
          500: '#0ea5e9',
          600: '#0284c7',
        },
        bg:               'hsl(var(--color-bg) / <alpha-value>)',
        surface:          'hsl(var(--color-surface) / <alpha-value>)',
        'surface-elev':   'hsl(var(--color-surface-elev) / <alpha-value>)',
        ink:              'hsl(var(--color-text) / <alpha-value>)',
        muted:            'hsl(var(--color-muted) / <alpha-value>)',
        line:             'hsl(var(--color-border) / <alpha-value>)',
        success:          'hsl(var(--color-success) / <alpha-value>)',
        danger:           'hsl(var(--color-danger) / <alpha-value>)',
        star:             'hsl(var(--color-star) / <alpha-value>)',
      },
      fontFamily: {
        sans:    ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'soft':     '0 1px 2px hsl(var(--color-shadow) / 0.04), 0 2px 6px hsl(var(--color-shadow) / 0.06)',
        'card':     '0 4px 12px hsl(var(--color-shadow) / 0.08), 0 2px 4px hsl(var(--color-shadow) / 0.04)',
        'card-lg':  '0 12px 32px hsl(var(--color-shadow) / 0.12), 0 4px 12px hsl(var(--color-shadow) / 0.08)',
        'lift':     '0 18px 40px hsl(var(--color-shadow) / 0.18), 0 6px 14px hsl(var(--color-shadow) / 0.08)',
        'glow':     '0 0 0 1px hsl(var(--color-primary-500) / 0.10), 0 8px 28px hsl(var(--color-primary-500) / 0.32)',
        'inset-3d': 'inset 0 1px 0 hsl(0 0% 100% / 0.30), inset 0 -1px 0 hsl(var(--color-shadow) / 0.12)',
      },
      backgroundImage: {
        'gradient-hero':
          'radial-gradient(at 12% 12%, hsl(var(--color-primary-500) / 0.28) 0%, transparent 45%), radial-gradient(at 92% 18%, hsl(var(--color-accent-500) / 0.22) 0%, transparent 50%), radial-gradient(at 50% 100%, hsl(280 90% 70% / 0.20) 0%, transparent 55%)',
        'gradient-mesh':
          'radial-gradient(at 0% 0%, hsl(var(--color-primary-500) / 0.18) 0%, transparent 50%), radial-gradient(at 100% 100%, hsl(var(--color-accent-500) / 0.16) 0%, transparent 50%)',
        'gradient-card':
          'linear-gradient(135deg, hsl(var(--color-primary-500) / 0.10), hsl(var(--color-accent-500) / 0.08))',
        'gradient-primary':
          'linear-gradient(135deg, hsl(var(--color-primary-500)) 0%, hsl(var(--color-primary-700)) 100%)',
        'gradient-accent':
          'linear-gradient(135deg, hsl(var(--color-accent-400)) 0%, hsl(var(--color-accent-600)) 100%)',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        lift: {
          '0%':   { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        marquee:    'marquee 35s linear infinite',
        'fade-up':  'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer:    'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
