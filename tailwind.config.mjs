/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	// Enable class-based dark mode
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				'prestige-blue': '#1089ff',      // Primary brand blue (from Express app)
				'prestige-green': '#01d28e',     // Brand accent (logo "Rentals" highlight)
				'prestige-orange': '#F96D00',    // Loader/accent color
				'prestige-dark': '#212529',      // Dark text and backgrounds
				'prestige-gray': '#6c757d',      // Secondary/muted text
			},
			fontFamily: {
				'poppins': ['Poppins', 'sans-serif'],
				'playfair': ['Playfair Display', 'serif'],
			},
		},
	},
	plugins: [],
}