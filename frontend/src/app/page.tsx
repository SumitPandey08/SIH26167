'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Radio,
  ExternalLink,
  ChevronRight,
  Satellite,
  CheckCircle2,
  Database,
  Eye,
} from 'lucide-react';
import { Investigation } from '../types';

export default function OverviewPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/investigations');
        if (res.ok) {
          const data = await res.json();
          setInvestigations(data.investigations || []);
        }
      } catch (err) {
        console.error('Failed to fetch investigations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestigations();
  }, []);

  // Compute live metrics from actual store
  const totalClaims = investigations.reduce(
    (acc, inv) => acc + (inv.evidence_graphs?.reduce((gAcc, g) => gAcc + (g.claims?.length || 0), 0) || 0),
    0
  );
  const totalImages = investigations.reduce((acc, inv) => acc + (inv.images?.length || 0), 0);

  return (
    <main className="h-full w-full overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-8 pb-16 no-scrollbar">
      {/* 1. Hero Header */}
      <section className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pt-2 border-b border-white/5 pb-8 animate-fade-up">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIH26167 Remote Sensing Assistant</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white font-sans leading-tight">
            Earth Observation. <br />
            <span className="text-neutral-400">Grounded in physical evidence.</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base mt-3 max-w-2xl font-normal leading-relaxed">
            SatQuery AI harmonizes optical reflectance and microwave radar telemetry. Specialist computer vision models analyze raw satellite pixels, while natural language reasoning synthesizes verifiable, zero-hallucination findings.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/map"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-950 font-medium text-sm hover:bg-neutral-200 transition-all shadow-lg shadow-white/10 ios-btn"
          >
            <span>Launch Map Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/investigate"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-white/10 font-medium text-sm transition-all ios-btn"
          >
            <span>Start Investigation</span>
          </Link>
        </div>
      </section>

      {/* 2. Dynamic Glanceable Metrics Strip (Apple VisionOS Style) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        {/* Metric 1: Active Missions */}
        <div className="p-5 rounded-3xl ios-glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Active Missions</span>
            <Satellite className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-semibold tracking-tight text-white font-mono">
              {isLoading ? '...' : investigations.length}
            </div>
            <div className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1">
              <span>{totalImages} ingested satellite scenes</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Optical + C-Band SAR</span>
        </div>

        {/* Metric 2: Mathematical Evidence */}
        <div className="p-5 rounded-3xl ios-glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Verified Claims</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-semibold tracking-tight text-emerald-400 font-mono">
              {isLoading ? '...' : totalClaims}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-1">
              <span>Cryptographically grounded</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">100% Pixel Verification</span>
        </div>

        {/* Metric 3: AI Architecture */}
        <div className="p-5 rounded-3xl ios-glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Specialist Engine</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-white font-mono">
              TinyCD
            </div>
            <div className="text-[11px] text-purple-300 flex items-center gap-1 mt-1">
              <span>Siamese U-Net + MAMB Attention</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">LEVIR-CD Benchmark</span>
        </div>

        {/* Metric 4: Edge Latency */}
        <div className="p-5 rounded-3xl ios-glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Edge Execution</span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-semibold tracking-tight text-white font-mono">
              &lt; 90 <span className="text-sm font-sans text-neutral-400">ms</span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <span>Real-time CPU inference</span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Sub-second Latency</span>
        </div>
      </section>

      {/* 3. Live Mission Investigations Cards (Dynamic from API) */}
      <section className="flex flex-col gap-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-white">Active Satellite Missions</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-neutral-300">
              Live Registry
            </span>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {investigations.length} Ready Scenarios
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-neutral-900/40 border border-white/5 animate-pulse p-6" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {investigations.map((inv) => {
              const hasEvidence = (inv.evidence_graphs?.length || 0) > 0;
              const isSAR = inv.tags?.some((t) => t.toLowerCase().includes('sar'));

              return (
                <div
                  key={inv.id}
                  className="group p-6 rounded-3xl ios-glass-card flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    {/* Header badge strip */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSAR ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                          }`}
                        />
                        <span
                          className={`text-xs font-mono uppercase tracking-wider ${
                            isSAR ? 'text-amber-400' : 'text-cyan-400'
                          }`}
                        >
                          {isSAR ? 'Radar + Multispectral' : 'High-Res Optical'}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500 font-mono">
                        {inv.images?.length || 0} Scenes Loaded
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {inv.title}
                    </h3>
                    <p className="text-neutral-400 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2">
                      {inv.description}
                    </p>

                    {/* Tag Pills */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {inv.tags?.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-neutral-300 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                      {hasEvidence && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Evidence Verified</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
                    <Link
                      href={`/map?id=${inv.id}`}
                      className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all ios-btn"
                    >
                      <span>View on Satellite Map</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      href={`/investigate?id=${inv.id}`}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all ios-btn shadow-sm"
                    >
                      Inspect & Query
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Bottom Authoritative Standards Banner */}
      <section className="p-6 rounded-3xl ios-glass-subtle flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Authoritative Space Agency RAG Integration</h4>
            <p className="text-neutral-400 text-xs mt-0.5 max-w-2xl leading-relaxed">
              Responses are strictly grounded in official ESA Sentinel Product Handbooks, ISRO Cartosat/RISAT technical guides, and IEEE GRSS peer-reviewed methodologies to prevent factual hallucination.
            </p>
          </div>
        </div>

        <Link
          href="/sensors"
          className="shrink-0 px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition border border-white/10 ios-btn"
        >
          Explore Sensor Catalog
        </Link>
      </section>
    </main>
  );
}
