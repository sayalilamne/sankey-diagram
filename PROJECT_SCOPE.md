# Hybrid-Powered Data Center Energy & Water Flow Dashboard
### Project Scope v2.4 — for Claude Code build + GitHub setup

> **Change log from v2.3:** Color system (Section 8) rebuilt around a **white/light background** instead of the dark plum canvas — driven by two visual references: an abstract flowing-ribbon image whose palette is literally three hue families (purple/magenta, orange, blue), and Simon Scarr's "Wiring the City" SCMP Sankey (clean editorial infographic, white background, organic curved links, serif title). The three hue families now map directly onto the three Sankey diagrams: **Electrical = orange/amber, Cooling & Water = blue, Heat = purple/magenta** (purple is no longer structure-only). Purple/structure tokens are repurposed as sparing UI chrome accents against white rather than a full-canvas dark base. **Not yet revisited:** Section 9's climate-map "muted vs. highlighted" contrast, Section 10's opacity-layering depth technique, and Section 11's particle-glow rendering (`globalCompositeOperation: 'lighter'`) were all written assuming a dark canvas — `lighter` blending in particular does nothing useful against white and will need a different technique. These get worked out when Phase 3 (animation) actually starts, not speculatively now.

> **Change log from v2.2:** Added a left-margin tier-label rail (Section 4) so each horizontal band of the Sankey is explicitly named as the flow descends (Power Source → Site Delivery → Building Load → Heat Outcome), with the water flow's tiers aligned to the same bands where causally linked. Added a docked axonometric California climate-zone map (new Section 9) in the top-right of the flow canvas — highlights the selected climate zone and connects via a leader line into the parts of the flow it drives (Cooling branch, Solar inflow). Page layout (Section 3) and repo structure updated accordingly; all section numbers below shifted by one from v2.2.

> **Change log from v2.1:** All open questions resolved. Heat Recovery Potential ships as a single % readout, no secondary diagram. PUE/WUE scroller conflicts resolved via continuous friction/strain feedback, not hard blocking (Section 5). Scroller interaction is finalized as scroll-responsive sliders — true scroll-jacking is out of scope, not a stretch goal. See Section 16 for the full decision log.

> **Change log from v2.0:** Color palette is now finalized (Section 8) — warm tones (terracotta/amber/peach/champagne) carry all electricity flows, blues (sky blue/powder blue) are reserved exclusively for water, purples handle structure/background. Added an explicit wave/fluid depth technique using stacked opacity layers (Section 10) instead of flat-fill links. Grid/Solar/Battery are now spec'd as texture-differentiated within the warm palette (Section 8) so the three energy sources stay legible without breaking the warm=electricity rule.

> **Change log from v1.0:** Dropped the BYOG/COP framing. Power source is now **Grid + On-site Solar + Battery Storage**, not a self-generation-only model. The scroller now controls **PUE and WUE directly** (not COP as a proxy). RTO/ISO and Data Center Type are no longer inputs — fixed to CAISO / 100MW Hyperscale. Layout is now a fixed **input bar (top) + flow visualization (below)** structure, with a generative-particle intro state before the diagram resolves.

---

## 1. Objective

An interactive, vertically-oriented Sankey dashboard that visualizes how electricity and water flow through a **100 MW hyperscale data center in California, sourced from a hybrid Grid + Solar + Battery supply stack**, from power source down through the building to IT load, heat rejection, and recoverable waste heat — with **PUE and WUE scroll controls** that re-flow the diagram in real time to show efficiency trade-offs.

**Audience:** FANG/MANG technical recruiters and hiring managers for energy/sustainability strategist roles. This is a portfolio centerpiece, not an internal analysis tool — it needs to read as *credible and built on public data*, and it needs to be visually arresting in under 10 seconds of viewing.

**Success criteria**
- A recruiter with no data center background understands PUE/WUE trade-offs within 30 seconds of scrolling.
- A recruiter *with* data center background (e.g., a Google/Meta infra sustainability lead) finds the numbers defensible and the assumptions cited.
- Built entirely on public data — no employer work product, no NBI-derived figures.
- Deploys cleanly to GitHub Pages / Vercel and links from the portfolio site.

---

## 2. Fixed Scope Parameters (not user-configurable)

To keep the model tight and defensible, these are **hardcoded constants**, not dropdowns:

| Constant | Value |
|---|---|
| Capacity | 100 MW critical IT load, hyperscale campus |
| Location | California |
| RTO/ISO | CAISO |
| Power supply architecture | Hybrid: Grid (CAISO) + On-site Solar PV + Battery Energy Storage System (BESS) |

