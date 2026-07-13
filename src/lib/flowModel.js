// Pure derivation of the electricity Sankey's node/link values from scenario
// coefficients. cooling/aux split and heat_recovery_pct are provisional
// placeholders (Section 7/13 of PROJECT_SCOPE.md leaves these unpinned) —
// replace with LBNL/DOE-sourced values in a later phase.

export const NODE_COLUMN = {
  grid: 0,
  solar: 0,
  battery: 0,
  switchgear: 1,
  it_load: 2,
  cooling: 2,
  aux: 2,
  switchgear_loss: 2,
  waste_heat: 3,
  heat_recovered: 4,
  heat_rejected: 4,
}

export function computeElectricityFlow({
  capacity_mw,
  pue,
  switchgear_loss_pct,
  power_mix_ratio,
  overhead_split,
  heat_recovery_pct,
}) {
  const itLoad = capacity_mw
  const totalFacility = itLoad * pue
  const overhead = totalFacility - itLoad
  const cooling = overhead * overhead_split.cooling
  const aux = overhead * overhead_split.aux

  const switchgearInput = totalFacility / (1 - switchgear_loss_pct)
  const switchgearLoss = switchgearInput - totalFacility

  const grid = switchgearInput * power_mix_ratio.grid
  const solar = switchgearInput * power_mix_ratio.solar
  const battery = switchgearInput * power_mix_ratio.battery

  const wasteHeat = itLoad
  const heatRecovered = wasteHeat * heat_recovery_pct
  const heatRejected = wasteHeat - heatRecovered

  const nodes = [
    { id: 'grid', label: 'CAISO Grid' },
    { id: 'solar', label: 'Solar PV' },
    { id: 'battery', label: 'Battery (BESS)' },
    { id: 'switchgear', label: 'Substation / Switchgear' },
    { id: 'it_load', label: 'IT Load' },
    { id: 'cooling', label: 'Cooling Plant' },
    { id: 'aux', label: 'Lighting/Aux' },
    { id: 'switchgear_loss', label: 'UPS/Transformer Loss' },
    { id: 'waste_heat', label: 'Waste Heat' },
    { id: 'heat_recovered', label: 'Recoverable Heat' },
    { id: 'heat_rejected', label: 'Rejected to Atmosphere' },
  ]

  const links = [
    { source: 'grid', target: 'switchgear', value: grid, colorVar: '--flow-primary' },
    { source: 'solar', target: 'switchgear', value: solar, colorVar: '--flow-primary' },
    { source: 'battery', target: 'switchgear', value: battery, colorVar: '--flow-primary' },
    { source: 'switchgear', target: 'it_load', value: itLoad, colorVar: '--flow-primary' },
    { source: 'switchgear', target: 'cooling', value: cooling, colorVar: '--flow-secondary' },
    { source: 'switchgear', target: 'aux', value: aux, colorVar: '--flow-tertiary' },
    { source: 'switchgear', target: 'switchgear_loss', value: switchgearLoss, colorVar: '--flow-tertiary' },
    { source: 'it_load', target: 'waste_heat', value: wasteHeat, colorVar: '--flow-primary' },
    { source: 'waste_heat', target: 'heat_recovered', value: heatRecovered, colorVar: '--accent-highlight' },
    { source: 'waste_heat', target: 'heat_rejected', value: heatRejected, colorVar: '--flow-tertiary' },
  ]

  return { nodes, links }
}
