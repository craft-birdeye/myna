/**
 * Shared visual shell for floating overlays (Popover, DropdownMenu, Select, custom menus).
 * 8px corner radius per global spec — no perimeter border, depth from elevation shadow only.
 * Import in primitives and stories; override with `className` only when necessary.
 */
export const FLOATING_PANEL_SURFACE_CLASSNAME =
  "rounded-md bg-popover text-popover-foreground shadow-dropdown dark:shadow-[0_4px_16px_rgba(0,0,0,0.24)]";

/** Default inset padding for list-style content inside the shell (8px grid). */
export const FLOATING_PANEL_LIST_PADDING_CLASSNAME = "p-2";
