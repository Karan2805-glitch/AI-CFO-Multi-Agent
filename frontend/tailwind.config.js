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
        'bg-primary': '#070B14',
        'bg-secondary': '#0D1526',
        'bg-card': 'rgba(13, 21, 38, 0.7)',
        'border-subtle': 'rgba(255,255,255,0.07)',
        'accent-blue': '#3B82F6',
        'accent-purple': '#8B5CF6',
        'accent-green': '#10B981',
        'accent-red': '#F43F5E',
        'accent-amber': '#F59E0B',
        'accent-teal': '#14B8A6',
        'text-primary': '#F1F5F9',
        'text-muted': '#64748B',
        'text-subtle': '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-up':  'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':   'fade-in 0.4s ease forwards',
        'count-up':  'count-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'shimmer':   'shimmer 2.5s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer-bg': 'linear-gradient(90deg,transparent 20%,rgba(255,255,255,0.06) 50%,transparent 80%)',
      },
    },
  },
  plugins: [],
}
