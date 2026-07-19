// Granular node/link derivation for the Electrical and Water Sankeys.
// Mirrors workbook/DataCenter_Flow_Model.xlsx exactly (Electricity Flow,
// Cooling Flow, Water Flow, Heat Recovery sheets) for the workbook's default
// scenario (CZ4 San Jose / AI Training / High Reliability / Closed-loop
// Evaporative / Direct-to-Chip / 2-5 years / Power Mix 55-30-15-0), so the
// two deliverables report identical numbers. Loss percentages not explicitly
// given here (0.5%/0.2%/2%/1%) come from the user-provided power-flow
// reference diagram; the IT hardware mix (GPU/TPU/CPU/ASIC/MPU/Fans split)
// is an illustrative assumption — see the workbook's Equipment Efficiencies
// sheet for full documentation of both.

export const ELECTRICAL_NODE_COLUMN = {
  utility_grid: 0, onsite_solar: 0, ess: 0, generator: 0,
  hv_transmission: 1, pv_inverter: 1, pcs: 1, generator_breaker: 1,
  main_mv_bus: 2,
  mv_switchgear: 3,
  utility_transformer: 4,
  lv_switchgear: 5, transformer_loss: 5,
  ats: 6, lv_switchgear_loss: 6,
  it_infra: 7, lighting_aux: 7,
  ups: 8,
  ups_loss: 9, dist_panels: 9,
  pdu: 10,
  rpdu: 11,
  rpdu_loss: 12, server_psu: 12,
  motherboard: 13,
  gpu: 14, tpu: 14, cpu: 14, asic: 14, mpu: 14, fans: 14,
}

// Water's OWN dense column scheme (0-6, no gaps) — this is what gets fed to
// d3-sankey's nodeAlign. d3-sankey's internal computeNodeBreadths indexes an
// array by depth and crashes on skipped indices, so this must stay dense and
// local to water's own graph; it must NOT be the shared 0-14 tier space.
export const WATER_NODE_COLUMN = {
  water_source: 0,
  onsite_pump: 1,
  hvac: 2,
  closed_loop_evaporative: 3,
  chiller: 4,
  facility_water_loop: 5,
  evaporated: 6, blowdown: 6,
}

// Separate from the above: where each water node lands on the SHARED 0-14
// row grid when rendered alongside Electrical, so the two tracks visually
// align by facility tier. This is applied as a post-layout override of each
// node's row position — d3-sankey itself never sees these sparse values, so
// its internal math (which needs dense depths) stays untouched. Electrical
// already spans every depth 0-14 with no gaps, so its own ELECTRICAL_NODE_COLUMN
// doubles as its shared-row mapping without a separate table.
export const WATER_SHARED_ROW = {
  water_source: 0,
  onsite_pump: 2,
  hvac: 6,
  closed_loop_evaporative: 8,
  chiller: 9,
  facility_water_loop: 10,
  evaporated: 12, blowdown: 12,
}

// Direct Liquid Cooling secondary loop — the reference diagram's Heat
// Exchanger -> CDU -> Servers/IT Equipment (DLC) -> Secondary Coolant ->
// Cold Plates -> chip path. This is a THIRD independent track, not part of
// the Water mass-balance track above: it's a closed loop carrying heat
// (MW-thermal), not consumed water (gal/yr) — mixing the two into one
// d3-sankey run would make a 97 MW-th flow render as a barely-visible
// hairline next to a 150-million-gallon flow, since d3-sankey scales widths
// off raw numbers with no unit awareness. Kept as its own track so its
// widths stay honest, same principle as splitting Electrical from Water.
export const DLC_NODE_COLUMN = {
  heat_exchanger: 0,
  cdu: 1,
  dlc_servers: 2,
  secondary_coolant: 3,
  cold_plates: 4,
  cpu_dlc: 5, gpu_dlc: 5, tpu_dlc: 5,
}

export const DLC_SHARED_ROW = {
  heat_exchanger: 9,
  cdu: 10,
  dlc_servers: 11,
  secondary_coolant: 12,
  cold_plates: 13,
  cpu_dlc: 14, gpu_dlc: 14, tpu_dlc: 14,
}

