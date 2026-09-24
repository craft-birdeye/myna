import { useState, useCallback, useRef, useEffect } from 'react'
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
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
  /** Gap between nodes in the same column (default 10). Use 3–4 for dense funnels. */
  nodePadding?: number
  /** When false, preserves node order within each column (default true in Recharts). */
  sort?: boolean
  /** Layout relaxation iterations (default 32). Lower values keep nodes closer to input order. */
  iterations?: number
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  /** Node depths whose labels render to the left of the bar (e.g. [2, 3] for outcome + sub-outcome). */
  leftLabelDepths?: number[]
  /** Called when a node label is clicked, with the node name (without percentage) */
  onNodeClick?: (name: string) => void
}

const isPhantom = (name?: string) => name?.startsWith('__phantom') ?? false

const colorAt = (i: number, overrides?: Record<number, string>) =>
  overrides?.[i] ?? chartColors.categorical[i % chartColors.categorical.length]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeNode(
  overrides?: Record<number, string>,
  onHover?: (idx: number | null, x: number, y: number) => void,
  measuredWidth?: number,
  onNodeClick?: (name: string) => void,
  leftLabelDepths?: number[],
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Node({ x, y, width, height, index, payload, containerWidth }: any) {
    const [hovered, setHovered] = useState(false)
    if (isPhantom(payload?.name)) return null
    const cw = measuredWidth || containerWidth || 800
    const labelOnLeft = leftLabelDepths?.includes(payload.depth) ?? false
    const onRightEdge = !labelOnLeft && x > cw - 60
    const fill = colorAt(index, overrides)
    const name: string = payload.name ?? ''
    const lastSpace = name.lastIndexOf(' ')
    const labelName = lastSpace >= 0 ? name.slice(0, lastSpace) : name
    const labelPct = lastSpace >= 0 ? name.slice(lastSpace + 1) : ''
    const lx = labelOnLeft || onRightEdge ? x - 6 : x + width + 6
    const anchor = labelOnLeft || onRightEdge ? 'end' : 'start'
    const midY = y + height / 2
    const label = labelPct ? `${labelName} ${labelPct.replace(/[()]/g, '')}` : labelName
    return (
      <g
        onMouseEnter={(e) => { setHovered(true); onHover?.(index, e.clientX, e.clientY) }}
        onMouseLeave={() => { setHovered(false); onHover?.(null, 0, 0) }}
        onClick={() => onNodeClick?.(labelName)}
        style={{ cursor: 'pointer' }}
      >
        <rect x={x} y={y} width={width} height={height} rx={2} fill={fill} />
        <text x={lx} y={midY} textAnchor={anchor} dominantBaseline="middle" fontFamily="Inter, sans-serif" fontSize={12} fontWeight={400} fill="#0d0d12" textDecoration={hovered ? 'underline' : 'none'}>
          {label}
        </text>
      </g>
    )
  }
}

function makeLink(overrides?: Record<number, string>, nameToIndex?: Map<string, number>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Link({ sourceX, sourceY, targetX, targetY, sourceControlX, targetControlX, linkWidth, payload }: any) {
    if (isPhantom(payload?.target?.name) || linkWidth < 0.5) return null
    const src = payload?.source
    // Recharts passes source as a node object — resolve to index via name lookup
    let srcIdx = 0
    if (typeof src === 'number') {
      srcIdx = src
    } else if (typeof src?.index === 'number') {
      srcIdx = src.index
    } else if (src?.name && nameToIndex) {
      srcIdx = nameToIndex.get(src.name) ?? 0
    }
    return (
      <path
        d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={colorAt(srcIdx, overrides)}
        strokeOpacity={0.2}
        strokeWidth={linkWidth}
      />
    )
  }
}

