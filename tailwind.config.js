/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas:        token('canvas'),
        surface:       token('surface'),
        'surface-2':   token('surface-2'),
        bd:            token('bd'),
        'bd-strong':   token('bd-strong'),
        fg:            token('fg'),
        'fg-2':        token('fg-2'),
        'fg-3':        token('fg-3'),
        accent:        token('accent'),
        'accent-2':    token('accent-2'),
        'accent-weak': token('accent-weak'),
        'on-accent':   token('on-accent'),
        'on-danger':   token('on-danger'),
        pos:           token('pos'),
        'pos-bg':      token('pos-bg'),
        warn:          token('warn'),
        'warn-bg':     token('warn-bg'),
        violet:        token('violet'),
        'violet-bg':   token('violet-bg'),
        danger:        token('danger'),
        'danger-bg':   token('danger-bg'),
        neutral:       token('neutral'),
        'neutral-bg':  token('neutral-bg'),
        'side-bg':     token('side-bg'),
        'side-bg-2':   token('side-bg-2'),
        'side-bd':     token('side-bd'),
        'side-fg':     token('side-fg'),
        'side-fg-on':  token('side-fg-on'),
        'side-lab':    token('side-lab'),
        'side-active': token('side-active'),
        'side-hover':  token('side-hover'),
      },
      borderRadius: {
        card: '10px',
        ctl: '7px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
      },
      backgroundImage: {
        'accent-grad': 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-2)))',
      },
    },
  },
  plugins: [],
}
