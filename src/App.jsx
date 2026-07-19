import { useMemo } from 'react'
import SankeyDiagram from './components/SankeyDiagram'
import { computeElectricityFlow, computeWaterFlow, ELECTRICAL_NODE_COLUMN, WATER_NODE_COLUMN } from './lib/flowModel'
import coefficients from './data/coefficients.json'

export default function App() {
  const electricalFlow = useMemo(() => computeElectricityFlow(coefficients), [])
  const waterFlow = useMemo(() => computeWaterFlow(coefficients), [])

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center gap-10 p-4 sm:p-8"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <h1 className="text-lg sm:text-xl font-semibold text-center mt-4">
        100MW CAISO Data Center — Electrical &amp; Water Flow (Phase 1)
      </h1>

      <section className="w-full max-w-4xl flex flex-col items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          Electrical Energy Flow
        </h2>
        <SankeyDiagram
          data={electricalFlow}
          nodeColumn={ELECTRICAL_NODE_COLUMN}
          width={900}
          height={1500}
          ariaLabel="Granular electrical flow Sankey diagram, utility sources through to individual chip types, for a 100MW California data center"
        />
      </section>

      <section className="w-full max-w-2xl flex flex-col items-center gap-3 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          Cooling &amp; Water Flow
        </h2>
        <SankeyDiagram
          data={waterFlow}
          nodeColumn={WATER_NODE_COLUMN}
          width={480}
          height={620}
          ariaLabel="Water flow Sankey diagram, water source through the evaporative cooling loop to evaporated and blowdown losses, for a 100MW California data center"
        />
      </section>
    </div>
  )
}
