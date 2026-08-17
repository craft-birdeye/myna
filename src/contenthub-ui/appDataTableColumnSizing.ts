import type { ColumnDef } from "@tanstack/react-table";

/** Optional column meta read by {@link AppDataTable} sizing. */
export type AppDataTableColumnMeta = {
  settingsLabel?: string;
  sizeWeight?: number;
  stopRowClick?: boolean;
};

/** Default asymmetric weights by visible column count (display order). */
export function getDefaultWeights(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  if (n === 2) return [0.62, 0.38];
  if (n === 3) return [0.45, 0.275, 0.275];
  if (n === 4) return [0.34, 0.22, 0.22, 0.22];
  if (n === 5) return [0.28, 0.18, 0.18, 0.18, 0.18];
  const tail = (1 - 0.22) / (n - 1);
  return [0.22, ...Array.from({ length: n - 1 }, () => tail)];
}

/** Build normalized weights from optional per-column `meta.sizeWeight`. */
export function resolveWeights(
  n: number,
  sizeWeights: (number | undefined)[],
): number[] {
  if (n === 0) return [];
  const hasExplicit = sizeWeights.some((w) => w != null && w > 0);
  if (!hasExplicit) return getDefaultWeights(n);

  const explicit = sizeWeights.map((w) => (w != null && w > 0 ? w : 0));
  const sumExplicit = explicit.reduce((a, b) => a + b, 0);
  const implicitIdx = explicit.map((w, i) => (w > 0 ? -1 : i)).filter((i) => i >= 0);
  if (implicitIdx.length === 0) {
    const s = sumExplicit || 1;
    return explicit.map((w) => w / s);
  }
  const remainder = Math.max(0, 1 - sumExplicit);
  const share = remainder / implicitIdx.length;
  const combined = explicit.map((w) => (w > 0 ? w : share));
  const s = combined.reduce((a, b) => a + b, 0) || 1;
  return combined.map((w) => w / s);
}

export type ColumnLayoutInput = {
  id: string;
  minSize: number;
  maxSize: number;
};

/**
 * Pixel widths from container width `W` and weights, clamped to min/max.
 * Remainder after rounding is spread across columns with headroom (primary first).
 */
export function distributeWidths(
  W: number,
  columns: ColumnLayoutInput[],
  weights: number[],
): Record<string, number> {
  const n = columns.length;
  if (n === 0 || W < 1) return {};
  if (weights.length !== n) return {};

  const budget = Math.max(320, Math.floor(W));
  const ideals = weights.map((wt, i) => budget * wt);
  const clamped = ideals.map((ideal, i) =>
    Math.min(columns[i].maxSize, Math.max(columns[i].minSize, Math.round(ideal))),
  );

  let sum = clamped.reduce((a, b) => a + b, 0);
  let delta = budget - sum;
  const out = [...clamped];

  const tryApply = (idx: number, dir: 1 | -1): boolean => {
    const next = out[idx] + dir;
    if (next < columns[idx].minSize || next > columns[idx].maxSize) return false;
    out[idx] = next;
    delta -= dir;
    return true;
  };

  let guard = 0;
  while (delta !== 0 && guard < 4096) {
    guard++;
    let moved = false;
    const indices =
      delta > 0 ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
    for (const i of indices) {
      if (delta === 0) break;
      const dir = delta > 0 ? 1 : -1;
      if (tryApply(i, dir)) moved = true;
    }
    if (!moved) break;
  }

  return Object.fromEntries(columns.map((c, i) => [c.id, out[i]]));
}

export function buildLayoutInputsFromColumnDefs<TData>(
  defs: ColumnDef<TData, unknown>[],
  visibleIdsInOrder: string[],
): ColumnLayoutInput[] {
  const byId = new Map(defs.map((d) => [String(d.id ?? ""), d]));
  return visibleIdsInOrder.map((id) => {
    const def = byId.get(id);
    const declaredMin = (def?.minSize as number | undefined) ?? 72;
    const maxSize = (def?.maxSize as number | undefined) ?? 640;
    /** Resize and layout clamp to `minSize` / `maxSize` only; `size` is the default width via TanStack, not a floor here. */
    const minSize = Math.min(maxSize, declaredMin);
    return { id, minSize, maxSize };
  });
}

export function buildSizeWeightsFromColumnDefs<TData>(
  defs: ColumnDef<TData, unknown>[],
  visibleIdsInOrder: string[],
): (number | undefined)[] {
  const byId = new Map(defs.map((d) => [String(d.id ?? ""), d]));
  return visibleIdsInOrder.map((id) => {
    const meta = byId.get(id)?.meta as AppDataTableColumnMeta | undefined;
    return meta?.sizeWeight;
  });
}
