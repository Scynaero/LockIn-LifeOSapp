/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: '#000000',
                surface: '#121212',
                surfaceHighlight: '#1E1E1E',
                primary: '#FFFFFF',
                secondary: '#A1A1AA',
                success: '#4ADE80',
                error: '#EF4444',
            },
        },
    },
    plugins: [],
}
