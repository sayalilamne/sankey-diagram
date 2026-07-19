import { useMemo } from 'react'
import { sankey } from 'd3-sankey'
import { linkVertical } from 'd3-shape'
import designTokens from '../data/designTokens.json'

const MARGIN = 24
const NODE_THICKNESS = 14

function colorFromVar(varName) {
  return designTokens[varName.replace('--', '')]
}

export default function SankeyDiagram({ data, nodeColumn, width, height, ariaLabel }) {
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
      .nodePadding(10)
      .nodeAlign((node) => nodeColumn[node.id])
      // extent's axes are swapped here on purpose: d3-sankey lays out
      // horizontally by default, so feeding it [height, width] and
      // transposing coordinates when drawing produces a vertical layout.
      .extent([
        [MARGIN, MARGIN],
        [height - MARGIN, width - MARGIN],
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
        node.labelOffset = i % 2 === 0 ? 5 : 15
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
  }, [data, nodeColumn, width, height])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      role="img"
      aria-label={ariaLabel}
    >
      {linkPaths.map((link, i) => (
        <path
          key={i}
          d={link.d}
          fill="none"
          stroke={link.color}
          strokeWidth={link.width}
          strokeOpacity={0.75}
        />
      ))}
      {nodePositions.map((node) => (
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
