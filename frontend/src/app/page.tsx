'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  CloudRain,
  Radio,
} from 'lucide-react';

export default function OverviewPage() {
  return (
    <main className="h-full w-full overflow-y-auto px-6 py-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* 1. Hero Header */}
      <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pt-4 border-b border-white/5 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH26167 Remote Sensing Assistant</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white font-sans">
            Earth Observation. <br />
            <span className="text-neutral-400">Grounded in physical evidence.</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base mt-2 max-w-xl font-normal leading-relaxed">
            SatQuery AI decouples high-level reasoning from physical GIS measurement. Specialist computer vision models analyze pixels, while natural language models synthesize verifiable findings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-950 font-medium text-sm hover:bg-neutral-200 transition shadow-lg shadow-white/10"
          >
            <span>Launch Map Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/investigate"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/10 font-medium text-sm transition"
          >
            <span>Start Investigation</span>
          </Link>
        </div>
      </section>

      {/* 2. Glanceable Metrics Strip (Apple Health / VisionOS Style) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Inundation Mapped</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">
              20.31 <span className="text-sm font-sans text-neutral-400">km²</span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <span>+2.64 km² penetrated clouds</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Sentinel-1 C-band SAR</span>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Bi-Temporal Shift</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">
              -5.86<span className="text-sm font-sans text-neutral-400">%</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
              <span>Water coverage delta (2020-2026)</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">TinyCD Siamese MAMB</span>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Hallucination Delta (ΔA)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-emerald-400 font-mono">
              0.00<span className="text-sm font-sans text-neutral-400">%</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
              <span>Mathematically verified claims</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Constrained Synthesis</span>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Inference Speed</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">
              134 <span className="text-sm font-sans text-neutral-400">ms</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
              <span>Sub-second edge execution</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">CPU-Optimized PyTorch</span>
        </div>
      </section>

      {/* 3. Active Mission Investigations Cards */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">Active Investigations</h2>
          <span className="text-xs text-neutral-500 font-mono">2 Ready Scenarios</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Nepal Hydrology */}
          <div className="group p-6 rounded-3xl bg-neutral-900/40 backdrop-blur-2xl border border-white/5 hover:border-white/15 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Bi-Temporal Optical</span>
                </div>
                <span className="text-xs text-neutral-500 font-mono">2020 → 2026</span>
              </div>

              <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Himalayan River Inundation & Landslide
              </h3>
              <p className="text-neutral-400 text-xs md:text-sm mt-2 leading-relaxed">
                Bi-temporal investigation tracking severe riverbed widening, riparian vegetation scouring, and sediment deposition in high-relief mountainous topography.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-300 border border-white/5">
                  Area Delta: 4.59 km²
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-300 border border-white/5">
                  TinyCD Siamese Attention
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-300 border border-white/5">
                  10m Sentinel-2 GSD
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
              <Link
                href="/map"
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <span>View on Satellite Map</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/investigate"
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
              >
                Ask Questions
              </Link>
            </div>
          </div>

          {/* Card 2: Optical + SAR Flood */}
          <div className="group p-6 rounded-3xl bg-neutral-900/40 backdrop-blur-2xl border border-white/5 hover:border-white/15 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400">Cross-Modal Radar</span>
                </div>
                <span className="text-xs text-neutral-500 font-mono">Sentinel-1 + 2</span>
              </div>

              <h3 className="text-xl font-semibold text-white group-hover:text-amber-300 transition-colors">
                All-Weather Flood Mapping (Optical + SAR)
              </h3>
              <p className="text-neutral-400 text-xs md:text-sm mt-2 leading-relaxed">
                Overcoming 30% cloud blindness during monsoon flooding by fusing optical reflectance with Sentinel-1 C-band radar microwave specular backscatter.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-300 border border-white/5">
                  Cloud Penetration: 2.64 km²
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-300 border border-white/5">
                  SEN12MS Dual-Stream
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-300 border border-white/5">
                  Enhanced Lee Filter
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
              <Link
                href="/map"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <span>View on Satellite Map</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/investigate"
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
              >
                Ask Questions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Scientific Principles */}
      <section className="p-6 rounded-3xl bg-neutral-900/20 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Authoritative Space Agency RAG Integration</h4>
            <p className="text-neutral-400 text-xs mt-0.5">
              Responses are anchored in official ESA Sentinel User Guides, ISRO Cartosat/RISAT technical specs, and IEEE GRSS peer-reviewed methodologies.
            </p>
          </div>
        </div>

        <Link
          href="/sensors"
          className="shrink-0 px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition border border-white/10"
        >
          Explore Dataset Catalog
        </Link>
      </section>
    </main>
  );
}
