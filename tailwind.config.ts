import type { Config } from 'tailwindcss'

// Design tokens extracted from Figma (MYNA — Automotive · Frontdesk)
// via get_variable_defs. Do not hardcode raw hex/px in components — use these.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  // Use class-based dark mode — prevents system dark mode from activating
  // contenthub dark: variants on components (fixes black inputs/dropdowns on dark-mode Macs)
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // bg/action/primary + text/onLightSurface/action/primary
        primary: { DEFAULT: '#1976D2', hover: '#1565C0' },
        surface: {
          DEFAULT: '#ffffff',       // bg/primary/0
          l2: '#f0f1f5',            // L2 nav panel background
          shell: '#e0e5eb',         // page/gutter/L1/topbar chrome
          hover: '#f2f4f7',         // bg/primary/hover (hover states)
          selected: '#e5e9f0',      // New/Selected · bg/primary/Selected
          subtle: '#f7f7f7',        // neutral light grey (no blue cast) — section header bands
          muted: '#fafafa',         // secondary surface — settings section cards
          'selected-l1': '#c7d6f6', // New/Selected (L1)
        },
        accent: {
          DEFAULT: 'var(--accent)',           // bg-accent (contenthub components)
          foreground: 'var(--accent-foreground)',
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
          strong: '#cccccc', // slightly darker divider (dashed card dividers, hover borders)
          selected: '#e5e9f0', // Selected - NEW
          'chart-btn': '#cccccc', // chart card action button stroke
          input: '#e5e9f0', // text field / select / dropdown border
        },
        text: {
          primary: '#0d0d12', // text/onLightSurface/Primary (Birdeye brand near-black)
          secondary: '#717182', // text/onLightSurface/Secondary
          tertiary: '#9ca3af', // text/onLightSurface/Tertiary
          muted: '#8F8F8F', // L1 rail section headers (Marketing / Operations / Customer experience)
          action: '#1976D2', // text/onLightSurface/action/primary
          icon: '#303030', // icon/primary/default
        },
        chip: {
          warning: { bg: '#fef3d6', text: '#c69204' }, // Yellow/40 · critical
          success: { bg: '#f1faf0', text: '#377e2c' }, // Green/20 · positive
          danger: { bg: '#fef6f5', text: '#de1b0c' }, // Red/10 · negative
          neutral: { bg: '#eaeaea', text: '#555555' }, // Gray/40 · Gray/300
          info: { bg: '#e8f1fc', text: '#1976d2' }, // Blue/10 · informational (matches text/action primary)
        },
        rating: {
          star: '#F2C052', // filled review star
          empty: '#B9BCC0', // empty / unfilled review star
        },
        tooltip: { DEFAULT: '#252525' }, // Gray/800 — Tooltip / Web (Aero DS, node 2180:72)
        // ── Contenthub 2.0 shadcn tokens (for copied contenthub UI components) ──
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card:        { DEFAULT: 'var(--card)',    foreground: 'var(--card-foreground)'    },
        popover:     { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        secondary:   { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted:       { DEFAULT: 'var(--muted)',   foreground: 'var(--muted-foreground)'   },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        ring:        'var(--ring)',
        input:       'var(--input)',
        // primary.foreground (contenthub buttons etc.) — extends existing primary token
        'primary-foreground': 'var(--primary-foreground)',
        // App-shell tokens — used by L2NavLayout and contenthub layout constants
        'app-shell': {
          border:            'var(--app-shell-border)',
          gutter:            'var(--app-shell-gutter)',
          rail:              'var(--app-shell-rail)',
          'l1-nav-highlight':'var(--app-shell-l1-nav-highlight)',
          'l1-nav-pressed':  'var(--app-shell-l1-nav-pressed)',
          'l2-surface':      'var(--app-shell-l2-surface)',
          main:              'var(--app-shell-main)',
          'l2-row-hover':    'var(--app-shell-l2-row-hover)',
          'l2-row-active':   'var(--app-shell-l2-row-active)',
          'l2-content-muted':'var(--app-shell-l2-content-muted)',
        },
        // Sidebar tokens (used by contenthub nav components)
        sidebar: {
          DEFAULT:            'var(--sidebar)',
          foreground:         'var(--sidebar-foreground)',
          primary:            'var(--sidebar-primary)',
          'primary-foreground':'var(--sidebar-primary-foreground)',
          accent:             'var(--sidebar-accent)',
          'accent-foreground':'var(--sidebar-accent-foreground)',
          border:             'var(--sidebar-border)',
          ring:               'var(--sidebar-ring)',
        },
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
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Web & Mobile Android type ramp
        small: ['12px', { lineHeight: '18px', letterSpacing: '-0.24px' }], // Small Body
        body: ['14px', { lineHeight: '20px', letterSpacing: '-0.28px' }], // Body 2
        h3: ['18px', { lineHeight: '26px', letterSpacing: '-0.36px' }], // Heading 3
        display: ['24px', { lineHeight: '32px', letterSpacing: '0' }], // Display
      },
      // Remap font-weight utilities to CSS variables so Tailwind v3 output matches
      // contenthub 2.0's Tailwind v4 design (semibold=400, bold=500, etc.)
      fontWeight: {
        thin:       'var(--font-weight-thin, 300)',
        extralight: 'var(--font-weight-extralight, 300)',
        light:      'var(--font-weight-light, 300)',
        normal:     'var(--font-weight-normal, 300)',
        medium:     'var(--font-weight-medium, 400)',
        semibold:   'var(--font-weight-semibold, 400)',
        bold:       'var(--font-weight-bold, 500)',
        extrabold:  'var(--font-weight-extrabold, 600)',
        black:      'var(--font-weight-black, 700)',
      },
    },
  },
  safelist: ['bg-ai-summary', 'border-ai-summary-border', 'ai-summary-panel'],
  plugins: [],
} satisfies Config
