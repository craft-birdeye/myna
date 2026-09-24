/**
 * L2NavLayout — shared layout primitive for ALL L2 navigation panels.
 *
 * NAVIGATION “STATE” COLOURS (see Design System → Tokens → Navigation selection):
 *   • L1 rail / expanded Birdeye nav — selected + hover pill: `bg-app-shell-l1-nav-highlight`; pressed:
 *     `bg-app-shell-l1-nav-pressed`; selected icon/label: `text-primary` (`Sidebar.v2` `IconStrip`).
 *   • L2 tree child (neutral selection) — `CHILD_ACTIVE` / `--app-shell-l2-row-active` + `text-foreground`.
 *   • L2 flat accent rows (tabs, overflow flyout, profile pickers) — `CHILD_FLAT_ACCENT_ACTIVE`: `bg-primary/10` +
 *     `text-primary` (+ optional `ring-primary/15`).
 *
 * APP SHELL — L2 COLUMN (required for new products):
 *   The exported `PANEL` class string includes `rounded-tl-lg` (8px top-left) and `border-r` (1px seam vs
 *   main). The outer chrome frame is `APP_SHELL_BELOW_TOPBAR_CARD_CLASS` (`border-app-shell-border` / `--app-shell-border`).
 *   Custom L2 sidebars (220px) must use `PANEL` or replicate the same tokens — see Storybook:
 *   Design System → Tokens → App shell.
 *
 * DEFAULT EXPANSION RULE (applies to every panel automatically):
 *   • If a section named "Actions" exists → expand only that section.
 *   • If no "Actions" section exists → expand only the first section.
 *   • All other sections start collapsed.
 *
 * DEFAULT ACTIVE RULE:
 *   • If defaultActive is provided → use it.
 *   • Otherwise → auto-select the first child of the expanded section.
 *
 * To build a new product L2 nav, pass a config object — no styling decisions needed:
 *
 *   <L2NavLayout
 *     headerAction={{ label: "Send a review request" }}
 *     sections={[
 *       { label: "Actions", children: ["Reply manually", "Monitor agent replies"] },
 *       { label: "Reviews", children: ["All", "Google", "Yelp"] },
 *     ]}
 *     footerLink={{ label: "Reports", external: true }}
 *   />
 */

import { useState, type ReactNode } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { ChevronUp, ChevronDown, ExternalLink, Plus } from "lucide-react";
import { L1_STRIP_ICON_STROKE_PX } from "@/content-hub/l1StripIconTokens";
import { cn } from "./utils";

/* ─────────────────────────────────────────────────────
   Design tokens — edit here to update every L2 panel
   ───────────────────────────────────────────────────── */
/** L2 column background only (matches `PANEL`) — use behind main-content lists that mirror L2 selection. */
export const L2_PANEL_SURFACE = "bg-surface-l2";

/** Default column: no rounding on container, matches SideNav visual language. */
export const PANEL =
  `w-[222px] ${L2_PANEL_SURFACE} border-r border-border flex flex-col h-full overflow-hidden shrink-0 transition-colors duration-300 text-text-secondary`;

/** Inbox L2 only — no `border-r`. */
export const PANEL_INBOX_L2 =
  `w-[222px] ${L2_PANEL_SURFACE} flex flex-col h-full overflow-hidden shrink-0 transition-colors duration-300 text-text-secondary`;

// Shared row geometry — matches SideNav: text-body (14px), rounded-sm (4px), px-sm (8px), py-[6px]
export const ROW =
  "flex items-center justify-between w-full px-sm py-[6px] text-body rounded-sm transition-colors";

export const HOVER = "hover:bg-surface-selected";

export const SECTION_HEADER    = `${ROW} ${HOVER} text-text-primary`;
export const CHILD_INACTIVE    = `${ROW} ${HOVER} text-left text-text-primary font-light`;
/**
 * Neutral selected row — matches SideNav `bg-surface-selected`.
 */
