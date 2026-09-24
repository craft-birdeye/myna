import React from 'react';
import { Tooltip } from '../../components/Tooltip/Tooltip';
import './DraftBlockedTooltip.css';
import '../styles/aero-disabled.css';

/** Tooltip copy + link shown when the live Active version is read-only because a draft exists. */
export function DraftBlockedTooltipContent({ onEditDraft }) {
  return (
    <span className="draft-blocked-tooltip">
      This agent has an unpublished draft. Continue editing the draft.{' '}
      <button
        type="button"
        className="draft-blocked-tooltip__link"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEditDraft?.();
        }}
      >
        Edit draft
      </button>
    </span>
  );
}

const DRAFT_BLOCKED_TOOLTIP_SIDE = 'top';
const DRAFT_BLOCKED_TOOLTIP_OFFSET = 4;
const DRAFT_BLOCKED_TOOLTIP_SHOW_DELAY_MS = 400;

export const draftBlockedTooltipProps = {
  side: DRAFT_BLOCKED_TOOLTIP_SIDE,
  followCursor: true,
  offset: DRAFT_BLOCKED_TOOLTIP_OFFSET,
  showDelay: DRAFT_BLOCKED_TOOLTIP_SHOW_DELAY_MS,
};

/** Wraps a single control (toggle, copy, delete, Save) with the draft-blocked tooltip. */
export function DraftBlockedGuard({
  blocked = false,
  onEditDraft,
  children,
  side = DRAFT_BLOCKED_TOOLTIP_SIDE,
  className = '',
  inline = false,
}) {
  if (!blocked) return children;

  return (
    <Tooltip
      content={<DraftBlockedTooltipContent onEditDraft={onEditDraft} />}
      variant="detail"
      interactive
      {...draftBlockedTooltipProps}
      side={side}
      className={className}
    >
      <span className={`draft-blocked-guard${inline ? ' draft-blocked-guard--inline' : ''}`}>{children}</span>
    </Tooltip>
  );
}

/** Shared draft-blocked / view-only field lock for RHS body panels. */
export function rhsFieldLock({ viewOnly = false, draftBlocked = false } = {}) {
  const inputDisabled = Boolean(draftBlocked && !viewOnly);
  const inputReadOnly = Boolean(viewOnly);
  return {
    inputDisabled,
    inputReadOnly,
    fieldsLocked: inputDisabled || inputReadOnly,
  };
}

/** Wraps one RHS field group — Aero disabled look + draft-blocked tooltip on hover. */
export function DraftBlockedField({
  draftBlocked = false,
  viewOnly = false,
  onEditDraft,
  children,
  className = '',
  side = DRAFT_BLOCKED_TOOLTIP_SIDE,
}) {
  const blocked = draftBlocked && !viewOnly;
  if (!blocked) {
    if (className) return <div className={className}>{children}</div>;
    return children;
  }

  return (
    <DraftBlockedGuard
      blocked
      onEditDraft={onEditDraft}
      side={side}
      className={`draft-blocked-field${className ? ` ${className}` : ''}`}
    >
      {children}
    </DraftBlockedGuard>
  );
}

/** Full-size overlay for RHS field areas — blocks interaction but keeps the panel readable. */
export function DraftBlockedOverlay({ onEditDraft, className = '' }) {
  return (
    <Tooltip
      content={<DraftBlockedTooltipContent onEditDraft={onEditDraft} />}
      variant="detail"
      interactive
      {...draftBlockedTooltipProps}
      className={`draft-blocked-overlay-wrap${className ? ` ${className}` : ''}`}
    >
      <div className="draft-blocked-overlay" aria-hidden />
    </Tooltip>
  );
}

/** Wraps a field pane (below tabs) with the draft-blocked hover overlay. */
export function DraftBlockedSegment({ blocked = false, onEditDraft, children, className = '' }) {
  if (!blocked) {
    if (className) return <div className={className}>{children}</div>;
    return children;
  }

  return (
    <div className={`draft-blocked-segment draft-blocked-segment--rhs-content${className ? ` ${className}` : ''}`}>
      {children}
      <DraftBlockedOverlay onEditDraft={onEditDraft} />
    </div>
  );
}
