/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Backgrounds
        'paper': '#FAF7F2',
        'cloud': '#FFFFFF',
        'sand': '#EFE9DE',

        // Greens (primary brand)
        'evergreen': '#4F7F72',
        'evergreen-hover': '#6F9F92',
        'meadow': '#7FB3A2',
        'mint': '#BFDCD0',

        // Blues (links, wayfinding)
        'trail': '#4F86A8',
        'trail-hover': '#6FA2C0',
        'lake': '#8DB9D6',
        'mist': '#D6E8F3',

        // Reds (emphasis, fun)
        'cairn': '#C7655B',
        'cairn-hover': '#D9867D',
        'peach': '#E4A39A',

        // Neutrals (text, structure)
        'ink': '#2E2E2B',
        'drift': '#6F7470',
        'fog': '#D4D1C8',
      },
    },
  },
  plugins: [],
}
