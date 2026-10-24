"use client";
import { useState, useEffect, useCallback } from "react";

interface Incident {
  id: string; title: string; severity: string; status: string; detectedAt: string;
  services: string[]; errorCount: number; sessionsAffected: number; fingerprint: string;
  rootCause?: string; remediation?: string; translatedAlert?: string; audioAlert?: string | null;
  relatedLogs: any[]; relatedAlerts: any[]; relatedTraces: any[];
  timeline: { time: string; event: string; agent: string }[];
}

interface MetricData {
  current: { service: string; cpu: number; memory: number; latency: number; errorRate: number; requestsPerSec: number }[];
  aggregate: { healthScore: number; avgCpu: number; avgMemory: number; avgErrorRate: number; totalRequests: number; serviceCount: number };
  timeSeries: { time: string; cpu: number; memory: number; latency: number; errorRate: number }[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#3b82f6",
};
const STATUS_LABELS: Record<string, string> = {
  detected: "🔴 Detected", triaging: "🟡 Triaging", remediating: "🔧 Remediating", resolved: "✅ Resolved", regressed: "⚠️ Regressed",
};
const AGENT_ICONS: Record<string, string> = {
  "Sweep Agent": "🔍", "Triage Agent": "🏷️", "Remediation Agent": "🔧", "Validation Agent": "✅",
};

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "incidents" | "pipeline">("overview");

  const fetchData = useCallback(async () => {
    try {
      const [incRes, metRes] = await Promise.all([fetch("/api/incidents"), fetch("/api/metrics")]);
      const incData = await incRes.json();
      const metData = await metRes.json();
      setIncidents(incData.incidents || []);
      setMetrics(metData);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  const runPipeline = async (id: string) => {
    setAnalyzing(id);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.result);
        fetchData();
      }
    } catch (e) { console.error(e); }
    setAnalyzing(null);
  };

