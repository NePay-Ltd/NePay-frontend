import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{ts,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                violet: {
                    "050": "#FAF8FF",
                    "100": "#F2EEFF",
                    "300": "#C5AAFF",
                    "400": "#9D6FF5",
                    "500": "#7C3AED",
                    "600": "#6C2FF2",
                    "700": "#4C00B4",
                    "800": "#3A00A8",
                    "950": "var(--color-violet-950)",
                },
                gray: {
                    50: "var(--color-gray-50)",
                    100: "var(--color-gray-100)",
                },
                green: {
                    "500": "#00B074",
                },
                red: {
                    "500": "#E53935",
                },
                amber: {
                    "500": "#F59E0B",
                },
                // Solid `white` stays the theme token (#ffffff light, #121212 dark). A faded one - bg-white/10,
                // border-white/20, text-white/70 - is translucent REAL white, which is what it is always written to mean
                // (overlays on gradients and dark surfaces). As a bare var() colour Tailwind silently generated NOTHING for
                // any of the faded forms, so ~120 of them across the app never rendered. Tailwind passes a
                // `var(--tw-*-opacity)` for the solid class and a number for /NN, which is how the two are told apart.
                // opacityValue can arrive as a string OR a number (some utilities pass numbers), so it is
                // normalised to a string before being inspected - a bare .startsWith() crashed `next build`.
                white: (({ opacityValue }: { opacityValue?: string | number }) => {
                    const value = opacityValue === undefined || opacityValue === null ? undefined : String(opacityValue);
                    return value === undefined || value.startsWith("var(")
                        ? "var(--color-white)"
                        : `rgb(255 255 255 / ${value})`;
                }) as unknown as string,
                trueWhite: "#ffffff",
                ink: "var(--color-ink)",
                body: "var(--color-body)",
                muted: "var(--color-muted)",
                border: "var(--color-border)",
                bg: "var(--color-bg)",
                marketing: {
                    bg: "var(--marketing-bg)",
                    surface: "var(--marketing-surface)",
                    text: "var(--marketing-text)",
                    secondary: "var(--marketing-secondary)",
                    border: "var(--marketing-border)",
                },
            },
            fontFamily: {
                sans: ["NairaFix", "var(--font-sans)", "system-ui", "sans-serif"],
                heading: ["NairaFix", "var(--font-heading)", "system-ui", "sans-serif"],
                mono: ["NairaFix", "ui-monospace", "monospace"],
            },
            borderRadius: {
                sm: "var(--r-sm)",
                DEFAULT: "var(--r)",
                lg: "var(--r-lg)",
            },
            boxShadow: {
                sm: "0 2px 8px rgba(76,0,180,.04)",
                md: "0 8px 24px rgba(76,0,180,.08)",
                lg: "0 16px 40px rgba(76,0,180,.12)",
                xl: "0 24px 64px rgba(76,0,180,.16)",
            },
            backgroundImage: {
                "brand-gradient": "linear-gradient(135deg, #4C00B4 0%, #7C3AED 100%)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "slide-in-left": {
                    from: { transform: "translateX(-100%)" },
                    to: { transform: "translateX(0)" },
                },
                marquee: {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-50%)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.2s ease-out",
                "slide-in-left": "slide-in-left 0.25s ease-out",
                marquee: "marquee 15s linear infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;