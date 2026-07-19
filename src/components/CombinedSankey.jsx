import { useMemo, useState } from 'react'
import { sankey } from 'd3-sankey'
import { linkVertical } from 'd3-shape'
import designTokens from '../data/designTokens.json'

const MARGIN = 28
const NODE_THICKNESS = 11
const NODE_RADIUS = 4
const GAP_BETWEEN_TRACKS = 40

function colorFromVar(varName) {
  return designTokens[varName.replace('--', '')]
}

// Mix a hex color toward white by `amt` (0..1) — used for the leading edge
// of each ribbon gradient so flows read as lit/translucent rather than flat.
function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c) => Math.round(c + (255 - c) * amt)
  return `#${((1 << 24) + (mix(r) << 16) + (mix(g) << 8) + mix(b)).toString(16).slice(1)}`
}

function formatValue(value, unit) {
  if (unit === 'gal/yr') {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M gal/yr`
    return `${Math.round(value).toLocaleString()} gal/yr`
  }
  return `${value.toFixed(value < 10 ? 2 : 1)} ${unit}`
}

// Lays out one track with its own independent d3-sankey run (so each track's
// widths reflect only its own values), then overrides node rows onto a shared
// depth grid so tracks align by facility tier. Also derives per-node color and
// per-link gradient endpoints for the polished rendering layer.
function layoutTrack(track, height, maxDepth, xOffset, trackIndex) {
  const { data, nodeColumn, sharedRow = nodeColumn, width, unit } = track
  const nodeIndex = new Map(data.nodes.map((n, i) => [n.id, i]))
  const graph = {
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.links.map((l) => ({
      source: nodeIndex.get(l.source),
      target: nodeIndex.get(l.target),
      value: l.value,
      colorVar: l.colorVar,
    })),
  }

  const sankeyGenerator = sankey()
    .nodeId((_, i) => i)
    .nodeWidth(NODE_THICKNESS)
    .nodePadding(9)
    .nodeAlign((node) => nodeColumn[node.id])
    .extent([
      [MARGIN, MARGIN],
      [height - MARGIN, width - MARGIN],
    ])

  const { nodes, links } = sankeyGenerator(graph)

  const rowPitch = (height - 2 * MARGIN) / maxDepth
  for (const node of nodes) {
    const row = sharedRow[node.id]
    node.x0 = MARGIN + row * rowPitch
    node.x1 = node.x0 + NODE_THICKNESS
  }

  // Each node takes the color of the flow LEAVING it (outgoing wins), so a
  // terminal node keeps its incoming flow's color.
  const nodeColor = {}
  for (const link of links) nodeColor[nodes[link.target.index].id] = colorFromVar(link.colorVar)
  for (const link of links) nodeColor[nodes[link.source.index].id] = colorFromVar(link.colorVar)

  const rawPositions = nodes.map((node) => ({
    id: node.id,
    label: node.label,
    x: node.y0 + xOffset,
    y: node.x0,
    width: node.y1 - node.y0,
    height: node.x1 - node.x0,
    color: nodeColor[node.id] || designTokens['text-secondary'],
    trackIndex,
  }))

  const rows = new Map()
  for (const node of rawPositions) {
    if (!rows.has(node.y)) rows.set(node.y, [])
    rows.get(node.y).push(node)
  }
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x)
    row.forEach((node, i) => {
      node.labelOffset = i % 2 === 0 ? 6 : 17
    })
  }

  const linkPathGen = linkVertical()
    .source((d) => [d.y0 + xOffset, d.source.x1])
    .target((d) => [d.y1 + xOffset, d.target.x0])

  const linkPaths = links.map((link, i) => {
    const color = colorFromVar(link.colorVar)
    return {
      key: `${trackIndex}-${i}`,
      d: linkPathGen(link),
      width: Math.max(1.2, link.width),
      color,
      gradId: `grad-${trackIndex}-${i}`,
      gx: link.y0 + xOffset,
      gy0: link.source.x1,
      gy1: link.target.x0,
      value: link.value,
      unit,
      sourceLabel: nodes[link.source.index].label,
      targetLabel: nodes[link.target.index].label,
      midX: ((link.y0 + link.y1) / 2) + xOffset,
      midY: (link.source.x1 + link.target.x0) / 2,
    }
  })

  return { nodePositions: rawPositions, linkPaths }
}

export default function CombinedSankey({ tracks, maxDepth, height, tierBands, railWidth = 120 }) {
  const [hovered, setHovered] = useState(null)

  const { allNodes, allLinks, totalWidth, rowPitch, trackHeaders } = useMemo(() => {
    let xOffset = railWidth
    const allNodes = []
    const allLinks = []
    const trackHeaders = []
    for (let t = 0; t < tracks.length; t++) {
      const track = tracks[t]
      const { nodePositions, linkPaths } = layoutTrack(track, height, maxDepth, xOffset, t)
      allNodes.push(...nodePositions)
      allLinks.push(...linkPaths)
      trackHeaders.push({
        label: track.label,
        unit: track.unit,
        color: colorFromVar(track.accentVar),
        x: xOffset + track.width / 2,
      })
      xOffset += track.width + GAP_BETWEEN_TRACKS
    }
    const totalWidth = xOffset - GAP_BETWEEN_TRACKS
    const rowPitch = (height - 2 * MARGIN) / maxDepth
    return { allNodes, allLinks, totalWidth, rowPitch, trackHeaders }
  }, [tracks, maxDepth, height, railWidth])

  const hoveredLink = hovered && allLinks.find((l) => l.key === hovered)

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height + 34}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      role="img"
      aria-label="Combined electrical, water and direct-liquid-cooling flow diagram for a 100MW California data center, aligned by facility tier"
      onMouseLeave={() => setHovered(null)}
    >
      <defs>
        {allLinks.map((link) => (
          <linearGradient
            key={link.gradId}
            id={link.gradId}
            gradientUnits="userSpaceOnUse"
            x1={link.gx}
            y1={link.gy0}
            x2={link.gx}
            y2={link.gy1}
          >
            <stop offset="0%" stopColor={lighten(link.color, 0.28)} />
            <stop offset="100%" stopColor={link.color} />
          </linearGradient>
        ))}
      </defs>

      {/* Tier bands: alternating whisper-tint with a hairline and a label */}
      {tierBands.map((band, i) => {
        const yTop = MARGIN + band.start * rowPitch
        const yBottom = MARGIN + (band.end + 1) * rowPitch
        return (
          <g key={band.label}>
            {i % 2 === 1 && (
              <rect
                x={0}
                y={yTop}
                width={totalWidth}
                height={yBottom - yTop}
                fill={designTokens['bg-secondary']}
                opacity={0.5}
              />
            )}
            <line
              x1={0}
              x2={totalWidth}
              y1={yTop}
              y2={yTop}
              stroke={designTokens['line-hairline']}
              strokeWidth={1}
            />
            <text
              x={8}
              y={(yTop + yBottom) / 2}
              fontSize={9}
              fontWeight="700"
              fill={designTokens['text-muted']}
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {band.label.split(' ').map((word, wi) => (
                <tspan key={wi} x={8} dy={wi === 0 ? 0 : 11}>
                  {word}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}

      {/* Track column headers */}
      {trackHeaders.map((h) => (
        <text
          key={h.label}
          x={h.x}
          y={height + 22}
          textAnchor="middle"
          fontSize={11}
          fontWeight="700"
          fill={h.color}
          style={{ letterSpacing: '0.02em' }}
        >
          {h.label}
          <tspan fill={designTokens['text-muted']} fontWeight="400" fontSize={9.5}>
            {'  '}
            {h.unit}
          </tspan>
        </text>
      ))}

      {/* Ribbons */}
      {allLinks.map((link, i) => {
        const dim = hovered && hovered !== link.key
        const active = hovered === link.key
        const baseOpacity = 0.5
        return (
          <path
            key={link.key}
            className="ribbon"
            d={link.d}
            fill="none"
            stroke={`url(#${link.gradId})`}
            strokeWidth={active ? link.width + 1 : link.width}
            strokeLinecap="round"
            strokeOpacity={dim ? 0.08 : active ? 0.92 : baseOpacity}
            style={{
              '--ribbon-opacity': baseOpacity,
              animationDelay: `${i * 10}ms`,
              transition: 'stroke-opacity 160ms ease, stroke-width 160ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHovered(link.key)}
          />
        )
      })}

      {/* Nodes */}
      {allNodes.map((node, i) => (
        <g key={`${node.trackIndex}-${node.id}`} className="node-in" style={{ animationDelay: `${i * 6}ms` }}>
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={NODE_RADIUS}
            fill={node.color}
            opacity={0.92}
          />
          <text
            x={node.x + node.width / 2}
            y={node.y - node.labelOffset}
            textAnchor="middle"
            fontSize={7.8}
            fontWeight="500"
            fill={designTokens['text-primary']}
          >
            {node.label}
          </text>
        </g>
      ))}

      {/* Hover tooltip */}
      {hoveredLink && (
        <g style={{ pointerEvents: 'none' }}>
          {(() => {
            const label = `${hoveredLink.sourceLabel} → ${hoveredLink.targetLabel}`
            const valueStr = formatValue(hoveredLink.value, hoveredLink.unit)
            const w = Math.max(label.length, valueStr.length) * 5.4 + 20
            const h = 34
            let tx = hoveredLink.midX - w / 2
            tx = Math.max(4, Math.min(totalWidth - w - 4, tx))
            const ty = hoveredLink.midY - h - 8
            return (
              <>
                <rect
                  x={tx}
                  y={ty}
                  width={w}
                  height={h}
                  rx={6}
                  fill={designTokens['text-primary']}
                  opacity={0.96}
                />
                <text x={tx + 10} y={ty + 14} fontSize={8.5} fontWeight="600" fill="#fff">
                  {label}
                </text>
                <text x={tx + 10} y={ty + 26} fontSize={9} fontWeight="700" fill={hoveredLink.color}>
                  {valueStr}
                </text>
              </>
            )
          })()}
        </g>
      )}
    </svg>
  )
}
