/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './home.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        surface: '#F8F9FB',
        'surface-container': '#ECEEF0',
        'surface-container-low': '#F2F4F6',
        'surface-container-high': '#E6E8EA',
        'surface-container-highest': '#E0E3E5',
        'surface-container-lowest': '#FFFFFF',
        'on-surface': '#191C1E',
        'on-surface-variant': '#44474C',
        primary: '#1A3350',
        'primary-container': '#2A313E',
        secondary: '#E74243',
        outline: '#676766',
        'outline-variant': '#BFC4C5',
        'alto-red': '#E74243',
        'alto-blue': '#1A3350',
        'alto-gray': '#AFB5B6',
        'alto-navy': '#1A3350',
        navy: '#1A3350',
        'surface-low': '#F2F4F6',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
};
