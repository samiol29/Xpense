/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: {
          900: '#070f1a',
          800: '#0f172a',
          700: '#162238',
        },
        glass: 'rgba(17, 25, 40, 0.75)',
        neon: {
          green: '#34f5c5',
          teal: '#2dd4bf',
          lime: '#a3e635',
        },
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        accent: {
          mint: '#34d399',
          emerald: '#10b981',
          violet: '#8b5cf6',
          cyan: '#22d3ee',
          purple: '#a855f7',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        }
      },
      boxShadow: {
        glow: '0 0 0.5rem rgba(34, 211, 238, 0.35), 0 0 2rem rgba(34, 211, 238, 0.2)',
        card: '0 10px 25px -10px rgba(0,0,0,0.5)',
        glass: '0 20px 40px -20px rgba(0, 0, 0, 0.7)',
        neon: '0 0 20px rgba(16, 185, 129, 0.45)',
      },
      backgroundImage: {
        'radial-grid': 'radial-gradient(1000px 600px at 10% 10%, rgba(8,145,178,0.2), transparent), radial-gradient(800px 500px at 90% 0%, rgba(52,211,153,0.15), transparent)',
        'dashboard-gradient': 'linear-gradient(135deg, #0f2027 0%, #203a43 45%, #2c5364 100%)',
        'night-grid': 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.95)), url(/noise.png)',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