The site/RTO is fixed so the diagram can be genuinely precise (real CAISO fuel mix and interconnection context) rather than a vague multi-region generalization — that precision is what will read as credible to a technical reviewer.

---

## 3. Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  INPUT BAR (sticky, top)                                 │
│  [Climate Zone] [Reliability] [Carbon Goal]              │
│  [Power Mix]    [Workload]    [Speed to Power]           │
└─────────────────────────────────────────────────────────┘
┌────────────┬────────────────────────────┬────────────────┐
│            │                            │  CA CLIMATE MAP │
│ TIER LABEL │   FLOW VISUALIZATION        │  (axonometric,  │
│ RAIL       │   CANVAS                    │  selected zone  │
│ (Power     │   (particles → Sankey,      │  highlighted,   │
│ Source /   │   PUE/WUE scrollers live    │  connector line │
│ Site Del./ │   inside this canvas)       │  into Climate   │
│ Building   │                            │  Zone tier)      │
│ Load / Heat│                            │                 │
│ Outcome)   │                            │                 │
└────────────┴────────────────────────────┴────────────────┘
```
The input bar is a single fixed-height strip at the top — six controls, no nesting, no modal. Below it, three columns share the canvas: a narrow tier-label rail on the left (Section 4), the Sankey flow itself in the center, and a small California climate-zone map docked to the right (Section 9) that stays visually tethered to the flow via a connector line. This keeps the "configure → reveal" narrative clean: the person sets up their scenario once, then the entire rest of the screen is the payoff — and now that payoff includes a legible sense of both *what level* they're looking at and *where in California* the climate assumptions come from.

---

## 4. Core Visualization Concept

**Two vertically-stacked Sankey diagrams sharing a synchronized top-to-bottom axis, rendered inside the canvas below the input bar:**

**A. Electricity flow**
```
Power Supply Stack
   ├── Grid (CAISO)
   ├── On-site Solar PV
   └── Battery Discharge (BESS, charged from solar + grid)
        │
        ▼ (combined at site interconnection / switchgear)
Substation + Switchgear  (transformer/UPS losses: ~2–4%)
        │
        ├── IT Load (compute + storage + network) → Servers → Compute → Waste Heat
        ├── Cooling / HVAC Plant (chillers, CRAH/CRAC, or liquid cooling loop)
        └── Lighting / Building Aux / Losses

Waste Heat
        │
        ├── Rejected to atmosphere (cooling tower / dry cooler)
        └── Heat Recovery Potential (shown as a single "% of waste heat recoverable" readout — no secondary end-use diagram)
```
The three-source merge at the top is the visual payoff of moving away from BYOG: the viewer sees the grid, solar, and battery contributions as three distinct inflows of different widths (widths driven by the **Power Mix** and **Speed to Power** inputs — see Section 6) converging into one trunk before the building-level split.

**B. Water flow (mirrored panel below or beside)**
```
Water Source (municipal potable / reclaimed / groundwater)
        │
Cooling Plant Makeup Water
        │
        ├── Evaporated (consumed — cooling towers)
        ├── Blowdown / Discharge
        └── Reclaim Potential (if reclaimed water program modeled)
