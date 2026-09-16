import React from 'react';
/* Same asset the LHS "Actions" palette item uses, so card badge / RHS header / palette match. */
import iconRrTasks from '../../../assets/rr-chrome/icon-tasks.svg';

/**
 * Shared wrapper for the stroked badge glyphs. Every one of them takes its colour from
 * `currentColor`, so the badge's accent colour drives the stroke — don't bake a colour in.
 */
function StrokeGlyph({ size = 16, className, children }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Single 4-point sparkle, stroked — the Start badge's glyph. */
export function SparkleOutlineIcon({ size = 16, className }) {
  return (
    <StrokeGlyph size={size} className={className}>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    </StrokeGlyph>
  );
}

/** Lightning bolt, stroked — the Trigger badge's glyph. */
export function ZapOutlineIcon({ size = 16, className }) {
  return (
    <StrokeGlyph size={size} className={className}>
      <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
    </StrokeGlyph>
  );
}

/** Bot, stroked — the Controls palette's Sub-agent glyph (not a node badge). */
export function BotOutlineIcon({ size = 16, className }) {
  return (
    <StrokeGlyph size={size} className={className}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </StrokeGlyph>
  );
}

/** Forking branch, stroked — the Branch badge's glyph. */
export function GitBranchOutlineIcon({ size = 16, className }) {
  return (
    <StrokeGlyph size={size} className={className}>
      <path d="M15 6a9 9 0 0 0-9 9V3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
    </StrokeGlyph>
  );
}

/**
 * One source of truth for the Full canvas per-node-type colours + glyph, shared by the
 * floating card badge (CanvasNodeBadge) and the RHS panel header, so a card and the panel
 * it opens read as the same thing.
 *
 * `Glyph`   = a stroked SVG component (preferred — inherits the accent colour directly).
 * `icon`    = Material Symbols ligature.
 * `maskIcon`= SVG asset painted with the accent colour via CSS mask (the files carry a
 *             baked stroke colour that would clash).
 *
 * Trigger/task accents sit one step lighter than the rest (600 rather than 700): the 700
 * shades read too heavy against these pale backgrounds.
 */
export const NODE_TYPE_BADGES = {
  start:      { Glyph: SparkleOutlineIcon, bg: '#EDE9FE', color: '#7C3AED' },
  trigger:    { Glyph: ZapOutlineIcon,     bg: '#FEF3C7', color: '#D97706' },
  task:       { maskIcon: iconRrTasks,   bg: '#DCFCE7', color: '#16A34A' },
  branch:     { Glyph: GitBranchOutlineIcon, bg: '#E0E7FF', color: '#6366F1' },
  delay:      { icon: 'schedule',        bg: '#E0F2FE', color: '#0369A1' },
  loop:       { icon: 'repeat',          bg: '#FCE7F3', color: '#BE185D' },
  parallel:   { icon: 'splitscreen_add', bg: '#CCFBF1', color: '#0D9488' },
  subagent:   { icon: 'smart_toy',       bg: '#EDE9FE', color: '#7C3AED' },
  procedures: { icon: 'menu_book',       bg: '#EDE9FE', color: '#7C3AED' },
};

/**
 * LHS palette section → the node type whose badge colours that section wears, so the floater
 * rail button, the panel header icon and the canvas badge are all literally the same colour.
 * `Controls` maps to `branch` because Branch is the section's headline control.
 */
const SECTION_NODE_TYPE = {
  Trigger: 'trigger',
  Tasks: 'task',
  Procedures: 'procedures',
  Controls: 'branch',
};

export function getBadgeForSection(section) {
  return NODE_TYPE_BADGES[SECTION_NODE_TYPE[section]] ?? null;
}

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

/** Shared renderer for a badge glyph — stroked SVG, Material ligature, or masked asset. */
export function NodeTypeBadgeIcon({ badge, className, maskClassName }) {
  if (!badge) return null;
  if (badge.Glyph) return <badge.Glyph className={className} />;
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
