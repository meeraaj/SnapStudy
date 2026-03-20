import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#f0f7ff",
                    100: "#e0efff",
                    200: "#b9dfff",
                    300: "#7cc8ff",
                    400: "#36aeff",
                    500: "#0c93f0",
                    600: "#0074cd",
                    700: "#005ca6",
                    800: "#024f89",
                    900: "#084271",
                    950: "#062a4b",
                },
            },
        },
    },
    plugins: [require("@tailwindcss/typography")],
};

export default config;
