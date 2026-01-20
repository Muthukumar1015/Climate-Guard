/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'climate': {
          'heat': '#ef4444',
          'heat-light': '#fecaca',
          'flood': '#3b82f6',
          'flood-light': '#bfdbfe',
          'air': '#8b5cf6',
          'air-light': '#ddd6fe',
          'water': '#06b6d4',
          'water-light': '#cffafe',
        },
        'alert': {
          'green': '#22c55e',
          'yellow': '#eab308',
          'orange': '#f97316',
          'red': '#dc2626',
        }
      }
    },
  },
  plugins: [],
};
