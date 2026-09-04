'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Download,
  CheckCircle2,
  FileCode,
  FileText,
  Layers,
  Cpu,
  Hash,
  Ruler,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Investigation, EvidenceGraph, EvidenceNode, Claim } from '../../types';

function EvidenceVaultInner() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('id');

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInv, setActiveInv] = useState<Investigation | null>(null);
  const [unit, setUnit] = useState<'km2' | 'ha' | 'acres'>('km2');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/investigations');
        if (res.ok) {
          const data = await res.json();
          const list: Investigation[] = data.investigations || [];
          setInvestigations(list);

          if (list.length > 0) {
            const matched = requestedId ? list.find((i) => i.id === requestedId) : null;
            // Prefer an investigation that has evidence graphs if none requested
            const defaultInv = matched || list.find((i) => (i.evidence_graphs?.length || 0) > 0) || list[0];
            setActiveInv(defaultInv);
          }
        }
      } catch (e) {
        console.error('Failed to load investigations:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestigations();
  }, [requestedId]);

  const formatArea = (km2?: number) => {
    if (km2 === undefined) return 'N/A';
    if (unit === 'ha') return (km2 * 100).toFixed(1) + ' ha';
    if (unit === 'acres') return (km2 * 247.105).toFixed(1) + ' acres';
    return km2.toFixed(4) + ' km²';
  };

  const activeGraph: EvidenceGraph | undefined = activeInv?.evidence_graphs?.[0];
  const claims: Claim[] = activeGraph?.claims || [];
  const nodes: EvidenceNode[] = activeGraph?.evidence_nodes
    ? (Object.values(activeGraph.evidence_nodes) as EvidenceNode[])
    : [];

  const primaryNode = nodes[0];

  const getPillLabel = (inv: Investigation) => {
    if (inv.id.includes('levir')) return '🏢 LEVIR Urban';
    if (inv.id.includes('crossmodal')) return '🛰️ Sentinel Radar';
    if (inv.id.includes('nepal')) return '🏔️ Nepal Hydrology';
    if (inv.id.includes('flood')) return '🌊 SAR Inundation';
    return `🛰️ ${inv.title.slice(0, 14)}...`;
  };

  return (
    <main className="h-full w-full overflow-y-auto px-4 md:px-8 py-6 max-w-6xl mx-auto flex flex-col gap-7 pb-16 no-scrollbar">
      {/* 1. Vault Header */}
      <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/5 pb-6 animate-fade-up">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Hallucination Evidence Vault</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-sans">
            Mathematical Verification & Provenance
          </h1>
          <p className="text-neutral-400 text-sm mt-1.5 max-w-2xl leading-relaxed">
            Every analytical statement produced by SatQuery AI is cryptographically bound to raw pixel arrays, deep Siamese feature embeddings, and verifiable spatial surface integrals.
          </p>
        </div>

        {/* Unit Segmented Control */}
        <div className="flex items-center p-1 rounded-full ios-glass border border-white/10 text-xs shrink-0">
          {(['km2', 'ha', 'acres'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 rounded-full font-medium transition-all ios-btn ${
                unit === u ? 'bg-white/15 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {u === 'km2' ? 'Square Km' : u === 'ha' ? 'Hectares' : 'Acres'}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Mission Investigation Capsule Selector */}
      <section className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 p-1 rounded-full ios-glass text-xs">
          {investigations.map((inv) => {
            const hasEv = (inv.evidence_graphs?.length || 0) > 0;
            return (
              <button
                key={inv.id}
                onClick={() => setActiveInv(inv)}
                className={`px-3.5 py-1.5 rounded-full transition-all text-xs font-medium shrink-0 flex items-center gap-1.5 ios-btn ${
                  activeInv?.id === inv.id
                    ? 'bg-white/15 text-white shadow-sm border border-white/15'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{getPillLabel(inv)}</span>
                {hasEv && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        {activeInv && (
          <Link
            href={`/map?id=${activeInv.id}`}
            className="shrink-0 flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 ios-btn"
          >
            <span>View on Map Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </section>

      {/* 3. Primary Verified Claims Section */}
      <section className="flex flex-col gap-4 animate-fade-up" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryptographically Verified Claims ({claims.length})</span>
          </h2>
          {activeGraph && (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Confidence: {(activeGraph.aggregate_confidence * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {claims.length > 0 ? (
          <div className="space-y-3">
            {claims.map((claim, idx) => (
              <div
                key={claim.claim_id || idx}
                className="p-5 rounded-3xl ios-glass-card flex items-start gap-4"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      {claim.claim_id.toUpperCase()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-sm text-white leading-relaxed font-sans">
                    {claim.statement}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono">
                    <span>Model: {primaryNode?.model_provenance || 'Specialist Engine'}</span>
                    {primaryNode?.metric.delta_area_km2 !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-300">
                          Delta Area: {formatArea(primaryNode.metric.delta_area_km2)}
                        </span>
                      </>
                    )}
                    {primaryNode?.metric.pixel_count !== undefined && (
                      <>
                        <span>•</span>
                        <span>{primaryNode.metric.pixel_count.toLocaleString()} Pixels</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl ios-glass text-center flex flex-col items-center justify-center gap-3">
            <ShieldCheck className="w-10 h-10 text-neutral-500" />
            <div>
              <h3 className="text-sm font-semibold text-white">No Verified Claims in Session Yet</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Ask questions in the AI Investigation panel to run computer vision models and generate empirical evidence claims.
              </p>
            </div>
            {activeInv && (
              <Link
                href={`/investigate?id=${activeInv.id}`}
                className="mt-2 px-4 py-2 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition ios-btn"
              >
                Run Investigation Query
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 4. Physical Quantitative Measurements Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-up" style={{ animationDelay: '200ms' }}>
        {/* Metric Card 1 */}
        <div className="p-6 rounded-3xl ios-glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Changed Footprint Area</span>
            <Ruler className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-4">
            <div className="text-3xl font-semibold text-white font-mono">
              {formatArea(primaryNode?.metric.area_km2)}
            </div>
            <span className="text-xs text-neutral-400 mt-1 block font-mono">
              {primaryNode?.metric.pixel_count ? `${primaryNode.metric.pixel_count.toLocaleString()} pixels analyzed` : 'Raster geometric integral'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            {activeInv?.images[0]?.metadata.crs || 'EPSG:32644 (UTM Zone 44N)'}
          </span>
        </div>

        {/* Metric Card 2 */}
        <div className="p-6 rounded-3xl ios-glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Specialist Architecture</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-4">
            <div className="text-lg font-semibold text-white truncate">
              {primaryNode?.model_provenance || 'Siamese U-Net + MAMB'}
            </div>
            <span className="text-xs text-neutral-400 mt-1 block">
              LEVIR-CD Verified Dual-Stream
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Sub-second CPU Execution</span>
        </div>

        {/* Metric Card 3 */}
        <div className="p-6 rounded-3xl ios-glass-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Authoritative RAG Grounds</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-4">
            <div className="text-lg font-semibold text-white">ESA & ISRO Standards</div>
            <span className="text-xs text-neutral-400 mt-1 block">Sentinel-1 GRD / Cartosat-3 Specs</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Domain Grounding Indexed</span>
        </div>
      </section>

      {/* 5. Mask Visual Preview (if available) */}
      {primaryNode?.preview_png_uri && (
        <section className="p-5 rounded-3xl ios-glass border border-white/10 flex flex-col gap-3 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Grounded Model Artifact Preview
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">{primaryNode.type}</span>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/5 flex items-center justify-center p-4">
            <img
              src={`http://localhost:5000${primaryNode.preview_png_uri}`}
              alt={primaryNode.title}
              className="max-h-64 object-contain filter drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            />
          </div>
        </section>
      )}

      {/* 6. Execution Trace Timeline */}
      {activeGraph?.execution_trace && activeGraph.execution_trace.length > 0 && (
        <section className="p-6 rounded-3xl ios-glass-subtle flex flex-col gap-3 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Specialist Execution Pipeline Trace</span>
            </h3>
            <span className="text-xs text-emerald-400 font-mono">
              Total Duration: {activeGraph.execution_trace.reduce((a, b) => a + b.duration_ms, 0)} ms
            </span>
          </div>

          <div className="space-y-2 mt-2">
            {activeGraph.execution_trace.map((step) => (
              <div
                key={step.step_number}
                className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-cyan-400">[{step.step_number}]</span>
                  <span className="text-neutral-200 font-medium">{step.tool_name}</span>
                  {step.output_summary && (
                    <span className="text-neutral-500 text-[11px] hidden md:inline ml-2">
                      — {step.output_summary}
                    </span>
                  )}
                </div>
                <span className="text-emerald-400 font-semibold shrink-0">{step.duration_ms} ms</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Export Actions Strip */}
      <section className="p-6 rounded-3xl ios-glass-card flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: '350ms' }}>
        <div>
          <h3 className="text-sm font-semibold text-white">Export Audit Dossiers</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Download verifiable mathematical summaries and GIS polygon vector layers for regulatory inspection.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeInv && (
            <>
              <a
                href={`http://localhost:5000/api/investigations/${activeInv.id}/report?format=geojson`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-medium border border-white/10 transition-all ios-btn"
              >
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>GeoJSON Vectors</span>
              </a>
              <a
                href={`http://localhost:5000/api/investigations/${activeInv.id}/report?format=markdown`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-neutral-950 text-xs font-medium hover:bg-neutral-200 transition-all ios-btn shadow"
              >
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>Markdown Dossier</span>
              </a>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function EvidenceVaultPage() {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-neutral-400">Loading Evidence Vault...</div>}>
      <EvidenceVaultInner />
    </Suspense>
  );
}
