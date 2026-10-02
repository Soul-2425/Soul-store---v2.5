import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Ferrari Red Dominante
        ferrari: {
          500: "#ff1a1a",
          600: "#e60000",
          700: "#d61a1a",
          800: "#b30000",
          900: "#800000",
        },
        // Amarillo Pollito
        pollito: {
          300: "#fff973",
          400: "#fff442",
          500: "#fff01f",
          600: "#ffe600",
          700: "#ffcc00",
        },
        // Rosado Urbano
        rosadoUrbano: {
          400: "#ff4da6",
          500: "#ff007f",
          600: "#e60072",
          700: "#cc0066",
        },
        // Negro y Secundarios
        obsidian: {
          800: "#141721",
          900: "#0b0d13",
          950: "#06070a",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glowRed: "0 0 25px -3px rgba(214, 26, 26, 0.45)",
        glowPollito: "0 0 25px -3px rgba(255, 240, 31, 0.55)",
        glowRosado: "0 0 20px 0px rgba(255, 0, 127, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
