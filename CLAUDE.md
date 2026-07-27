# CLAUDE.md — Figma-to-Prototype Playbook

This file is read by Claude Code at the start of every session. Follow every instruction here exactly. Do not skip sections. Do not deviate from the rules unless the user explicitly overrides them in the prompt.

---

## 1. Project Overview

This project is an **interactive UI prototype** built from Figma designs.

- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS (config-driven tokens only — never hardcode hex or px values)
- **Icons:** Lucide React
- **Package manager:** npm
- **Entry point:** `src/main.tsx`
- **Component directory:** `src/components/`
- **Screen/page directory:** `src/screens/`
- **Assets directory:** `src/assets/`

---

## 2. Figma MCP Setup

The Figma MCP server is connected. Use it before building any screen or component.

### How to use it

1. Get the Figma node URL by right-clicking any frame/component in Figma → **Copy link to selection**
2. Paste it in your prompt to Claude
3. Claude will call `get_design_context` and `get_screenshot` automatically to extract layout, spacing, colors, and component specs before writing any code

### Rules
- **Always fetch Figma context before writing a new screen or component.** Never guess layout from a description alone.
- If the Figma link is unavailable, ask the user to paste CSS specs or a screenshot before proceeding.
- Use `get_variable_defs` when building the first component to extract design tokens into `tailwind.config.ts`.

---

## 3. Folder Structure

```
/
├── CLAUDE.md                  ← You are here. The source of truth.
├── .mcp.json                  ← Figma MCP config
├── tailwind.config.ts         ← Design tokens (colors, spacing, fonts)
├── src/
│   ├── main.tsx
│   ├── App.tsx                ← Router root
│   ├── components/            ← Reusable components (shared across screens)
│   │   ├── index.ts           ← Barrel export — ALL components exported here
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx
│   │   │   └── DataTable.types.ts
│   │   ├── Tabs/
│   │   │   ├── Tabs.tsx
│   │   │   └── Tabs.types.ts
│   │   └── ... (more as built)
│   ├── screens/               ← Full page/screen compositions
│   │   └── ...
│   ├── hooks/                 ← Custom React hooks
│   ├── types/                 ← Shared TypeScript types
│   └── assets/                ← SVGs, images from Figma exports
```

---

## 4. Design Tokens

All tokens live in `tailwind.config.ts`. **Never use raw color hex or hardcoded spacing values in component code.** Use Tailwind utility classes that map to these tokens.

