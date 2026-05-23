import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#15171a',
        'ink-soft': '#4a4a4a',
        'ink-faint': '#8b8b8b',
        paper: '#fbf7ee',
        'paper-2': '#f3eeda',
        'paper-3': '#e8e1c8',
        tri: {
          red: '#E1252C',
          green: '#009A4E',
          blue: '#0061B2',
          'red-soft': '#fde2e3',
          'green-soft': '#d7f0e1',
          'blue-soft': '#d4e6f7',
        },
      },
      fontFamily: {
        hand: ['var(--font-caveat)', 'cursive'],
        scrawl: ['var(--font-kalam)', 'cursive'],
        print: ['var(--font-patrick)', 'cursive'],
        arch: ['var(--font-arch)', 'cursive'],
      },
    },
  },
  plugins: [],
}

export default config
