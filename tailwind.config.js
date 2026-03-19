/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0a0e1a',
        surface: '#111827',
        'surface-2': '#1a2236',
        'surface-3': '#232d45',
        border: '#1e2d4a',
        'border-bright': '#2a3f6a',
        // Neon accent palette
        'neon-blue': '#38bdf8',
        'neon-blue-bright': '#7dd3fc',
        'neon-orange': '#fb923c',
        'neon-orange-bright': '#fdb976',
        'neon-green': '#4ade80',
        'neon-green-bright': '#86efac',
        'neon-red': '#f87171',
        'neon-red-bright': '#fca5a5',
        'neon-purple': '#a78bfa',
        'neon-cyan': '#22d3ee',
        // Text
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(56, 189, 248, 0.35), 0 0 60px rgba(56, 189, 248, 0.15)',
        'neon-orange': '0 0 20px rgba(251, 146, 60, 0.35), 0 0 60px rgba(251, 146, 60, 0.15)',
        'neon-green': '0 0 20px rgba(74, 222, 128, 0.35), 0 0 60px rgba(74, 222, 128, 0.15)',
        'neon-red': '0 0 20px rgba(248, 113, 113, 0.35), 0 0 60px rgba(248, 113, 113, 0.15)',
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.6' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
