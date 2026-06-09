/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50:  '#F2F4F7', 100: '#EAEDF2', 200: '#D9DEE7', 300: '#BCC4D2',
          400: '#94A0B5', 500: '#6F7E96', 600: '#4E5E78', 700: '#2E3F58',
          800: '#1B2A40', 900: '#0E1A2B', 950: '#07111E',
        },
        paper: {
          50: '#FBF8F2', 100: '#F6F2EA', 200: '#ECE6D8', 300: '#D9D0BC',
        },
        sienna: {
          50: '#FCF3EA', 100: '#F7E6D9', 300: '#E9B89E',
          500: '#CF7556', 600: '#B85C3A', 700: '#8B3D1F',
        },
        level: {
          base:       '#B0473A',
          intermedio: '#C68A2E',
          avanzato:   '#4F7A53',
          esperto:    '#2D5F73',
        },
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-ibm-plex-sans)', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-3': ['28px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '500' }],
        'eyebrow':   ['12px', { letterSpacing: '0.18em', fontWeight: '500' }],
      },
      letterSpacing: {
        'eyebrow': '0.18em',
      },
      borderRadius: {
        sm: '2px', DEFAULT: '2px', md: '4px', lg: '6px',
      },
      boxShadow: {
        'sm-ink': '0 1px 2px rgba(14,26,43,0.06)',
        'md-ink': '0 4px 14px rgba(14,26,43,0.08)',
        'lg-ink': '0 22px 60px rgba(14,26,43,0.14)',
      },
    },
  },
  plugins: [],
}
