# ADR 004: Dual-Stack Architecture — Primary Node.js API Gateway + Python AI/Geospatial Service
**Status:** Accepted  
**Date:** September 2026  
**Deciders:** SatQuery AI Architectural Team

---

## Context
SatQuery AI requires two fundamentally different types of server responsibilities:
1. **High-Concurrency I/O & Client Web Experience:**
   - Real-time client session management
   - File uploads and streaming of large satellite assets
   - Server-Sent Events (SSE) and WebSockets for live execution telemetry
   - Shared end-to-end TypeScript validation types with the Next.js/React frontend
   - Report compilation and export (PDF, GeoJSON, CSV)
2. **Heavy Scientific Compute & Machine Learning:**
   - PyTorch tensor execution (TinyCD, ChangeFormer, GeoChat, RemoteCLIP)
   - C/C++ geospatial bindings (GDAL, Rasterio, Shapely, GeoPandas)
   - Matrix calculations ($NDWI, NDVI$, Enhanced Lee filter for SAR)
   - Remote sensing domain adaptation and model weights management

Running both within a single Python monolith introduces significant risk: heavy PyTorch inference or large GeoTIFF matrix operations tie up Python's Global Interpreter Lock (GIL) and CPU workers, causing client WebSockets to drop, UI latency to spike, and HTTP timeouts during live demonstrations.

## Decision
We adopt a **Dual-Stack Decoupled Architecture**:
- **Primary Backend (`backend/`):** Node.js 26+ / TypeScript using Fastify/Express. Acts as the API gateway, session coordinator, storage manager, and WebSocket/SSE broadcaster.
- **AI & Geospatial Microservice (`services/ai/`):** Python 3.12 / FastAPI. Runs the agentic task planner, specialist vision-language models, and raster processing pipelines.
- **Communication Protocol:** High-speed internal REST / JSON over localhost (or Docker network) passing filesystem paths and storage URIs rather than multi-gigabyte in-memory arrays.

## Rationale & Benefits
1. **Zero UI Freezing:** Python's CPU spikes during heavy change-detection or VLM passes never block the Node.js event loop or client WebSocket streams.
2. **Type Safety Across Frontend & Backend:** TypeScript types and Zod schemas are shared between the frontend React application and the Node.js gateway.
3. **Deployment Elasticity:** The Node.js server can run on lightweight container instances, while the Python AI service can be colocated or dispatched to GPU-enabled cloud nodes (e.g. AWS EC2 GPU / RunPod / Colab worker) with zero frontend changes.
4. **Resilience & Fault Isolation:** If a specialist Python model encounters an out-of-memory (OOM) error on an extreme image tile, only the internal job fails gracefully; the Node.js API remains online and streams a clean error report to the client.
