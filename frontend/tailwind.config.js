/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          950: '#08080B',
          900: '#0B0B0F',
          800: '#121218',
          700: '#15151B',
          600: '#1C1C24',
          500: '#24242E',
        },
        ink: {
          950: '#FAFAFA',
          900: '#F5F4F7',
          800: '#D4D3DC',
          700: '#9A9AA8',
          600: '#6E6E7C',
          500: '#4A4A56',
        },
        violet: {
          300: '#C4B8FF',
          400: '#A594F9',
          500: '#8B7FE8',
          600: '#6E5FD4',
          700: '#564AB0',
        },
        glow: {
          lavender: '#E8DFFF',
          mint: '#B8F5D8',
          amber: '#FFE3B3',
          rose: '#FFC9D9',
        },
        line: {
          subtle: 'rgba(255,255,255,0.06)',
          medium: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        paper: {
          50: '#FDFCFB',
          100: '#F7F5F2',
          200: '#EDEAE5',
          300: '#DEDAD2',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      animation: {
        'reveal': 'reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'reveal-stagger': 'reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'waveform': 'waveform 1.2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
    },
  },
  plugins: [],
}
