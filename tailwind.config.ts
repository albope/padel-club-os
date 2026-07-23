import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Identidad «Marcador»: definidos solo bajo .theme-marcador (globals.css)
        "surface-raised": "hsl(var(--surface-raised))",
        "border-strong": "hsl(var(--border-strong))",
        info: {
          DEFAULT: "hsl(var(--status-info-fg))",
          bg: "hsl(var(--status-info-bg))",
          border: "hsl(var(--status-info-border))",
          foreground: "hsl(var(--status-info-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--status-success-fg))",
          bg: "hsl(var(--status-success-bg))",
          border: "hsl(var(--status-success-border))",
          foreground: "hsl(var(--status-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--status-warning-fg))",
          bg: "hsl(var(--status-warning-bg))",
          border: "hsl(var(--status-warning-border))",
          foreground: "hsl(var(--status-warning-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--status-error-fg))",
          bg: "hsl(var(--status-error-bg))",
          border: "hsl(var(--status-error-border))",
          foreground: "hsl(var(--status-error-foreground))",
        },
        dataviz: {
          "1": "hsl(var(--dataviz-1))",
          "2": "hsl(var(--dataviz-2))",
          "3": "hsl(var(--dataviz-3))",
          "4": "hsl(var(--dataviz-4))",
          "5": "hsl(var(--dataviz-5))",
          "6": "hsl(var(--dataviz-6))",
        },
      },
      borderWidth: {
        '3': '3px',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "landing-fade-up": {
          from: { opacity: "0", transform: "translateY(32px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "landing-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "landing-fade-up": "landing-fade-up 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards",
        "landing-float": "landing-float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