Example structure (update with actual Figma variable values when extracted):

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#4F46E5', hover: '#4338CA' },
        secondary: { DEFAULT: '#6B7280' },
        surface:   { DEFAULT: '#FFFFFF', muted: '#F9FAFB', subtle: '#F3F4F6' },
        border:    { DEFAULT: '#E5E7EB', strong: '#D1D5DB' },
        text:      { primary: '#111827', secondary: '#6B7280', muted: '#9CA3AF' },
        danger:    { DEFAULT: '#EF4444' },
        success:   { DEFAULT: '#10B981' },
        warning:   { DEFAULT: '#F59E0B' },
      },
      spacing: {
        xs:  '4px',
        sm:  '8px',
        md:  '16px',
        lg:  '24px',
        xl:  '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs:   ['12px', { lineHeight: '16px' }],
        sm:   ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg:   ['18px', { lineHeight: '28px' }],
        xl:   ['20px', { lineHeight: '28px' }],
        '2xl':['24px', { lineHeight: '32px' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
        modal: '0 8px 32px rgba(0,0,0,0.16)',
      },
    },
  },
}
```

When Figma variables are extracted via MCP, update this file first before writing any component code.

---

## 5. Component Registry

**This is the most important section. Before writing any new component, check this list.**

If a component exists here, import it — do not recreate it.

| Component | Path | Props Summary |
|-----------|------|---------------|
| Chip        | components/Chip/Chip.tsx               | label, variant?='warning'                                          |
| ChatBubble / ChatSystemLabel | components/ChatBubble/ChatBubble.tsx | `ChatBubble`: sender='business'\|'user', text, children?, className?, showFeedback?, feedback?, onFeedbackChange? — chat-thread message bubble (business right-aligned blue `bg-[#dbeafe]`, user left-aligned gray `bg-[#f0f0f0]`, `rounded-lg`, meta content passed as children below the bubble). When `showFeedback`, thumbs up/down sit beside the meta row (mutually exclusive; click again to clear). Inbox thumbs-down opens `ShareFeedbackModal` before committing. `ChatSystemLabel`: text — centered gray system/status line (e.g. "Conversation started"). Shared by `InboxScreen` and `LogDetailsPanel`'s call transcript — reuse this instead of hand-rolling bubble markup |
| ShareFeedbackModal | components/ShareFeedbackModal/ShareFeedbackModal.tsx | open, onClose, onSubmit(details) — centered "Share feedback" modal (required Add details textarea; Cancel / Submit feedback); used after inbox thumbs-down |
| HeaderSearchField | components/HeaderSearchField/HeaderSearchField.tsx | open, value, onOpenChange, onChange, placeholder?='Search' — canonical page-header search: collapsed 36px icon button, expands to 224px input with a trailing ✕ clear button that clears + collapses. Screen owns the `searchOpen`/`searchQuery` state and its own filtering logic |
| Icon        | components/Icon/Icon.tsx               | name (Material Symbol), size?, fill?, weight?, className?           |
| Tooltip     | components/Tooltip/Tooltip.tsx         | content, variant?='detail'\|'brief', children (trigger), className? — hover tooltip per Aero DS "Tooltip / Web" (Figma `xecPAre4cKkeXEdvTig1oI`, node 2180:72): dark `bg-tooltip` (#252525), white `text-small`, `rounded-sm`, `shadow-tooltip`. `brief` = short phrase (`max-w-[140px]`), `detail` = explanatory text (`max-w-[280px]`, prefer ≤2 lines) |
| InfoTooltip | components/InfoTooltip/InfoTooltip.tsx | text, variant?='detail'\|'brief' — info-icon button wrapping `Tooltip`; use this (not a hand-rolled hover panel) whenever a label/title needs an explanatory "ⓘ" hint |
| IconRail    | components/IconRail/IconRail.tsx       | logoSrc, brand, groups[] (header?, items[]), activeId, onSelect? — collapsed 56px, expands to 262px on hover |
| SideNav     | components/SideNav/SideNav.tsx         | title, sections[], activeId, onSelect?                              |
| TopNav      | components/TopNav/TopNav.tsx           | avatarUrl?, initials?, onAdd?, onHelp?, onMenu?                     |
| PageHeader  | components/PageHeader/PageHeader.tsx   | date, providerLabel?, view?, onPrev?, onNext?, onToday?, onViewChange?, onFilter? |
| MetricTiles | components/MetricTiles/MetricTiles.tsx | metrics[] ({ id, value, label })                                   |
| Tabs        | components/Tabs/Tabs.tsx               | tabs[], activeTab, onChange                                         |
| DataTable   | components/DataTable/DataTable.tsx     | columns[] (width?, sortable?, resizable?, render?), data, loading?, onRowClick?, rowAction? (icon,label,onClick), rowMenuItems? — built-in resize + sort + row-hover CTAs (page CTA + 3-dots menu) |
| FormDrawer | components/FormDrawer/FormDrawer.tsx | open, title, fields[] (key,label,type 'text'\|'select',options?), submitLabel, requiredKeys?, initialValues?, onClose, onSubmit — generic 650px right form drawer (text inputs + select dropdowns) |
| IntakeFormPreviewDrawer | components/IntakeFormPreviewDrawer/IntakeFormPreviewDrawer.tsx | open, patient (IntakePreviewPatient), onClose — 650px intake quick-view overlay (profile, AI summary, accordions) |
| SetupAppointmentDrawer | components/SetupAppointmentDrawer/SetupAppointmentDrawer.tsx | open, subject?, onClose, onOfferSlot — thin wrapper over FormDrawer (Customer rep / Appointment type / Date / Time) |
| CustomizeColumnsDrawer | components/CustomizeColumnsDrawer/CustomizeColumnsDrawer.tsx | open, options[] (key,label,locked?), visibleKeys[], onClose, onSave, onRestoreDefault |
| FilterPanel | components/FilterPanel/FilterPanel.tsx | open, fields[] (id,label,options?,multi?), onClose?, onSaveView?, onAdvancedFilters? — 280px right push-panel; opens SelectMenu per field |
| SelectMenu | components/SelectMenu/SelectMenu.tsx | options[] (value,label), value[], multi?, searchable?, onChange, onApply? — single/multi-select dropdown menu (no redundant field label inside) |
| LanguageSelectMenu | components/LanguageSelectMenu/LanguageSelectMenu.tsx | options[] (id,label,countryCode), value?/values?, multi?, onSelect?/onChange? — searchable language picker with circular flags; multi uses checkboxes; always opens below the field (LanguageFlag exported too) |
| StatusFilterDropdown | components/StatusFilterDropdown/StatusFilterDropdown.tsx | value[] (status ids), onChange, onApply — 256px calendar status filter panel (checkboxes + status icons + Apply footer); use with fixed anchor positioning |
| ChartCard | components/charts/ChartCard.tsx | title, toolbar?, showActions?, children — titled card shell for charts |
| SummaryStats | components/charts/SummaryStats.tsx | title?, stats[] ({id,value,label,delta?,trend?}) — KPI row with up/down deltas |
| StackedBarChart | components/charts/StackedBarChart.tsx | data, series[] ({key,label,color}), xKey, height? — Recharts stacked bars |
| DonutChart | components/charts/DonutChart.tsx | data[] ({name,value,color}), centerValue?, centerLabel?, height? — Recharts donut |
| SankeyChart | components/charts/SankeyChart.tsx | nodes[], links[] ({source,target,value}), height? — Recharts Sankey flow |
| Heatmap | components/charts/Heatmap.tsx | rowLabels[], colLabels[], values[][] — CSS-grid intensity heatmap |
| chartColors | components/charts/chartColors.ts | shared on-brand chart palette (import as `chartColors`) |
| InfoCard | components/InfoCard/InfoCard.tsx | title, description, actionLabel?, onAction? — library grid card; layout spec in `InfoCard.types.ts` (`INFO_CARD_LAYOUT`: 192px height, p-lg/16px padding, title line-clamp-2, description line-clamp-3, CTA fades in on hover) |
| InfoCardListItem | components/InfoCard/InfoCardListItem.tsx | title, description, actionLabel?, onAction?, first? — library list row; title text-text-primary, description line-clamp-2, three-dot menu + "Use agent" on row hover (`INFO_CARD_LIST_ITEM_LAYOUT`) |
| RefChip | components/RefChip/RefChip.tsx | kind ('tool'\|'context'\|'subagent'\|'procedure'\|'file'\|'link'), label, onRemove?, className? — reference chip that **reuses the workflow editor's `VariableChip.module.css`** (left colored swatch + divider, white body, per-type border) so procedure Tools/Context chips match the workflow variable fields. Maps kind→workflow chip type: context→variable (blue brackets), tool→Tool, file→Attachment, link→Link, subagent→Address, procedure→Product. Used inline in the Steps editor and in the Tools/Context side panels |
| ContextModal | components/ContextModal/ContextModal.tsx | open, onClose, onSave(result) — centered 1200px modal for adding LLM context: Fields (search + Business accordion with Name/Source/Sample/Anonymize/Show-in-output), Knowledge (files/links), Brand (checkbox list), Industry (toggle); Save commits enabled selections |
| CallRecordingPlayer | components/CallRecordingPlayer/CallRecordingPlayer.tsx | audioUrl?, durationSecs?, active?, title?, padded?, className? — WaveSurfer call-recording player (waveform + play/pause + speed + time); shared by inbox `VoiceChatDrawer` and `LogDetailsPanel` |
| LogDetailsPanel | components/LogDetailsPanel/LogDetailsPanel.tsx | row (HealthcareLogRow), callerNumber?, sidNumber?, languageDetected?, callEndReason?, routedVia?, summary?, transcript?, durationSecs?, audioUrl?, onViewConversation? — conversation details side panel (meta card, collapsible AI summary, call recording via `CallRecordingPlayer`, call transcript) |
| EmptyState  | components/EmptyState/EmptyState.tsx   | title, description?, className? — Aero Design System "no results" empty state (3 dashed placeholder circles + solid search-icon glyph, title + description); used by `DataTable`'s built-in zero-row fallback and as a search-miss overlay in `DayCalendar`/`WeekCalendar` |
| RecordDetailScreen | components/RecordDetailScreen/RecordDetailScreen.tsx | name, accordions[] (title,fields[],defaultOpen?), metrics[] ({value,label}), activities[] (`Activity` from `ViewActivityDrawer.types`) — full-page record detail (same visual structure as `IntakePatientDetailScreen`: left avatar+accordion card, right AI-summary banner + tabs + metric tiles + search + activity timeline). Generic, data-driven — used as the "View details" destination for Manage appointments / Review waitlist / Sales pipeline / Service requests (each screen builds its own `build*DetailProps()` mapping from its row shape) |

### How to add a component to this registry

After building a new reusable component, update the table above with:
- Component name
- Import path (relative to `src/`)
- Brief props summary (e.g., `columns, data, onRowClick`)

**Example entry after building DataTable:**
```
| DataTable   | components/DataTable/DataTable.tsx | columns, data, loading?, onRowClick? |
| Tabs        | components/Tabs/Tabs.tsx           | tabs[], activeTab, onChange          |
| PageLayout  | components/PageLayout.tsx          | title, children, breadcrumbs?        |
```

---

## 6. Component Rules

### 6.1 When to create a component
Create a component in `src/components/` when:
- It appears on more than one screen, OR
- It is complex enough (>40 lines) that the screen file becomes hard to read, OR
- It is a UI pattern that could plausibly be reused (tables, cards, modals, tabs, form fields, badges)

### 6.2 Component file structure

Every component must follow this pattern:

```tsx
// src/components/DataTable/DataTable.tsx

import { DataTableProps } from './DataTable.types'

export function DataTable({ columns, data, loading = false, onRowClick }: DataTableProps) {
  // ...
}
```

```ts
// src/components/DataTable/DataTable.types.ts

export interface Column<T> {
  key: keyof T
  label: string
  width?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
}
```

### 6.3 Barrel exports

Every component must be exported from `src/components/index.ts`:

```ts
export { DataTable } from './DataTable/DataTable'
export { Tabs } from './Tabs/Tabs'
export { PageLayout } from './PageLayout'
```

Screens import like this:
```ts
import { DataTable, Tabs, PageLayout } from '../components'
```

### 6.4 Props contract
- All props must be typed — no `any`
- Optional props must have default values or be marked with `?`
- Event handlers follow the pattern `on[Event]: (payload) => void`
- Never pass raw style objects — use Tailwind classes via `className`

### 6.5 No inline styles
```tsx
// ❌ Wrong
<div style={{ color: '#4F46E5', padding: '16px' }}>

// ✅ Correct
<div className="text-primary p-md">
```

### 6.6 Typography — REGULAR WEIGHT ONLY (hard rule)
**Never use `font-medium`, `font-semibold`, or `font-bold` anywhere.** The only weight is Roboto Regular (`font-normal`, the default — so just omit the weight class). Build visual hierarchy with **color and size tokens**, not weight: e.g. title = `text-text-primary`, supporting copy = `text-text-secondary`/`text-text-tertiary`; bump size with `text-h3`/`text-body`/`text-small`. (Some older components still contain `font-medium` — do not copy that; leave them unless asked, but never add new ones.)

### 6.7 Reuse the shared chrome — don't invent new header/button/switcher variants
Before styling any header, button, switcher, menu, or input, copy the **exact classes** already used by the Human-actions pages. Do not create a parallel look. Canonical patterns:
- **Page header bar:** `flex items-center justify-between bg-surface px-2xl py-xl` (see `PageHeader`, `SalesPipelineScreen`, `ServiceRequestsScreen`).
- **Icon button (search / customize / filter):** `flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2`, `Icon` size 20.
- **View switcher:** outer `flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm`; each button `flex size-6 items-center justify-center rounded-sm`, active `bg-surface-selected text-text-primary`, inactive `text-text-icon`, `Icon` size 18 (see `PageHeader` ViewToggle).
- **Primary CTA:** `flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover`.
- **Secondary / "Actions" button:** `flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2`.
- **Disabled primary:** `cursor-not-allowed bg-surface-selected text-text-tertiary`.
- **Text button (Cancel):** `rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover`.
- **Dropdown menu:** `min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown`; items `block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover` (danger item → `text-chip-danger-text`). Matches `DataTable`'s row menu.
- Use **`rounded-sm`** for chrome (buttons/inputs/menus) and spacing **tokens** (`gap-sm`, `px-2xl`, `py-xl`, `px-md`) — never raw `rounded-md`/`gap-1.5`/`px-4`.

### 6.8 Copy capitalization — sentence case (hard rule)
All UI copy uses **sentence case**: capitalize **only the first word** (plus proper nouns and acronyms such as AI, CRM, VIN). Applies to page titles, drawer headers, section labels, buttons, tabs, column headers, menu items, and empty states.

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| Intake Details | Intake details |
| AI Summary | AI summary |
| Quick View | Quick view |
| Appointment Date | Appointment date |

When implementing from Figma, **override Title Case** in the design to match this product rule unless the string is a single word or a proper noun.

---

## 7. Screen Rules

Screens live in `src/screens/`. A screen:
- Composes components from `src/components/`
- Contains no reusable UI logic of its own
- Is registered as a route in `src/App.tsx`
- Is named after the Figma frame (e.g., `DashboardScreen.tsx`, `SettingsScreen.tsx`)

```tsx
// src/screens/DashboardScreen.tsx
import { PageLayout, Tabs, DataTable } from '../components'

export function DashboardScreen() {
  return (
    <PageLayout title="Dashboard">
      <Tabs ... />
      <DataTable ... />
    </PageLayout>
  )
}
```

---

## 8. Workflow: Building a New Screen

Follow these steps every time. Do not skip.

### Step 1 — Fetch Figma context
```
"Here is the Figma frame for [Screen Name]: [paste Figma node URL]
Fetch the design context and screenshot before writing any code."
```

### Step 2 — Audit the component registry
Before writing code, scan Section 5 (Component Registry) above.
- List which components from the registry this screen needs
- List which new components will need to be created

### Step 3 — Build missing components first
Build each new reusable component in isolation in `src/components/`.
Match the Figma design exactly: spacing, color tokens, font sizes, border radius.

For each new component:
1. Create `ComponentName.tsx` and `ComponentName.types.ts` in a named folder
2. Export from `src/components/index.ts`
3. **Add to the Component Registry table in Section 5 of this file**

### Step 4 — Compose the screen
Once all components exist, compose them in `src/screens/[ScreenName].tsx`.

### Step 5 — Register the route
Add the screen to `src/App.tsx` router.

### Step 6 — Verify
Run `npm run dev` and compare the rendered screen against the Figma screenshot side by side.

---

## 9. Tabs + Table Pattern (Reference Implementation)

This is the canonical pattern for any screen with tabs and a data table. Always follow this structure.

### Tabs component
```tsx
// src/components/Tabs/Tabs.tsx
import { TabsProps } from './Tabs.types'

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-border flex gap-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            px-md py-sm text-sm font-medium border-b-2 -mb-px transition-colors
            ${activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-sm text-xs bg-surface-subtle text-text-secondary rounded-full px-xs py-0.5">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
```

```ts
// src/components/Tabs/Tabs.types.ts
export interface Tab {
  id: string
  label: string
  count?: number
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}
```

### DataTable component
```tsx
// src/components/DataTable/DataTable.tsx
import { DataTableProps } from './DataTable.types'

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        Loading...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        No data found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border shadow-card">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface-muted text-text-secondary font-medium">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-md py-sm border-b border-border" style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-border last:border-0 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-surface-subtle' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-md py-sm text-text-primary">
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Screen using both
```tsx
// src/screens/ExampleScreen.tsx
import { useState } from 'react'
import { Tabs, DataTable, PageLayout } from '../components'

const TABS = [
  { id: 'active', label: 'Active', count: 12 },
  { id: 'archived', label: 'Archived', count: 4 },
]

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
]

export function ExampleScreen() {
  const [activeTab, setActiveTab] = useState('active')
  const data = activeTab === 'active' ? ACTIVE_DATA : ARCHIVED_DATA

  return (
    <PageLayout title="Example">
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      <div className="mt-md">
        <DataTable columns={COLUMNS} data={data} />
      </div>
    </PageLayout>
  )
}
```

---

## 10. Initial Project Setup Commands

Run these once in a new empty folder:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react
npm install react-router-dom
```

Update `tailwind.config.ts` content array:
```ts
content: ['./index.html', './src/**/*.{ts,tsx}']
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 11. MCP Config File

Create `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key", "YOUR_FIGMA_API_KEY"]
    }
  }
}
```

Get your Figma API key: Figma → Profile → Settings → Security → Personal Access Tokens.

---

## 12. Prompt Templates

Use these exact prompts for consistency.

### Build a new screen
```
Figma frame URL: [URL]

