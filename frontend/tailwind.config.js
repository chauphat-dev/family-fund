/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-sidebar': 'var(--bg-sidebar)',
        'bg-card': 'var(--bg-card)',
        'accent-emerald': 'var(--accent-emerald)',
        'accent-purple': 'var(--accent-purple)',
        'accent-amber': 'var(--accent-amber)',
        'accent-rose': 'var(--accent-rose)',
        'accent-blue': 'var(--accent-blue)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'border-light': 'var(--border-light)',
      }
    },
  },
  plugins: [],
}
