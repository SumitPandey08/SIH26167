# Authoritative Remote Sensing Methodology: Bi-Temporal Change Detection
**Source:** IEEE Geoscience and Remote Sensing Society (GRSS) & ISPRS Technical Guidelines  
**Domain:** Multi-Temporal Satellite Image Analysis

---

## 1. Fundamental Principles of Satellite Change Detection
Change detection in Earth Observation involves observing the same geographic footprint across multiple temporal epochs $(T_1, T_2, \dots, T_n)$ to identify surface modifications resulting from human activity, environmental processes, or natural disasters.

### Strict Pre-requisites for Accurate Change Analysis:
1. **Precise Spatial Co-Registration:** Misalignment between $T_1$ and $T_2$ exceeding $0.5$ pixels creates severe false-alarm edge artifacts (pseudochanges) along high-contrast boundaries (coastlines, roads, field borders). Sub-pixel alignment via feature matching (ORB/SIFT/AKAZE) or normalized cross-correlation is mandatory.
2. **Harmonized Coordinate Reference Systems (CRS):** Both rasters must be reprojected to a common projected coordinate reference system (e.g. Universal Transverse Mercator - UTM) so that pixel counts map directly to physical ground metrics ($m^2, km^2$).
3. **Radiometric Consistency:** Variations in atmospheric aerosol scattering, solar elevation angles, and sensor gain between acquisition dates must be accounted for by converting raw digital numbers ($DN$) into Surface Reflectance or calibrated Decibel ($\sigma^0$) units.

---

## 2. Phenological vs. Structural Change Discrimination
A critical failure mode of naive deep learning models is confusing **phenological seasonality** with **true surface change**:
- **Phenological Variations (Not Permanent Change):** Natural seasonal greening, leaf fall in deciduous forests, or temporary agricultural crop growth cycles.
- **Structural / Permanent Changes:** Urban building construction, road expansion, river channel shifts, forest clearcutting, or post-flood sediment erosion.
- **SatQuery Solution:** Uses dual spectral difference ($\Delta NDVI$, $\Delta NDWI$) alongside structural deep Siamese features (TinyCD / ChangeFormer) to distinguish seasonal shifts from structural transformation.