```

The two diagrams share a vertical axis so the viewer can visually correlate "more cooling electricity" with "more water consumed" (or the inverse, for dry/air-cooled configs).

**Orientation rationale:** vertical flow reads as "cause falls downward through the building," matching how a data center actually stacks (power supply → building → IT → heat), and differentiates this from the standard horizontal Sankey recruiters have seen a hundred times.

**Left-margin tier labels (new):** run a narrow label rail down the left edge of the flow canvas, outside the Sankey itself, naming each horizontal tier as the eye descends — this is what makes "what level am I looking at" legible without hovering or guessing from node labels alone:

```
┌──────────────┬─────────────────────────────────────┐
│ POWER SOURCE │  Grid ─┬─ Solar ─┬─ Battery           │
├──────────────┼─────────────────────────────────────┤
│ SITE DELIVERY│        Switchgear / UPS                │
├──────────────┼─────────────────────────────────────┤
│ BUILDING LOAD│  IT Load ─┬─ Cooling ─┬─ Aux            │
├──────────────┼─────────────────────────────────────┤
│ HEAT OUTCOME │  Rejected ─┬─ Recoverable (%)          │
└──────────────┴─────────────────────────────────────┘
```
Each label sits vertically centered against its tier's row band, in muted small-caps type (12–13px, `--text-secondary`-equivalent against the dark background — see Section 8), with a thin 0.5px horizontal rule separating tiers so the rail reads as a stepped ruler rather than a list. The water flow's tiers (Source / Makeup / Consumed-Discharged) align to the *same* horizontal bands as their electricity counterparts wherever the two systems are causally linked (e.g. "Building Load" band aligns with "Makeup Water," since cooling load at that tier is what drives water draw) — this reinforces the cause-and-effect reading between the two diagrams rather than just stacking them side by side. On narrow/mobile viewports, collapse the rail to a slim sticky column that stays pinned as the user scrolls vertically through the diagram, rather than dropping the labels entirely.

---

## 5. The PUE / WUE Scrollers (headline interaction)

Two independent vertical scroll-linked controls live inside the visualization canvas (not the input bar) — one for **PUE**, one for **WUE**. This is a deliberate change from a single COP-derived scroller: PUE and WUE are the metrics a sustainability recruiter actually thinks in, and having *two* dials makes the key industry tension explicit — **you can't always minimize both at once.**

**PUE Scroller:** range ≈ **1.6 (older air-cooled plant) → 1.08 (best-in-class liquid-cooled / free-cooling-heavy plant)**
**WUE Scroller:** range ≈ **0.0 L/kWh (fully dry/air-cooled, zero water for cooling) → 2.0+ L/kWh (water-cooled chiller plant in a hot/dry climate)**

As the user scrolls either control:
- Link widths for the **Cooling/HVAC branch** and **IT Load branch** recompute and animate (D3 `.transition()`, ~400–600ms ease) to reflect the new PUE directly — no intermediate COP math surfaced to the viewer, though it still drives the model internally (see formula below).
- Moving the WUE scroller independently re-flows the **water Sankey** — evaporated vs. blowdown split, source mix.
- **The two scrollers interact, and that interaction is the point of the piece:** pushing PUE toward its best value while holding WUE low is the actual industry trade-off (dry cooling saves water but caps how low PUE can go; water-cooled chillers unlock lower PUE but drive WUE up). **Decision: no hard blocking.** Both scrollers remain freely draggable across their full range at all times. Instead, as the user pushes into a combination that's increasingly unrealistic for the shared cooling-technology state (Section 8's coefficient table), the diagram introduces continuous **friction feedback**: the opposing scroller's implied position visibly resists/lags (e.g. the WUE indicator slows its response and edges toward its own physically-consistent value rather than snapping), link widths develop a faint jitter/strain animation, and a subtle warning-tinted glow (not a hard error state) appears on the affected links. This keeps the interaction continuous and honest about real-world trade-offs being gradients, not discrete bands, while still making "you're fighting physics" legible without ever disabling input.
- Heat Recovery Potential branch widens as PUE improves (more headroom heat relative to overhead loss, cleaner low-grade waste heat available to recover) — surfaced purely as the "% of waste heat recoverable" readout described above, with no secondary end-use breakdown for this version.

**Formula sketch (internal only — COP stays a hidden intermediate variable, not user-facing):**
```
COP_effective(PUE) = derived from cooling load share implied by PUE (kW/ton conversion under the hood)
Cooling_Load_MW = Total_Load_MW − IT_Load_MW
PUE = (IT_Load_MW + Cooling_MW + Aux_MW) / IT_Load_MW
Water_Consumption_gal = f(Cooling_Load_MW, cooling_tech_implied_by_WUE_target, climate_zone_wet_bulb)
```
Use a small lookup table (JSON) mapping `{PUE_band, WUE_band}` → an implied cooling technology (dry/air-cooled economizer, water-cooled chiller, direct-to-chip liquid, immersion), plus a continuous "consistency score" between the two values — this score drives the friction feedback described above (the further from a physically-plausible technology match, the more the opposing scroller lags/jitters) and is the detail that reads as "this person actually knows data centers."

---

## 6. Input Bar — Six Controls

Sits as a fixed strip at the top of the page (Section 3). Each control changes underlying model coefficients, not just labels.

| # | Parameter | Options | What it changes |
|---|---|---|---|
| 1 | **Climate Zone** | CA zones relevant to hyperscale siting: CZ3 (Bay Area/Oakland), CZ4 (San Jose), CZ11–13 (Central Valley — Stockton/Sacramento corridor), CZ15 (Imperial/desert) | Free-cooling hours, wet-bulb temp → achievable PUE floor and WUE at a given cooling tech; also solar irradiance for the Power Mix branch |
| 2 | **Energy Reliability** | Standard (99.9%) / High (99.99%) / Five Nines (99.999%) | Backup generation and battery reserve capacity shown as a "reserve, not dispatched" sub-flow; redundant cooling capacity; higher tiers pull the achievable PUE floor slightly worse (more standby overhead) |
| 3 | **Carbon/Sustainability Goal** | Grid-matched (annual), 24/7 CFE (hourly-matched), Unmatched baseline | Clean-energy % overlay/color on the Grid + Solar + Battery inflows (e.g., link color gradient by carbon intensity); 24/7 CFE pushes Solar+Battery share up |
| 4 | **Power Mix Emphasis** | Grid-heavy / Balanced / Solar+Battery-heavy | Relative widths of the three inflow streams (Grid, Solar, Battery) at the top of the electricity Sankey |
| 5 | **Primary Workload** | AI-Training, AI-Inference, Mixed-Cloud, Financial/HFT | Rack density (kW/rack) → which cooling technologies are realistic, IT load shape, achievable PUE floor |
| 6 | **Speed to Power** | <2 years / 2–5 years / 5+ years | How much of the 100MW can realistically come from grid interconnection vs. must come from on-site solar+battery to hit the timeline — directly drives the Power Mix Emphasis default (fast timelines push toward more behind-the-meter solar+battery, since CAISO interconnection queues run long) |

**Workload → cooling implication table (for your own reference building the model):**
- AI-Training: very high rack density (40–130+ kW/rack), strongly favors direct-to-chip liquid or immersion, lower PUE floor achievable but water/liquid infra cost higher
- AI-Inference: moderate density, more flexible on cooling tech
- Mixed-Cloud: lowest density, air cooling still viable, PUE floor is the highest (least room to improve)
- Financial/HFT: moderate density but **reliability-dominated** — redundancy overrides efficiency optimization, so PUE tends to be worse than training clusters of similar size

**Speed to Power ↔ Power Mix note:** this is the most interesting cross-input relationship in the model and worth making visually obvious — a <2 year timeline with Standard reliability practically forces heavier solar+battery reliance (bypassing queue delays), while a 5+ year timeline can lean grid-heavy. Consider having Speed to Power *suggest* a Power Mix default when changed, rather than treating the two as fully independent.

---

## 7. Data Model (JSON schema sketch)

```json
{
  "fixed": {
    "capacity_mw": 100,
    "location": "California",
    "rtoIso": "CAISO",
    "dc_type": "Hyperscale"
  },
  "scenario": {
    "climate_zone": "CZ4",
    "reliability": "High (99.99%)",
    "carbon_goal": "24/7 CFE",
    "power_mix_emphasis": "Balanced",
    "workload": "AI-Training",
    "speed_to_power": "2-5 years"
  },
  "live_controls": {
    "pue_target": 1.25,
    "wue_target": 0.6
  },
  "electricity_nodes": [
    {"id": "grid", "label": "CAISO Grid", "mw": 55},
    {"id": "solar", "label": "On-site Solar PV", "mw": 30},
    {"id": "battery", "label": "Battery Discharge (BESS)", "mw": 15},
    {"id": "switchgear", "label": "Substation/UPS", "loss_pct": 0.03},
    {"id": "it_load", "label": "IT Load"},
    {"id": "cooling", "label": "Cooling Plant"},
    {"id": "aux", "label": "Lighting/Aux"},
    {"id": "waste_heat", "label": "Waste Heat"},
    {"id": "heat_recovered", "label": "Recoverable Heat"},
    {"id": "heat_rejected", "label": "Rejected to Atmosphere"}
  ],
  "water_nodes": [
    {"id": "water_source", "label": "Municipal/Reclaimed Supply"},
    {"id": "makeup_water", "label": "Cooling Tower Makeup"},
    {"id": "evaporated", "label": "Evaporated (Consumed)"},
    {"id": "blowdown", "label": "Blowdown/Discharge"}
  ],
  "coefficients_lookup": {
    "pue_wue_to_cooling_tech": {
      "pue<1.15|wue>1.5": "water_cooled_chiller",
      "pue<1.15|wue<0.5": "direct_to_chip_liquid_with_dry_cooler",
      "pue>1.4|wue<0.3": "air_cooled_economizer"
    },
    "speed_to_power_to_power_mix_default": {
      "<2 years": "Solar+Battery-heavy",
      "2-5 years": "Balanced",
      "5+ years": "Grid-heavy"
    }
  }
}
```
Keep node/link values **derived from the scenario + live_controls object at render time**, not hardcoded — this is what makes the input bar and scrollers feel alive rather than like swapping static images. `live_controls` (PUE/WUE) update on every scroll frame; `scenario` updates only on input-bar changes and can trigger a fuller re-layout/re-accumulate of the particle system (Section 11).

---

## 8. Color System

**v2.4 rebuild — white background, three-hue-family mapping.** Two references drove this: an abstract flowing-ribbon artwork whose palette is three translucent hue families (purple/magenta, orange, blue) blended on white, and Simon Scarr's "Wiring the City" SCMP Sankey — a clean editorial infographic on white, with organic curved links and a distinct color per end-use category. The dashboard now reads as **light and editorial**, not dark and moody: white canvas, three Sankeys each carrying one of the three reference hue families as its signature color, ribbon-style curved (not straight-edged) links, purple demoted from "background" to "sparing UI chrome."

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#FFFFFF` White | Canvas background — full white, per direct instruction |
| `--bg-secondary` | `#F7F5F2` Warm White | Panel fills (input bar, methodology panel) — barely-there contrast against pure white, avoids a harsh flat white-on-white seam |
| `--text-primary` | `#1A1420` Near-Black Plum | Headings and body text against white |
| `--text-secondary` | `#6B6470` Muted Plum-Gray | Captions, tier labels, secondary text |
| `--line-hairline` | `#E5E1E8` Pale Lavender | Hairline rules (tier-rail separators, table borders) — replaces the old thin white-on-dark rule |
| `--structure-accent` | `#6F4AA8` Royal Purple | UI chrome only now — input-bar active states, section dividers, focus rings. No longer the canvas base |

