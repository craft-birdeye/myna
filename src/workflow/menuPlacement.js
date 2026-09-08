/**
 * menuPlacement.js
 *
 * Shared placement math for body-portaled dropdown menus (`tc-dropdown__menu--portaled`).
 * The RHS panel body and the LHS accordions both scroll (`overflow-y: auto`), so an
 * absolutely positioned menu gets clipped at their edge — and disappears behind the
 * panel footer's Save CTA. Portaling to <body> with these fixed coordinates escapes that.
 */

export const MENU_Z_INDEX = 5200;
export const MENU_MAX_HEIGHT = 240;

/** Anchors a body-portaled menu to its trigger, flipping it above when there isn't room
 *  below. `opts` lets taller menus (e.g. the Delay panel's two-line option cards) declare
 *  their own row height / max height instead of the single-line 36px default. */
export function buildFixedMenuStyle(triggerEl, optionCount, zIndex = MENU_Z_INDEX, opts = {}) {
  const { optionHeight = 36, maxHeight = MENU_MAX_HEIGHT } = opts;
  if (!triggerEl) return null;
  const rect = triggerEl.getBoundingClientRect();
  const estimatedHeight = Math.min(optionCount * optionHeight + 8, maxHeight);
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

  return {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    zIndex,
    ...(openUp
      ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(maxHeight, spaceAbove) }
      : { top: rect.bottom + 4, maxHeight: Math.min(maxHeight, spaceBelow) }),
  };
}
