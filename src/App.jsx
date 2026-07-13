import { useMemo } from 'react'
import SankeyElectricity from './components/SankeyElectricity'
import { computeElectricityFlow } from './lib/flowModel'
import coefficients from './data/coefficients.json'

export default function App() {
  const flow = useMemo(() => computeElectricityFlow(coefficients), [])

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-4 p-4"
      style={{ background: 'var(--bg-base)', color: 'var(--text-on-dark)' }}
    >
      <h1 className="text-lg sm:text-xl font-semibold text-center">
        100MW CAISO Data Center — Electricity Flow (Phase 1)
      </h1>
      <SankeyElectricity data={flow} />
    </div>
  )
}
