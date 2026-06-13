import type { Config } from 'tailwindcss';

/**
 * BELS FARM design system.
 *
 * Colors are driven by CSS custom properties (see src/styles/theme.css) so the
 * same token set powers both light and dark themes without duplicating classes.
 * The palette leans on deep "field green" and warm "soil" neutrals to evoke a
 * working farm without resorting to clip-art greens or heavy gradients.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — map to CSS variables (HSL channels).
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
          sunken: 'hsl(var(--surface-sunken) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          muted: 'hsl(var(--primary-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',

        /**
         * Public marketing site palette — fixed, warm "farm editorial" tones.
         * Kept separate from the semantic app tokens so the dashboard theme and
         * the public site can evolve independently. Inspired by cream paper,
         * pasture green and sun-baked terracotta/clay.
         */
        site: {
          cream: '#F6F1E7',
          paper: '#FCFAF4',
          sand: '#ECE3D1',
          ink: '#1E241B',
          'ink-soft': '#5C6052',
          moss: '#33502F',
          'moss-dark': '#223820',
          'moss-soft': '#E6EBDC',
          clay: '#B85733',
          'clay-dark': '#8F4023',
          honey: '#D69A3A',
          line: '#E2DAC6',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'Inter var', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        sm: '0 1px 2px 0 hsl(var(--shadow) / 0.05)',
        DEFAULT: '0 1px 3px 0 hsl(var(--shadow) / 0.1), 0 1px 2px -1px hsl(var(--shadow) / 0.1)',
        md: '0 4px 12px -2px hsl(var(--shadow) / 0.12)',
        lg: '0 12px 32px -8px hsl(var(--shadow) / 0.18)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.2), 0 8px 24px -8px hsl(var(--primary) / 0.35)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
