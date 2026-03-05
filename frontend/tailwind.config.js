/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0f172a",
                "primary-light": "#1e293b",
                accent: "#3b82f6",
                "accent-hover": "#2563eb",
                bg: "#f8fafc",
                danger: "#ef4444",
                success: "#10b981",
                warning: "#f59e0b",
            },
        },
    },
    plugins: [],
}
