/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(15, 23, 42, 0.7)', // Slate-900 with opacity
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.03)',
        },
        brand: {
          primary: '#10b981', // Emerald-500
          secondary: '#34d399', // Emerald-400
          dark: '#064e3b', // Emerald-900
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        light: {
          100: '#f8fafc',
          200: '#f1f5f9',
          300: '#e2e8f0',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'brand': '0 0 20px rgba(16, 185, 129, 0.2)',
      },
      backgroundImage: {
        'mesh': 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.1) 0, transparent 50%)',
      }
    },
  },
  plugins: [],
}
