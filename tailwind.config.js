/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './home.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        'surface': '#F8F9FB',
        'surface-container': '#ECEEF0',
        'surface-container-low': '#F2F4F6',
        'surface-container-high': '#E6E8EA',
        'surface-container-highest': '#E0E3E5',
        'surface-container-lowest': '#FFFFFF',
        'on-surface': '#191C1E',
        'on-surface-variant': '#44474C',
        'primary': '#041627',
        'primary-container': '#1A2B3C',
        'secondary': '#BB0014',
        'outline': '#74777D',
        'outline-variant': '#C4C6CD',
        'alto-red': '#BB0014',
        'alto-blue': '#041627',
        'alto-gray': '#B0B6B8',
        'alto-navy': '#041627',
        'navy': '#041627',
        'surface-low': '#F2F4F6',
      },
      fontFamily: {
        'headline': ['Manrope', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
