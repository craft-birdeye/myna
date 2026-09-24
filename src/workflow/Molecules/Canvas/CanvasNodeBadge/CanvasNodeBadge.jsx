import React from 'react';
import { useCardBadge } from '../CardBadgeContext';
import { NODE_TYPE_BADGES, NodeTypeBadgeIcon } from '../nodeTypeBadges';
import './CanvasNodeBadge.css';

/** Run-test glyph colours. Deliberately independent of the pill's type colour so the
 *  status reads as a status — the pill itself keeps its Trigger/Action/Branch tint. */
const RUN_STATUS_COLORS = {
  running: '#1976d2',
  done: '#2e7d32',
  fail: '#d32f2f',
};

/** `runStatus` aliases that mean "this step failed" — nothing emits one yet (the test run
 *  only reports running/done), so this is here for whenever a failure state is added. */
const FAIL_STATUSES = new Set(['fail', 'failed', 'error']);

function normaliseRunStatus(runStatus) {
  if (runStatus === 'running' || runStatus === 'done') return runStatus;
  if (FAIL_STATUSES.has(runStatus)) return 'fail';
  return null;
}

/*
 * Centred in its own 16×16 box so `animate`/rotate spins in place — a Material font glyph
 * sits off-centre in its line-box and would orbit instead. Same approach as the run
 * spinner in CanvasNodeHeader / TestRunPanel.
 */
const RunSpinnerIcon = () => (
  <svg className="canvas-node-badge__spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.75" />
    <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

/*
 * Drawn rather than using Material's filled `check_circle` / `error`: in those glyphs the
 * tick/bang is a transparent cutout, so it shows the pill's tint through instead of white.
 * Inline SVG also avoids the `.flow-canvas .material-symbols-outlined` size/fill overrides.
 * The disc takes `currentColor` (the per-status colour); the mark is always white.
 */
const RunDoneIcon = () => (
  <svg className="canvas-node-badge__status-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="8" fill="currentColor" />
    <path
      d="M4.6 8.3 6.85 10.5 11.4 6"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RunFailIcon = () => (
  <svg className="canvas-node-badge__status-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="8" fill="currentColor" />
    <path d="M8 4.1v4.9" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="8" cy="11.5" r="0.95" fill="#fff" />
  </svg>
);

function RunStatusIcon({ status }) {
  if (status === 'running') return <RunSpinnerIcon />;
  if (status === 'done') return <RunDoneIcon />;
  return <RunFailIcon />;
}

/**
 * Floating type badge that sits fully outside (above) a canvas card — the Full canvas
 * design sandbox replaces the card's inline icon+label with this. Renders nothing for
 * every other nav segment, so it's safe to mount unconditionally.
 *
 * During a test run the glyph swaps for a spinner / tick / error icon; the pill keeps its
 * type colour and label so the step is still identifiable mid-run.
 *
 * Must be a child of the card element itself (`.canvas-node`, `position: relative`) so it
 * anchors to the card's own top-left corner regardless of the card's inner padding.
 */
export default function CanvasNodeBadge({ nodeType = 'task', label, runStatus }) {
  const showTypeBadge = useCardBadge();
  const badge = NODE_TYPE_BADGES[nodeType];
  if (!showTypeBadge || !badge || !label) return null;

  const status = normaliseRunStatus(runStatus);

  return (
    <span className="canvas-node-badge" style={{ background: badge.bg, color: badge.color }}>
      {status ? (
        <span className="canvas-node-badge__status" style={{ color: RUN_STATUS_COLORS[status] }}>
          <RunStatusIcon status={status} />
        </span>
      ) : (
        <NodeTypeBadgeIcon badge={badge} maskClassName="canvas-node-badge__mask-icon" />
      )}
      {label}
    </span>
  );
}