/* ── Breakdown tooltip ── */
interface BreakdownTooltipProps {
  x: number
  y: number
  items: Array<{ label: string; pct: string; value: number }>
}
function BreakdownTooltip({ x, y, items }: BreakdownTooltipProps) {
  return (
    <div style={{
      position: 'fixed', left: x + 12, top: y - 8, zIndex: 9999,
      background: '#fff', border: '1px solid #e5e9f0', borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      padding: '10px 14px', minWidth: 220,
      fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#0d0d12',
      pointerEvents: 'none',
    }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: '4px 0' }}>
          <span style={{ color: '#0d0d12' }}>{item.label}</span>
          <span style={{ display: 'flex', gap: 10 }}>
            <span style={{ color: '#6834b7', fontWeight: 400 }}>{item.pct}</span>
            <span style={{ color: '#717182' }}>{item.value.toLocaleString()}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function SankeyChart({
  nodes,
  links,
  height = 360,
  columnHeaders,
  columnHeaderTooltips,
  nodeColors,
  terminalNodes,
  nodePadding = 10,
  sort = true,
  iterations = 32,
  margin = { top: 8, right: 10, bottom: 8, left: 10 },
  leftLabelDepths,
  onNodeClick,
}: SankeyChartProps) {
  const [hoverState, setHoverState] = useState<{ idx: number; x: number; y: number } | null>(null)
  const [headerTooltip, setHeaderTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
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
  }, [nodes])

  // Inject a hidden phantom node so terminalNodes don't jump to the last column.
  // Recharts forces any node with no outgoing links to maxDepth — adding a tiny
  // link to a phantom sink keeps them in their intended middle column.
  const PHANTOM = '__phantom__'
  const phantomIndex = nodes.length
  const sankeyNodes: SankeyNode[] = terminalNodes?.length ? [...nodes, { name: PHANTOM }] : nodes
  const sankeyLinks: SankeyLink[] = terminalNodes?.length
    ? [...links, ...terminalNodes.map((i) => ({ source: i, target: phantomIndex, value: 0.001 }))]
    : links

  const chartMargin = { top: margin.top ?? 8, right: margin.right ?? 10, bottom: margin.bottom ?? 8, left: margin.left ?? 10 }

  const nameToIndex = new Map(sankeyNodes.map((n, i) => [n.name, i]))
  const NodeComponent = makeNode(nodeColors, handleHover, measuredWidth, onNodeClick, leftLabelDepths)
  const LinkComponent = makeLink(nodeColors, nameToIndex)

  const activeBreakdown = hoverState !== null ? nodes[hoverState.idx]?.breakdown : undefined

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {columnHeaders && measuredWidth > 0 && (() => {
        // Recharts Sankey places column i at: marginLeft + i * (width - marginLeft - marginRight - nodeWidth) / (n-1)
        // We center the header over the node bar (nodeWidth=12, marginLeft=10, marginRight=10)
        const n = columnHeaders.length
        const marginL = chartMargin.left, marginR = chartMargin.right, nodeW = 12
        const colX = (i: number) =>
          marginL + i * (measuredWidth - marginL - marginR - nodeW) / (n - 1)
        return (
          <div style={{ position: 'relative', height: 20, marginBottom: 0 }}>
            {columnHeaders.map((label, i) => {
              const tip = columnHeaderTooltips?.[i]
              const isFirst = i === 0
              const isLast = i === n - 1
              const useLeftHeader = isFirst || isLast
              const leftPos = isFirst ? colX(i) : isLast ? colX(i) : colX(i) + nodeW / 2
              return (
                <span
                  key={label}
                  style={{
                    position: 'absolute',
                    left: leftPos,
                    transform: useLeftHeader ? 'none' : 'translateX(-50%)',
                    fontSize: 12,
                    fontWeight: 400,
                    color: '#9CA3AF',
                    fontFamily: 'Inter, sans-serif',
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
                      style={{ cursor: 'default', color: '#9ca3af', fontSize: 13, lineHeight: 1 }}
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
          sort={sort}
          iterations={iterations}
          margin={chartMargin}
          node={<NodeComponent />}
          link={<LinkComponent />}
        >
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e9f0', fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
        </Sankey>
      </ResponsiveContainer>

      {activeBreakdown && hoverState && (
        <BreakdownTooltip x={hoverState.x} y={hoverState.y} items={activeBreakdown} />
      )}
      {headerTooltip && (
        <div className="pointer-events-none fixed z-[120] -translate-x-1/2 rounded-md bg-text-primary px-sm py-xs text-small text-white" style={{ left: headerTooltip.x, top: headerTooltip.y, maxWidth: 280, whiteSpace: 'normal' }}>
          {headerTooltip.text}
        </div>
      )}
    </div>
  )
}