export const MAX_DEPTH = 14

// Tier-band labels for the left-margin rail, matching the reference
// diagram's Utility Level / Campus Infrastructure / Facility Level / Data
// Hall / Server groupings, expressed as inclusive [start, end] column ranges.
export const TIER_BANDS = [
  { label: 'Utility Level', start: 0, end: 2 },
  { label: 'Campus Infrastructure', start: 3, end: 6 },
  { label: 'Facility Level', start: 7, end: 11 },
  { label: 'Data Hall', start: 12, end: 13 },
  { label: 'Server', start: 14, end: 14 },
]

export function computeElectricityFlow({
  capacity_mw,
  pue_floor,
  climate_cooling_mult,
  heat_rejection_pue_factor,
  standby_loss_pct,
  workload_cooling_mult,
  ups_redundancy_factor,
  utility_transformer_loss_pct,
  lv_switchgear_loss_pct,
  ups_heat_loss_pct_base,
  rpdu_loss_pct,
  power_mix_ratio,
  it_hardware_mix,
}) {
  const itLoad = capacity_mw
  const modeledCoolingPUE =
    1 + (pue_floor - 1) * climate_cooling_mult * heat_rejection_pue_factor + standby_loss_pct
  const totalFacility = itLoad * modeledCoolingPUE
  const lightingAux = totalFacility - itLoad

  // Facility level, working backward from the chip
  const rpduInput = itLoad / (1 - rpdu_loss_pct)
  const rpduLoss = rpduInput - itLoad
  const pduInput = rpduInput
  const distPanelInput = pduInput
  const upsLossPctEff = Math.min(0.30, ups_heat_loss_pct_base * ups_redundancy_factor)
  const upsInput = distPanelInput / (1 - upsLossPctEff)
  const upsLoss = upsInput - distPanelInput

  // Campus infrastructure
  const atsInput = upsInput + lightingAux
  const lvswInput = atsInput / (1 - lv_switchgear_loss_pct)
  const lvswLoss = lvswInput - atsInput
  const xfmrInput = lvswInput / (1 - utility_transformer_loss_pct)
  const xfmrLoss = xfmrInput - lvswInput
  const mvBusInput = xfmrInput

  // Utility level — source split
  const grid = mvBusInput * power_mix_ratio.grid
  const solar = mvBusInput * power_mix_ratio.solar
  const battery = mvBusInput * power_mix_ratio.battery
  const generator = mvBusInput * power_mix_ratio.generator

  const nodes = [
    { id: 'utility_grid', label: 'Utility Grid' },
    { id: 'onsite_solar', label: 'On-site Solar' },
    { id: 'ess', label: 'ESS' },
    { id: 'generator', label: 'Generator' },
    { id: 'hv_transmission', label: 'HV Transmission' },
    { id: 'pv_inverter', label: 'PV Inverter' },
    { id: 'pcs', label: 'PCS' },
    { id: 'generator_breaker', label: 'Generator Breaker' },
    { id: 'main_mv_bus', label: 'Main MV BUS' },
    { id: 'mv_switchgear', label: 'MV Switchgear' },
    { id: 'utility_transformer', label: 'Utility Transformer' },
    { id: 'lv_switchgear', label: 'LV Switchgear' },
    { id: 'transformer_loss', label: 'Transformer Loss (0.5%)' },
    { id: 'ats', label: 'ATS' },
    { id: 'lv_switchgear_loss', label: 'LV Switchgear Loss (0.2%)' },
    { id: 'it_infra', label: 'IT Infrastructure/Servers' },
    { id: 'lighting_aux', label: 'Lighting & Building Aux' },
    { id: 'ups', label: 'UPS (N+1)' },
    { id: 'ups_loss', label: 'UPS Heat Loss (2%)' },
    { id: 'dist_panels', label: 'Distribution Panels' },
    { id: 'pdu', label: 'PDUs' },
    { id: 'rpdu', label: 'rPDUs' },
    { id: 'rpdu_loss', label: 'rPDU Loss (1%)' },
    { id: 'server_psu', label: 'Server PSU' },
    { id: 'motherboard', label: 'Motherboard' },
    { id: 'gpu', label: 'GPU' },
    { id: 'tpu', label: 'TPU' },
    { id: 'cpu', label: 'CPU' },
    { id: 'asic', label: 'ASIC' },
    { id: 'mpu', label: 'MPU' },
    { id: 'fans', label: 'Server Fans' },
  ]

  const T = '--flow-primary'
  const A = '--flow-secondary'
  const L = '--flow-tertiary'

  const links = [
    { source: 'utility_grid', target: 'hv_transmission', value: grid, colorVar: T },
    { source: 'hv_transmission', target: 'main_mv_bus', value: grid, colorVar: T },
    { source: 'onsite_solar', target: 'pv_inverter', value: solar, colorVar: T },
    { source: 'pv_inverter', target: 'main_mv_bus', value: solar, colorVar: T },
    { source: 'ess', target: 'pcs', value: battery, colorVar: T },
    { source: 'pcs', target: 'main_mv_bus', value: battery, colorVar: T },
    { source: 'generator', target: 'generator_breaker', value: generator, colorVar: T },
    { source: 'generator_breaker', target: 'main_mv_bus', value: generator, colorVar: T },
    { source: 'main_mv_bus', target: 'mv_switchgear', value: mvBusInput, colorVar: T },
    { source: 'mv_switchgear', target: 'utility_transformer', value: xfmrInput, colorVar: T },
    { source: 'utility_transformer', target: 'lv_switchgear', value: lvswInput, colorVar: T },
    { source: 'utility_transformer', target: 'transformer_loss', value: xfmrLoss, colorVar: L },
    { source: 'lv_switchgear', target: 'ats', value: atsInput, colorVar: T },
    { source: 'lv_switchgear', target: 'lv_switchgear_loss', value: lvswLoss, colorVar: L },
    { source: 'ats', target: 'it_infra', value: upsInput, colorVar: T },
    { source: 'ats', target: 'lighting_aux', value: lightingAux, colorVar: A },
    { source: 'it_infra', target: 'ups', value: upsInput, colorVar: T },
    { source: 'ups', target: 'ups_loss', value: upsLoss, colorVar: L },
    { source: 'ups', target: 'dist_panels', value: distPanelInput, colorVar: T },
    { source: 'dist_panels', target: 'pdu', value: pduInput, colorVar: T },
    { source: 'pdu', target: 'rpdu', value: rpduInput, colorVar: T },
    { source: 'rpdu', target: 'rpdu_loss', value: rpduLoss, colorVar: L },
    { source: 'rpdu', target: 'server_psu', value: itLoad, colorVar: T },
    { source: 'server_psu', target: 'motherboard', value: itLoad, colorVar: T },
    { source: 'motherboard', target: 'gpu', value: itLoad * it_hardware_mix.gpu, colorVar: T },
    { source: 'motherboard', target: 'tpu', value: itLoad * it_hardware_mix.tpu, colorVar: T },
    { source: 'motherboard', target: 'cpu', value: itLoad * it_hardware_mix.cpu, colorVar: T },
    { source: 'motherboard', target: 'asic', value: itLoad * it_hardware_mix.asic, colorVar: T },
    { source: 'motherboard', target: 'mpu', value: itLoad * it_hardware_mix.mpu, colorVar: T },
    { source: 'motherboard', target: 'fans', value: itLoad * it_hardware_mix.fans, colorVar: T },
  ]

  return { nodes, links }
}

