'use client';

import React, { useState } from 'react';
import { Send, Sparkles, CheckCircle2, AlertCircle, FileSearch, ArrowRight, Clock } from 'lucide-react';
import { Investigation, ChatMessage, EvidenceGraph } from '../types';

interface ChatPanelProps {
  investigation: Investigation | null;
  onSendQuery: (query: string) => void;
  isLoading: boolean;
  onOpenEvidence: (graph: EvidenceGraph) => void;
  activeEvidenceGraph: EvidenceGraph | null;
}

const PRESET_QUERIES = [
  'What changed between these two images?',
  'Has water coverage increased?',
  'Highlight and locate the water body.',
  'Compare optical and SAR backscatter features.',
  'Provide a dense land-cover description of this scene.',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  investigation,
  onSendQuery,
  isLoading,
  onOpenEvidence,
  activeEvidenceGraph,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendQuery(input.trim());
    setInput('');
  };

  const messages = investigation?.messages || [];

  return (
    <div className="w-full h-full flex flex-col bg-space-900 border-l border-space-800 select-none">
      {/* Panel Header */}
      <div className="h-10 px-4 border-b border-space-800 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-semibold tracking-wider">INVESTIGATION CONVERSATION</span>
        </div>
        <span className="text-[11px] text-slate-500">{messages.length} Messages</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-xl p-3.5 leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-isro-blue text-white rounded-tr-none'
                  : msg.sender === 'system'
                  ? 'bg-space-850 border border-space-700 text-slate-400 font-mono text-[11px]'
                  : 'bg-space-850 border border-space-700 text-slate-200 rounded-tl-none'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-1.5 opacity-60 text-[10px] font-mono">
                <span>{msg.sender.toUpperCase()}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>

              {/* Message Text Content */}
              <div className="prose prose-invert prose-xs max-w-none break-words whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Attached Evidence Graph Summary */}
              {msg.evidence_graph && (
                <div className="mt-3 pt-3 border-t border-space-700/60 flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-400 flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3 text-radar-green" />
                      <span>{msg.evidence_graph.claims.length} Verified Evidence Claims</span>
                    </span>
                    <span className="text-slate-400">
                      Conf: {(msg.evidence_graph.aggregate_confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Execution Trace Snippet */}
                  <div className="bg-space-950/70 p-2 rounded border border-space-800 font-mono text-[10px] text-slate-400 space-y-1">
                    {msg.evidence_graph.execution_trace.map((step) => (
                      <div key={step.step_number} className="flex items-center justify-between">
                        <span className="text-slate-300">✓ {step.tool_name}</span>
                        <span className="text-slate-500">{step.duration_ms}ms</span>
                      </div>
                    ))}
                  </div>

                  {/* Inspect Evidence Button */}
                  <button
                    onClick={() => onOpenEvidence(msg.evidence_graph!)}
                    className="mt-1 w-full py-1.5 px-3 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center space-x-1.5 transition font-medium text-xs"
                  >
                    <FileSearch className="h-3.5 w-3.5" />
                    <span>Open Evidence Drawer & Measurements</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-space-850 border border-space-700 rounded-xl text-slate-400 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Agentic Orchestrator is executing specialist models...</span>
          </div>
        )}
      </div>

      {/* Suggested Queries */}
      <div className="px-3 py-2 border-t border-space-800/80 bg-space-950/40">
        <p className="text-[10px] font-mono text-slate-500 mb-1.5 uppercase">Suggested Questions:</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUERIES.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => onSendQuery(pq)}
              disabled={isLoading}
              className="text-[11px] px-2 py-1 rounded bg-space-850 hover:bg-space-800 text-slate-300 hover:text-white border border-space-700/60 transition text-left"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-space-800 bg-space-900 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SatQuery about these remote sensing scenes..."
          disabled={isLoading}
          className="flex-1 bg-space-950 border border-space-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-lg bg-isro-blue hover:bg-blue-600 disabled:opacity-40 text-white shadow-lg transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
