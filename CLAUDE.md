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
| ChatHistoryPanel | components/ChatHistoryPanel/ChatHistoryPanel.tsx | title, items[] ({id,title}), selectedId, onSelect, onAllChats — 222px left rail (mirrors `SideNav`'s shell/width) shown in place of the hidden `SideNav` while a create-agent flow is open; search-chats input (client-side filter), "All chats" row, collapsible "Recent chats" list. Used by `AgentDetailScreen`'s create-flow for both Front desk and Reminder; selecting a recent chat re-mounts the flow and auto-sends that item's own canned prompt (`autoStart` prop on `HealthcareFrontdeskCreateAgentScreen`) |
| CoachAgentPanel | components/CoachAgentPanel/CoachAgentPanel.tsx | agentName, onClose — right-side Copilot-style coach chat (400px) that squeezes page content; New chat header, threaded reply + feedback, Ask-anything composer |
| AiAssistPanel | components/AiAssistPanel/AiAssistPanel.tsx | userName?='John', onClose — right-side "AI assist" welcome drawer (400px, expand→640px) that squeezes page content: top-right expand/close, "Hi {name}, how can I help you today?" greeting, centered BirdAI gradient sparkle + "BirdAI fetches reports…" caption, bottom "Ask your questions here…" composer with `SendIcon`. Opened by the AI-assist sparkle button on `AgentInstanceScreen` (Front desk + Reminder agents, non-recommendation tabs) |
| AiBuilderPanel | components/AiBuilderPanel/AiBuilderPanel.tsx | onClose, onExpand?, suggestions?=4 defaults, onSend? — docked right-side "AI Builder" panel (392px, flush-right, no squeeze animation) for the Reviews AI review-response canvas: violet→blue gradient header (white sparkle badge, "AI Builder" title + "Describe changes — I'll build them" subtitle, expand `open_in_full` then close X), centered magenta→purple gradient hero icon + "Build with `AI`" heading + description, 4 `AiSparkleGlyphIcon`-prefixed suggestion rows (click fills the composer, doesn't auto-send), bottom pill composer with gradient send button. Expand closes the docked panel and opens the full-page Create with AI shell (`CreateAiGhostwriterShellHeader` + "View agent builder" back to canvas). Opened via the review-response chrome's "Create with AI" FAB (`AgentBuilder.jsx`'s `onOpenAiBuilderPanel`, preferred over `onOpenAiFullscreen`); rendered by `WorkflowEditorScreen` (`aiBuilderPanelOpen`/`onAiBuilderPanelOpenChange` props), which also flips `hideLhs`/`createAiPanelOpen` on `AgentBuilder` so the canvas re-centers in the remaining width |
| RunDetailsPanel | components/RunDetailsPanel/RunDetailsPanel.tsx | onViewConversation?, steps?, conversation? — 530px overlay panel (reuses `.log-details-panel` float-wrap sizing) with Logs/Conversation tabs; Logs = stepper of workflow run steps (Trigger/Task/Delay/Branch, green checkmark timeline, collapsible Task/Branch output + Tool + View inputs using `RefChip`-keyed fields) ending in a "Completed" marker; Conversation = `ChatSystemLabel`/`ChatBubble` transcript plus wide/compact structured cards (booking confirmations, reminder emails). Used in place of `LogDetailsPanel` on RunDetailView **only for the Reminder agent** — Front desk and other agents keep `LogDetailsPanel` unchanged |
| Chip        | components/Chip/Chip.tsx               | label, variant?='warning'                                          |
| Block       | components/Block/Block.tsx             | heading?, meta?, variant?='neutral'\|'danger'\|'warning'\|'success'\|'info', collapsible?, defaultExpanded?, children — left-bar-quoted container for one "block" of a recommendation chat (Issue/Impact/Action needed, a testing result, etc.); bar color signals the block's kind, heading can optionally be a collapsible toggle |
| ReviewCardBody / StarRating | components/ReviewCard/ReviewCard.tsx | `ReviewCardBody`: review (`ReviewCardData`: reviewerName, rating, date, reviewId, location, text, reply?), className? — read-only review record (Birdeye avatar + `StarRating` + reviewer/date, reviewId/location tags, review text, and — when `reply` is set — the "Posted on {source logo} by {agent} • {date}" reply block). `StarRating`: rating, size?=18 — 5-star row (partial fill supported). Extracted from `AllReviewsScreen`'s `ReviewCard` (which wraps `ReviewCardBody` plus its own Reply/Edit-reply action buttons) so `RunDetailView`'s Review response "Review details" tab can render the same review layout for a log row |
| ProcedureSidePanel | components/ProcedureSidePanel/ProcedureSidePanel.tsx | open, title, whenToUse?, steps (`{title, bullets, addedBullets?, removedBullets?}[]`), exitCriteria?, onClose — read-only slide-in panel showing a procedure's full when-to-use + numbered steps + when-to-exit; opened from a "Procedure updated/created" block's "View Procedure" button in the recommendation chat. Bullet text supports inline `{{token}}` markup, rendered as read-only `RefChip` (kind='tool') pills. For "Procedure updated" recs, pass `Recommendation.stepsWithDiff` instead of `steps` to show `addedBullets` in green with an "Added" chip and `removedBullets` with a red strikethrough |
| TranscriptSidePanel | components/TranscriptSidePanel/TranscriptSidePanel.tsx | open, title?='Transcript', lines (`{speaker, text}[]`), onClose — read-only slide-in panel showing a conversation's full transcript; opened from a "Reported conversation" block's "View Transcript" button in the recommendation chat |
| ChatBubble / ChatSystemLabel | components/ChatBubble/ChatBubble.tsx | `ChatBubble`: sender='business'\|'user', text, children?, className?, showFeedback?, feedback?, onFeedbackChange? — chat-thread message bubble (business right-aligned blue `bg-[#dbeafe]`, user left-aligned gray `bg-[#f0f0f0]`, `rounded-lg`, meta content passed as children below the bubble). When `showFeedback`, thumbs up/down sit beside the meta row (mutually exclusive; click again to clear). Inbox thumbs-down opens `ShareFeedbackModal` before committing. `ChatSystemLabel`: text — centered gray system/status line (e.g. "Conversation started"). Shared by `InboxScreen` and `LogDetailsPanel`'s call transcript — reuse this instead of hand-rolling bubble markup |
| ShareFeedbackModal | components/ShareFeedbackModal/ShareFeedbackModal.tsx | open, onClose, onSubmit(details), initialDetails?, variant?='coaching'\|'help' — `coaching` = inbox/logs thumbs-down; `help` = Help center Share feedback (Figma `16119:14085`: subtitle, Your feedback + 0/500, optional file drop zone, Cancel / Submit feedback) |
| AgentsIntroVideoModal | components/AgentsIntroVideoModal/AgentsIntroVideoModal.tsx | open, onClose, title?='Introduction to AI agents' — in-product video placeholder (16:9 player chrome with title overlay + play/volume/time/fullscreen controls); auto-opened on `OverviewScreen` mount (reload to retake) until a real agents intro embed is wired in |
| WorkflowCoachTour | components/WorkflowCoachTour/WorkflowCoachTour.tsx | open, onClose, steps?=WORKFLOW_COACH_STEPS — first-time 5-step coach queue on the edit-mode workflow canvas (Create with AI → Trigger → Tasks & controls → Test run → Publish); anchored popovers with caret + spotlight ring via `data-tour-id` on AgentBuilder chrome; Next/Done; remount editor to retake |
| HelpCenterPanel | components/HelpCenterPanel/HelpCenterPanel.tsx | open, onClose, onStartTour?(tourId), onOpenGlossary? — workflow-canvas Help center drawer (Figma `15865:4049`: Video tutorials / Support articles / Glossary / Agent builder basics Start tour / Share feedback); Glossary calls `onOpenGlossary` to open `GlossaryModal` (Figma `15988:11969`); trigger is `.rr-chrome-help` top-right inside AgentBuilder; Start tour reopens `WorkflowCoachTour`; Share feedback opens `ShareFeedbackModal` |
| GlossaryModal | components/HelpCenterPanel/GlossaryModal.tsx | open, onClose, initialTermId? — full-screen glossary popup (left categorized term list + search; right definition / visual / example); opened from Help center Glossary card |
| HeaderSearchField | components/HeaderSearchField/HeaderSearchField.tsx | open, value, onOpenChange, onChange, placeholder?='Search' — canonical page-header search: collapsed 36px icon button, expands to 224px input with a trailing ✕ clear button that clears + collapses. Screen owns the `searchOpen`/`searchQuery` state and its own filtering logic |
| Icon        | components/Icon/Icon.tsx               | name (Material Symbol), size?, fill?, weight?, className?           |
| Tooltip     | components/Tooltip/Tooltip.tsx         | content, variant?='detail'\|'brief', children (trigger), className? — hover tooltip per Aero DS "Tooltip / Web" (Figma `xecPAre4cKkeXEdvTig1oI`, node 2180:72): dark `bg-tooltip` (#252525), white `text-small`, `rounded-sm`, **no drop shadow**. Fades in/out (120ms ease-out) on mount/unmount rather than toggling instantly. `brief` = short phrase (`max-w-[140px]`), `detail` = explanatory text (`max-w-[280px]`, prefer ≤2 lines) |
| InfoTooltip | components/InfoTooltip/InfoTooltip.tsx | text, variant?='detail'\|'brief' — info-icon button wrapping `Tooltip`; use this (not a hand-rolled hover panel) whenever a label/title needs an explanatory "ⓘ" hint |
| TtsModelSettings | components/VoiceCallEngineSettings/VoiceCallEngineSettings.tsx | value?, onChange?, hideHeading? (suppresses the built-in `<h3>` when the caller supplies its own — used by the Front desk Settings sub-panels) — "Text-to-speech (TTS)" heading + Primary model only; rendered first in Voice call settings, above Default voice |
| TtsFailoverSettings | components/VoiceCallEngineSettings/VoiceCallEngineSettings.tsx | no props — TTS Failover policy + conditional Failover model (shown only when policy='Manual'), plus a self-contained mirrored Default voice/Add additional voice pair for the failover path (own local state + `DefaultVoiceDrawer`/`AdditionalVoiceDrawer`); rendered after the primary Default voice/Add additional voice block, before Speech-to-text |
| VoiceCallEngineSettings | components/VoiceCallEngineSettings/VoiceCallEngineSettings.tsx | value?, onChange?, hideHeading? (also drops the top padding) — "Speech-to-text (STT)" heading + Primary model + Failover policy (conditional Failover model when policy='Manual') + Enable interruptions toggle; rendered last, right before Greeting message. Shares the file with `TtsModelSettings`/`TtsFailoverSettings` |
| DefaultVoiceDrawer / AdditionalVoiceDrawer | components/VoiceSettingsDrawers/VoiceSettingsDrawers.tsx | shared 650px drawers for Default voice (voice + speed) and Add/edit additional voice (label, voice, language, usage, speed); used by setup wizard and Front desk / Reminder agent Settings |
| IconRail    | components/IconRail/IconRail.tsx       | logoSrc, brand, groups[] (header?, items[]), activeId, onSelect? — collapsed 56px, expands to 262px on hover |
| SideNav     | components/SideNav/SideNav.tsx         | title, sections[], activeId, onSelect?                              |
| TopNav      | components/TopNav/TopNav.tsx           | avatarUrl?, initials?, onAdd?, onHelp?, onMenu?                     |
| PageHeader  | components/PageHeader/PageHeader.tsx   | date, providerLabel?, view?, onPrev?, onNext?, onToday?, onViewChange?, onFilter? |
| MetricTiles | components/MetricTiles/MetricTiles.tsx | metrics[] ({ id, value, label }), renderTileAction? ((metric) => ReactNode — rendered top-right inside the tile) |
| EstimateSavingsModal | components/EstimateSavingsModal/EstimateSavingsModal.tsx | open, onClose, onSave(values), initialValues (`EstimateSavingsValues`: mode 'time'\|'cost', minutesPerResolution, wageCurrency, hourlyWage), copy? (`EstimateSavingsCopy` — title/subtitle/timeLabel/wageLabel/wageCaption/saveLabel, each defaulting to the **Front desk** wording) — centered 560px savings-config modal: Time saved / Cost saved radios, a minutes input + Mins/Hours dropdown, and a conditional currency + hourly-wage row shown only in cost mode. Opened from the **Time saved** metric tile's `tune` icon button (via `MetricTiles`' `renderTileAction`) on `AgentDetailScreen` and `AgentInstanceScreen`, gated to Front desk + Review response agents. Review response passes the exported `REVIEW_RESPONSE_SAVINGS_COPY` ("Configure" / "Specify time and cost savings below" / "Time saved per ticket created by the agent" / "Hourly employee wage" / "Update") so Front desk keeps its own strings — **don't hardcode new copy into the modal**, pass it via `copy`. Also exports `parseTimeSavedHours(value)`, which both screens use to turn a tile value into hours for the cost conversion; it parses "18h", "6h 20m", "40m", "8 min", "2.5 hrs" (naively stripping non-digits reads "6h 20m" as 620) |
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
| ComposerAttachPopover | components/ComposerAttachPopover/ComposerAttachPopover.tsx | onSelect(item: AttachItem), disabled?, tools?, procedures? — self-contained plus-button trigger + anchored attach popover for chat composers (Birdeye flavor of the monday.com attach menu): All/Files/Tools/Procedures tab pills over a fixed-height (360px) body so the panel never resizes between tabs; All = section lists ("+ Add file", integrated tools, available procedures) under plain section labels; Files = dashed "Click or drag and drop" upload zone; outside-click/Esc close. Picked items surface as `RefChip`s in the create-agent composer ("+ Add file" returns `{ id: 'add-file' }` for the screen to resolve) |
| AttachMenuPopover | components/AttachMenuPopover/AttachMenuPopover.tsx | onSelect(option: 'upload-image'\|'media-library'\|'files'), disabled?, className? — plus-button trigger + simple anchored 3-item menu (Upload image / Media library / Files, Material icons `computer`/`perm_media`/`draft`) opening above the button; used by the "Build your agent" landing composer in `AgentDetailScreen`. "Upload image" is left for the caller to wire to a native file input; "Media library"/"Files" are meant to open `MediaLibraryModal`/`FilesModal` |
| PromptComposer | components/PromptComposer/PromptComposer.tsx | value, onChange, onSend, placeholder?, disabled?, sendDisabled?, rows?=2, attachments? (`{id,kind,label}[]`), onRemoveAttachment?, onAttach? (renders `AttachMenuPopover` when set, else a plain non-interactive "+"), onFocus?, onClick?, className? — canonical chat composer (rounded-xl card, `RefChip` attachment row, textarea, attach + dictate + `SendIcon` send button). Shared by `AgentDetailScreen`'s create-flow follow-up composer and `LHSDrawer`'s "Create with AI" tab (replaces the old workflow-only `AIPromptBox`) so both surfaces render the same input |
| MediaLibraryModal | components/MediaLibraryModal/MediaLibraryModal.tsx | open, onClose, onDone(selected: MediaLibraryFile[]), folders?, files? — centered 1200px modal (Figma Content Hub `a7aOc9Q8S6XvOK27VGDOyv`, node 9894:64621): header + close, a "Folders" row of 216px folder covers (2×2 thumbnail-cell grid, "+N" overflow cell, optional count badge), an "Other media" checkbox list (thumbnail + filename), footer "N files selected" + Done |
| FilesModal | components/FilesModal/FilesModal.tsx | open, onClose, onDone(selected: FilesModalFile[]), files? — centered 1200px modal (Figma Content Hub node 9894:64966): "Select all" row + checkbox list of files with type-colored icon badges (`assets/icon-file-pdf.png`/`icon-file-xls.png`/`icon-file-ppt.png`), footer "N files selected" + Done |
| ContextModal | components/ContextModal/ContextModal.tsx | open, onClose, onSave(result) — centered 1200px modal for adding LLM context: Fields (search + Business accordion with Name/Source/Sample/Anonymize/Show-in-output), Knowledge (files/links), Brand (checkbox list), Industry (toggle); Save commits enabled selections |
| CallRecordingPlayer | components/CallRecordingPlayer/CallRecordingPlayer.tsx | audioUrl?, durationSecs?, active?, title?, padded?, className? — WaveSurfer call-recording player (waveform + play/pause + speed + time); shared by inbox `VoiceChatDrawer` and `LogDetailsPanel` |
| RunDetailsPanel / RunConversationThread | components/RunDetailsPanel/RunDetailsPanel.tsx | `RunDetailsPanel`: onViewConversation?, steps? (RunLogStep[] — trigger/task/delay/branch, each with expandable output/tool/inputs field trees), conversation? (`ReminderConversationEntry[]`, defaults to the Reminder run), conversationContent? (ReactNode override for the Conversation tab, takes precedence over `conversation`), callDetails? (typed Call-details tab fields), callDetailsContent? (ReactNode override, also reveals the tab on its own) — 600px "Run details" side panel with Logs/Conversation(/Call details) tabs. `RunConversationThread`: entries (`ReminderConversationEntry[]` from `data/reminderInboxConversation.ts`) — renders a run conversation thread (system labels, blue/gray email cards, voice bubbles with LLM/STT meta); reused by `InboxScreen` for the Sarah Lauren reminder deep-link (`REMINDER_INBOX_CONVERSATION_ID`) and internally by `RunDetailsPanel` itself |
| WorkflowViewerTab (view-only canvas) | screens/WorkflowViewerTab.tsx | instanceName, displayName?, onEdit, product? — the agent instance's **Workflow tab**. Mounts `AgentBuilder` with `viewOnly` + `viewChromeActions`, giving: a `👁 View only mode` badge top-left (`.rr-chrome-viewonly`) and a centred pill with **Edit workflow** (pencil) + **Run test** (play); flat `#eef0f4` canvas, no dot grid; node toggles disabled and dimmed. Clicking a node opens the node-config `RHS` in **read-only** mode — `RHS.jsx` wraps the body in a **disabled `<fieldset>`** (`.rhs-readonly`), which natively disables every nested control so Tab-and-type can't edit it either (`pointer-events: none` alone only stopped the mouse); `.rhs-readonly` CSS also hides chip remove crosses (`[class*="deleteBtn"]`) and dims disabled buttons. **Editing round-trip:** the pencil calls `onEditAgent(instanceName, undefined, { instanceName, tab: 'workflow' })`; `App.handleEditAgent` stores that as `editorReturnView` and, on editor close, replays it through `pendingAgentInstanceView` so **Back returns to this Workflow tab** instead of the agent list. Both `AgentDetailScreen` render sites in `App.tsx` must receive `pendingInstanceView` / `onPendingInstanceViewConsumed` — the Reviews AI one originally didn't |
| TestRunPanel | components/TestRunPanel/TestRunPanel.tsx | steps (`TestRunStep[]`), stepStatuses (`('pending'\|'running'\|'done')[]`), activeIndex, status ('running'\|'complete'), onExit — 390px "Test details" RHS shown while a workflow test run plays out (shell matches the canvas node-config `RHS`: 390px, 12px radius). Mirrors the canvas node cards as a stepper — each row carries the node's own `TYPE_META` glyph + numbered title, a status marker (grey ring → blue SVG loading ring → green check; the spinner is a local inline SVG, **not** a Material glyph — a font glyph sits off-centre in its line-box so `animate-spin` makes it orbit rather than spin), and collapsible `Tool : X` / Task output / View inputs built from `RunDetailsPanel`'s exported `FieldList` (`{}` RefChip keys, nested `{ N properties }`). The running row also shows an inline spinner + "Running…". Ends in a "Completed" marker + "Exit test"; the header ✕ and the footer button both call `onExit`. Auto-scrolls the executing row into view. Opened by **both** Run test buttons in `AgentBuilder` (the Workflow-tab `viewChromeActions` pill and the editor header). State comes from `hooks/useTestRun.ts` — auto-starts, advances every `TEST_RUN_STEP_MS` (1800ms) — which also feeds the canvas node highlighting (blue border + `ab-test-run-pulse` 2.6s on the active node, green border on done ones, injected inline by `data-id`) and `FlowCanvas`'s `focusNodeId` auto-pan (700ms), so panel and canvas stay in lockstep. Steps are built by `data/testRunSteps.ts` `buildTestRunSteps(nodeList, nodeDetails)`, which walks branches down the **first non-fallback path only**; tool/output/inputs payloads are placeholder for now |
| LogDetailsPanel | components/LogDetailsPanel/LogDetailsPanel.tsx | row (HealthcareLogRow), agentName?, transcript?, durationSecs?, audioUrl?, callerNumber?, sidNumber?, languageDetected?, callEndReason?, routedVia?, onTrackFeedback? — call-log flavor of `RunDetailsPanel`: builds this call's trigger/task steps for the Logs tab, and passes its own call-transcript/call-details layouts into `RunDetailsPanel` via `conversationContent`/`callDetailsContent`. Agent transcript bubbles show a "Coach agent" / "Track your feedback" link (same `ShareFeedbackModal` + `useFeedbackRecommendationsStore().submitFeedback` flow as `InboxScreen`), tagged with `agentName` so feedback lands on that instance's Recommendation tab |
| EmptyState  | components/EmptyState/EmptyState.tsx   | title, description?, className? — Aero Design System "no results" empty state (3 dashed placeholder circles + solid search-icon glyph, title + description); used by `DataTable`'s built-in zero-row fallback and as a search-miss overlay in `DayCalendar`/`WeekCalendar` |
| RecordDetailScreen | components/RecordDetailScreen/RecordDetailScreen.tsx | name, accordions[] (title,fields[],defaultOpen?), metrics[] ({value,label}), activities[] (`Activity` from `ViewActivityDrawer.types`) — full-page record detail (same visual structure as `IntakePatientDetailScreen`: left avatar+accordion card, right AI-summary banner + tabs + metric tiles + search + activity timeline). Generic, data-driven — used as the "View details" destination for Manage appointments / Review waitlist / Sales pipeline / Service requests (each screen builds its own `build*DetailProps()` mapping from its row shape) |
| Block | components/Block/Block.tsx | heading?, meta?, variant?='neutral'\|'danger'\|'warning'\|'success'\|'info', collapsible?, defaultExpanded?, hideBar?, children?, className? — left-color-bar content block (optionally collapsible); used throughout `RecommendationDetailScreen`'s scripted chat (Issue/Impact/Thoughts/diff blocks) |
| ProcedureSidePanel | components/ProcedureSidePanel/ProcedureSidePanel.tsx | open, title, whenToUse?, steps[] (`ProcedureSidePanelStep`: title, bullets[], addedBullets?, removedBullets?), exitCriteria?, onClose — right overlay showing a procedure's steps with added/removed-bullet diffing; opened from `RecommendationDetailScreen`'s "View procedure" chip |
| TranscriptSidePanel | components/TranscriptSidePanel/TranscriptSidePanel.tsx | open, title?, lines[] (`{speaker, text}`), onClose — right overlay rendering a full call/chat transcript as `ChatBubble`s; opened from `RecommendationDetailScreen`'s "View Transcript" link |
| RecommendationsTab / RecommendationDetailScreen | screens/RecommendationsTab.tsx, screens/RecommendationDetailScreen.tsx | `RecommendationsTab`: agentName, onSelect(id), isDraft? — table of Myna-generated + human-feedback recommendations (`data/recommendationsData.ts`) for the agent's "Recommendation" tab. `RecommendationDetailScreen`: recommendationId, onBack, autoOpenFeedbackPrefill?, onAutoOpenFeedbackConsumed? — full-page scripted AI chat walking through Issue/Impact/proposed change with an accept/reject flow. Ported from the `Akhil-myna-repo` branch's Recommendation flow (see `FeedbackRecommendationsStoreContext` / `RecommendationOverridesStoreContext` providers in `App.tsx`); the Inbox-to-Recommendation "human feedback" linkage from that branch (coaching examples, `submitFeedback` wiring) was intentionally left out of scope — our existing `agentFeedbackRecommendations.ts` + `InboxScreen` thumbs-down flow is untouched and separate |

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
- **Agent directory (`AgentDirectoryScreen`, `src/data/agentDirectoryData.ts`):** L1 icon-rail item `agents` (`railActive === 'agents'` in `App.tsx`) — no L2 `SideNav` for this route; `TopNav` shows `title="Agents"`. `ReportHeader` = "Agents overview" + subtitle, right slot = status filter dropdown ("All agents"/Running/Paused/Needs attention), a `DateRangeDropdown` (Today/Last week/Last month/Last quarter presets + a "Custom" row that opens the existing `DatePickerModal` calendar on click), and "Create agent" CTA. All dropdowns share a `useOpenTransition` mount-delay hook that eases panels in **and** out (do **not** use `createPortal` + a document `mousedown` listener for these — a click inside a portaled panel isn't "contained" by the trigger button ref, so the outside-click check fires before the item's own `onClick`, silently swallowing the selection). 4 `MetricTiles` summarize the directory, computed live from the current product's agent list (`Metric` type supports `valueColorClassName` to color a tile's value, e.g. red for "Needs attention"). "Agent directory" section has a `SortDropdown` (runs / persona-with-hover-flyout grouped via `PERSONA_GROUPS`, which mirrors the real L1 rail product groupings / custom drag-to-reorder — native HTML5 `draggable`, only when `sortMode==='custom'`, plain top-center drag-handle icon with no dimming overlay); "Sort by runs" and "Sort by custom order" share the same base sequence until the user actually drags. **Grid only** (no list/table view). Card numbers ≥1000 auto-format to "16.2K" (`formatK`); each metric is wrapped in the shared `Tooltip` (no drop shadow, ease in/out) showing the full label + exact number on hover. Agents with a `navId` are clickable and route to `AgentDetailScreen` via the `onOpenAgent` prop (`App.tsx` sets `railActive='frontdesk'` + `navActive=navId`). **Product-aware:** `AgentDirectoryScreen` takes a `product` prop (`App.tsx` passes `activeProduct`, keyed by `key={activeProduct}` so switching products remounts with fresh state instead of carrying over stale filters/sort). `agentDirectoryData.ts`'s `getAgentDirectory(product)` builds each product's list from a shared set of product-agnostic Marketing/Inbox agents (Review response/generation, Social publishing/engagement, Tagging & routing — same for every product) interleaved with that product's own front-desk-family agents from `FRONT_DESK_AGENTS_BY_PRODUCT` (healthcare: Front desk/Waitlist/Pre-visit/Reminder; dental: same four + Recall/Revenue/Treatment plan; automotive: Front desk/Reminder/Outreach) — all pulled from `AgentDetailScreen`'s existing `METRICS_BY_AGENT`/`REGIONS_BY_AGENT` real numbers for that agent name.
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

---

## 18. Graphify Knowledge Graph (context lookup + upkeep)

This repo has a local [graphify](https://github.com/Graphify-Labs/graphify) knowledge graph at `graphify-out/` (gitignored — regenerated locally, never committed). It indexes every symbol in `src/` (functions, components, types, constants) and their relationships, clustered into communities.

### Look here first
Before grepping/exploring the codebase cold for "where does X live" / "what touches Y" / "how do these pieces relate" questions, check `graphify-out/GRAPH_REPORT.md` first — it's a fast index of communities (feature areas) and their member symbols. Use it to jump straight to the relevant files instead of open-ended searching. Fall back to normal search (Explore agent, grep) for anything the report doesn't resolve (e.g. it was written before a very recent change).

Useful lookups beyond the static report:
```bash
graphify god-nodes .                    # most-connected files (architectural hubs)
graphify query "<question>" .           # BFS traversal of graph.json for a question
graphify explain "<SymbolName>" .       # plain-language explanation of a node + neighbors
graphify path "<A>" "<B>" .             # shortest relationship path between two symbols
```

### Keep it current
After any change that adds/removes/renames symbols (new component, new screen, refactor), refresh the graph so the next lookup reflects reality:
```bash
graphify update .                       # re-extract changed code files into graph.json (local AST only, no LLM)
graphify cluster-only . --no-label      # regenerate GRAPH_REPORT.md + graph.html from the updated graph
```

**Always use `--code-only` (on `extract`) and `--no-label` (on `cluster-only`).** Community naming and full semantic extraction call an external LLM backend — sending this repo's proprietary source code to an outside API is against org data-handling policy. The AST-only path (`--code-only` / `update` / `--no-label`) never leaves the machine; don't drop those flags to get nicer output.

If `graphify` isn't on `PATH` in a given shell, it's installed via `uv tool install graphifyy` — invoke as `~/.local/bin/graphify` or `export PATH="$HOME/.local/bin:$PATH"` first.