**Electrical Flow — orange/amber family:**
| Token | Hex | Usage |
|---|---|---|
| `--flow-primary` | `#DB634C` Terracotta (brand) | Main trunk — Grid/Solar/Battery inflow, IT Load. Unchanged from v2.3; already reads well on white |
| `--flow-secondary` | `#D98C2B` Deep Amber | Cooling/HVAC electricity branch — deepened from v2.3's `#E58B42` for contrast against white |
| `--flow-tertiary` | `#E3A467` Warm Peach | Lighting/Aux, transformer/UPS/distribution losses — deepened from v2.3's `#F0B07A`, which read as near-invisible on white |
| `--accent-highlight` | `#C9962B` Rich Gold | Headline PUE / "opportunity" callouts — replaces v2.3's pale champagne `#F3D9B4`, which all but disappeared on a white canvas |

**Cooling & Water Flow — blue family:**
| Token | Hex | Usage |
|---|---|---|
| `--flow-water-1` | `#2E86C1` Deep Sky Blue | Primary water flow — water source, CDU makeup water, main loop. Deepened from v2.3's `#76B6E8` for contrast |
| `--flow-water-2` | `#7FB8E0` Soft Blue | Evaporated / blowdown split — lighter = "resolved/returned," same logic as v2.3, deepened from `#B8D8F2` |

