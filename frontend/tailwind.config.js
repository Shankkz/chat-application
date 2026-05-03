/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neu: {
          bg: '#24272C', // Base background color
          dark: '#1a1c20', // Dark shadow color
          light: '#2e3238', // Light shadow color
          text: '#e2e8f0', // primary text
          textMuted: '#94a3b8', // secondary text
          primary: '#10b981', // WhatsApp-like green
          primaryDark: '#059669'
        }
      },
      boxShadow: {
        'neu-flat': '8px 8px 16px #1a1c20, -8px -8px 16px #2e3238',
        'neu-pressed': 'inset 8px 8px 16px #1a1c20, inset -8px -8px 16px #2e3238',
        'neu-sm': '4px 4px 8px #1a1c20, -4px -4px 8px #2e3238',
        'neu-inset-sm': 'inset 4px 4px 8px #1a1c20, inset -4px -4px 8px #2e3238',
      }
    },
  },
  plugins: [],
}
