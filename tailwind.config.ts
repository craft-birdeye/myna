import type { Config } from 'tailwindcss'

// Design tokens extracted from Figma (MYNA — Automotive · Frontdesk)
// via get_variable_defs. Do not hardcode raw hex/px in components — use these.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // bg/action/primary + text/onLightSurface/action/primary
        primary: { DEFAULT: '#1976d2', hover: '#1565c0' },
        surface: {
          DEFAULT: '#ffffff', // bg/primary/0
          l2: '#fafafa', // New/L2 BG
          hover: '#f2f4f7', // bg/primary/hover
          selected: '#e5e9f0', // New/Selected · bg/primary/Selected
          'selected-l1': '#c7d6f6', // New/Selected (L1)
        },
        accent: {
          positive: '#4cae3d', // bg/accent/dark/positive
        },
        ai: {
          brand: '#6834b7', // BirdAI icon / accent purple
          summary: '#F9F7FD', // AI summary panel background
          'summary-border': '#B090E0', // AI summary panel border
        },
        control: {
          border: '#9e9e9e', // unchecked checkbox border
          disabled: '#bdbdbd', // locked/disabled checkbox fill
        },
        border: {
          DEFAULT: '#e5e9f0', // borders/primary/1
          selected: '#e5e9f0', // Selected - NEW
          'chart-btn': '#cccccc', // chart card action button stroke
          input: '#e5e9f0', // text field / select / dropdown border
        },
        text: {
          primary: '#212121', // text/onLightSurface/Primary
          secondary: '#555555', // text/onLightSurface/Secondary
          tertiary: '#8f8f8f', // text/onLightSurface/Tertiary
          action: '#1976d2', // text/onLightSurface/action/primary
          icon: '#303030', // icon/primary/default
        },
        chip: {
          warning: { bg: '#fef3d6', text: '#c69204' }, // Yellow/40 · critical
          success: { bg: '#f1faf0', text: '#377e2c' }, // Green/20 · positive
          danger: { bg: '#fef6f5', text: '#de1b0c' }, // Red/10 · negative
          neutral: { bg: '#eaeaea', text: '#555555' }, // Gray/40 · Gray/300
        },
        tooltip: { DEFAULT: '#252525' }, // Gray/800 — Tooltip / Web (Aero DS, node 2180:72)
      },
      spacing: {
        xs: '4px', // Spacing/xs
        sm: '8px', // Spacing/sm
        md: '12px', // Spacing/md (default)
        lg: '16px', // Spacing/lg
        xl: '20px', // Spacing/xl
        '2xl': '24px', // Spacing/2xl
        '3xl': '32px', // Spacing/3xl — section rhythm
        '4xl': '40px', // Spacing/4xl — page section gaps
      },
      borderRadius: {
        sm: '4px', // Corner Radius/sm (Default-Web)
        md: '8px', // Corner Radius/md (Default-Mobile)
        lg: '12px', // Corner Radius/lg
        xl: '16px', // Corner Radius/xl
        full: '9999px',
      },
      boxShadow: {
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
        modal: '0 8px 40px rgba(0,0,0,0.22)',
        tooltip: '0px 4px 8px rgba(33,33,33,0.18)', // Shadow/sm — Tooltip / Web (Aero DS, node 2180:72)
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      fontSize: {
        // Web & Mobile Android type ramp
        small: ['12px', { lineHeight: '18px', letterSpacing: '-0.24px' }], // Small Body
        body: ['14px', { lineHeight: '20px', letterSpacing: '-0.28px' }], // Body 2
        h3: ['18px', { lineHeight: '26px', letterSpacing: '-0.36px' }], // Heading 3
        display: ['24px', { lineHeight: '32px', letterSpacing: '0' }], // Display
      },
    },
  },
  safelist: ['bg-ai-summary', 'border-ai-summary-border', 'ai-summary-panel'],
  plugins: [],
} satisfies Config
