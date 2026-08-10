/**
 * Persisted slice for {@link AppDataTable} (sessionStorage via `usePersistedState`).
 * Keys align with TanStack Table state fields.
 */
export type AppDataTablePersistedSlice = {
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
};

export const emptyAppDataTablePersistedSlice = (): AppDataTablePersistedSlice => ({
  columnOrder: [],
  columnVisibility: {},
  columnSizing: {},
});

export function buildAppDataTableStorageKey(tableId: string): string {
  return `appdt:v1:${tableId}`;
}
