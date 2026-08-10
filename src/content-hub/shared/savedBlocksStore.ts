/**
 * savedBlocksStore
 *
 * Lightweight module-level singleton for saved content blocks.
 * Blocks saved from the FAQ canvas appear in the BlockLibraryPanel "Saved" tab
 * for blog and landing page editors.
 *
 * Backed by sessionStorage so blocks persist across view navigation within
 * the same browser session.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type SavedBlockSource = 'faq-section' | 'faq-full' | 'blog';

export interface SavedBlock {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string; // ISO-8601
  sourceType: SavedBlockSource;
  /** Lightweight preview data used to render the thumbnail card. */
  preview: {
    title: string;
    snippets: string[]; // First 2–3 question texts
  };
}

// ── Internal store state ───────────────────────────────────────────────────────

const STORAGE_KEY = 'birdeye:saved-blocks:v1';

/**
 * Seed blocks shown the first time the Saved tab is opened, so the panel
 * demonstrates reusable FAQ sections out of the box instead of an empty state.
 * Only applied when no saved blocks have been persisted yet this session.
 */
const SEED_SAVED_BLOCKS: SavedBlock[] = [
  {
    id: 'seed-hours-location',
    name: 'Hours & location FAQ',
    createdBy: 'Birdeye',
    createdAt: '2026-05-20T09:00:00.000Z',
    sourceType: 'faq-section',
    preview: {
      title: 'Hours & location',
      snippets: [
        'What are your opening hours?',
        'Where is the nearest location?',
        'Do you have parking available?',
      ],
    },
  },
  {
    id: 'seed-reservations',
    name: 'Reservations FAQ',
    createdBy: 'Birdeye',
    createdAt: '2026-05-20T09:05:00.000Z',
    sourceType: 'faq-full',
    preview: {
      title: 'Reservations & booking',
      snippets: [
        'How do I make a reservation?',
        'Can I book a table for a large group?',
        'What is your cancellation policy?',
      ],
    },
  },
  {
    id: 'seed-menu-dietary',
    name: 'Menu & dietary FAQ',
    createdBy: 'Birdeye',
    createdAt: '2026-05-20T09:10:00.000Z',
    sourceType: 'faq-section',
    preview: {
      title: 'Menu & dietary options',
      snippets: [
        'Do you have vegetarian or vegan options?',
        'Can you accommodate food allergies?',
        'Is the menu available online?',
      ],
    },
  },
];

type Listener = (blocks: SavedBlock[]) => void;
const _listeners = new Set<Listener>();
let _blocks: SavedBlock[] = _loadFromStorage();

function _loadFromStorage(): SavedBlock[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    // No persisted state yet → seed with example reusable blocks.
    return raw ? (JSON.parse(raw) as SavedBlock[]) : [...SEED_SAVED_BLOCKS];
  } catch {
    return [...SEED_SAVED_BLOCKS];
  }
}

function _persist(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(_blocks));
  } catch {
    // Ignore storage quota errors in prototype
  }
}

function _notify(): void {
  const snapshot = [..._blocks];
  _listeners.forEach(fn => fn(snapshot));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Returns a snapshot of all saved blocks (newest first). */
export function getSavedBlocks(): SavedBlock[] {
  return [..._blocks];
}

/**
 * Adds a new saved block.  Generates `id` and `createdAt` automatically.
 * Returns the complete saved block record.
 */
export function addSavedBlock(
  block: Omit<SavedBlock, 'id' | 'createdAt'>,
): SavedBlock {
  const full: SavedBlock = {
    ...block,
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  _blocks = [full, ..._blocks];
  _persist();
  _notify();
  return full;
}

/** Removes a saved block by id. */
export function removeSavedBlock(id: string): void {
  _blocks = _blocks.filter(b => b.id !== id);
  _persist();
  _notify();
}

/**
 * Subscribes to store changes.  The listener is called with a fresh snapshot
 * every time the store mutates.  Returns an unsubscribe function.
 */
export function subscribeSavedBlocks(fn: Listener): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
