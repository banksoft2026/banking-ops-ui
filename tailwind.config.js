/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1B3A5C',
          'navy-light': '#2A5580',
          teal: '#0F6E56',
          amber: '#854F0B',
          info: '#185FA5',
          danger: '#A32D2D',
        },
        page: '#F0F2F5',
        card: '#FFFFFF',
        border: '#D8E2EC',
        text: {
          primary: '#1A1A2E',
          secondary: '#5A6A7A',
          muted: '#8A9BAB',
        },
      },
    },
  },
  plugins: [],
}
