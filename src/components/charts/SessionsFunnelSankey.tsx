import { useMemo, useRef, useState, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import type { SankeyLink, SankeyNode } from './SankeyChart'

export interface SessionsFunnelSankeyProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  nodeColors?: Record<number, string>
  columnHeaders: [string, string, string, string]
  height?: number
  onNodeClick?: (name: string) => void
}

interface LayoutNode {
  id: number
  label: string
  clickName: string
  color: string
  col: number
  y0: number
  y1: number
  hidden: boolean
}

interface PositionedLink {
  sy0: number
  sy1: number
  ty0: number
  ty1: number
  color: string
}

const isPhantom = (name: string) => name.startsWith('__phantom')

function parseLabel(name: string) {
  const lastSpace = name.lastIndexOf(' ')
  if (lastSpace < 0) return { label: name, clickName: name }
  const clickName = name.slice(0, lastSpace)
  const pct = name.slice(lastSpace + 1).replace(/[()]/g, '')
  return { label: `${clickName} ${pct}`, clickName }
}

function computeDepths(nodeCount: number, links: SankeyLink[]) {
  const depths = new Array<number>(nodeCount).fill(-1)
  const remaining = new Array(nodeCount).fill(0)
  links.forEach((l) => { remaining[l.target as number]++ })
  const queue: number[] = []
  for (let i = 0; i < nodeCount; i++) {
    if (remaining[i] === 0) {
      depths[i] = 0
      queue.push(i)
    }
  }
  while (queue.length) {
    const id = queue.shift()!
    links
      .filter((l) => l.source === id)
      .forEach((l) => {
        const t = l.target as number
        depths[t] = Math.max(depths[t], depths[id] + 1)
        remaining[t]--
        if (remaining[t] === 0) queue.push(t)
      })
  }
  return depths
}

function nodeWeight(id: number, links: SankeyLink[]) {
  const inflow = links.filter((l) => l.target === id).reduce((s, l) => s + l.value, 0)
  const outflow = links.filter((l) => l.source === id).reduce((s, l) => s + l.value, 0)
  return Math.max(inflow, outflow)
}

/** Stack sub-outcome nodes inside each parent outcome's vertical band with gaps between branches. */
function layoutSubOutcomeColumn(
  outcomeLayout: LayoutNode[],
  links: SankeyLink[],
  nodes: SankeyNode[],
  nodeColors: Record<number, string>,
  nodePadding: number,
): LayoutNode[] {
  const layout: LayoutNode[] = []
  const outcomes = outcomeLayout.filter((node) => node.col === 2).sort((a, b) => a.y0 - b.y0)

  outcomes.forEach((outcome) => {
    const childLinks = links.filter((link) => link.source === outcome.id)
    if (!childLinks.length) return

    const childTotal = childLinks.reduce((sum, link) => sum + link.value, 0)
    const span = outcome.y1 - outcome.y0
    const gaps = Math.max(0, childLinks.length - 1)
    const availableSpan = span - gaps * nodePadding
    let y = outcome.y0

    childLinks.forEach((link, index) => {
      const childId = link.target as number
      const h = childTotal > 0 ? (link.value / childTotal) * availableSpan : availableSpan / childLinks.length
      const { label, clickName } = parseLabel(nodes[childId].name)
      layout.push({
        id: childId,
        label,
        clickName,
        color: nodeColors[childId] ?? '#9ca3af',
        col: 3,
        y0: y,
        y1: y + h,
        hidden: isPhantom(nodes[childId].name),
      })
      y += h
      if (index < childLinks.length - 1) y += nodePadding
    })
  })

  return layout
}

function layoutColumn(
  ids: number[],
  nodes: SankeyNode[],
  links: SankeyLink[],
  nodeColors: Record<number, string>,
  col: number,
  chartH: number,
  nodePadding: number,
): LayoutNode[] {
  const weights = ids.map((id) => nodeWeight(id, links))
  const total = weights.reduce((s, w) => s + w, 0)
  const gaps = Math.max(0, ids.length - 1)
  const unit = (chartH - gaps * nodePadding) / total
  let y = 0
  return ids.map((id, i) => {
    const h = weights[i] * unit
    const { label, clickName } = parseLabel(nodes[id].name)
    const node: LayoutNode = {
      id,
      label,
      clickName,
      color: nodeColors[id] ?? '#9ca3af',
      col,
      y0: y,
      y1: y + h,
      hidden: isPhantom(nodes[id].name),
    }
    y += h + nodePadding
    return node
  })
}

