'use client';

import React from 'react';
import { X, CheckCircle, ShieldCheck, Cpu, Download, Database, Layers, BarChart2 } from 'lucide-react';
import { EvidenceGraph, EvidenceNode } from '../types';

interface EvidenceDrawerProps {
  graph: EvidenceGraph | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ graph, onClose }) => {
  if (!graph) return null;

  const nodes = Object.values(graph.evidence_nodes);

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] bg-space-900 border-l border-space-700 shadow-2xl z-50 flex flex-col select-none text-xs">
      {/* Header */}
      <div className="h-14 px-4 border-b border-space-800 flex items-center justify-between bg-space-850">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">EVIDENCE GRAPH</h2>
            <p className="text-[10px] text-slate-400 font-mono">Mathematical Verification & Audit Trail</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-space-700 text-slate-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 font-sans">
        {/* Anti-Hallucination Status Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-space-850 border border-cyan-500/30 flex items-start space-x-3">
          <CheckCircle className="h-4 w-4 text-radar-green shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-cyan-300">Empirically Grounded Findings</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
              All quantitative metrics below are computed directly by remote sensing vision models and GIS geometry engines.
            </p>
          </div>
        </div>

        {/* Verified Claims Section */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Verified Claims ({graph.claims.length})</span>
          </h3>
          <div className="space-y-2">
            {graph.claims.map((claim) => (
              <div
                key={claim.claim_id}
                className="p-3 rounded-lg bg-space-850 border border-space-700 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-radar-green/20 text-radar-green border border-radar-green/40">
                    {claim.status}
                  </span>
                  <span className="text-slate-500">{claim.claim_id}</span>
                </div>
                <p className="text-slate-200 text-xs leading-normal">{claim.statement}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supporting Evidence Nodes */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Evidence Artifacts & Measurements ({nodes.length})</span>
          </h3>
          <div className="space-y-3">
            {nodes.map((node: EvidenceNode) => (
              <div
                key={node.node_id}
                className="p-3.5 rounded-xl bg-space-850 border border-space-700 space-y-3"
              >
                {/* Node Title & Type */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{node.title}</h4>
                    <span className="text-[10px] font-mono text-cyan-400">{node.type}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-space-900 px-1.5 py-0.5 rounded border border-space-700">
                    {(node.metric.mean_confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>

                {/* Model Provenance */}
                <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400 bg-space-900/80 p-2 rounded border border-space-800">
                  <Cpu className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="truncate">Model: {node.model_provenance}</span>
                </div>

                {/* Physical Quantitative Measurements */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {node.metric.area_km2 !== undefined && (
                    <div className="p-2 rounded bg-space-900 border border-space-700">
                      <span className="text-[10px] text-slate-400 block">AREA (KM²)</span>
                      <strong className="text-sm text-cyan-400">{node.metric.area_km2} km²</strong>
                    </div>
                  )}
                  {node.metric.delta_area_km2 !== undefined && (
                    <div className="p-2 rounded bg-space-900 border border-space-700">
                      <span className="text-[10px] text-slate-400 block">DELTA (Δ)</span>
                      <strong className={`text-sm ${node.metric.delta_area_km2 >= 0 ? 'text-radar-green' : 'text-red-400'}`}>
                        {node.metric.delta_area_km2 >= 0 ? '+' : ''}{node.metric.delta_area_km2} km²
                      </strong>
                    </div>
                  )}
                  {node.metric.percentage_change !== undefined && (
                    <div className="p-2 rounded bg-space-900 border border-space-700">
                      <span className="text-[10px] text-slate-400 block">SHIFT (%)</span>
                      <strong className="text-sm text-radar-yellow">{node.metric.percentage_change}%</strong>
                    </div>
                  )}
                  {node.metric.pixel_count !== undefined && (
                    <div className="p-2 rounded bg-space-900 border border-space-700">
                      <span className="text-[10px] text-slate-400 block">PIXELS</span>
                      <strong className="text-sm text-slate-200">{node.metric.pixel_count.toLocaleString()}</strong>
                    </div>
                  )}
                </div>

                {/* Mask Preview Image if available */}
                {node.preview_png_uri && (
                  <div className="rounded-lg overflow-hidden border border-space-700 bg-space-950">
                    <img
                      src={node.preview_png_uri}
                      alt={node.title}
                      className="w-full h-32 object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Execution Trace Timeline */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
            <BarChart2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Telemetry Step Latencies</span>
          </h3>
          <div className="bg-space-850 p-3 rounded-lg border border-space-700 font-mono text-[10px] space-y-2">
            {graph.execution_trace.map((t) => (
              <div key={t.step_number} className="flex items-center justify-between border-b border-space-800 pb-1.5 last:border-0 last:pb-0">
                <span className="text-slate-300 truncate max-w-[240px]">
                  {t.step_number}. {t.tool_name}
                </span>
                <span className="text-cyan-400">{t.duration_ms} ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