**Heat Flow — purple/magenta family (new; purple was structure-only in v2.3):**
| Token | Hex | Usage |
|---|---|---|
| `--flow-heat-1` | `#6F3A8C` Deep Violet | Chip heat, to-coolant trunk |
| `--flow-heat-2` | `#B23A7A` Magenta Rose | Recovered Heat — the payoff flow, deliberately the most saturated/eye-catching heat tone |
| `--flow-heat-3` | `#C9B7D6` Muted Lavender | Rejected to Atmosphere — the "lost" outcome, deliberately the quietest heat tone |

**Core color logic — the rule to hold to throughout the build:**
- **One hue family per Sankey, matching the reference artwork's three ribbon colors:** orange/amber = Electrical, blue = Cooling & Water, purple/magenta = Heat. Never let a flow render outside its diagram's family — this is the fastest visual cue a recruiter reads, faster than labels.
- **Within each family, saturation encodes narrative weight:** the main/dominant trunk gets the most saturated tone; secondary branches step down; the "payoff" flow (Recoverable Heat, headline PUE) gets the brightest/most attention-grabbing tone in its family; the "loss/waste" flow gets the quietest.
- **Purple is UI chrome only**, not a flow color anymore except within the Heat Sankey specifically — it must not appear as a structural/background element competing with the Heat diagram's own use of purple.
- **Links render as organic curved ribbons**, not straight-edged bars — matches both references directly (Scarr's curved link paths, and the ribbon artwork's flowing form). See Section 10 for the fluid rendering technique, which still needs its opacity math re-derived for a white base (see v2.4 change log note above).

**Energy source distinction (Grid / Solar / Battery):**
The three inflows at the top of the electricity Sankey need to read as visually distinct *sources* even though they all feed into the same `--flow-primary` trunk. Rather than three arbitrary colors (which would break the one-hue-family-per-diagram rule), differentiate by **texture/pattern within the family**, not hue:
- **Grid (CAISO):** solid terracotta fill, matching the main trunk it's directly continuous with
- **Solar:** terracotta fill with a subtle diagonal-hatch or gradient-pulse overlay (suggests intermittency/daylight-dependence — could literally pulse in opacity on a slow cycle to imply "sun-dependent")
- **Battery:** terracotta fill with a subtle dashed/segmented link pattern (suggests stored/discrete rather than continuous flow)
This keeps the "one family per diagram" rule intact while still making Grid vs. Solar vs. Battery legible at a glance — label each on hover/tap regardless, since pattern alone shouldn't carry the full burden of distinction (accessibility).

