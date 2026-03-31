module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Cormorant Garamond"', 'serif'],
        body: ['"Montserrat"', 'sans-serif'],
      },
      colors: {
        gold: { 50: '#FBF6EC', 100: '#F3E6CC', 200: '#E5CC99', 300: '#D4B06A', DEFAULT: '#B8924A', 600: '#9A7A3A', 700: '#7A612E', 800: '#5A4822', 900: '#3A2F16' },
        burgundy: { 50: '#FDF2F4', 100: '#F8D8DE', 200: '#F0B0BD', 300: '#E0808F', DEFAULT: '#8B3A4A', 600: '#6B2A3A', 700: '#4E1E2B' },
        cream: { DEFAULT: '#FFFDF8', 100: '#FBF8F2', 200: '#F3EDE3', 300: '#E8DFD1' },
        warm: { 50: '#FFFDF8', 100: '#FBF8F2', 200: '#F3EDE3', 300: '#E8DFD1', 400: '#D4C8B8', 500: '#A89A88', 600: '#8A7E70', 700: '#5A5248', 800: '#3A3530', 900: '#2C2825', 950: '#1A1612' },
      }
    }
  }
}
