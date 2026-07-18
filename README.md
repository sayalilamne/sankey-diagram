# Data Center Flow Dashboard

An interactive Sankey dashboard visualizing electricity, cooling, water, and heat flow through a 100 MW hyperscale AI data center in California. Full design spec: [PROJECT_SCOPE.md](PROJECT_SCOPE.md).

**Live demo:** https://sayalilamne.github.io/sankey-diagram/

**Data model:** [workbook/DataCenter_Flow_Model.xlsx](workbook/DataCenter_Flow_Model.xlsx) — the Excel workbook driving all three Sankeys (Electrical, Cooling & Water, Heat), modeled at full equipment granularity (utility→MV→LV→UPS→PDU→rPDU→chip on the electrical side; CDU/direct-liquid-cooling loop + CRAH air-cooling backup on the cooling side; a 5-way heat-recovery offtake). Every user-adjustable input lives on the `Inputs` tab; every calculated output is formula-driven and documented on the `Equations` tab with sources on `References`. The `Sankey Data Tables` tab (64 live, formula-linked node/link rows) is the export point for the dashboard.

**Current status:**
- Phase 1 (Excel data model) — complete: 11-sheet workbook with named ranges, dropdowns, and full documentation.
- Phase 2 (parse the workbook into this dashboard) — not started.
- Phase 3 (particle-flow scroll animation) — not started.

React scaffold in `src/` is an earlier static proof-of-concept for the vertical Sankey rendering approach; it will be rewired to read `Sankey Data Tables` in Phase 2.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Deploys automatically to GitHub Pages via GitHub Actions on every push to `main`.