  const playAudio = (base64: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    audio.play();
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0e1a 0%, #0f1629 50%, #0a0e1a 100%)" }}>
      {/* Header */}
      <header style={{
        background: "rgba(17, 24, 39, 0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>🛡️</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>AIOps Sentinel</h1>
            <p style={{ fontSize: 11, color: "#64748b" }}>Powered by Sarvam AI — Agentic Error Remediation</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", background: "rgba(26,31,54,0.8)", borderRadius: "10px", padding: "3px" }}>
          {(["overview", "incidents", "pipeline"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, transition: "all 0.2s",
              background: activeTab === tab ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "transparent",
              color: activeTab === tab ? "#fff" : "#94a3b8",
            }}>
              {tab === "overview" ? "📊 Overview" : tab === "incidents" ? "🚨 Incidents" : "🤖 Pipeline"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse-glow 2s infinite" }}></span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Live Monitoring</span>
        </div>
      </header>

      <main style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ animation: "slide-in 0.4s ease-out" }}>
            {/* Health Score + Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Health Score */}
              <div style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))",
                border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 20, textAlign: "center",
              }}>
                <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>System Health</p>
                <p style={{ fontSize: 42, fontWeight: 800, background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {metrics?.aggregate.healthScore ?? "--"}
                </p>
                <p style={{ fontSize: 12, color: "#64748b" }}>/ 100</p>
              </div>
              {[
                { label: "Avg CPU", value: `${metrics?.aggregate.avgCpu ?? "--"}%`, color: "#3b82f6", icon: "⚡" },
                { label: "Avg Memory", value: `${metrics?.aggregate.avgMemory ?? "--"}%`, color: "#8b5cf6", icon: "💾" },
                { label: "Error Rate", value: `${metrics?.aggregate.avgErrorRate ?? "--"}%`, color: "#ef4444", icon: "❌" },
                { label: "Requests/s", value: `${metrics?.aggregate.totalRequests ?? "--"}`, color: "#06b6d4", icon: "📡" },
              ].map((m) => (
                <div key={m.label} style={{
                  background: "rgba(26,31,54,0.8)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16, padding: 20,
                }}>
                  <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                    {m.icon} {m.label}
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Services Grid */}
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#e2e8f0" }}>🖥️ Service Health Matrix</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {metrics?.current.map((svc) => (
                <div key={svc.service} style={{
                  background: "rgba(26,31,54,0.6)", border: `1px solid ${svc.errorRate > 5 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 12, padding: 14, transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{svc.service}</span>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: svc.errorRate > 5 ? "#ef4444" : svc.errorRate > 2 ? "#f59e0b" : "#10b981",
                    }}></span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
                    <span style={{ color: "#64748b" }}>CPU <span style={{ color: svc.cpu > 80 ? "#ef4444" : "#e2e8f0", fontWeight: 600 }}>{svc.cpu}%</span></span>
                    <span style={{ color: "#64748b" }}>MEM <span style={{ color: svc.memory > 80 ? "#ef4444" : "#e2e8f0", fontWeight: 600 }}>{svc.memory}%</span></span>
                    <span style={{ color: "#64748b" }}>LAT <span style={{ color: svc.latency > 500 ? "#f59e0b" : "#e2e8f0", fontWeight: 600 }}>{svc.latency}ms</span></span>
                    <span style={{ color: "#64748b" }}>ERR <span style={{ color: svc.errorRate > 5 ? "#ef4444" : "#e2e8f0", fontWeight: 600 }}>{svc.errorRate}%</span></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Incidents */}
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#e2e8f0" }}>🚨 Active Incidents</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {incidents.slice(0, 4).map((inc) => (
                <div key={inc.id} onClick={() => { setSelected(inc); setActiveTab("incidents"); }} style={{
                  background: "rgba(26,31,54,0.8)", border: `1px solid ${SEVERITY_COLORS[inc.severity]}33`,
                  borderLeft: `3px solid ${SEVERITY_COLORS[inc.severity]}`, borderRadius: 12, padding: 16,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        background: `${SEVERITY_COLORS[inc.severity]}22`, color: SEVERITY_COLORS[inc.severity],
                      }}>{inc.severity}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{inc.title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#94a3b8" }}>
                      <span>{STATUS_LABELS[inc.status] || inc.status}</span>
                      <span>{timeAgo(inc.detectedAt)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    <span>📋 {inc.errorCount} errors</span>
                    <span>👥 {inc.sessionsAffected} sessions</span>
                    <span>🏷️ {inc.services.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === "incidents" && (
          <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: 20, animation: "slide-in 0.4s ease-out" }}>
            {/* Incident List */}
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🚨 All Incidents ({incidents.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {incidents.map((inc) => (
                  <div key={inc.id} onClick={() => { setSelected(inc); setAnalysisResult(null); }} style={{
                    background: selected?.id === inc.id ? "rgba(59,130,246,0.1)" : "rgba(26,31,54,0.8)",
                    border: `1px solid ${selected?.id === inc.id ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                    borderLeft: `3px solid ${SEVERITY_COLORS[inc.severity]}`, borderRadius: 12, padding: 14,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        background: `${SEVERITY_COLORS[inc.severity]}22`, color: SEVERITY_COLORS[inc.severity],
                      }}>{inc.severity}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{timeAgo(inc.detectedAt)}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{inc.title}</p>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#64748b" }}>
                      <span>{inc.errorCount} errors</span>
                      <span>{inc.sessionsAffected} sessions</span>
                      <span>{STATUS_LABELS[inc.status]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident Detail */}
            {selected && (
              <div style={{ animation: "slide-in 0.3s ease-out" }}>
                <div style={{
                  background: "rgba(26,31,54,0.8)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16, padding: 20, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                    <div>
                      <span style={{
                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: `${SEVERITY_COLORS[selected.severity]}22`, color: SEVERITY_COLORS[selected.severity],
                      }}>{selected.severity.toUpperCase()}</span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>{selected.title}</h3>
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Fingerprint: <code style={{ fontFamily: "'JetBrains Mono', monospace", color: "#8b5cf6" }}>{selected.fingerprint}</code></p>
                    </div>
                    <button onClick={() => runPipeline(selected.id)} disabled={analyzing === selected.id} style={{
                      padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                      background: analyzing === selected.id ? "#374151" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      color: "#fff", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                    }}>
                      {analyzing === selected.id ? "⏳ Analyzing..." : "🤖 Run Sarvam AI Pipeline"}
                    </button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>{selected.errorCount}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Errors</p>
                    </div>
                    <div style={{ background: "rgba(249,115,22,0.1)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: "#f97316" }}>{selected.sessionsAffected}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Sessions</p>
                    </div>
                    <div style={{ background: "rgba(59,130,246,0.1)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6" }}>{selected.services.length}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>Services</p>
                    </div>
                  </div>
                </div>

                {/* Root Cause (from Sarvam) */}
                {(analysisResult?.rootCause || selected.rootCause) && (
                  <div style={{
                    background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: 16, padding: 16, marginBottom: 12,
                  }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: "#8b5cf6", marginBottom: 8 }}>🧠 Root Cause Analysis <span style={{ fontSize: 10, color: "#64748b" }}>(Sarvam AI — sarvam-m)</span></h4>
                    <pre style={{ fontSize: 12, color: "#e2e8f0", whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                      {analysisResult?.rootCause || selected.rootCause}
                    </pre>
                    {analysisResult?.confidence && (
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Confidence:</span>
                        <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                          <div style={{ width: `${analysisResult.confidence * 100}%`, height: "100%", background: "linear-gradient(90deg, #8b5cf6, #3b82f6)", borderRadius: 3 }}></div>
                        </div>
                        <span style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 600 }}>{Math.round(analysisResult.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Remediation (from Sarvam) */}
                {(analysisResult?.remediation || selected.remediation) && (
                  <div style={{
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 16, padding: 16, marginBottom: 12,
                  }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: "#10b981", marginBottom: 8 }}>🔧 Remediation Plan <span style={{ fontSize: 10, color: "#64748b" }}>(Sarvam AI — sarvam-m)</span></h4>
                    <pre style={{ fontSize: 12, color: "#e2e8f0", whiteSpace: "pre-wrap", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                      {analysisResult?.remediation || selected.remediation}
                    </pre>
                  </div>
                )}

                {/* Translated Alert (Sarvam Translate + TTS) */}
                {(analysisResult?.translatedAlert || selected.translatedAlert) && (
                  <div style={{
                    background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)",
                    borderRadius: 16, padding: 16, marginBottom: 12,
                  }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: "#06b6d4", marginBottom: 8 }}>🌐 Hindi Alert <span style={{ fontSize: 10, color: "#64748b" }}>(Sarvam Translate — mayura + Sarvam TTS — bulbul)</span></h4>
                    <p style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>{analysisResult?.translatedAlert || selected.translatedAlert}</p>
                    {(analysisResult?.audioBase64 || selected.audioAlert) && (
                      <button onClick={() => playAudio(analysisResult?.audioBase64 || selected.audioAlert!)} style={{
                        marginTop: 10, padding: "6px 16px", borderRadius: 8, border: "1px solid rgba(6,182,212,0.3)",
                        background: "rgba(6,182,212,0.15)", color: "#06b6d4", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}>🔊 Play Hindi Voice Alert</button>
                    )}
                  </div>
                )}

                {/* Timeline */}
                <div style={{
                  background: "rgba(26,31,54,0.8)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16, padding: 16,
                }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📜 Agent Timeline</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {(analysisResult?.timeline || selected.timeline).map((t: any, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 12, paddingLeft: 16, borderLeft: "2px solid #2a3050", paddingBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{new Date(t.time).toLocaleTimeString()}</span>
                          <span style={{ fontSize: 11, marginLeft: 8, color: "#8b5cf6" }}>{AGENT_ICONS[t.agent] || "🤖"} {t.agent}</span>
                          <p style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{t.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Logs */}
                {selected.relatedLogs.length > 0 && (
                  <div style={{
                    background: "rgba(26,31,54,0.8)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 16, padding: 16, marginTop: 12,
                  }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📋 Related Logs</h4>
                    {selected.relatedLogs.slice(0, 4).map((log: any) => (
                      <div key={log.id} style={{
                        background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 10, marginBottom: 6,
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      }}>
                        <span style={{ color: log.level === "FATAL" || log.level === "ERROR" ? "#ef4444" : "#f59e0b" }}>[{log.level}]</span>
                        <span style={{ color: "#8b5cf6", marginLeft: 6 }}>{log.service}</span>
                        <span style={{ color: "#94a3b8", marginLeft: 6 }}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PIPELINE TAB */}
        {activeTab === "pipeline" && (
          <div style={{ animation: "slide-in 0.4s ease-out" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🤖 Sarvam AI Agent Pipeline</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>LangGraph-style state graph — each agent node uses Sarvam AI as its brain</p>

            {/* Pipeline Visualization */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40, flexWrap: "wrap" }}>
              {[
                { name: "Sweep Agent", icon: "🔍", desc: "Rank errors, fingerprint, dedup", api: "Sarvam Chat (sarvam-m)", color: "#3b82f6" },
                { name: "Triage Agent", icon: "🏷️", desc: "Root cause, classify fatal/noise", api: "Sarvam Chat (sarvam-m)", color: "#8b5cf6" },
                { name: "Remediation Agent", icon: "🔧", desc: "Generate code fix & mitigation", api: "Sarvam Chat (sarvam-m)", color: "#10b981" },
                { name: "Validation Agent", icon: "✅", desc: "Multilingual alerts, monitoring", api: "Sarvam Translate + TTS", color: "#06b6d4" },
              ].map((agent, i) => (
                <div key={agent.name} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    background: `${agent.color}15`, border: `2px solid ${agent.color}40`,
                    borderRadius: 16, padding: 20, width: 220, textAlign: "center", transition: "all 0.3s",
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{agent.icon}</div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: agent.color }}>{agent.name}</h3>
                    <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{agent.desc}</p>
                    <div style={{
                      marginTop: 10, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                      background: `${agent.color}22`, color: agent.color, display: "inline-block",
                    }}>🧠 {agent.api}</div>
                  </div>
                  {i < 3 && <div style={{ fontSize: 24, color: "#374151", margin: "0 8px" }}>→</div>}
                </div>
              ))}
            </div>

            {/* Sarvam API Integration Details */}
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🧠 Sarvam AI API Integration</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { name: "Chat Completions", model: "sarvam-m", endpoint: "POST /v1/chat/completions", usage: "Error analysis, root cause detection, code fix generation", color: "#3b82f6", calls: "3 calls/incident" },
                { name: "Translation", model: "mayura:v1", endpoint: "POST /translate", usage: "Alert translation to Hindi, Tamil, Telugu & more", color: "#8b5cf6", calls: "1 call/incident" },
                { name: "Text-to-Speech", model: "bulbul:v1", endpoint: "POST /text-to-speech", usage: "Voice alerts in regional Indian languages", color: "#06b6d4", calls: "1 call/incident" },
              ].map((api) => (
                <div key={api.name} style={{
                  background: "rgba(26,31,54,0.8)", border: `1px solid ${api.color}30`,
                  borderRadius: 16, padding: 20,
                }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: api.color, marginBottom: 8 }}>{api.name}</h4>
                  <code style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", display: "block", marginBottom: 6 }}>{api.endpoint}</code>
                  <p style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Model: <span style={{ color: api.color }}>{api.model}</span></p>
                  <p style={{ fontSize: 11, color: "#e2e8f0", marginBottom: 8 }}>{api.usage}</p>
                  <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, background: `${api.color}22`, color: api.color, fontWeight: 600 }}>{api.calls}</span>
                </div>
              ))}
            </div>

            {/* Run Pipeline Demo */}
            <div style={{
              marginTop: 24, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 16, padding: 20, textAlign: "center",
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>⚡ Run Live Pipeline Demo</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>Select an incident from the Incidents tab and click "Run Sarvam AI Pipeline" to see all 5 API calls in action</p>
              <button onClick={() => setActiveTab("incidents")} style={{
                padding: "10px 28px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: "#fff", fontSize: 14, fontWeight: 600,
              }}>Go to Incidents →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
