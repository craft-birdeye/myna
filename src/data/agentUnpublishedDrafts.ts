/**
 * Live (Active) agent instances that also have an unpublished draft.
 * Used by the workflow editor to block edits on Active and redirect to Draft.
 */
export const INSTANCES_WITH_UNPUBLISHED_DRAFT = new Set([
  'Review response agent - South Region',
])

export function instanceHasUnpublishedDraft(instanceName: string | null | undefined): boolean {
  if (!instanceName) return false
  return INSTANCES_WITH_UNPUBLISHED_DRAFT.has(instanceName)
}
