'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Radio,
  Layers,
} from 'lucide-react';
import { ChatMessage, Investigation } from '../../types';

export default function InvestigatePage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInv, setActiveInv] = useState<Investigation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const fetchInvestigations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/investigations');
      if (res.ok) {
        const data = await res.json();
        setInvestigations(data.investigations || []);
        if (data.investigations?.length > 0) {
          setActiveInv(data.investigations[0]);
          setMessages(data.investigations[0].messages || []);
        }
      }
    } catch (e) {
      console.error('Failed to load investigations:', e);
    }
  };

  const handleSelectInv = (inv: Investigation) => {
    setActiveInv(inv);
    setMessages(inv.messages || []);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || !activeInv || isLoading) return;

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:5000/api/investigations/${activeInv.id}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } else {
        alert('Analysis failed. Ensure the Python AI service is running.');
      }
    } catch (err) {
      console.error('Query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const PRESETS = [
    'What changed between 2020 and 2026?',
    'Has water coverage increased by what percentage?',
    'Compare optical and SAR images to map flooded regions.',
    'Explain how Sentinel-1 radar backscatter penetrates clouds.',
  ];

  return (
    <div className="h-[calc(100vh-4rem)] w-full max-w-5xl mx-auto flex flex-col px-4 pb-6 overflow-hidden">
      {/* 1. Header with Investigation Switcher */}
      <div className="flex items-center justify-between py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Geospatial Reasoning</h2>
            <p className="text-[11px] text-neutral-400 font-sans">
              Grounding questions in physical satellite pixel evidence
            </p>
          </div>
        </div>

        {/* Investigation Capsule Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-neutral-900/80 border border-white/10 text-xs font-medium">
          {investigations.map((inv) => (
            <button
              key={inv.id}
              onClick={() => handleSelectInv(inv)}
              className={`px-3 py-1 rounded-full transition text-[11px] ${
                activeInv?.id === inv.id
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {inv.id === 'demo_nepal_hydrology' ? '🏔️ Demo 1: Nepal' : '🌊 Demo 2: SAR Flood'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Chat Conversation Scroll View */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const graph = msg.evidence_graph;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  isUser
                    ? 'bg-neutral-800 border border-white/10 text-neutral-200'
                    : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className="flex flex-col gap-2 flex-1">
                <div
                  className={`p-5 rounded-3xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-neutral-800/80 text-white border border-white/10'
                      : 'bg-neutral-900/50 backdrop-blur-xl text-neutral-200 border border-white/5'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Grounded Evidence Graph Card (if attached) */}
                  {graph && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                      {/* Verified Claims */}
                      {graph.claims?.map((claim) => (
                        <div
                          key={claim.claim_id}
                          className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs"
                        >
                          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold uppercase text-[10px] tracking-wider block font-mono">
                              Verified Claim
                            </span>
                            <span>{claim.statement}</span>
                          </div>
                        </div>
                      ))}

                      {/* Trace Stepper Toggle */}
                      {graph.execution_trace?.length > 0 && (
                        <div className="pt-1">
                          <button
                            onClick={() =>
                              setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)
                            }
                            className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-cyan-400 transition"
                          >
                            {expandedTraceId === msg.id ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                            <span>Execution Trace ({graph.execution_trace.length} Specialist Steps)</span>
                          </button>

                          {expandedTraceId === msg.id && (
                            <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2 font-mono text-[11px]">
                              {graph.execution_trace.map((step) => (
                                <div
                                  key={step.step_number}
                                  className="flex items-center justify-between py-1 border-b border-white/5 last:border-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-cyan-400">[{step.step_number}]</span>
                                    <span className="text-neutral-300 font-medium">
                                      {step.tool_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-neutral-500">{step.output_summary}</span>
                                    <span className="text-emerald-400 font-semibold">
                                      {step.duration_ms} ms
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono text-neutral-500 px-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-3xl bg-neutral-900/40 border border-white/5 text-xs text-neutral-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Executing TinyCD Siamese Attention & Spatial GIS Analysis...</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Query Preset Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 mb-2 no-scrollbar">
        {PRESETS.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium border border-white/5 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 4. Bottom Input Island */}
      <div className="relative">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask a question about spatial change, water coverage, or radar penetration..."
          className="w-full pl-5 pr-14 py-3.5 rounded-full bg-neutral-900/70 backdrop-blur-2xl border border-white/10 text-white text-sm outline-none focus:border-cyan-500/50 shadow-2xl transition"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white text-neutral-950 flex items-center justify-center transition shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
