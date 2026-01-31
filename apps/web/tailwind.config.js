/** @type {import('tailwindcss').Config} */
const { toTailwind } = require('@citewalk/design-tokens');

const tokens = toTailwind();

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'IBM Plex Serif', 'Georgia', 'serif'],
      },
      colors: tokens.colors,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      maxWidth: tokens.maxWidth,
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.5px' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '-0.5px' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '-0.5px' }],
        lg: ['18px', { lineHeight: '24px', letterSpacing: '-0.5px' }],
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.5px' }],
      },
      screens: {
        xs: '475px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};