---

## 9. California Climate Zone Map (axonometric)

A small, tilted (axonometric/isometric-style, not flat top-down) outline map of California docked in the top-right corner of the flow canvas, permanently visible once a scenario is active — not a modal, not something the user has to open.

**Behavior:**
- The map shows a simplified California outline with the relevant hyperscale-siting climate zones from the Climate Zone input (Section 6) rendered as distinct flat regions: CZ3 (Bay Area/Oakland), CZ4 (San Jose), CZ11–13 (Central Valley corridor), CZ15 (Imperial/desert).
- Whichever zone is currently selected in the input bar is **highlighted** (full opacity, `--flow-primary` terracotta fill or outline) while the other zones sit at low opacity/muted purple, so the selection reads instantly.
- A thin **connector line** runs from the highlighted zone on the map to the "Power Source" tier of the flow diagram (specifically, toward the climate-sensitive parts of the model — free-cooling hours affecting the Cooling branch width, and solar irradiance affecting the Solar inflow width) — this is what makes the map feel wired into the diagram rather than decorative. Style the connector as a dashed 0.5px leader line in a muted tone, consistent with the leader-line convention used for diagram callouts elsewhere in the piece.
- Changing the Climate Zone input re-highlights the map (short transition, ~300ms) and the connector line's endpoint on the flow side updates if the diagram's layout has shifted (e.g. cooling branch width changed).
- Keep the map small and quiet — roughly 140–160px wide, enough to read the CA outline and zone shape at a glance, not a competing focal point against the Sankey.

**Axonometric treatment specifically:** rather than a flat 2D map, give it a slight tilt/depth (a subtle 3D-ish projection, consistent with "axo" style — think a slightly rotated, extruded-looking outline rather than a literal flat GIS map) so it reads as a companion illustration to the flow diagram's own sense of depth (Section 8's opacity layering), not a dropped-in Google Maps screenshot. This can be achieved with a CSS `transform: perspective() rotateX()` on an SVG California outline, or by hand-drawing the outline with a slight skew and a drop "shadow" edge in a darker purple to imply thickness — keep it simple, a stylized wedge-shaped state outline reads fine at this size.

**Implementation note for Claude Code:** build as `CaliforniaClimateMap.jsx` — a static SVG path for the CA outline (simplified, not survey-accurate) with named zone regions as separate `<path>` fills, driven by the same `scenario.climate_zone` value as the rest of the model. The connector line can be a separate absolutely-positioned SVG/canvas overlay that recalculates its endpoint coordinates whenever the flow layout re-renders.

---

## 10. Wave/Fluid Depth Effect (Opacity Layering)

To make both Sankeys read as **flowing fluid rather than static bars**, layer each link as 2–3 stacked paths at different opacities rather than one flat-fill shape:

