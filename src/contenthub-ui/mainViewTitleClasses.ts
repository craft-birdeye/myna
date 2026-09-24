/**
 * Standard main-canvas view header band — unified across all modules.
 * px-2xl = 24px, py-xl = 20px (MYNA 4px grid spacing tokens).
 */
export const MAIN_VIEW_HEADER_BAND_CLASS =
  "flex shrink-0 items-center justify-between bg-surface px-2xl py-xl";

/**
 * Primary title line: canvas `<h1>`, {@link MainCanvasViewHeader}, and Radix
 * Dialog / Sheet / Drawer / AlertDialog titles.
 */
export const MAIN_VIEW_PRIMARY_HEADING_CLASS =
  "text-h3 text-text-primary";

/** Optional one-line subtitle under the primary heading in canvas headers. */
export const MAIN_VIEW_SUBHEADING_CLASS = "mt-0.5 text-small text-text-secondary";
