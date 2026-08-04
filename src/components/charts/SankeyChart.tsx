import { useState, useCallback, useRef, useEffect } from 'react'
import { ResponsiveContainer, Sankey } from 'recharts'
import { chartColors } from './chartColors'

export interface SankeyNode {
  name: string
  /** Optional tooltip breakdown shown on hover (for specific nodes) */
  breakdown?: Array<{ label: string; pct: string; value: number }>
}
export interface SankeyLink {
  source: number | string
  target: number | string
  value: number
}
export interface SankeyChartProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  height?: number
  /** Labels for 3 or 4 column groups */
  columnHeaders?: [string, string, string] | [string, string, string, string]
  /** Tooltip text for each column header keyed by index */
  columnHeaderTooltips?: Record<number, string>
  /** Per-node color overrides keyed by node index */
  nodeColors?: Record<number, string>
  /** Node indices that should stay in a middle column (not jump to last). A hidden phantom node is added to anchor them. */
  terminalNodes?: number[]
  /** Called when a node label is clicked, with the node name (without percentage) */
  onNodeClick?: (name: string) => void
  /**
   * Vertical gap between stacked nodes in the same column (default 10). Recharts scales every
   * column to a single shared ratio driven by whichever column is tightest (most nodes / least
   * value) — a hidden phantom node from `terminalNodes` adds one extra gap to its column, which
   * can make that column the bottleneck and leave the others visibly short of full height. Lower
   * this if columns should read as evenly full.
   */
  nodePadding?: number
}

const colorAt = (i: number, overrides?: Record<number, string>) =>
  overrides?.[i] ?? chartColors.categorical[i % chartColors.categorical.length]

const stripPct = (name: string) => {
  const lastSpace = name.lastIndexOf(' ')
  return lastSpace >= 0 && /%\)?$/.test(name.slice(lastSpace + 1)) ? name.slice(0, lastSpace) : name
}

