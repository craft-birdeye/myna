/**
 * App shell chrome — shared by `App.tsx` and App Shell stories so corners stay consistent.
 * L2 column: top-left 8px — `PANEL` in `L2NavLayout.tsx` (`rounded-tl-lg`).
 * Top bar: top-right 8px — `TopBar.tsx` (`rounded-tr-lg`).
 * Main canvas: white fill, right corners 8px (`rounded-tr-lg rounded-br-lg`) via overflow clip.
 */

/**
 * Single 1px frame around L2 + main (+ Myna) below TopBar; grey gutter shows outside (`App.tsx` pr/pb row).
 * Uses `border-app-shell-border` (`--app-shell-border` in `theme.css`). Surfaces: **App chrome** in Design Tokens.
 * Keep L2 `PANEL` seam on the same token (`L2NavLayout.v1.tsx`).
 */
export const APP_SHELL_BELOW_TOPBAR_CARD_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden rounded-lg border border-app-shell-border";

/** Gutter row below TopBar — pair with `pr-[10px] pb-[10px] pl-0` on the same element as in `App.tsx`. */
export const APP_SHELL_GUTTER_SURFACE_CLASS =
  "bg-app-shell-gutter transition-colors duration-300";

/** L1 icon strip + TopBar background. */
export const APP_SHELL_RAIL_SURFACE_CLASS =
  "bg-app-shell-rail transition-colors duration-300";

export const APP_MAIN_CONTENT_SHELL_CLASS =
  "flex-1 flex flex-col min-w-0 overflow-hidden rounded-tr-lg rounded-br-lg bg-app-shell-main";
