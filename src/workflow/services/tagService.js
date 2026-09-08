// Shared review tag library used by the "Classify tags" workflow action.
// A single module-level list so tags created from one workflow's tag picker
// are searchable from every other one too, like a real tag library.

let _tags = [
  { id: 'tag-vip-patient', name: 'VIP Patient', description: 'High-value patient requiring priority handling.' },
  { id: 'tag-vip-complaint', name: 'VIP Complaint', description: 'Escalated complaint from a VIP account.' },
  { id: 'tag-follow-up', name: 'Follow-up Required', description: 'Review needs a follow-up action from the team.' },
  { id: 'tag-billing-dispute', name: 'Billing Dispute', description: 'Review mentions a billing or insurance charge dispute.' },
  { id: 'tag-spam', name: 'Spam/Fake', description: 'Suspected fake or spam review, flagged for moderation.' },
  { id: 'tag-positive', name: 'Positive Experience', description: 'Highlights a strongly positive patient experience.' },
  { id: 'tag-negative', name: 'Negative Experience', description: 'Highlights a strongly negative patient experience.' },
  { id: 'tag-staff-compliment', name: 'Staff Compliment', description: 'Calls out a specific staff member by name positively.' },
  { id: 'tag-wait-time', name: 'Wait Time Complaint', description: 'Review complains about appointment or wait times.' },
  { id: 'tag-referral', name: 'Referral Mention', description: 'Review mentions referring friends or family.' },
];

let _nextId = 1;

/** All tags currently in the library. */
export function getTags() {
  return _tags;
}

/** Case-insensitive exact name lookup. */
export function findTagByName(name) {
  const needle = (name || '').trim().toLowerCase();
  if (!needle) return null;
  return _tags.find((t) => t.name.toLowerCase() === needle) || null;
}

/** Adds a new tag to the shared library and returns it (or the existing match). */
export function createTag({ name, description = '' }) {
  const trimmedName = (name || '').trim();
  const existing = findTagByName(trimmedName);
  if (existing) return existing;
  const tag = { id: `tag-custom-${_nextId++}`, name: trimmedName, description: description.trim() };
  _tags = [..._tags, tag];
  return tag;
}
