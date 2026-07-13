# Data Center Flow Dashboard

An interactive, vertically-oriented Sankey dashboard visualizing electricity and water flow through a 100 MW hyperscale data center in California. Full design spec: [PROJECT_SCOPE.md](PROJECT_SCOPE.md).

**Live demo:** https://sayalilamne.github.io/sankey-diagram/

**Current status:** Phase 1 (Static MVP) — hardcoded scenario, vertical electricity Sankey only, no input bar or scrollers yet. See Section 15 of the project scope for the full build-phase roadmap.

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
