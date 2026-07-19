import { useMemo } from 'react'
import CombinedSankey from './components/CombinedSankey'
import {
  computeElectricityFlow,
  computeWaterFlow,
  computeDLCFlow,
  ELECTRICAL_NODE_COLUMN,
  WATER_NODE_COLUMN,
  WATER_SHARED_ROW,
  DLC_NODE_COLUMN,
  DLC_SHARED_ROW,
  MAX_DEPTH,
  TIER_BANDS,
} from './lib/flowModel'
import designTokens from './data/designTokens.json'
import coefficients from './data/coefficients.json'

const LEGEND = [
  { label: 'Electrical energy', unit: 'MW', color: designTokens['flow-primary'] },
  { label: 'Water', unit: 'gal / yr', color: designTokens['flow-water-1'] },
  { label: 'Direct liquid cooling', unit: 'MW-thermal', color: designTokens['flow-dlc-1'] },
  { label: 'Conversion loss', unit: '', color: designTokens['flow-tertiary'] },
]

export default function App() {
  const electricalFlow = useMemo(() => computeElectricityFlow(coefficients), [])
  const waterFlow = useMemo(() => computeWaterFlow(coefficients), [])
  const dlcFlow = useMemo(() => computeDLCFlow(coefficients), [])

  const tracks = useMemo(
    () => [
      {
        data: electricalFlow,
        nodeColumn: ELECTRICAL_NODE_COLUMN,
        width: 640,
        label: 'Electrical',
        unit: 'MW',
        accentVar: '--flow-primary',
      },
      {
        data: waterFlow,
        nodeColumn: WATER_NODE_COLUMN,
        sharedRow: WATER_SHARED_ROW,
        width: 220,
        label: 'Water',
        unit: 'gal/yr',
        accentVar: '--flow-water-1',
      },
      {
        data: dlcFlow,
        nodeColumn: DLC_NODE_COLUMN,
        sharedRow: DLC_SHARED_ROW,
        width: 220,
        label: 'Direct Liquid Cooling',
        unit: 'MW-th',
        accentVar: '--flow-dlc-1',
      },
    ],
    [electricalFlow, waterFlow, dlcFlow],
  )

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-10 sm:px-8"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Hyperscale AI Data Center · California · CAISO
          </div>
          <h1 className="serif text-3xl sm:text-4xl font-bold leading-tight">
            How 100 Megawatts Flows to the Chip
          </h1>
          <p
            className="mt-4 text-sm leading-relaxed max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Electricity, water and coolant traced from the utility grid down to individual GPUs, TPUs and CPUs.
            Three flows share row alignment by facility tier, but each keeps its own honest scale — megawatts,
            gallons per year and thermal megawatts are different physical quantities, so ribbon widths compare
            only <span style={{ fontStyle: 'italic' }}>within</span> a flow, never across.
          </p>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="inline-block rounded-full"
                  style={{ width: 11, height: 11, background: item.color }}
                />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
                {item.unit && (
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {item.unit}
                  </span>
                )}
              </div>
            ))}
          </div>
        </header>

        {/* Diagram card */}
        <div
          className="rounded-2xl p-4 sm:p-7"
          style={{
            background: 'var(--bg-panel)',
            boxShadow: '0 1px 2px rgba(26,20,32,0.04), 0 12px 40px -12px rgba(26,20,32,0.14)',
            border: '1px solid var(--line-hairline)',
          }}
        >
          <CombinedSankey tracks={tracks} maxDepth={MAX_DEPTH} height={860} tierBands={TIER_BANDS} />
        </div>

        <footer className="mt-6 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Hover any ribbon for its value. Model &amp; assumptions:
          <span style={{ color: 'var(--text-secondary)' }}> workbook/DataCenter_Flow_Model.xlsx</span> · Phase 1
        </footer>
      </div>
    </div>
  )
}
