import React from 'react';

function scoreColor(score: number) {
  if (score >= 85) return '#4CAE3D';
  if (score >= 70) return '#D97706';
  return '#DC2626';
}

interface MiniScoreRingProps {
  score: number;
  size?: number;
}

export const MiniScoreRing = ({ score, size = 40 }: MiniScoreRingProps) => {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <svg
      key={score}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ flexShrink: 0 }}
    >
      <circle cx="20" cy="20" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="600"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
};
