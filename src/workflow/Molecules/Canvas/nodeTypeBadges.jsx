import React from 'react';
/* Same asset the LHS "Actions" palette item uses, so card badge / RHS header / palette match. */
import iconRrTasks from '../../../assets/rr-chrome/icon-tasks.svg';

/** Single 4-point sparkle, stroked — takes its colour from `currentColor`. */
export function SparkleOutlineIcon({ size = 16, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 1.25Q9.25 6.75 14.75 8Q9.25 9.25 8 14.75Q6.75 9.25 1.25 8Q6.75 6.75 8 1.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * One source of truth for the Full canvas per-node-type colours + glyph, shared by the
 * floating card badge (CanvasNodeBadge) and the RHS panel header, so a card and the panel
 * it opens read as the same thing.
 *
 * `icon`    = Material Symbols ligature.
 * `maskIcon`= SVG asset painted with the accent colour via CSS mask (the files carry a
 *             baked stroke colour that would clash).
 * `sparkle` = render <SparkleOutlineIcon /> instead.
 */
export const NODE_TYPE_BADGES = {
  start:      { sparkle: true,           bg: '#EDE9FE', color: '#7C3AED' },
  trigger:    { icon: 'bolt',            bg: '#FEF3C7', color: '#B45309' },
  task:       { maskIcon: iconRrTasks,   bg: '#DCFCE7', color: '#15803D' },
  branch:     { icon: 'alt_route',       bg: '#E0E7FF', color: '#6366F1' },
  delay:      { icon: 'schedule',        bg: '#E0F2FE', color: '#0369A1' },
  loop:       { icon: 'repeat',          bg: '#FCE7F3', color: '#BE185D' },
  parallel:   { icon: 'splitscreen_add', bg: '#CCFBF1', color: '#0D9488' },
  subagent:   { icon: 'smart_toy',       bg: '#EDE9FE', color: '#7C3AED' },
  procedures: { icon: 'menu_book',       bg: '#EDE9FE', color: '#7C3AED' },
};

/** RHS `variant` → the node type whose badge colours/glyph that panel should wear. */
const VARIANT_NODE_TYPE = {
  start: 'start',
  agentDetails: 'start',
  llmTask: 'task',
  entityTask: 'task',
  voiceCallTask: 'task',
  sendResponseTask: 'task',
  entityTrigger: 'trigger',
  reviewTrigger: 'trigger',
  conversationTrigger: 'trigger',
  branch: 'branch',
  controlBranch: 'branch',
  delay: 'delay',
  parallel: 'parallel',
  loop: 'loop',
  subagent: 'subagent',
  procedureTask: 'procedures',
  procedureDetail: 'procedures',
  createCustomProcedure: 'procedures',
};

export function getBadgeForVariant(variant) {
  return NODE_TYPE_BADGES[VARIANT_NODE_TYPE[variant]] ?? null;
}

/** Shared renderer for a badge glyph — Material ligature, masked asset, or the sparkle. */
export function NodeTypeBadgeIcon({ badge, className, maskClassName }) {
  if (!badge) return null;
  if (badge.sparkle) return <SparkleOutlineIcon className={className} />;
  if (badge.maskIcon) {
    return (
      <span
        className={maskClassName}
        style={{
          WebkitMaskImage: `url("${badge.maskIcon}")`,
          maskImage: `url("${badge.maskIcon}")`,
        }}
        aria-hidden
      />
    );
  }
  return (
    <span className="material-symbols-outlined" aria-hidden>
      {badge.icon}
    </span>
  );
}