Fetch the design context and screenshot for this frame.
Check CLAUDE.md Section 5 (Component Registry) before writing anything.
List which existing components you will reuse and which new ones you need to create.
Then build any missing components first, register them in CLAUDE.md Section 5, then compose the screen.
```

### Build a standalone component
```
Figma component URL: [URL]

Fetch the design context. Build this as a reusable React component in src/components/.
Follow the file structure in CLAUDE.md Section 6.
After building, show me the entry to add to the Component Registry in Section 5.
```

### Fix a visual discrepancy
```
The [ComponentName] doesn't match Figma. Here is the Figma screenshot: [paste or URL].
Here is what it looks like now: [paste screenshot].
Fix only the visual properties (spacing, color, border radius, font size). Do not change props or logic.
```

### Add a new column or tab
```
Add a "[Label]" tab to [ScreenName].
The tab should show [describe content].
Use the existing Tabs and DataTable components from the registry. Do not create new ones.
```

---

## 13. Quality Checklist

Before calling any screen done, verify:

- [ ] Matches Figma design (spacing, colors, typography, border radius)
- [ ] UI copy uses sentence case — first word capitalized only (§6.8)
- [ ] Uses only Tailwind config tokens — no hardcoded values
- [ ] All new components are in `src/components/` with types file
- [ ] All new components exported from `src/components/index.ts`
- [ ] Component Registry in Section 5 is updated
- [ ] No component is duplicated — check registry before creating
- [ ] Screen file only composes components, contains no raw HTML UI logic
- [ ] Props are fully typed, no `any`
- [ ] `npm run build` passes with no TypeScript errors

---

## 14. Common Mistakes — Never Do These

| ❌ Don't | ✅ Do instead |
|---------|--------------|
| Recreate a component that's already in the registry | Import it from `src/components` |
| Use `style={{ color: '#...' }}` | Use Tailwind class with token |
| Put complex UI logic inside a screen file | Extract to a component |
| Skip fetching Figma context and guess from description | Fetch `get_screenshot` first; use `get_design_context` only when exact tokens are needed (see §15) |
| Export a component from its own file only | Also add it to `src/components/index.ts` |
| Forget to update the Component Registry | Update Section 5 every time a component is created |
| Use `any` in TypeScript | Define a proper interface in `.types.ts` |
| Use `font-medium`/`font-semibold`/`font-bold` | Regular weight only — build hierarchy with color/size tokens (§6.6) |
| Copy Figma Title Case into labels ("Intake Details") | Sentence case — first word only ("Intake details") — see §6.8 |
| Invent a new header / button / switcher / menu look | Copy the exact shared-chrome classes (§6.7) from the Human-actions pages |
| Build the full screen at once without checking components | Audit registry → build missing components → compose screen |

---

## 15. Working Agreement (keep token cost low)

This project is built one task per conversation. **Start a fresh chat (or `/clear`) for each new task** — CLAUDE.md reloads automatically, so project context is never lost. Do not carry one long thread across many tasks (the whole history is re-billed every prompt).

- **Figma:** prefer `get_screenshot` (cheap) and build from the visual. Only call `get_design_context` (very large — tens of thousands of tokens) when exact tokens/measurements are needed, and only for the first component of a new family. Never call it "just to check."
- **Verify** with `npm run build` + **one** small screenshot (headless Chrome, `--force-device-scale-factor=1`), not several.
- **Model:** Sonnet is fine for routine UI build/edit work; reserve Opus for hard reasoning/planning.
- Batch related changes into one prompt instead of many follow-ups.

---

## 16. Project State (so a new chat can resume)

- **App:** automotive dealership prototype ("MYNA Automotive"). Shell = `IconRail` (L1, hover-expand) + `SideNav` (L2 "Frontdesk") + screen. Routing is **state-based in `src/App.tsx`** via `navActive` (no react-router); agent items drill into `AgentDetailScreen` → row click → `AgentInstanceScreen`.
- **Icons:** Material Symbols (Outlined) via the `Icon` component — NOT Lucide. A few brand glyphs are SVGs in `src/assets/`.
- **Screens:** `ManageAppointmentsScreen`, `SalesPipelineScreen`, `ServiceRequestsScreen` (list pages — no tabs, push `FilterPanel`, `CustomizeColumnsDrawer`, row-hover CTA + `FormDrawer`); `ConversationsScreen` (Outcomes dashboard, `src/components/charts/*` + Recharts); `AgentDetailScreen` (Agents/Library tabs); `AgentInstanceScreen` (Outcomes + per-location table); `ProceduresScreen` (Resources → Procedures) + `ProcedureDetailScreen`.
- **Procedure library (`ProceduresScreen` / `ProcedureDetailScreen`):** matches Figma `37-42809`. List = grid/list toggle of cards (book icon, title, description, 3-dot Edit/Duplicate/Delete menu, clock+date footer), search-icon toggle, "Create new". Editor (`ProcedureDetailScreen`, `procedure: Procedure | null` where null=new) = back+title header with Cancel/Save (new) or Actions/Save (existing, Save disabled until dirty); two columns: left = title input + when-to-use textarea + Steps editor box (rich `StepsView` for existing, placeholder textarea + slash hint for new, bottom `{x}`/wrench/link toolbar); right = Tools & Context cards with `RefChip`s + Add. Data model in `src/data/procedureData.ts`: `Procedure` now has `description`, `lastEdited`, structured `steps` (`ProcedureStep` = title + `Bullet[]` of inline `Token`s where a token is a string or a `Ref` chip), `tools: string[]`, `context: ContextItem[]`. Raw automotive entries are `transform()`-ed; `p-005` "Handle emergency or urgent concern" is the fully-authored featured example with inline chips. **No category tabs/chips anymore** (old design dropped).
- **Table convention:** column order is **name → Status (2nd) → Vehicle/subject (3rd) → rest**; tables support resize + sort + customize-columns. Drawers use the generic `FormDrawer`. Charts use `chartColors` + `ChartCard`.
- **Repo / deploy:** pushed to `github.com/craft-birdeye/myna`; pushing to `main` auto-deploys to GitHub Pages (`.github/workflows/deploy.yml`). Vite `base` is `/myna/` for production builds. Live: https://craft-birdeye.github.io/myna/

---

## 17. Building Agents from a PRD

This section tells Claude (and teammates) exactly how to take a new PRD and wire it into the MYNA prototype as a working agent workflow.

### Step 1 — Read the PRD sections you need

From the PRD, extract for each agent:
- **Trigger type** — inbound call/chat ("Conversation trigger") or scheduled/CRM event ("Schedule-based trigger" or "Entity trigger")
- **Workflow steps** — ordered list of triggers, tasks, procedures, delays, branches
- **Task details** — task name, description, tools required (maps to `agentService` tool IDs)
- **Procedures** — names that map to entries in `src/workflow/services/procedureService.js`
- **Metrics** — 4 KPIs shown on the agent overview and instance screens
- **Goals / Outcomes** — 1-2 sentence summaries used in the Agent details RHS panel

### Step 2 — Add or update `src/data/agentWorkflows.ts`

One `AgentWorkflow` object per agent: `{ nodes, nodeDetails }`.

**Node shape:**
```typescript
{ id: 'my-1', flowType: 'trigger' | 'task' | 'procedures' | 'delay' | 'branch', data: { title, subtype, hasToggle, toggleEnabled, hasAiIcon, headerLabel? } }
```

**Trigger subtypes and their RHS panels:**
| `data.subtype` | RHS panel rendered |
|---|---|
| `'Conversation trigger'` | `ConversationTriggerBody` — voice + webchat conditions |
| `'Schedule-based'` | `ScheduleBased` — frequency, day, time |
| anything else | `EntityTriggerBody` — conditions list |

**nodeDetails keys:**
- `'__start__'` → `{ agentName, goals, outcomes, locations[] }`
- trigger node → `{ triggerName, description, voiceConditions[], webchatConditions[] }` (or `{ frequency, day, time }` for schedule)
- task node → `{ taskName, description, tools: string[] }` — tool IDs come from `agentService._SEED_TOOLS`
- procedures node → `{ procedureIds: string[] }` — names must exactly match IDs in `procedureService.js`
- delay node → `{ name, duration, unit }` — e.g. `{ name: 'Wait 24h', duration: '24', unit: 'hours' }`
- branch node → `{ basedOn: 'conditions', branches: [{ id, name, isFallback? }] }` + one entry per branch path

**Branch path entry:**
```typescript
'branch-node-id-path-1': {
  branchName: 'Path label',
  description: '...',
  conditions: [],
  parentId: 'branch-node-id',
  isBranchPath: true,
  nodes: [ ...sub-nodes same shape as top-level nodes... ],
}
```
Also add nodeDetails entries for each sub-node ID.

### Step 3 — Add tools to `src/workflow/services/agentService.js`

Existing automotive tools (use these IDs directly):

| Tool ID | Name | Icon |
|---|---|---|
| `dms-integration` | DMS Integration | `storage` |
| `send-confirmation` | Send Confirmation | `send` |
| `schedule-appointment` | Schedule Appointment | `calendar_today` |
| `voice-call` | Voice Call | `call` |
| `crm-update` | CRM Update | `sync_alt` |
| `inventory-search` | Inventory Search | `inventory_2` |
| `lead-routing` | Lead Routing | `route` |
| `trigger-escalation` | Trigger Escalation | `priority_high` |
| `intent-classifier` | Intent Classifier | `psychology` |
| `vin-decode` | VIN Decode | `qr_code` |
| `check-business-hours` | Check Business Hours | `schedule` |
| `nhtsa-recall-lookup` | NHTSA Recall Lookup | `find_in_page` |

To add a **new tool**, append to `_SEED_TOOLS` in `agentService.js`:
```js
{ id: 'my-tool-id', name: 'My Tool', icon: 'material_icon_name', description: '...', category: 'Category', inputs: [...], outputs: [...] }
```

### Step 4 — Add or update procedures in `src/workflow/services/procedureService.js`

Each procedure needs `{ id, name, category, whenToUse, tools: string[], steps: string[], escalation }`. The `id` must exactly match the name string used in `procedureIds` arrays (they are the same).

To add from a PRD, follow the format already established for the 34 existing automotive procedures.

### Step 5 — Update metrics in `AgentDetailScreen.tsx` and `AgentInstanceScreen.tsx`

Both files have a `METRICS_BY_AGENT` record. Add your agent's key and 4 metrics:
```typescript
'My new agent': [
  { id: 'kpi1', value: '1,234', label: 'KPI label', delta: '2.1%', trend: 'up', info: true },
  // ...
]
```

### Step 6 — Wire the agent into the nav

In `src/App.tsx`:
1. Add `{ id: 'my-agent', label: 'My agent' }` to the `agent` section of `NAV_SECTIONS`
2. Add `'my-agent': 'My agent'` to the `AGENT_NAMES` record

### Step 7 — Build and verify

```bash
npm run build   # must say "✓ N modules transformed" with no TS errors
npm run dev     # open localhost:5173, navigate to your new agent
```

Click a row → Workflow tab → verify nodes match the PRD. Click the edit pencil → verify the full workflow editor opens with all nodes and pre-populated tool chips.