function positionLinks(
  links: SankeyLink[],
  layout: LayoutNode[],
  nodeColors: Record<number, string>,
): PositionedLink[] {
  const byId = new Map(layout.map((n) => [n.id, n]))
  const sourceOff = new Map<number, number>()
  const targetOff = new Map<number, number>()
  layout.forEach((n) => {
    sourceOff.set(n.id, n.y0)
    targetOff.set(n.id, n.y0)
  })

  const positioned: PositionedLink[] = []
  links.forEach((link) => {
    const s = byId.get(link.source as number)
    const t = byId.get(link.target as number)
    if (!s || !t) return

    const sSpan = s.y1 - s.y0
    const tSpan = t.y1 - t.y0
    const sOut = links.filter((l) => l.source === s.id).reduce((sum, l) => sum + l.value, 0)
    const tIn = links.filter((l) => l.target === t.id).reduce((sum, l) => sum + l.value, 0)
    const sh = (link.value / sOut) * sSpan
    const th = (link.value / tIn) * tSpan
    const sy0 = sourceOff.get(s.id)!
    const ty0 = targetOff.get(t.id)!
    positioned.push({
      sy0,
      sy1: sy0 + sh,
      ty0,
      ty1: ty0 + th,
      color: nodeColors[s.id] ?? '#9ca3af',
    })
    sourceOff.set(s.id, sy0 + sh)
    targetOff.set(t.id, ty0 + th)
  })
  return positioned
}

function ribbonPath(x0: number, y0a: number, y0b: number, x1: number, y1a: number, y1b: number) {
  const mx = (x0 + x1) / 2
  return [
    `M${x0},${y0a}`,
    `C${mx},${y0a} ${mx},${y1a} ${x1},${y1a}`,
    `L${x1},${y1b}`,
    `C${mx},${y1b} ${mx},${y0b} ${x0},${y0b}`,
    'Z',
  ].join(' ')
}

const LABEL_HEIGHT = 14
const MIN_BAR_HEIGHT_FOR_LABEL = 16

/** Hide labels on tiny or overlapping segments; full label shows on hover instead. */
function computeLabelVisibility(nodes: LayoutNode[]) {
  const visible = new Map<number, boolean>()
  const byCol = new Map<number, LayoutNode[]>()

  nodes
    .filter((node) => !node.hidden)
    .forEach((node) => {
      const colNodes = byCol.get(node.col) ?? []
      colNodes.push(node)
      byCol.set(node.col, colNodes)
    })

  byCol.forEach((colNodes) => {
    const sorted = [...colNodes].sort((a, b) => a.y0 - b.y0)
    let lastLabelBottom = -Infinity

    sorted.forEach((node) => {
      const height = node.y1 - node.y0
      const centerY = (node.y0 + node.y1) / 2
      const labelTop = centerY - LABEL_HEIGHT / 2
      const labelBottom = centerY + LABEL_HEIGHT / 2
      const tooSmall = height < MIN_BAR_HEIGHT_FOR_LABEL
      const overlaps = labelTop < lastLabelBottom + 2
      const show = !tooSmall && !overlaps
      visible.set(node.id, show)
      if (show) lastLabelBottom = labelBottom
    })
  })

  return visible
}

