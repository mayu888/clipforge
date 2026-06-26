/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg':     '#1a1a1c',
        'panel':      '#242427',
        'panel-2':    '#2c2c30',
        'elevated':   '#323237',
        'border':     '#3a3a40',
        'border-s':   '#4a4a52',
        'accent':     '#f0883e',
        'accent-dim': '#b5632a',
        'select':     '#4a9eff',
        'success':    '#4ade80',
        'danger':     '#f87171',
        'warn':       '#fbbf24',
        'text':       '#e8e8ea',
        'text-2':     '#a8a8b0',
        'muted':      '#6b6b73',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        panel: '8px',
        btn:   '5px',
        input: '4px',
        chip:  '4px',
      },
      fontSize: {
        'xxs':  ['11px', { lineHeight: '1.3' }],
        'xs':   ['12px', { lineHeight: '1.3' }],
        'sm':   ['13px', { lineHeight: '1.4' }],
        'base': ['13px', { lineHeight: '1.4' }],
        'md':   ['15px', { lineHeight: '1.4' }],
        'lg':   ['18px', { lineHeight: '1.3' }],
      },
      spacing: {
        'panel': '12px',
      },
    },
  },
  plugins: [],
};