- **Base layer:** full-width link path at ~85% opacity in the link's assigned color — this is the "body" of the flow.
- **Mid layer:** a slightly narrower, offset path at ~40% opacity — creates a soft inner glow/depth, like light passing through moving water or a translucent stream.
- **Highlight layer:** a thin, animated path (~15–20% of the link's width) at ~60–70% opacity with a slow-moving gradient sweep along its length (animate `stop-offset` on an SVG `linearGradient`, or a moving `background-position` if using CSS/HTML links) — this is what actually reads as "flowing" rather than "colored bar with a gradient." Loop this continuously, independent of user interaction.

For the **water flows specifically**, add one more subtle touch: a very faint sinusoidal wobble on the link's top/bottom edge (a few px amplitude, slow period) rather than a perfectly straight-edged path — this is a cheap way to suggest liquid motion without needing real fluid simulation, and it should be more pronounced on water links than electricity links (electricity can stay straight-edged with just the gradient sweep; water gets both the sweep and the wobble).

Apply the same opacity-layering technique to the **particle field** (Section 11) for consistency: particles themselves should vary in opacity (not just size) as they drift, and the "pooling" moment when they arrive at Sankey link positions should transition each particle's opacity to match whichever depth-layer (base/mid/highlight) it lands in, so the particle-to-shape morph and the resolved Sankey feel like one continuous material rather than two different rendering techniques stitched together.

---

## 11. Generative Particle Intro Effect

**Reference points you gave:** The Pudding's ["In Pursuit of Democracy"](https://pudding.cool/2025/11/democracy/) — a scroll-driven canvas piece where individual dots (each representing five congressional speeches) glow and cluster as the reader scrolls through history, with brightness encoding meaning. What's worth borrowing from it isn't the topic, it's the mechanic: **a field of small, individually-animated points that the story gradually organizes into meaning**, rather than a chart that's just "on" from page load. Use the confirmed palette from Section 8 for the particle field itself — ambient/idle particles in Lavender (`--particle-ambient`), transitioning to whichever flow color (warm or blue) their target link belongs to as they converge and pool.

**Behavior spec:**

1. **Pre-input state (screen load, before all 6 inputs are set):**
   - Full-bleed canvas fills the visualization area below the input bar with **freely floating particles** — slow drift, slight parallax on mouse move, low-opacity glow (Canvas2D `globalCompositeOperation: 'lighter'` or a lightweight WebGL particle system).
   - No Sankey shape is implied yet — particles wander with gentle noise-based motion (e.g. simplex/Perlin noise field, similar to how the Pudding piece uses per-dot brightness/position logic rather than a static scatter).
   - As each of the 6 inputs gets set, a **subtle acknowledgment pulse** ripples through a portion of the particle field (visual progress feedback without a literal progress bar).

2. **Transition state (last input selected):**
   - Particles **accelerate toward target positions** that correspond to the Sankey's node/link geometry for the now-fully-defined scenario — this is a particle-to-shape morph, conceptually: each particle gets assigned a target `(x, y)` on the eventual Sankey path, and eases there (`d3.ease.cubicInOut` or a spring, ~1.2–1.8s duration staggered per-particle for an organic rather than mechanical feel).
   - As particles arrive at their targets, they should visually "pool" along the flow paths — implying liquid/fluid motion rather than snapping into static bars. Consider layering a subtle flow-direction animation on top even after the Sankey resolves (e.g. a moving dash-offset or gradient sweep along each link, like a river) so the diagram never feels fully static, echoing "flows" rather than "chart."

3. **Resolved state (Sankey fully visible):**
   - The particle field recedes to a low-opacity ambient layer behind the Sankey (not gone — this keeps continuity with the intro rather than a hard cut).
   - PUE/WUE scrollers become interactive; scrolling them should perturb the particle-flow animation speed/direction along the affected links (subtle, not distracting) so the "fluid" feeling persists through interaction, not just on load.
   - Changing an input-bar value after this point should **not** reset to the pre-input floating state — it should re-morph the particles directly from their current Sankey positions to the new scenario's positions (same particle-to-shape technique, shorter duration, ~600–900ms) so it reads as the flow reconfiguring, not restarting.

**Implementation note for Claude Code:** build this as its own component (`ParticleField.jsx`) with a small state machine — `idle-floating → converging → resolved` — driven by a `scenarioComplete: boolean` and a `targets: {x,y}[]` array computed from the current Sankey layout. Canvas2D is almost certainly sufficient at the particle counts this needs (a few hundred to ~1500 particles); reach for WebGL (e.g. `three.js` or `pixi.js`) only if performance testing on the target device shows Canvas2D dropping frames.

---

## 12. Tech Stack Recommendation

- **Framework:** React + Vite (fast local dev, clean GitHub Pages deploy)
- **Sankey rendering:** `d3-sankey` + raw D3 for link/node transitions (gives you full control over the vertical orientation and the animated re-flow on scroll — Plotly's built-in Sankey is horizontal-only and harder to animate smoothly)
- **Particle field:** Canvas2D custom implementation (see Section 11); escalate to `pixi.js` only if needed for performance
- **Scroll interaction:** Draggable vertical range sliders for PUE and WUE — one control per metric, both **feel** scroll-driven (mouse-wheel and touch-scroll gestures over the slider track nudge the value, in addition to drag) without true scroll-jacking of the page. **Decision: this is the final interaction model, not a placeholder** — no scroll-jacking stretch goal planned; sliders are more reliable to ship and test, and the friction/strain feedback (Section 5) gives plenty of "alive" feeling without needing to hijack page scroll.
- **Animation orchestration:** Framer Motion or GSAP for the particle-to-Sankey morph and per-link flow animation; D3 handles the Sankey layout math, GSAP/Framer handles the choreography on top of it
- **Styling:** Tailwind, with the confirmed design-token palette from Section 8 (`designTokens.json`) — terracotta stays the dominant brand accent, purples handle structure, blues are reserved exclusively for water
- **State:** React state/context is sufficient — no need for Redux at this scale
- **Deployment:** GitHub Pages (matches your existing `sayalilamne.github.io` setup) or Vercel if you want preview deployments per branch

---

## 13. Data Sources & Assumptions (public only)

Pull baseline coefficients from, and cite in an "assumptions" panel or footer:
- **LBNL** — U.S. Data Center Energy Usage Report, PUE/WUE benchmark studies
- **EIA** — grid mix, CAISO fuel mix data
- **ASHRAE TC 9.9** — thermal guidelines, liquid cooling classes (W1–W5)
- **NREL** — data center water/energy nexus reports
- **Uptime Institute** — Tier classification definitions, annual PUE survey data
- **CAISO** — real-time/historical fuel mix and emissions factor data (public API)
- **DOE Better Buildings / Center of Expertise for Data Centers** — PUE/WUE reference ranges

A visible "Methodology & Sources" panel (collapsible) is worth building — it's the single highest-leverage element for convincing a technical reviewer this isn't hand-waved.

---

## 14. Repo Structure

```
dc-flow-dashboard/
├── README.md                    # project pitch + live demo link + methodology summary
├── PROJECT_SCOPE.md              # this document
├── src/
│   ├── components/
│   │   ├── InputBar.jsx           # the 6 fixed controls
│   │   ├── ParticleField.jsx      # idle-floating / converging / resolved states
│   │   ├── TierLabelRail.jsx      # left-margin tier labels (Power Source / Site Delivery / etc.)
│   │   ├── SankeyElectricity.jsx
│   │   ├── SankeyWater.jsx
│   │   ├── CaliforniaClimateMap.jsx  # axo CA outline, highlighted CZ, connector line to flow
│   │   ├── PUEScroller.jsx
│   │   ├── WUEScroller.jsx
│   │   └── MethodologyPanel.jsx
│   ├── data/
│   │   ├── coefficients.json      # PUE/WUE/climate/cooling-tech lookup tables
│   │   ├── designTokens.json      # confirmed palette — see Section 8
│   │   └── sources.json           # citation metadata
│   ├── lib/
│   │   └── flowModel.js           # pure functions: (fixed + scenario + live_controls) → node/link values
│   └── App.jsx
├── public/
└── vite.config.js
```

---

## 15. Build Phases

**Phase 1 — Static MVP**
Fixed scenario (100MW CA/CAISO, AI-Training, CZ4, Balanced power mix), vertical electricity Sankey only with the three-source (Grid/Solar/Battery) merge, hardcoded PUE=1.3 / WUE=0.6. Get the vertical D3 rendering and node/link math right first — no particles, no scroll, no input bar yet.

**Phase 2 — PUE/WUE Scrollers**
Add both sliders, wire them to `flowModel.js` with the shared cooling-tech constraint (Section 5), animate transitions. This is the first demo-able milestone.

**Phase 3 — Water Flow**
Add the mirrored water Sankey in full, wire the cooling-tech → WUE relationship end to end.

**Phase 4 — Input Bar**
Add all 6 controls, make `flowModel.js` fully scenario-driven, wire the Speed-to-Power → Power-Mix default relationship.

**Phase 5 — Tier Rail + Climate Map**
Build `TierLabelRail.jsx` (Section 4) and `CaliforniaClimateMap.jsx` (Section 9) together, since both depend on the flow layout being stable — wire the map's connector line to recalculate against the same layout coordinates the tier rail aligns to.

**Phase 6 — Particle Field**
Build `ParticleField.jsx` and its state machine (idle-floating → converging → resolved), tune the particle-to-Sankey morph, layer the ambient post-resolve flow animation.

**Phase 7 — Polish**
Methodology panel, wave/depth opacity-layering pass (Section 10) across all links, mobile responsiveness (including the tier-rail collapse and climate-map repositioning behavior), README + live link, embed on portfolio site.

---

## 16. Decisions Locked (formerly Open Questions)

All three prior open questions are now resolved — recorded here so Claude Code treats them as spec, not options to reconsider:

- **Heat Recovery Potential:** single "% of waste heat recoverable" readout only. No secondary end-use diagram (district heat/greenhouse/preheat) in this version.
- **PUE/WUE scroller interaction at unrealistic combinations:** no hard blocking. Continuous friction/strain feedback instead (lag, jitter, warning-tinted glow) — see Section 5.
- **Scroll mechanic:** sliders that feel scroll-responsive (wheel/touch nudges the value), not true page scroll-jacking. This is final, not a Phase-2-then-upgrade plan.

No open questions remain — the spec is ready for Claude Code to build against end to end.

---

*Prepared for Claude Code handoff — drop this file at the repo root, then start with Phase 1. The color palette (Section 8) is finalized, so `designTokens.json` can be populated up front rather than deferred to Phase 7.*
