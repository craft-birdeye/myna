/**
 * Vertical rhythm for directory tables (`AppDataTable`).
 *
 * **Choosing a density (for implementers / LLMs):**
 * - **`default`** — Reference density: **8px grid** (`py-2` cells). Use for primary ledgers
 *   where rows should align with **Payments** / **Contacts** directory (compact, scan-friendly).
 * - **`medium`** — Previous AppDataTable baseline (`py-4` cells, taller header). Use when
 *   rows carry **multi-line** primary cells or extra chrome without feeling cramped.
 * - **`large`** — Maximum comfort (`py-6`). Use sparingly for **sparse** tables or demos.
 *
 * Horizontal padding stays **`px-4`** on all densities (16px, on-grid).
 */
export type AppDataTableRowDensity = "default" | "medium" | "large";

/** Body cell padding classes (includes horizontal). */
export const APP_DATA_TABLE_DENSITY_CELL: Record<AppDataTableRowDensity, string> = {
  default: "px-4 py-2",
  medium: "px-4 py-4",
  large: "px-4 py-6",
};

/** Header cell min-height + padding (sort affordances need vertical room). */
export const APP_DATA_TABLE_DENSITY_HEAD: Record<AppDataTableRowDensity, string> = {
  default: "min-h-10 px-4 py-2",
  medium: "min-h-[52px] px-4 py-4",
  large: "min-h-16 px-4 py-6",
};

/** Column resize handle vertical span (keeps proportional to row band). */
export const APP_DATA_TABLE_DENSITY_RESIZE_HANDLE_H: Record<AppDataTableRowDensity, string> = {
  default: "h-8",
  medium: "h-10",
  large: "h-12",
};
