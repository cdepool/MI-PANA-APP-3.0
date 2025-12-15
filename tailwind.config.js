/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                mipana: {
                    // Azules - Del logo oficial
                    'lightBlue': '#0B9BD9',
                    'mediumBlue': '#0077B6',
                    'darkBlue': '#003D5B',
                    'deepBlue': '#002A3D',
                    // Naranja - Del logo oficial
                    'orange': '#F2620F',
                    'orangeHover': '#E55A0E',
                    // Acento
                    'accent': '#FFD700',
                    // Neutros
                    'lightGray': '#F5F5F5',
                    'gray': '#E0E0E0',
                    'black': '#1A1A1A',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
            },
            animation: {
                'slide-up': 'slide-up 0.3s ease-out',
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                'fade-in': 'fade-in 0.3s ease-out',
                'bounce-in': 'bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            },
            keyframes: {
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in-right': {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'bounce-in': {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '50%': { transform: 'scale(1.02)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
}