export const L2_ROW_SELECTED_BG = "bg-surface-selected";
export const CHILD_ACTIVE      = `${ROW} text-left text-text-primary ${L2_ROW_SELECTED_BG}`;
/** Primary-tint selection for flat nav rows (e.g. Journeys → Outcomes). */
export const CHILD_FLAT_ACCENT_ACTIVE =
  `${ROW} text-left text-text-primary ${L2_ROW_SELECTED_BG} ${HOVER}`;
export const FOOTER_ROW_CLS    = `${ROW} ${HOVER} text-text-primary`;

/** Muted band on main content (e.g. Monitor hero) — aligns with L2 grey family, borderless. */
export const L2_CONTENT_MUTED_BAND = "bg-app-shell-l2-content-muted";

/** L2 header row “+” — primary tint + Lucide `Plus` (shared across L2 + custom sidebars). ~10% under `2rem` circle. */
export const L2_HEADER_PLUS_WRAPPER_BLUE =
  "size-5 rounded-full flex items-center justify-center shrink-0 bg-primary";
/** Class names for `<Plus />` inside `L2_HEADER_PLUS_WRAPPER_*`. */
export const L2_HEADER_PLUS_GLYPH_BLUE =
  "size-3 shrink-0 text-white pointer-events-none";

/** Same shape for `headerActionColor="green"` (pale green surface + darker plus). */
export const L2_HEADER_PLUS_WRAPPER_GREEN =
  "size-[1.8rem] bg-[#4caf50]/20 dark:bg-[#4caf50]/25 rounded-full flex items-center justify-center shrink-0";
export const L2_HEADER_PLUS_GLYPH_GREEN =
  "size-[13.5px] shrink-0 text-[#1b5e20] dark:text-[#a5d6a7] pointer-events-none";

/** Lucide `Plus` stroke in L2 header circles — matches L1 rail / product outline icons (`L1_STRIP_ICON_STROKE_PX`). */
export const L2_HEADER_PLUS_STROKE_PX = L1_STRIP_ICON_STROKE_PX;

/* ─────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────── */
/**
 * String = label and key are the same (legacy panels).
 * Object = visible label + stable key, with optional modifiers:
 *   external — show ExternalLink icon on the right
 *   nonNav   — render as a non-interactive div (no click / active state)
 */
export type L2SectionChild =
  | string
  | { label: string; key: string; external?: boolean; nonNav?: boolean };

export interface L2Section {
  label: string;
  children: L2SectionChild[];
}

function l2ChildParts(c: L2SectionChild): { label: string; key: string; external?: boolean; nonNav?: boolean } {
  return typeof c === "string" ? { label: c, key: c } : c;
}

export interface L2HeaderAction {
  label: string;
  onClick?: () => void;
}