export function computeWaterFlow({
  capacity_mw,
  climate_wue_mult,
  heat_rejection_wue_base,
  it_utilization,
  evaporated_share,
}) {
  const HOURS_PER_YEAR = 8760
  const LITERS_PER_GALLON = 3.78541

  const wue = heat_rejection_wue_base * climate_wue_mult
  const annualITEnergyMWh = capacity_mw * it_utilization * HOURS_PER_YEAR
  const waterLiters = wue * annualITEnergyMWh * 1000
  const waterGallons = waterLiters / LITERS_PER_GALLON
  const evapGal = waterGallons * evaporated_share
  const blowGal = waterGallons * (1 - evaporated_share)

  const nodes = [
    { id: 'water_source', label: 'Water Source' },
    { id: 'onsite_pump', label: 'Onsite Pump' },
    { id: 'hvac', label: 'HVAC' },
    { id: 'closed_loop_evaporative', label: 'Closed Loop Evaporative' },
    { id: 'chiller', label: 'Chiller' },
    { id: 'facility_water_loop', label: 'Facility Water Loop' },
    { id: 'evaporated', label: 'Evaporated (Consumed)' },
    { id: 'blowdown', label: 'Blowdown / Discharge' },
  ]

  const W1 = '--flow-water-1'
  const W2 = '--flow-water-2'

  const links = [
    { source: 'water_source', target: 'onsite_pump', value: waterGallons, colorVar: W1 },
    { source: 'onsite_pump', target: 'hvac', value: waterGallons, colorVar: W1 },
    { source: 'hvac', target: 'closed_loop_evaporative', value: waterGallons, colorVar: W1 },
    { source: 'closed_loop_evaporative', target: 'chiller', value: waterGallons, colorVar: W1 },
    { source: 'chiller', target: 'facility_water_loop', value: waterGallons, colorVar: W1 },
    { source: 'facility_water_loop', target: 'evaporated', value: evapGal, colorVar: W2 },
    { source: 'facility_water_loop', target: 'blowdown', value: blowGal, colorVar: W1 },
  ]

  return { nodes, links, waterGallons, wue }
}

