/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf6',
          100: '#d8f8e8',
          200: '#b4efd2',
          300: '#7ddbb0',
          400: '#43c98b',
          500: '#17a96a',
          600: '#0d8b56',
          700: '#0c7048',
          800: '#0d5b3d',
          900: '#0b4b33'
        },
        ink: {
          950: '#07111b'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(23, 169, 106, 0.14), 0 24px 60px rgba(2, 6, 23, 0.26)'
      },
      backgroundImage: {
        'radial-grid': 'radial-gradient(circle at top left, rgba(23,169,106,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(59,130,246,0.12), transparent 36%)'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.7 },
          '50%': { opacity: 1 }
        }
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease-out both',
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};