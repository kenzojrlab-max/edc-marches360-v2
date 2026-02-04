/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
    "!./functions/**",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['DM Sans', 'sans-serif'],
        'display': ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#1e3a8a',
        secondary: '#64748b',
        accent: '#0ea5e9',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        'blue-edc': {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1e3a8a',
          600: '#1e40af',
          900: '#1e3a8a'
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3.5rem',
      }
    }
  },
  plugins: [],
}