export function computeDLCFlow({ capacity_mw, server_heat_loss_pct, it_hardware_mix }) {
  // Chip heat entering the liquid loop = IT Load x the fraction of chip
  // power that becomes heat (97%, per the reference diagram's 95-99% label)
  // — mirrors workbook/DataCenter_Flow_Model.xlsx's Heat Recovery sheet.
  const chipHeat = capacity_mw * server_heat_loss_pct

  // DLC specifically cools CPU/GPU/TPU (the dies the user asked to see) —
  // renormalize just those three shares of the IT hardware mix to sum to
  // 100% of the coolant loop, since ASIC/MPU/Fans aren't part of this path.
  const dlcShareTotal = it_hardware_mix.gpu + it_hardware_mix.tpu + it_hardware_mix.cpu
  const gpuShare = it_hardware_mix.gpu / dlcShareTotal
  const tpuShare = it_hardware_mix.tpu / dlcShareTotal
  const cpuShare = it_hardware_mix.cpu / dlcShareTotal

  const nodes = [
    { id: 'heat_exchanger', label: 'Heat Exchanger' },
    { id: 'cdu', label: 'CDU' },
    { id: 'dlc_servers', label: 'Servers/IT Equipment (DLC)' },
    { id: 'secondary_coolant', label: 'Secondary Coolant' },
    { id: 'cold_plates', label: 'Cold Plates' },
    { id: 'cpu_dlc', label: 'CPU' },
    { id: 'gpu_dlc', label: 'GPU' },
    { id: 'tpu_dlc', label: 'TPU' },
  ]

  const D1 = '--flow-dlc-1'
  const D2 = '--flow-dlc-2'

  const links = [
    { source: 'heat_exchanger', target: 'cdu', value: chipHeat, colorVar: D1 },
    { source: 'cdu', target: 'dlc_servers', value: chipHeat, colorVar: D1 },
    { source: 'dlc_servers', target: 'secondary_coolant', value: chipHeat, colorVar: D1 },
    { source: 'secondary_coolant', target: 'cold_plates', value: chipHeat, colorVar: D1 },
    { source: 'cold_plates', target: 'gpu_dlc', value: chipHeat * gpuShare, colorVar: D2 },
    { source: 'cold_plates', target: 'tpu_dlc', value: chipHeat * tpuShare, colorVar: D2 },
    { source: 'cold_plates', target: 'cpu_dlc', value: chipHeat * cpuShare, colorVar: D2 },
  ]

  return { nodes, links, chipHeat }
}
