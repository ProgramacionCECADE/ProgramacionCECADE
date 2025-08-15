/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores CECADE
        cecade: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1E3A8A', // Color principal CECADE
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Colores de estado
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#6366F1',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Tamaños optimizados para tablets
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        // Espaciado optimizado para tablets
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      screens: {
        // Breakpoints optimizados para tablets
        'xs': '475px',
        'tablet': '768px',
        'tablet-lg': '1024px',
        'desktop': '1280px',
      },
      animation: {
        // Animaciones personalizadas
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        // Sombras optimizadas para tablets
        'tablet': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'tablet-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-cecade': '0 0 20px rgba(30, 58, 138, 0.3)',
      },
      borderRadius: {
        // Bordes redondeados para tablets
        'tablet': '0.75rem',
        'tablet-lg': '1rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    // Plugin para utilidades de touch
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.touch-pan-x': {
          'touch-action': 'pan-x',
        },
        '.touch-pan-y': {
          'touch-action': 'pan-y',
        },
        '.touch-pinch-zoom': {
          'touch-action': 'pinch-zoom',
        },
        // Utilidades para tablets
        '.tablet-touch': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.tablet-text': {
          'font-size': '16px',
          'line-height': '1.5',
        },
        // Gradientes CECADE
        '.bg-gradient-cecade': {
          'background': 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
        },
        '.bg-gradient-cecade-light': {
          'background': 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
