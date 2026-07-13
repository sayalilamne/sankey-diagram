import { useMemo } from 'react'
import { sankey } from 'd3-sankey'
import { linkVertical } from 'd3-shape'
import designTokens from '../data/designTokens.json'
import { NODE_COLUMN } from '../lib/flowModel'

const WIDTH = 480
const HEIGHT = 720
const MARGIN = 24
const NODE_THICKNESS = 24

function colorFromVar(varName) {
  return designTokens[varName.replace('--', '')]
}

export default function SankeyElectricity({ data }) {
  const { nodePositions, linkPaths } = useMemo(() => {
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
      .nodePadding(16)
      .nodeAlign((node) => NODE_COLUMN[node.id])
      // extent's axes are swapped here on purpose: d3-sankey lays out
      // horizontally by default, so feeding it [height, width] and
      // transposing coordinates when drawing produces a vertical layout.
      .extent([
        [MARGIN, MARGIN],
        [HEIGHT - MARGIN, WIDTH - MARGIN],
      ])

    const { nodes, links } = sankeyGenerator(graph)

    const rawPositions = nodes.map((node) => ({
      id: node.id,
      label: node.label,
      x: node.y0,
      y: node.x0,
      width: node.y1 - node.y0,
      height: node.x1 - node.x0,
    }))

    // Nodes sharing a row (same depth) can be narrow enough that centered
    // labels collide horizontally — stagger label height per row, ordered
    // by x, so adjacent narrow nodes' labels don't overlap.
    const rows = new Map()
    for (const node of rawPositions) {
      if (!rows.has(node.y)) rows.set(node.y, [])
      rows.get(node.y).push(node)
    }
    for (const row of rows.values()) {
      row.sort((a, b) => a.x - b.x)
      row.forEach((node, i) => {
        node.labelOffset = i % 2 === 0 ? 6 : 18
      })
    }

    const nodePositions = rawPositions

    const linkPathGen = linkVertical()
      .source((d) => [d.y0, d.source.x1])
      .target((d) => [d.y1, d.target.x0])

    const linkPaths = links.map((link) => ({
      d: linkPathGen(link),
      width: Math.max(1, link.width),
      color: colorFromVar(link.colorVar),
    }))

    return { nodePositions, linkPaths }
  }, [data])

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto max-w-2xl"
      role="img"
      aria-label="Electricity flow Sankey diagram for a 100MW California data center"
    >
      {linkPaths.map((link, i) => (
        <path
          key={i}
          d={link.d}
          fill="none"
          stroke={link.color}
          strokeWidth={link.width}
          strokeOpacity={0.85}
        />
      ))}
      {nodePositions.map((node) => (
        <g key={node.id}>
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={designTokens['text-on-dark']}
            fillOpacity={0.15}
            stroke={designTokens['text-on-dark']}
            strokeOpacity={0.3}
          />
          <text
            x={node.x + node.width / 2}
            y={node.y - node.labelOffset}
            textAnchor="middle"
            fontSize={9.5}
            fill={designTokens['text-on-dark']}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