export function SessionsFunnelSankey({
  nodes,
  links,
  nodeColors = {},
  columnHeaders,
  height = 400,
  onNodeClick,
}: SessionsFunnelSankeyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  const [hoverTip, setHoverTip] = useState<{ label: string; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const margin = { top: 8, right: 12, bottom: 8, left: 12 }
  const nodePadding = 4
  const barW = 12
  const headerH = 20
  const chartH = height - margin.top - margin.bottom
  const contentW = width - margin.left - margin.right
  const colCount = columnHeaders.length
  const colX = (col: number) => margin.left + col * (contentW - barW) / (colCount - 1)

  const { layoutNodes, layoutLinks } = useMemo(() => {
    const depths = computeDepths(nodes.length, links)
    const colIds: number[][] = Array.from({ length: colCount }, () => [])
    depths.forEach((d, i) => colIds[d].push(i))

    const layout: LayoutNode[] = []
    colIds.forEach((ids, col) => {
      if (col === 3) {
        const outcomeLayout = layout.filter((node) => node.col === 2)
        layout.push(...layoutSubOutcomeColumn(outcomeLayout, links, nodes, nodeColors, nodePadding))
      } else {
        layout.push(...layoutColumn(ids, nodes, links, nodeColors, col, chartH, nodePadding))
      }
    })

    const positioned = positionLinks(links, layout, nodeColors)
    return { layoutNodes: layout, layoutLinks: positioned }
  }, [nodes, links, nodeColors, chartH, colCount])

  const nodeById = useMemo(() => new Map(layoutNodes.map((n) => [n.id, n])), [layoutNodes])
  const labelVisibility = useMemo(() => computeLabelVisibility(layoutNodes), [layoutNodes])

  function showHoverTip(label: string, event: ReactMouseEvent) {
    setHoverTip({ label, x: event.clientX, y: event.clientY })
  }

  function clearHoverTip() {
    setHoverTip(null)
  }

  function handleSegmentClick(clickName: string) {
    onNodeClick?.(clickName)
  }

  const labelX = (node: LayoutNode) => {
    const x = colX(node.col)
    if (node.col >= 2) {
      // Left-aligned in the gap before the bar — text ends at the bar edge
      return x - 6
    }
    return x + barW + 6
  }

  const columnHeaderStyle = (colIndex: number) => {
    const base = {
      position: 'absolute' as const,
      fontSize: 12,
      fontWeight: 400,
      color: '#9CA3AF',
      fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap' as const,
    }
    if (colIndex === 1 || colIndex === 2) {
      return { ...base, left: colX(colIndex) + barW / 2, transform: 'translateX(-50%)' }
    }
    // Sub-outcome header sits in the gap left of the bar so it stays visible.
    if (colIndex >= 3) {
      return { ...base, left: colX(colIndex) - 6, transform: 'translateX(-100%)' }
    }
    return { ...base, left: colX(colIndex) }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', height: headerH, marginBottom: 0, overflow: 'visible' }}>
        {columnHeaders.map((label, i) => (
          <span key={label} style={columnHeaderStyle(i)}>
            {label}
          </span>
        ))}
      </div>
      <svg width={width} height={height} style={{ display: 'block', overflow: 'hidden' }}>
        <defs>
          <clipPath id="sessions-funnel-clip">
            <rect x={0} y={margin.top} width={width} height={chartH} />
          </clipPath>
          {[2, 3].map((col) => (
            <clipPath key={col} id={`sessions-funnel-label-${col}`}>
              <rect
                x={colX(col - 1) + barW + 4}
                y={margin.top}
                width={colX(col) - colX(col - 1) - barW - 8}
                height={chartH}
              />
            </clipPath>
          ))}
        </defs>
        <g clipPath="url(#sessions-funnel-clip)">
          {links.map((link, i) => {
            const pl = layoutLinks[i]
            const s = nodeById.get(link.source as number)
            const t = nodeById.get(link.target as number)
            if (!pl || !s || !t || isPhantom(nodes[link.target as number]?.name)) return null
            const ribbonLabel = `${s.clickName} → ${t.clickName}`
            return (
              <path
                key={i}
                d={ribbonPath(
                  colX(s.col) + barW,
                  pl.sy0 + margin.top,
                  pl.sy1 + margin.top,
                  colX(t.col),
                  pl.ty0 + margin.top,
                  pl.ty1 + margin.top,
                )}
                fill={pl.color}
                fillOpacity={0.2}
                stroke="transparent"
                strokeWidth={10}
                style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                onClick={() => handleSegmentClick(t.clickName)}
                onMouseEnter={(event) => showHoverTip(ribbonLabel, event)}
                onMouseMove={(event) => showHoverTip(ribbonLabel, event)}
                onMouseLeave={clearHoverTip}
              />
            )
          })}
          {layoutNodes.filter((n) => !n.hidden).map((node) => {
            const x = colX(node.col)
            const y = node.y0 + margin.top
            const h = node.y1 - node.y0
            const labelOnLeft = node.col >= 2
            const showLabel = labelVisibility.get(node.id) ?? true
            const tipLabel = node.label
            return (
              <g key={node.id}>
                <rect
                  x={x - 4}
                  y={y}
                  width={barW + 8}
                  height={Math.max(h, 4)}
                  rx={2}
                  fill="transparent"
                  style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
                  onClick={() => handleSegmentClick(node.clickName)}
                  onMouseEnter={(event) => showHoverTip(tipLabel, event)}
                  onMouseMove={(event) => showHoverTip(tipLabel, event)}
                  onMouseLeave={clearHoverTip}
                />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={2}
                  fill={node.color}
                  style={{ pointerEvents: 'none' }}
                />
                {showLabel && (
                  <text
                    x={labelX(node)}
                    y={y + h / 2}
                    textAnchor={labelOnLeft ? 'end' : 'start'}
                    dominantBaseline="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize={12}
                    fontWeight={400}
                    fill="#0d0d12"
                    clipPath={labelOnLeft ? `url(#sessions-funnel-label-${node.col})` : undefined}
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.label}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      {hoverTip && (
        <div
          className="pointer-events-none fixed z-[120] -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-sm bg-tooltip px-sm py-xs text-small text-white shadow-tooltip"
          style={{ left: hoverTip.x, top: hoverTip.y }}
        >
          {hoverTip.label}
        </div>
      )}
    </div>
  )
}
