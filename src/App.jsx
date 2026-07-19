import { useMemo } from 'react'
import CombinedSankey from './components/CombinedSankey'
import {
  computeElectricityFlow,
  computeWaterFlow,
  ELECTRICAL_NODE_COLUMN,
  WATER_NODE_COLUMN,
  WATER_SHARED_ROW,
  MAX_DEPTH,
  TIER_BANDS,
} from './lib/flowModel'
import coefficients from './data/coefficients.json'

export default function App() {
  const electricalFlow = useMemo(() => computeElectricityFlow(coefficients), [])
  const waterFlow = useMemo(() => computeWaterFlow(coefficients), [])

  const tracks = useMemo(
    () => [
      { data: electricalFlow, nodeColumn: ELECTRICAL_NODE_COLUMN, width: 620, label: 'Electrical' },
      { data: waterFlow, nodeColumn: WATER_NODE_COLUMN, sharedRow: WATER_SHARED_ROW, width: 260, label: 'Water' },
    ],
    [electricalFlow, waterFlow],
  )

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center gap-4 p-4 sm:p-8"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <h1 className="text-lg sm:text-xl font-semibold text-center mt-4">
        100MW CAISO Data Center — Electrical &amp; Water Flow (Phase 1)
      </h1>
      <p className="text-xs text-center max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        Electrical (orange, MW) and Water (blue, gal/yr) share row alignment by facility tier — each keeps its own
        honest value scale, since the two are different physical units and can't be compared by width directly.
      </p>
      <div className="w-full max-w-6xl mb-8">
        <CombinedSankey tracks={tracks} maxDepth={MAX_DEPTH} height={820} tierBands={TIER_BANDS} />
      </div>
    </div>
  )
}