interface LinkHoverState {
  srcIdx: number
  tgtIdx: number
  sourceName: string
  targetName: string
  value: number
  x: number
  y: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeNode(overrides?: Record<number, string>, onHover?: (idx: number | null, x: number, y: number) => void, measuredWidth?: number, onNodeClick?: (name: string) => void, linkHover?: LinkHoverState | null, clearHovers?: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Node({ x, y, width, height, index, payload, containerWidth }: any) {
    const [hovered, setHovered] = useState(false)
    if (payload?.name === '__phantom__' || height < 1) return null
    const cw = measuredWidth || containerWidth || 800
    const onRightEdge = x > cw - 60
    const fill = colorAt(index, overrides)
    const name: string = payload.name ?? ''
    const lastSpace = name.lastIndexOf(' ')
    const labelName = lastSpace >= 0 ? name.slice(0, lastSpace) : name
    const labelPct = lastSpace >= 0 ? name.slice(lastSpace + 1) : ''
    const lx = onRightEdge ? x - 6 : x + width + 6
    const anchor = onRightEdge ? 'end' : 'start'
    const midY = y + height / 2
    const label = labelPct ? `${labelName} ${labelPct.replace(/[()]/g, '')}` : labelName
    const isDimmed = !!linkHover && linkHover.srcIdx !== index && linkHover.tgtIdx !== index
    return (
      <g
        onMouseEnter={(e) => { setHovered(true); onHover?.(index, e.clientX, e.clientY) }}
        onMouseLeave={() => { setHovered(false); onHover?.(null, 0, 0) }}
        onClick={() => { clearHovers?.(); onNodeClick?.(labelName) }}
        style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
        opacity={isDimmed ? 0.25 : 1}
      >
        <rect x={x} y={y} width={width} height={height} rx={2} fill={fill} />
        <text x={lx} y={midY} textAnchor={anchor} dominantBaseline="middle" fontFamily="Roboto" fontSize={12} fontWeight={400} fill="#212121" textDecoration={hovered ? 'underline' : 'none'}>
          {label}
        </text>
      </g>
    )
  }
}

function makeLink(overrides?: Record<number, string>, nameToIndex?: Map<string, number>, onLinkHover?: (state: LinkHoverState | null) => void, linkHover?: LinkHoverState | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Link({ sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, payload }: any) {
    if (payload?.target?.name === '__phantom__' || linkWidth < 0.5) return null
    const src = payload?.source
    const tgt = payload?.target
    // Recharts passes source/target as node objects — resolve to index via name lookup
    const resolveIdx = (node: unknown) => {
      if (typeof node === 'number') return node
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const n = node as any
      if (typeof n?.index === 'number') return n.index
      if (n?.name && nameToIndex) return nameToIndex.get(n.name) ?? 0
      return 0
    }
    const srcIdx = resolveIdx(src)
    const tgtIdx = resolveIdx(tgt)
    const sourceName = stripPct(src?.name ?? '')
    const targetName = stripPct(tgt?.name ?? '')
    const isHighlighted = !!linkHover && linkHover.srcIdx === srcIdx && linkHover.tgtIdx === tgtIdx
    const isDimmed = !!linkHover && !isHighlighted
    return (
      <path
        d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={colorAt(srcIdx, overrides)}
        strokeOpacity={isHighlighted ? 0.55 : isDimmed ? 0.05 : 0.2}
        strokeWidth={linkWidth}
        style={{ cursor: 'pointer', transition: 'stroke-opacity 0.15s' }}
        onMouseEnter={(e) => onLinkHover?.({ srcIdx, tgtIdx, sourceName, targetName, value: payload.value, x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => onLinkHover?.({ srcIdx, tgtIdx, sourceName, targetName, value: payload.value, x: e.clientX, y: e.clientY })}
        onMouseLeave={() => onLinkHover?.(null)}
      />
    )
  }
}

// Shared floating-tooltip chrome — flat (no shadow), matches the `ChartTooltip` used by every
// other chart in the dashboard (bg-surface, rounded-md), with a hairline border standing in for
// the elevation a shadow would otherwise give. `shown` drives a subtle slide + fade transition;
// callers keep rendering the last data for a beat after hiding so the exit animation can play.
const FLOATING_TOOLTIP_BASE =
  'fixed z-[9999] rounded-md border border-border bg-surface pointer-events-none transition-all duration-150 ease-out'
const floatingTooltipVisibility = (shown: boolean, centered = false) =>
  `${centered ? '-translate-x-1/2' : ''} ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`

/* ── Link relationship tooltip ── */
interface LinkTooltipProps {
  x: number
  y: number
  sourceName: string
  targetName: string
  value: number
  shown: boolean
}
function LinkTooltip({ x, y, sourceName, targetName, value, shown }: LinkTooltipProps) {
  return (
    <div
      className={`${FLOATING_TOOLTIP_BASE} whitespace-nowrap px-md py-sm text-small text-text-secondary ${floatingTooltipVisibility(shown)}`}
      style={{ left: x + 12, top: y - 16 }}
    >
      {sourceName} <span className="text-text-tertiary">→</span> {targetName}:{' '}
      <span className="text-text-primary">{value.toLocaleString()} interactions</span>
    </div>
  )
}

/* ── Breakdown tooltip ── */
interface BreakdownTooltipProps {
  x: number
  y: number
  items: Array<{ label: string; pct: string; value: number }>
  shown: boolean
}
function BreakdownTooltip({ x, y, items, shown }: BreakdownTooltipProps) {
  return (
    <div
      className={`${FLOATING_TOOLTIP_BASE} min-w-[220px] p-md text-small ${floatingTooltipVisibility(shown)}`}
      style={{ left: x + 12, top: y - 8 }}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-lg py-xs">
          <span className="text-text-secondary">{item.label}</span>
          <span className="flex gap-sm">
            <span className="text-text-action">{item.pct}</span>
            <span className="text-text-tertiary">{item.value.toLocaleString()}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// Generic show/hide-with-transition helper: keeps rendering the last non-null value for one
// exit-transition beat after it's cleared, and only fades in from a hidden first frame (via rAF)
// on a genuinely new appearance — a value update while already shown just updates in place.
function useTooltipTransition<T>(exitMs = 150) {
  const [data, setData] = useState<T | null>(null)
  const [shown, setShown] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = useCallback((next: T | null) => {
    if (next !== null) {
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
      setData((prev) => {
        if (prev === null) requestAnimationFrame(() => setShown(true))
        else setShown(true)
        return next
      })
    } else {
      setShown(false)
      hideTimer.current = setTimeout(() => setData(null), exitMs)
    }
  }, [exitMs])

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  return { data, shown, set }
}

export function SankeyChart({ nodes, links, height = 360, columnHeaders, columnHeaderTooltips, nodeColors, terminalNodes, onNodeClick, nodePadding = 10 }: SankeyChartProps) {
  const { data: hoverState, shown: hoverShown, set: setHoverState } = useTooltipTransition<{ idx: number; x: number; y: number }>()
  const { data: headerTooltip, shown: headerTooltipShown, set: setHeaderTooltip } = useTooltipTransition<{ text: string; x: number; y: number }>()
  const { data: linkHover, shown: linkHoverShown, set: setLinkHover } = useTooltipTransition<LinkHoverState>()
  const [measuredWidth, setMeasuredWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => setMeasuredWidth(entries[0].contentRect.width))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleHover = useCallback((idx: number | null, x: number, y: number) => {
    if (idx === null) { setHoverState(null); return }
    if (nodes[idx]?.breakdown) setHoverState({ idx, x, y })
    else setHoverState(null)
  }, [nodes, setHoverState])

  // Inject a hidden phantom node so terminalNodes don't jump to the last column.
  // Recharts forces any node with no outgoing links to maxDepth — adding a tiny
  // link to a phantom sink keeps them in their intended middle column.
  const PHANTOM = '__phantom__'
  const phantomIndex = nodes.length
  const sankeyNodes: SankeyNode[] = terminalNodes?.length ? [...nodes, { name: PHANTOM }] : nodes
  const sankeyLinks: SankeyLink[] = terminalNodes?.length
    ? [...links, ...terminalNodes.map((i) => ({ source: i, target: phantomIndex, value: 0.001 }))]
    : links

  const clearHovers = useCallback(() => { setHoverState(null); setLinkHover(null) }, [setHoverState, setLinkHover])

  const nameToIndex = new Map(sankeyNodes.map((n, i) => [n.name, i]))
  const NodeComponent = makeNode(nodeColors, handleHover, measuredWidth, onNodeClick, linkHover, clearHovers)
  const LinkComponent = makeLink(nodeColors, nameToIndex, setLinkHover, linkHover)

  const activeBreakdown = hoverState !== null ? nodes[hoverState.idx]?.breakdown : undefined

  return (
    <div ref={containerRef} style={{ position: 'relative' }} onMouseLeave={clearHovers}>
      {columnHeaders && measuredWidth > 0 && (() => {
        // Recharts Sankey places column i at: marginLeft + i * (width - marginLeft - marginRight - nodeWidth) / (n-1)
        // We center the header over the node bar (nodeWidth=12, marginLeft=10, marginRight=10)
        const n = columnHeaders.length
        const marginL = 10, marginR = 10, nodeW = 12
        const colX = (i: number) =>
          marginL + i * (measuredWidth - marginL - marginR - nodeW) / (n - 1)
        return (
          <div style={{ position: 'relative', height: 20, marginBottom: 0 }}>
            {columnHeaders.map((label, i) => {
              const tip = columnHeaderTooltips?.[i]
              const isFirst = i === 0
              const isLast = i === n - 1
              const leftPos = isFirst ? colX(i) : isLast ? undefined : colX(i) + nodeW / 2
              const rightPos = isLast ? measuredWidth - colX(n - 1) - nodeW : undefined
              return (
                <span
                  key={label}
                  style={{
                    position: 'absolute',
                    ...(isLast ? { right: rightPos } : { left: leftPos }),
                    transform: (!isFirst && !isLast) ? 'translateX(-50%)' : 'none',
                    fontSize: 12,
                    fontWeight: 400,
                    color: '#9CA3AF',
                    fontFamily: 'Roboto, sans-serif',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {label}
                  {tip && (
                    <span
                      onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHeaderTooltip({ text: tip, x: r.left + r.width / 2, y: r.bottom + 6 }) }}
                      onMouseLeave={() => setHeaderTooltip(null)}
                      style={{ cursor: 'default', color: '#bdbdbd', fontSize: 13, lineHeight: 1 }}
                    >ⓘ</span>
                  )}
                </span>
              )
            })}
          </div>
        )
      })()}
      <ResponsiveContainer width="100%" height={height}>
        <Sankey
          data={{ nodes: sankeyNodes, links: sankeyLinks.map((l) => {
            const si = typeof l.source === 'string' ? sankeyNodes.findIndex((n) => n.name === l.source) : l.source
            const ti = typeof l.target === 'string' ? sankeyNodes.findIndex((n) => n.name === l.target) : l.target
            return { ...l, source: si, target: ti }
          }) }}
          nodePadding={nodePadding}
          nodeWidth={12}
          margin={{ top: 8, right: 10, bottom: 8, left: 10 }}
          node={<NodeComponent />}
          link={<LinkComponent />}
        />
      </ResponsiveContainer>

      {activeBreakdown && hoverState && (
        <BreakdownTooltip x={hoverState.x} y={hoverState.y} items={activeBreakdown} shown={hoverShown} />
      )}
      {linkHover && (
        <LinkTooltip x={linkHover.x} y={linkHover.y} sourceName={linkHover.sourceName} targetName={linkHover.targetName} value={linkHover.value} shown={linkHoverShown} />
      )}
      {headerTooltip && (
        <div
          className={`${FLOATING_TOOLTIP_BASE} px-sm py-xs text-small text-text-secondary ${floatingTooltipVisibility(headerTooltipShown, true)}`}
          style={{ left: headerTooltip.x, top: headerTooltip.y, maxWidth: 280, whiteSpace: 'normal' }}
        >
          {headerTooltip.text}
        </div>
      )}
    </div>
  )
}
