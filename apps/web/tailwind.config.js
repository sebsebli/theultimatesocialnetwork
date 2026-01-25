/** @type {import('tailwindcss').Config} */
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
      colors: {
        background: '#0B0B0C',
        foreground: '#F2F2F2',
        accent: '#6E7A8A',
        secondary: '#A8A8AA',
        tertiary: '#6E6E73',
        divider: '#1A1A1D',
        hover: 'rgba(255, 255, 255, 0.05)',
        pressed: 'rgba(255, 255, 255, 0.1)',
        ink: '#0B0B0C',
        paper: '#F2F2F2',
        primary: '#6E7A8A',
        primaryDark: '#5A6573',
        error: '#EF4444',
        like: '#EF4444',
      },
      spacing: {
        container: '680px',
        xs: '4px',
        s: '8px',
        m: '12px',
        l: '16px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.5px' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '-0.5px' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '-0.5px' }],
        lg: ['18px', { lineHeight: '24px', letterSpacing: '-0.5px' }],
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.5px' }],
      },
      borderRadius: {
        xl: '12px',
        pill: '20px',
      },
      maxWidth: {
        '4xl': '896px',
        '5xl': '1024px',
      },
      screens: {
        'xs': '475px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
