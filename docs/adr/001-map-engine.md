# ADR 001: Hybrid 2D MapLibre GL JS + 3D CesiumJS Map Engine Architecture
**Status:** Accepted  
**Date:** September 2026  
**Deciders:** SatQuery AI Architectural Team

---

## Context
SatQuery AI requires high-performance geospatial visualization for both detailed 2D raster analysis (multispectral bands, binary change masks, split-screen before/after swipe comparisons) and 3D macroscopic Earth context (orbital positioning, geographic terrain visualization).

We evaluated three primary options:
1. **Option A: Pure Mapbox GL JS / Google Maps API**
2. **Option B: Pure CesiumJS**
3. **Option C: Hybrid Architecture (MapLibre GL JS for 2D analysis + CesiumJS for 3D planetary context)**

## Decision
We choose **Option C: Hybrid Architecture using MapLibre GL JS for 2D investigation workflows and CesiumJS for 3D global visualization**.

## Rationale & Tradeoffs

### Why MapLibre GL JS for 2D:
- **100% Open Source & Zero API Costs:** Unlike Mapbox GL JS v2+ or Google 3D Tiles, MapLibre GL JS uses a permissive BSD-3-Clause license without proprietary access token restrictions or usage-metered billing.
- **Superior Local Raster Rendering:** Native support for client-side raster tile rendering, custom canvas overlays for Cloud-Optimized GeoTIFFs (COGs), and fast polygon layer toggling.
- **Split-Screen Swipe Control:** Mature, battle-tested split-screen comparison plugins (`maplibre-gl-compare`) for before/after bi-temporal inspection.

### Why CesiumJS for 3D:
- **Spatial Intelligence Inspiration:** Emulates the cinematic 3D globe presentation of reference projects like God's Eye View while maintaining an open Apache 2.0 license.
- **Global Context & Terrain:** Provides true 3D ellipsoid representation, atmosphere rendering, and elevation models for mountainous disaster analysis (e.g. Himalayan flood/landslide scenarios).

### Tradeoffs & Mitigation:
- *Increased Frontend Bundle Size:* Mitigated via Next.js dynamic code splitting (`next/dynamic` with `ssr: false`), loading CesiumJS only when the analyst toggles the 3D Globe mode.
