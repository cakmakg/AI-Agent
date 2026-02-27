/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a14',
        surface: 'rgba(25, 25, 35, 0.65)',
        primary: '#00f0ff',
        secondary: '#bf00ff',
        success: '#00ffaa',
        warning: '#ffaa00',
        danger: '#ff3366',
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 240, 255, 0.4), 0 0 30px rgba(0, 240, 255, 0.2)',
        'neon-purple': '0 0 15px rgba(191, 0, 255, 0.4), 0 0 30px rgba(191, 0, 255, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
