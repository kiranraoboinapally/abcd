/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}', // 👈 this tells Tailwind to scan your Angular templates and components
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['"Nunito Sans"', 'sans-serif'],
      },
      colors: {
        redCustom: '#C1212F',
      },
    },
  },
  plugins: [],
};
