/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#faf8ff',
          100: '#f3f0ff',
          200: '#e9e3ff',
          300: '#d8ccff',
          400: '#c3b0ff',
          500: '#a88dff',
          600: '#8b6aed',
          700: '#7350d4',
          800: '#5d3fb0',
          900: '#4d3492',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-scale': 'fadeInScale 0.3s ease-out forwards',
        'slide-in': 'slideInRight 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(115, 93, 200, 0.06)',
        'soft-md': '0 8px 24px rgba(115, 93, 200, 0.08)',
        'soft-lg': '0 16px 48px rgba(115, 93, 200, 0.12)',
        'soft-xl': '0 24px 64px rgba(115, 93, 200, 0.16)',
      },
    },
  },
  plugins: [],
}
