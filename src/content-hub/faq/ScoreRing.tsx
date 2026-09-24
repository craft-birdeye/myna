import React from 'react';

function scoreColor(score: number) {
  if (score >= 85) return '#4CAE3D';
  if (score >= 70) return '#D97706';
  return '#DC2626';
}

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing = ({ score, size = 120, strokeWidth = 10 }: ScoreRingProps) => {
  const r = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = scoreColor(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      key={score}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      {/* Score arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      {/* Center score text */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.22}
        fontWeight="600"
        fill={color}
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + size * 0.14}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.095}
        fill="#9CA3AF"
      >
        / 100
      </text>
    </svg>
  );
};
