/**
 * ValutoLab Design System v2 — Tailwind config snippet
 *
 * Paste the `extend` block into your existing tailwind.config.ts.
 * Do NOT replace the whole file — merge with what's already there.
 */
import type { Config } from 'tailwindcss'

const config: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Ink — primary text + dark surfaces
        ink: {
          50:  '#F2F4F7',
          100: '#EAEDF2',
          200: '#D9DEE7',
          300: '#BCC4D2',
          400: '#94A0B5',
          500: '#6F7E96',
          600: '#4E5E78',
          700: '#2E3F58',
          800: '#1B2A40',
          900: '#0E1A2B',
          950: '#07111E',
        },
        // Paper — warm off-white backgrounds (NOT cold gray)
        paper: {
          50:  '#FBF8F2',
          100: '#F6F2EA',
          200: '#ECE6D8',
          300: '#D9D0BC',
        },
        // Sienna — single accent (brand, CTA, links — use sparingly)
        sienna: {
          50:  '#FCF3EA',
          100: '#F7E6D9',
          300: '#E9B89E',
          500: '#CF7556',
          600: '#B85C3A',
          700: '#8B3D1F',
        },
        // Level — functional, ONLY for ESCO scoring (4 levels)
        level: {
          base:       '#B0473A', // 1.0–2.0
          intermedio: '#C68A2E', // 2.1–3.0
          avanzato:   '#4F7A53', // 3.1–4.0
          esperto:    '#2D5F73', // 4.1–5.0
        },
      },

      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['IBM Plex Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'SF Mono', 'monospace'],
      },

      fontSize: {
        // Custom display scale matching the design system
        'display-1': ['64px', { lineHeight: '66px', letterSpacing: '-0.030em', fontWeight: '700' }],
        'display-2': ['42px', { lineHeight: '46px', letterSpacing: '-0.025em', fontWeight: '500' }],
        'display-3': ['28px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '500' }],
        'lede':      ['22px', { lineHeight: '31px', letterSpacing: '0',        fontWeight: '300' }],
        'body':      ['16px', { lineHeight: '26px' }],
        'caption':   ['13px', { lineHeight: '20px' }],
        'eyebrow':   ['12px', { letterSpacing: '0.18em', fontWeight: '500' }],
        'numeric':   ['90px', { lineHeight: '81px', letterSpacing: '-0.040em', fontWeight: '300' }],
      },

      letterSpacing: {
        'tightest-display': '-0.045em', // wordmark
        'tighter-display':  '-0.030em', // display-1
        'tight-display':    '-0.025em', // display-2
        'micro-tight':      '-0.015em', // display-3
        'eyebrow':          '0.18em',
      },

      borderRadius: {
        sm: '2px',
        DEFAULT: '2px',
        md: '4px',
        lg: '6px',
      },

      boxShadow: {
        'sm-ink': '0 1px 2px rgba(14, 26, 43, 0.06)',
        'md-ink': '0 4px 14px rgba(14, 26, 43, 0.08)',
        'lg-ink': '0 22px 60px rgba(14, 26, 43, 0.14)',
      },
    },
  },
}

export default config
