/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        work: ['"Work Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        calc: {
          bg: '#000000',
          button: '#0F161A',
          accent: '#0BB3CC',
          muted: '#344447',
        },
      },
      borderRadius: {
        'calc-btn': '12px',
      },
    },
  },
  plugins: [],
};

