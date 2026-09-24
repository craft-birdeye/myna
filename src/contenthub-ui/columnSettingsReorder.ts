/** Move item from `from` to sit before visual slot `insertIndex` (0..length). */
export function reorderColumnIds(ids: readonly string[], from: number, insertIndex: number): string[] {
  const next = [...ids];
  const [item] = next.splice(from, 1);
  let to = insertIndex;
  if (from < insertIndex) to -= 1;
  next.splice(to, 0, item);
  return next;
}
