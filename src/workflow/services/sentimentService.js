// Default sentiment classifications used by the "Social sentiment classifier" workflow action.

const DEFAULT_SENTIMENTS = [
  {
    id: 'sentiment-positive',
    name: 'Positive',
    description:
      'The message clearly expresses satisfaction, praise, gratitude, or a positive emotional tone toward the business, product, service, or experience. This includes supportive text, positive emojis, or symbols.',
  },
  {
    id: 'sentiment-negative',
    name: 'Negative',
    description:
      'The message clearly expresses dissatisfaction, criticism, anger, or a negative emotional tone. This may include complaints, negative experiences, or hostile emojis/symbols.',
  },
  {
    id: 'sentiment-neutral',
    name: 'Neutral',
    description:
      'The message is factual, ambiguous, or lacks emotional expression. It may contain questions, general updates, or statements without a strong emotional tone. Neutral emojis or context-free responses also fall into this category.',
  },
];

let _sentiments = DEFAULT_SENTIMENTS.map((s) => ({ ...s, isDefault: true }));
let _nextId = 1;

/** All sentiment classifications currently configured. */
export function getSentiments() {
  return _sentiments;
}

/** The seed definition for a default sentiment (used to power "Restore default"). */
export function getDefaultSentiment(id) {
  return DEFAULT_SENTIMENTS.find((s) => s.id === id) || null;
}

/** Edits a sentiment in place; returns the updated sentiment (or null when the id is unknown). */
export function updateSentiment(id, { name, description = '' }) {
  const existing = _sentiments.find((s) => s.id === id);
  if (!existing) return null;
  const updated = { ...existing, name: (name || '').trim() || existing.name, description: description.trim() };
  _sentiments = _sentiments.map((s) => (s.id === id ? updated : s));
  return updated;
}

/** Adds a new custom sentiment classification and returns it. */
export function createSentiment({ name, description = '' }) {
  const sentiment = {
    id: `sentiment-custom-${_nextId++}`,
    name: (name || '').trim(),
    description: description.trim(),
    isDefault: false,
  };
  _sentiments = [..._sentiments, sentiment];
  return sentiment;
}

/** Removes a sentiment classification. */
export function deleteSentiment(id) {
  _sentiments = _sentiments.filter((s) => s.id !== id);
}

/** Drops every custom sentiment and resets the defaults to their seed values. */
export function restoreDefaultSentiments() {
  _sentiments = DEFAULT_SENTIMENTS.map((s) => ({ ...s, isDefault: true }));
  return _sentiments;
}

/** True when the list is exactly the untouched seed set (nothing to restore). */
export function isSentimentListAtDefault(sentiments) {
  if (sentiments.length !== DEFAULT_SENTIMENTS.length) return false;
  return DEFAULT_SENTIMENTS.every((def, i) => {
    const s = sentiments[i];
    return !!s && s.id === def.id && s.name === def.name && s.description === def.description;
  });
}
