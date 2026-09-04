# SatQuery AI — Claude Code Guidelines

## Project Context
- **Problem Statement:** SIH26167 (Smart India Hackathon 2026) | Indian Space Research Organisation (ISRO)
- **Application:** SatQuery AI — Vision-Language Geospatial Investigation Platform
- **Master Instructions:** See `AGENTS.md` and `docs/PROJECT_HANDOFF.md` for architecture details and the prioritized "What to Do Next" roadmap.

## Key Commands
- **Launch Everything:** `./start.sh`
- **CLI Commands:** `./scripts/satquery --help` (e.g. `./scripts/satquery dataset list`)
- **Run DoD Scenarios:** `PYTHONPATH=. .venv/bin/python tests/test_all_scenarios.py`
- **Run Dataset Hub Tests:** `PYTHONPATH=. .venv/bin/python tests/test_dataset_hub.py`
- **Run Training Tests:** `PYTHONPATH=. .venv/bin/python tests/test_training_adaptation.py`
- **Build Backend:** `npm --prefix backend run build`
- **Build Frontend:** `npm --prefix frontend run build`

## Non-Negotiable Axioms
1. **Zero Hallucination:** Claims must be grounded in mathematical evidence nodes (`EvidenceGraph`).
2. **Deterministic GIS:** Use specialist tools (`TinyCD`, `SARProcessor`, `SpectralEngine`).
3. **Real Satellite Rasters:** Active datasets reside in `datasets/real/` and `storage/uploads/`.
