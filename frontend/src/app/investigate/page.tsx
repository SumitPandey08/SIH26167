'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  Image as ImageIcon,
  MapPin,
  Upload,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, Investigation, InvestigationImage } from '../../types';

function InvestigateInner() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('id');

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInv, setActiveInv] = useState<Investigation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [showSceneGallery, setShowSceneGallery] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchInvestigations();
  }, [requestedId]);

  const fetchInvestigations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/investigations');
      if (res.ok) {
        const data = await res.json();
        const list: Investigation[] = data.investigations || [];
        setInvestigations(list);

        if (list.length > 0) {
          const matched = requestedId ? list.find((i) => i.id === requestedId) : null;
          const target = matched || list[0];
          setActiveInv(target);
          setMessages(target.messages || []);
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

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.investigation) {
          setInvestigations((prev) => [data.investigation, ...prev]);
          setActiveInv(data.investigation);
          setMessages(data.investigation.messages || []);
          setShowNewModal(false);
          setNewTitle('');
          setNewDesc('');
        }
      }
    } catch (err) {
      console.error('Failed to create investigation:', err);
    }
  };

  const handleSendMessage = async (queryText?: string, mode: string = 'standard') => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || !activeInv || isLoading) return;

    // Optimistically push user query
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
        body: JSON.stringify({ query: textToSend, requested_mode: mode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.error || 'Analysis service connection failed. Verify Python backend.');
      }
    } catch (err) {
      console.error('Query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tailored presets for the active scenario
  const getScenarioPresets = () => {
    if (!activeInv) return [];
    if (activeInv.id.includes('levir')) {
      return [
        'What changed between T1 and T2?',
        'Quantify new building footprint and pixel count.',
        'Describe urban expansion and land cover shift.',
        'Which architecture was used to infer the change mask?',
      ];
    }
    if (activeInv.id.includes('crossmodal') || activeInv.id.includes('flood')) {
      return [
        'Compare optical and SAR images to map flooded regions.',
        'How does Sentinel-1 radar penetrate clouds?',
        'Detect specular radar reflectance over open water.',
        'Quantify water coverage delta in square kilometers.',
      ];
    }
    return [
      'What changed between 2020 and 2026?',
      'Has water coverage increased by what percentage?',
      'Provide a dense morphological assessment.',
      'Explain spectral differences between vegetation and sediment.',
    ];
  };

  const presets = getScenarioPresets();

  const getPillLabel = (inv: Investigation) => {
    if (inv.id.includes('levir')) return '🏢 LEVIR Urban';
    if (inv.id.includes('crossmodal')) return '🛰️ Sentinel Cross-Modal';
    if (inv.id.includes('nepal')) return '🏔️ Nepal Hydrology';
    if (inv.id.includes('flood')) return '🌊 SAR Inundation';
    return `🛰️ ${inv.title.slice(0, 14)}...`;
  };

  return (
    <div className="h-[calc(100vh-4.25rem)] w-full max-w-5xl mx-auto flex flex-col px-3 md:px-6 pb-4 overflow-hidden select-none">
      {/* 1. Header with Investigation Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 border-b border-white/5 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">AI Geospatial Reasoning</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-neutral-300">
                Zero Hallucination
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
              Natural language queries grounded directly into physical satellite pixels
            </p>
          </div>
        </div>

        {/* Investigation Switcher Carousel */}
        <div className="flex items-center gap-1.5 p-1 rounded-full ios-glass text-xs font-medium max-w-full overflow-x-auto no-scrollbar">
          {investigations.map((inv) => (
            <button
              key={inv.id}
              onClick={() => handleSelectInv(inv)}
              className={`px-3 py-1 rounded-full transition-all text-[11px] shrink-0 ios-btn ${
                activeInv?.id === inv.id
                  ? 'bg-white/15 text-white shadow-sm border border-white/15'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {getPillLabel(inv)}
            </button>
          ))}
          <button
            onClick={() => setShowNewModal(true)}
            className="p-1 px-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition text-xs flex items-center gap-1"
            title="Create New Investigation"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden md:inline text-[11px]">New</span>
          </button>
        </div>
      </div>

      {/* 2. Active Investigation Context Strip */}
      {activeInv && (
        <div className="py-2.5 px-4 my-2 rounded-2xl ios-glass-subtle flex items-center justify-between gap-3 text-xs animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold text-white truncate max-w-[200px] md:max-w-md">
                {activeInv.title}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-neutral-400 text-[11px]">
              <span>•</span>
              <span>{activeInv.images?.length || 0} Scene Assets</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeInv.images?.length > 0 && (
              <button
                onClick={() => setShowSceneGallery(!showSceneGallery)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 text-[11px] border border-white/5 transition-all ios-btn"
              >
                <ImageIcon className="w-3 h-3 text-cyan-400" />
                <span>{showSceneGallery ? 'Hide Scenes' : 'View Scenes'}</span>
              </button>
            )}
            <Link
              href={`/map?id=${activeInv.id}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] border border-cyan-500/30 transition-all ios-btn"
            >
              <span>Map Canvas</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Scene Gallery Preview Drawer (Expandable) */}
      {showSceneGallery && activeInv?.images && (
        <div className="p-3 mb-2 rounded-2xl ios-glass border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 animate-spring-in">
          {activeInv.images.map((img: InvestigationImage) => (
            <div key={img.id} className="relative rounded-xl overflow-hidden bg-black/50 border border-white/10 group">
              <img
                src={`http://localhost:5000${img.preview_url}`}
                alt={img.original_name}
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between text-[10px] font-mono">
                <span className="text-white truncate max-w-[100px]">{img.original_name}</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-200">
                  {img.metadata?.modality || img.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Chat Conversation Scroll View */}
      <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-2 no-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const graph = msg.evidence_graph;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl animate-fade-up ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-md ${
                  isUser
                    ? 'bg-neutral-800 border border-white/10 text-neutral-200'
                    : 'bg-cyan-500/15 border border-cyan-500/25 text-cyan-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className="flex flex-col gap-1.5 flex-1">
                <div
                  className={`p-5 rounded-3xl text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-gradient-to-tr from-neutral-800 to-neutral-750 text-white border border-white/10 rounded-tr-none'
                      : 'ios-glass text-neutral-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</div>

                  {/* Grounded Evidence Graph Card (if attached) */}
                  {graph && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                      {/* Traceable Confidence Header & Dossier Download */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-mono text-neutral-400">Traceable Confidence:</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {((graph.aggregate_confidence || 0.90) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <a
                          href={`http://localhost:5000/api/investigations/${activeInv?.id}/report?format=markdown`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Download Report (.MD)</span>
                        </a>
                      </div>

                      {/* Verified Claims */}
                      {graph.claims?.map((claim) => (
                        <div
                          key={claim.claim_id}
                          className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs"
                        >
                          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                          <div>
                            <span className="font-semibold uppercase text-[10px] tracking-wider block font-mono text-emerald-400">
                              Verified Claim ({claim.status})
                            </span>
                            <span className="leading-normal">{claim.statement}</span>
                          </div>
                        </div>
                      ))}

                      {/* Specialist Execution Trace Stepper */}
                      {graph.execution_trace?.length > 0 && (
                        <div className="pt-1">
                          <button
                            onClick={() =>
                              setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)
                            }
                            className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-cyan-400 transition ios-btn"
                          >
                            {expandedTraceId === msg.id ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                            <span>Execution Trace ({graph.execution_trace.length} Specialist Pipeline Steps)</span>
                          </button>

                          {expandedTraceId === msg.id && (
                            <div className="mt-2 p-3.5 rounded-2xl bg-black/50 border border-white/5 space-y-2 font-mono text-[11px] animate-fade-up">
                              {graph.execution_trace.map((step) => (
                                <div
                                  key={step.step_number}
                                  className="flex items-center justify-between py-1 border-b border-white/5 last:border-0"
                                >
                                  <div className="flex items-center gap-2 truncate mr-2">
                                    <span className="text-cyan-400">[{step.step_number}]</span>
                                    <span className="text-neutral-200 font-medium truncate">
                                      {step.tool_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-neutral-500 text-[10px] hidden sm:inline">
                                      {step.output_summary}
                                    </span>
                                    <span className="text-emerald-400 font-semibold text-[10px]">
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
          <div className="flex gap-3 max-w-xl mr-auto animate-fade-up">
            <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-3xl ios-glass text-xs text-neutral-300 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Executing PyTorch Specialist Models & GIS Feature Mapping...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. Query Contextual Preset Pills & Autonomous Investigation */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 mb-2 no-scrollbar">
        <button
          onClick={() => handleSendMessage('Investigate this area', 'investigation')}
          disabled={isLoading}
          className="shrink-0 px-3.5 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all ios-btn disabled:opacity-50 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>⚡ Auto-Investigate Area</span>
        </button>

        {presets.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="shrink-0 px-3.5 py-1.5 rounded-full ios-glass-subtle hover:bg-white/10 text-neutral-300 text-xs font-medium transition-all ios-btn disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 6. Bottom Input Island */}
      <div className="relative">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask SatQuery about building expansion, water extent, or radar penetration..."
          className="w-full pl-5 pr-14 py-3.5 rounded-full ios-glass border border-white/10 text-white text-sm outline-none focus:border-cyan-500/50 shadow-2xl transition-all"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white text-neutral-950 flex items-center justify-center transition-all ios-btn shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* 7. New Investigation iOS Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl ios-glass border border-white/15 p-6 shadow-2xl animate-spring-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Create New Investigation</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvestigation} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Investigation Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Coastal Mangrove Recession Study"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900/80 border border-white/10 text-white text-xs outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Description / Scientific Objective
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Inundation mapping and cross-modal radar penetration during monsoon cycle."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900/80 border border-white/10 text-white text-xs outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 font-medium text-xs transition ios-btn shadow"
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvestigatePage() {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-neutral-400">Loading Investigation Canvas...</div>}>
      <InvestigateInner />
    </Suspense>
  );
}
