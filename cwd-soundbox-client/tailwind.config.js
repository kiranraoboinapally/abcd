/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}', // Scan Angular templates and components
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['"Nunito Sans"', 'sans-serif'],
      },
      colors: {
        redCustom: '#C1212F',
      },
      filter: {
        'active-icon': 'brightness(0) saturate(100%) invert(18%) sepia(84%) saturate(4534%) hue-rotate(352deg) brightness(95%) contrast(106%)',
      },
    },
  },
  plugins: [],
};