
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
          border: 'hsl(var(--dashboard-border))',
          
          // Primary blue theme
          primary: 'hsl(var(--dashboard-primary))',
          'primary-light': 'hsl(var(--dashboard-primary-light))',
          'primary-dark': 'hsl(var(--dashboard-primary-dark))',
          'primary-foreground': 'hsl(var(--dashboard-primary-foreground))',
          
          // Teal accent
          teal: 'hsl(var(--dashboard-teal))',
          'teal-light': 'hsl(var(--dashboard-teal-light))',
          'teal-dark': 'hsl(var(--dashboard-teal-dark))',
          'teal-foreground': 'hsl(var(--dashboard-teal-foreground))',
          
          // Purple highlight
          purple: 'hsl(var(--dashboard-purple))',
          'purple-light': 'hsl(var(--dashboard-purple-light))',
          'purple-dark': 'hsl(var(--dashboard-purple-dark))',
          'purple-foreground': 'hsl(var(--dashboard-purple-foreground))',
          
          // Status colors
          success: 'hsl(var(--dashboard-success))',
          'success-light': 'hsl(var(--dashboard-success-light))',
          warning: 'hsl(var(--dashboard-warning))',
          'warning-light': 'hsl(var(--dashboard-warning-light))',
          error: 'hsl(var(--dashboard-error))',
          'error-light': 'hsl(var(--dashboard-error-light))',
          
          // Neutral grays
          'gray-50': 'hsl(var(--dashboard-gray-50))',
          'gray-100': 'hsl(var(--dashboard-gray-100))',
          'gray-200': 'hsl(var(--dashboard-gray-200))',
          'gray-300': 'hsl(var(--dashboard-gray-300))',
          'gray-400': 'hsl(var(--dashboard-gray-400))',
          'gray-500': 'hsl(var(--dashboard-gray-500))',
          'gray-600': 'hsl(var(--dashboard-gray-600))',
          'gray-700': 'hsl(var(--dashboard-gray-700))',
          'gray-800': 'hsl(var(--dashboard-gray-800))',
          'gray-900': 'hsl(var(--dashboard-gray-900))',
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
        'sm': 'var(--dashboard-shadow-sm)',
        'base': 'var(--dashboard-shadow-base)',
        'md': 'var(--dashboard-shadow-md)',
        'lg': 'var(--dashboard-shadow-lg)',
        'xl': 'var(--dashboard-shadow-xl)',
        'glow': 'var(--dashboard-shadow-glow)'
      },
      backgroundImage: {
        'dashboard-gradient-primary': 'var(--dashboard-gradient-primary)',
        'dashboard-gradient-secondary': 'var(--dashboard-gradient-secondary)',
        'dashboard-gradient-success': 'var(--dashboard-gradient-success)',
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
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: 'var(--dashboard-shadow-glow)' },
          '50%': { boxShadow: 'var(--dashboard-shadow-base)' }
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
        'slide-out-right': 'slide-out-right 0.3s cubic-bezier(0.33,1,0.68,1)',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
