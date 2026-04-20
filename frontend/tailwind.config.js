/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        imperial: {
          bg:        '#111318',
          'bg-mid':  '#16191f',
          'bg-light':'#1a1e28',
          border:    '#2a2e3a',
          gold:      '#c9a84c',
          'gold-lt': '#e8d5a0',
          light:     '#e8eaf0',
          muted:     '#6b7280',
          'muted-dk':'#4a4f5a',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans:  ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    },
  ],
};
