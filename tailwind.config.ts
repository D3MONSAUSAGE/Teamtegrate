
import type { Config } from "tailwindcss";

export default {
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
      padding: '2rem',
      screens: {
        '2xl': '1400px',
        '3xl': '1600px'
      }
    },
    extend: {
      screens: {
        '3xl': '1600px',
      },
      transitionDuration: {
        400: "400ms"
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        dashboard: {
          bg: 'hsl(var(--dashboard-bg))',
          card: 'hsl(var(--dashboard-card))',
          'card-hover': 'hsl(var(--dashboard-card-hover))',
          accent: 'hsl(var(--dashboard-accent))',
          'accent-light': 'hsl(var(--dashboard-accent-light))',
          warning: 'hsl(var(--dashboard-warning))',
          info: 'hsl(var(--dashboard-info))',
          success: 'hsl(var(--dashboard-success))'
        },
        priority: {
          low: '#34d399',      // emerald-400
          medium: '#bef264',   // lime-300
          high: '#F44336'
        },
        status: {
          todo: '#9CA3AF',       // gray-400
          inprogress: '#FACC15', // amber-400
          pending: '#FDE68A',    // yellow-300
          completed: '#6EE7B7'   // emerald-300
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'base': 'var(--shadow-base)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow': 'var(--shadow-glow)'
      },
      backgroundImage: {
        'dashboard-gradient': 'linear-gradient(135deg, hsl(var(--dashboard-gradient-start)), hsl(var(--dashboard-gradient-end)))',
        'card-gradient': 'linear-gradient(145deg, hsl(var(--dashboard-card)), hsl(var(--dashboard-card-hover)))'
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-out': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(16px)' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'scale-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' }
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.35s cubic-bezier(0.33,1,0.68,1)',
        'fade-out': 'fade-out 0.35s cubic-bezier(0.33,1,0.68,1)',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.4,0,0.2,1)',
        'scale-out': 'scale-out 0.18s cubic-bezier(0.4,0,0.2,1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.33,1,0.68,1)',
        'slide-out-right': 'slide-out-right 0.3s cubic-bezier(0.33,1,0.68,1)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
