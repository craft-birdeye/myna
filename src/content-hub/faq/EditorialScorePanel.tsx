import React, { useState } from 'react';
import { CheckCircle2, XCircle, TriangleAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { Button } from '@/contenthub-ui/button';
import { scoreColor as scoreBgText, scoreStrokeColor as scoreColor, STATUS_COLORS } from '../shared/scoreColors';

interface Dimension {
  label: string;
  score: number;
  weight: number;
}

interface ComplianceInfo {
  passed: boolean;
  blockedReason?: string;
}

interface Warning {
  text: string;
  type: 'error' | 'warning';
}

interface GateRowProps {
  label: string;
  met: boolean;
  detail: string;
}

const GateRow = ({ label, met, detail }: GateRowProps) => (
  <div className="flex items-start gap-2">
    {met
      ? <CheckCircle2 size={14} strokeWidth={1.6} className="text-accent-positive mt-0.5 shrink-0" />
      : <XCircle size={14} strokeWidth={1.6} className="text-red-500 mt-0.5 shrink-0" />
    }
    <div>
      <p className="text-[12px] text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
    </div>
  </div>
);

interface EditorialScorePanelProps {
  score: number;
  dimensions: Dimension[];
  compliance: ComplianceInfo;
  warnings: Warning[];
  aeoScore?: number;
  isRecalculating?: boolean;
}

export const EditorialScorePanel = ({
  score,
  dimensions,
  compliance,
  warnings,
  aeoScore,
  isRecalculating = false,
}: EditorialScorePanelProps) => {
  const [complianceExpanded, setComplianceExpanded] = useState(false);

  const stateLabel = score >= 80
    ? 'Publish ready'
    : score >= 70
      ? 'Needs improvement'
      : 'Needs work';

  const stateLabelStyle = scoreBgText(score);

  // Publish gate checks
  const gate1 = score >= 80;
  const weakDimension = dimensions.find(d => d.score < 60);
  const gate2 = !weakDimension;
  const gate3 = compliance.passed && !compliance.blockedReason;
  const allGatesMet = gate1 && gate2 && gate3;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Score ring */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {isRecalculating && (
            <div className="absolute inset-0 rounded-full animate-shimmer opacity-60 z-10" />
          )}
          <ScoreRing score={score} size={120} />
        </div>
        <p className="text-[13px] text-muted-foreground">Editorial score</p>
        <span
          className="text-[12px] px-2 py-1 rounded-full"
          style={{ background: stateLabelStyle.bg, color: stateLabelStyle.text }}
        >
          {isRecalculating ? 'Recalculating...' : stateLabel}
        </span>
      </div>

      {/* Dimension bars */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Score breakdown</p>
        {dimensions.map(dim => {
          const { text } = scoreBgText(dim.score);
          return (
            <div key={dim.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-foreground">{dim.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{dim.weight}%</span>
                  <span className="text-[12px]" style={{ color: text }}>{dim.score}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${dim.score}%`, background: text }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance */}
      <div>
        <button
          onClick={() => setComplianceExpanded(v => !v)}
          className="w-full flex items-center gap-2 text-left"
        >
          {compliance.passed
            ? <ShieldCheck size={14} strokeWidth={1.6} className="text-accent-positive shrink-0" />
            : <ShieldX size={14} strokeWidth={1.6} className="text-red-500 shrink-0" />
          }
          <span
            className="text-[12px] px-2 py-0.5 rounded-md"
            style={compliance.passed
              ? { background: STATUS_COLORS.ready.bg, color: STATUS_COLORS.ready.text }
              : { background: STATUS_COLORS.blocked.bg, color: STATUS_COLORS.blocked.text }
            }
          >
            Compliance · {compliance.passed ? 'Passed' : 'Blocked'}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">{complianceExpanded ? '▴' : '▸'}</span>
        </button>
        {complianceExpanded && (
          <div className="mt-2 ml-6 flex flex-col gap-1">
            {['Brand claims verified', 'No PII detected', 'No competitor mentions', 'No regulated terms', 'Hallucination check passed'].map(rule => (
              <div key={rule} className="flex items-center gap-2">
                <CheckCircle2 size={12} strokeWidth={1.6} className="text-accent-positive shrink-0" />
                <span className="text-[11px] text-muted-foreground">{rule}</span>
              </div>
            ))}
          </div>
        )}
        {compliance.blockedReason && (
          <p className="text-[11px] text-red-600 mt-1 ml-6">{compliance.blockedReason}</p>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Warnings</p>
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <TriangleAlert
                size={14}
                strokeWidth={1.6}
                className={w.type === 'error' ? 'text-red-500 shrink-0 mt-0.5' : 'text-text-secondary shrink-0 mt-0.5'}
              />
              <div className="flex-1 flex items-start justify-between gap-2">
                <span className="text-[12px] text-foreground">{w.text}</span>
                <Button variant="ghost" size="sm" className="text-[11px] h-auto py-0.5 px-2 shrink-0">Fix</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AEO Score */}
      {aeoScore !== undefined && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide self-start">AEO score</p>
            <ScoreRing score={aeoScore} size={80} strokeWidth={8} />
            <p className="text-[12px] text-muted-foreground">Answer engine optimization</p>
          </div>
        </>
      )}

      {/* Publish readiness */}
      <div className="border-t border-border" />
      <div className="flex flex-col gap-2">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Publish readiness</p>
        <GateRow
          label="Overall score ≥ 80"
          met={gate1}
          detail={gate1 ? `${score}/100` : `${score}/100 — needs ${80 - score} more points`}
        />
        <GateRow
          label="All dimensions ≥ 60"
          met={gate2}
          detail={gate2 ? 'All dimensions passing' : `${weakDimension?.label}: ${weakDimension?.score}/100`}
        />
        <GateRow
          label="No compliance blocks"
          met={gate3}
          detail={gate3 ? 'Compliance passed' : (compliance.blockedReason || 'Blocked')}
        />
        <div
          className="mt-1 rounded-md px-2 py-2 text-[12px]"
          style={allGatesMet
            ? { background: STATUS_COLORS.ready.bg, color: STATUS_COLORS.ready.text }
            : { background: STATUS_COLORS.blocked.bg, color: STATUS_COLORS.blocked.text }
          }
        >
          {allGatesMet ? '✓ Ready to publish' : 'Not ready to publish — see gates above'}
        </div>
      </div>
    </div>
  );
};
