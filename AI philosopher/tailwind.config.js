module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'cat-base': '#1e1e2e',
        'cat-mantle': '#181825',
        'cat-crust': '#11111b',
        'cat-text': '#cdd6f4',
        'cat-subtext0': '#a6adc8',
        'cat-subtext1': '#bac2de',
        'cat-surface0': '#313244',
        'cat-surface1': '#45475a',
        'cat-surface2': '#585b70',
        'cat-overlay0': '#6c7086',
        'cat-overlay1': '#7f849c',
        'cat-overlay2': '#9399b2',
        'cat-blue': '#89b4fa',
        'cat-lavender': '#b4befe',
        'cat-sapphire': '#74c7ec',
        'cat-sky': '#89dceb',
        'cat-teal': '#94e2d5',
        'cat-green': '#a6e3a1',
        'cat-yellow': '#f9e2af',
        'cat-peach': '#fab387',
        'cat-maroon': '#eba0ac',
        'cat-red': '#f38ba8',
        'cat-mauve': '#cba6f7',
        'cat-pink': '#f5c2e7',
        'cat-flamingo': '#f2cdcd',
        'cat-rosewater': '#f5e0dc',
      },
      fontFamily: {
        mono: ['var(--font-vt323)', 'monospace'],
        display: ['var(--font-vt323)', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        }
      }
    },
  },
  plugins: [],
}
