# ADR 002: Deterministic Typed DAG State Machine vs. Arbitrary Code-Generating Agent
**Status:** Accepted  
**Date:** September 2026  
**Deciders:** SatQuery AI Architectural Team

---

## Context
In agentic AI systems for geospatial tasks, two prominent paradigms exist:
1. **Unbounded Code-Generating Agents (e.g. AWS Geospatial Code Agent):** An LLM writes arbitrary Python code strings at runtime, which are executed inside a dynamic `exec()` or subprocess environment to fetch data and run analysis.
2. **Deterministic Typed Tool Registry with DAG State Machine:** An LLM acts as an intent interpreter and parameter planner that routes execution through a strongly typed, pre-compiled registry of scientific tools, validating pre-conditions and post-conditions.

## Decision
We choose **Option 2: Deterministic Typed Tool Registry with DAG State Machine**.

## Rationale & Tradeoffs

### Why NOT Arbitrary Code Execution in Production:
- **Security Hazards (Section 33 Compliance):** Blindly executing LLM-generated code poses critical remote code execution (RCE) and container breakout risks, especially when handling untrusted user uploads and queries.
- **Non-Determinism & Fragility:** LLMs frequently produce slight syntax errors, incorrect GDAL/Rasterio method signatures, or deprecated library imports that cause opaque runtime crashes during live demonstrations or evaluation runs.
- **Unverifiable Claims (Hallucination Vulnerability):** When an LLM writes its own data-parsing script, it can inadvertently compute erroneous spatial math without system-level checks.

### Why Deterministic DAG State Machine:
- **Zero-Hallucination Evidence Guarantee:** The agent planner chooses from formally validated tools (`IMAGE_PREPROCESSOR`, `TINYCD_CHANGE_DETECTION`, `WATER_SEGMENTATION`, `SPATIAL_STATISTICS`). Intermediate and final outputs conform to strict Pydantic schemas.
- **Auditable Execution Trace (SIH Requirement):** Because tools run as discrete DAG nodes, the system effortlessly generates an exact execution trace (step name, input hash, parameters, latency in ms, confidence score) for judging and peer inspection.
- **High Performance:** No repeated LLM reflection loops or code syntax repair attempts; tasks execute in predictable milliseconds.

### Tradeoffs:
- Adding a brand-new tool requires writing a typed Python tool adapter rather than allowing the LLM to invent an arbitrary script on the fly. This tradeoff is enthusiastically accepted for production scientific reliability.
