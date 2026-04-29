/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          500: '#4F6EF7',
          600: '#3B55E0',
          700: '#2C42C2',
          900: '#1A2878',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          card:    '#FFFFFF',
          border:  '#E2E8F0',
        },
        sidebar: {
          bg:     '#1E293B',
          hover:  '#334155',
          active: '#3B55E0',
          text:   '#94A3B8',
          textActive: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
