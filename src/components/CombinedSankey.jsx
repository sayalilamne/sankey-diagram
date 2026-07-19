import { useMemo } from 'react'
import { sankey } from 'd3-sankey'
import { linkVertical } from 'd3-shape'
import designTokens from '../data/designTokens.json'

const MARGIN = 24
const NODE_THICKNESS = 14
const GAP_BETWEEN_TRACKS = 36

function colorFromVar(varName) {
  return designTokens[varName.replace('--', '')]
}

// Lays out each track with its own independent d3-sankey run (so each
// track's link widths reflect only its own values — MW stays MW-scaled,
// gal/yr stays gal/yr-scaled), then overrides every node's row (depth-axis)
// position with one shared scale derived from a common maxDepth, so a node
// at column N in any track lands at the same pixel row as column N in every
// other track. The value/width axis is left exactly as each track's own
// sankey() computed it — untouched, and never compared across tracks.
function layoutTrack(track, height, maxDepth, xOffset) {
  // `nodeColumn` must be dense (0..N, no gaps) — it drives d3-sankey's own
  // internal layout math, which indexes an array by depth and breaks on
  // skipped values. `sharedRow` (falls back to nodeColumn if a track has no
  // gaps, like Electrical) is applied afterward, purely for rendering, and
  // may be sparse — it only decides where each node's row lands on screen.
  const { data, nodeColumn, sharedRow = nodeColumn, width } = track
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
    .nodePadding(8)
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

  const rawPositions = nodes.map((node) => ({
    id: node.id,
    label: node.label,
    x: node.y0 + xOffset,
    y: node.x0,
    width: node.y1 - node.y0,
    height: node.x1 - node.x0,
  }))

  const rows = new Map()
  for (const node of rawPositions) {
    if (!rows.has(node.y)) rows.set(node.y, [])
    rows.get(node.y).push(node)
  }
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x)
    row.forEach((node, i) => {
      node.labelOffset = i % 2 === 0 ? 5 : 15
    })
  }

  const linkPathGen = linkVertical()
    .source((d) => [d.y0 + xOffset, d.source.x1])
    .target((d) => [d.y1 + xOffset, d.target.x0])

  const linkPaths = links.map((link) => ({
    d: linkPathGen(link),
    width: Math.max(1, link.width),
    color: colorFromVar(link.colorVar),
  }))

  return { nodePositions: rawPositions, linkPaths }
}

export default function CombinedSankey({ tracks, maxDepth, height, tierBands, railWidth = 110 }) {
  const { allNodes, allLinks, totalWidth, rowPitch } = useMemo(() => {
    let xOffset = railWidth
    const allNodes = []
    const allLinks = []
    for (const track of tracks) {
      const { nodePositions, linkPaths } = layoutTrack(track, height, maxDepth, xOffset)
      allNodes.push(...nodePositions)
      allLinks.push(...linkPaths)
      xOffset += track.width + GAP_BETWEEN_TRACKS
    }
    const totalWidth = xOffset - GAP_BETWEEN_TRACKS
    const rowPitch = (height - 2 * MARGIN) / maxDepth
    return { allNodes, allLinks, totalWidth, rowPitch }
  }, [tracks, maxDepth, height, railWidth])

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      role="img"
      aria-label="Combined electrical and water flow Sankey diagram for a 100MW California data center, aligned by facility tier"
    >
      {tierBands.map((band) => {
        const yTop = MARGIN + band.start * rowPitch
        const yBottom = MARGIN + (band.end + 1) * rowPitch
        return (
          <g key={band.label}>
            <line
              x1={0}
              x2={totalWidth}
              y1={yTop}
              y2={yTop}
              stroke={designTokens['line-hairline']}
              strokeWidth={0.5}
            />
            <text
              x={4}
              y={(yTop + yBottom) / 2}
              fontSize={8}
              fontWeight="600"
              fill={designTokens['text-secondary']}
              style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}
            >
              {band.label.split(' ').map((word, i) => (
                <tspan key={i} x={4} dy={i === 0 ? 0 : 9}>
                  {word}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}

      {allLinks.map((link, i) => (
        <path
          key={i}
          d={link.d}
          fill="none"
          stroke={link.color}
          strokeWidth={link.width}
          strokeOpacity={0.75}
        />
      ))}
      {allNodes.map((node) => (
        <g key={node.id}>
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={designTokens['text-primary']}
            fillOpacity={0.08}
            stroke={designTokens['line-hairline']}
            strokeWidth={1}
          />
          <text
            x={node.x + node.width / 2}
            y={node.y - node.labelOffset}
            textAnchor="middle"
            fontSize={7.5}
            fill={designTokens['text-primary']}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
