
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        dashboard: {
          bg: "hsl(var(--dashboard-bg))",
          card: "hsl(var(--dashboard-card))",
          "card-hover": "hsl(var(--dashboard-card-hover))",
          border: "hsl(var(--dashboard-border))",
          primary: "hsl(var(--dashboard-primary))",
          "primary-dark": "hsl(var(--dashboard-primary-dark))",
          "primary-foreground": "hsl(var(--dashboard-primary-foreground))",
          success: "hsl(var(--dashboard-success))",
          "success-hover": "hsl(var(--dashboard-success-hover))",
          "success-foreground": "hsl(var(--dashboard-success-foreground))",
          teal: "hsl(var(--dashboard-teal))",
          purple: "hsl(var(--dashboard-purple))",
          "gray-50": "hsl(var(--dashboard-gray-50))",
          "gray-100": "hsl(var(--dashboard-gray-100))",
          "gray-600": "hsl(var(--dashboard-gray-600))",
          "gray-900": "hsl(var(--dashboard-gray-900))",
          error: "hsl(var(--dashboard-error))",
        },
      },
      backgroundImage: {
        "dashboard-gradient": "var(--dashboard-gradient)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