export interface L2FooterLink {
  label: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

/** Prefix for `flatNavItems` active keys: `flatNav/{key}`. */
export const L2_FLAT_NAV_KEY_PREFIX = "flatNav";

export interface L2NavLayoutProps {
  /** Optional bold module title at the top of the scroll area (e.g. "Appointments"). */
  panelTitle?: string;
  /** Top row with a + button (e.g. "Send a review request") */
  headerAction?: L2HeaderAction;
  /** Color of the + button in the headerAction. Defaults to "blue". */
  headerActionColor?: "blue" | "green";
  /**
   * Custom node rendered in place of `headerAction`. When provided,
   * `headerAction` and `headerActionColor` are ignored.
   * Use for rich triggers such as dropdown menus.
   */
  headerSlot?: ReactNode;
  /** Flat clickable items rendered BEFORE sections (key = "standalone/{label}") */
  standaloneItems?: string[];
  /**
   * Flat rows with stable keys (no section header). Active key = `flatNav/{key}`.
   * Renders after standalone items and before collapsible sections.
   */
  flatNavItems?: { label: string; key: string }[];
  /** Subset of `flatNavItems` keys that use primary accent selection (`CHILD_FLAT_ACCENT_ACTIVE`). */
  flatNavAccentKeys?: string[];
  /** When true, `panelTitle` + `headerAction` stay sticky; list scrolls below. */
  stickyNavHeader?: boolean;
  /** Collapsible sections */
  sections: L2Section[];
  /** Single bottom row, optionally with an external-link icon */
  footerLink?: L2FooterLink;
  /**
   * Initial active item in "Section/Child" format.
   * Defaults to the first child of the default-expanded section.
   */
  defaultActive?: string;
  /** Controlled active item (for Storybook stories / testing) */
  activeItem?: string;
  onActiveItemChange?: (key: string) => void;
  /** Section labels to expand on initial mount (overrides default expansion rule) */
  defaultExpandedSections?: string[];
  /** Pinned below the scrollable nav (e.g. usage meter). */
  footerSlot?: ReactNode;
  /** sessionStorage key — when provided, active item persists across refresh */
  storageKey?: string;
  "data-no-print"?: boolean;
}

/* ─────────────────────────────────────────────────────
   Helper — resolve which section opens by default
   ───────────────────────────────────────────────────── */
function resolveDefaultExpanded(sections: L2Section[]): string {
  return sections.find(s => s.label === "Actions")?.label ?? sections[0]?.label ?? "";
}

/* ─────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────── */
export function L2NavLayout({
  panelTitle,
  headerAction,
  headerActionColor = "blue",
  headerSlot,
  standaloneItems,
  flatNavItems,
  flatNavAccentKeys,
  stickyNavHeader = false,
  sections,
  footerLink,
  defaultActive,
  activeItem: controlledActive,
  onActiveItemChange,
  defaultExpandedSections,
  footerSlot,
  storageKey,
  "data-no-print": noprint,
}: L2NavLayoutProps) {

  // Expansion state — respects defaultExpandedSections if provided, else default rule
  const defaultExpandedLabel = resolveDefaultExpanded(sections);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map(s => [
      s.label,
      defaultExpandedSections
        ? defaultExpandedSections.includes(s.label)
        : s.label === defaultExpandedLabel,
    ]))
  );

  // Active item — auto-resolve to first child of expanded section if not provided
  const defaultSection = sections.find(s => s.label === defaultExpandedLabel);
  const firstChild = defaultSection?.children[0];
  const firstKey = firstChild != null ? l2ChildParts(firstChild).key : null;
  const resolvedDefault =
    defaultActive ?? (firstKey != null ? `${defaultExpandedLabel}/${firstKey}` : "");

  // storageKey=undefined → behaves like useState (no storage); string → persists
  const [internalActive, setInternalActive] = usePersistedState(storageKey, resolvedDefault);
  const active = controlledActive ?? internalActive;

  const toggle = (label: string) =>
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));

  const activate = (key: string) => {
    setInternalActive(key);
    onActiveItemChange?.(key);
  };

  const plusWrapper =
    headerActionColor === "green" ? L2_HEADER_PLUS_WRAPPER_GREEN : L2_HEADER_PLUS_WRAPPER_BLUE;
  const plusGlyph =
    headerActionColor === "green" ? L2_HEADER_PLUS_GLYPH_GREEN : L2_HEADER_PLUS_GLYPH_BLUE;

  const titleBlock =
    panelTitle != null ? (
      <div className="mb-2 text-left text-body text-text-primary">
        {panelTitle}
      </div>
    ) : null;

  const headerActionBlock =
    headerSlot != null ? (
      <div className="mb-[6px]">{headerSlot}</div>
    ) : headerAction != null ? (
      <button
        type="button"
        onClick={headerAction.onClick}
        className={`${FOOTER_ROW_CLS} mb-[6px]`}
        style={{ fontSize: 14 }}
      >
        <span className="text-body">{headerAction.label}</span>
        <div className={plusWrapper}>
          <Plus
            className={plusGlyph}
            strokeWidth={L2_HEADER_PLUS_STROKE_PX}
            absoluteStrokeWidth
            aria-hidden
          />
        </div>
      </button>
    ) : null;

  const navScrollBody = (
    <>
      {/* Standalone items (flat, before sections) */}
      {standaloneItems && standaloneItems.map(label => {
        const key = `standalone/${label}`;
        const isActive = active === key;
        return (
          <button
            key={label}
            onClick={() => activate(key)}
            className={isActive ? CHILD_ACTIVE : CHILD_INACTIVE}
            style={{ fontWeight: isActive ? 400 : 300 }}
          >
            {label}
          </button>
        );
      })}

      {flatNavItems?.map(({ label: rowLabel, key: itemKey }) => {
        const compoundKey = `${L2_FLAT_NAV_KEY_PREFIX}/${itemKey}`;
        const isActive = active === compoundKey;
        const useAccent = Boolean(isActive && flatNavAccentKeys?.includes(itemKey));
        return (
          <button
            key={itemKey}
            type="button"
            onClick={() => activate(compoundKey)}
            className={useAccent ? CHILD_FLAT_ACCENT_ACTIVE : isActive ? CHILD_ACTIVE : CHILD_INACTIVE}
            style={{ fontWeight: isActive ? 400 : 300 }}
          >
            {rowLabel}
          </button>
        );
      })}

      {/* Sections */}
      {sections.map(section => (
        <div key={section.label}>
          <button
            onClick={() => toggle(section.label)}
            className={SECTION_HEADER}
            style={{ fontWeight: 400 }}
          >
            <span>{section.label}</span>
            {expanded[section.label]
              ? <ChevronUp   className="size-4 shrink-0 text-text-icon" />
              : <ChevronDown className="size-4 shrink-0 text-text-icon" />
            }
          </button>

          {expanded[section.label] && section.children.map(child => {
            const { label: childLabel, key: childKey, external: childExternal, nonNav: childNonNav } = l2ChildParts(child);
            const compoundKey = `${section.label}/${childKey}`;
            const isActive = active === compoundKey;

            if (childNonNav) {
              return (
                <div
                  key={`${section.label}/${childKey}`}
                  className={`${CHILD_INACTIVE} cursor-default`}
                  style={{ fontWeight: 300 }}
                >
                  <span>{childLabel}</span>
                  {childExternal && (
                    <ExternalLink className="size-4 shrink-0 text-text-icon" />
                  )}
                </div>
              );
            }

            return (
              <button
                key={`${section.label}/${childKey}`}
                onClick={() => activate(compoundKey)}
                className={isActive ? CHILD_ACTIVE : CHILD_INACTIVE}
                style={{ fontWeight: isActive ? 400 : 300 }}
              >
                <span>{childLabel}</span>
                {childExternal && (
                  <ExternalLink className="size-4 shrink-0 text-text-icon" />
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Footer link */}
      {footerLink && (
        <button
          className={`${FOOTER_ROW_CLS} mt-[2px]`}
          style={{ fontWeight: 400, opacity: footerLink.disabled ? 0.5 : 1 }}
          onClick={footerLink.onClick}
          disabled={footerLink.disabled}
        >
          <span>{footerLink.label}</span>
          {footerLink.external && !footerLink.disabled && (
            <ExternalLink className="size-4 shrink-0 text-text-icon" />
          )}
        </button>
      )}
    </>
  );

  const navScrollClass = "min-h-0 flex-1 overflow-y-auto px-[8px] pb-4";

  return (
    <div className={PANEL} data-no-print={noprint}>
      {stickyNavHeader ? (
        <>
          <div
            className={`sticky top-0 z-10 shrink-0 px-[8px] pt-lg pb-0 ${L2_PANEL_SURFACE}`}
          >
            {titleBlock}
            {headerActionBlock}
          </div>
          <div className={cn(navScrollClass, "pt-0")}>{navScrollBody}</div>
        </>
      ) : (
        <div className={cn(navScrollClass, "pt-lg")}>
          {titleBlock}
          {headerActionBlock}
          {navScrollBody}
        </div>
      )}

      {footerSlot ? (
        <div className="shrink-0 p-2">
          {footerSlot}
        </div>
      ) : null}
    </div>
  );
}
