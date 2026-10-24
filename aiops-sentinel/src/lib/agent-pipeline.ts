// LangGraph-inspired Agent Pipeline for Incident Analysis
// Since @langchain/langgraph requires heavy dependencies, we implement
// a lightweight state-graph pattern that mirrors LangGraph's architecture

import { sarvamChat, sarvamTranslate, sarvamTTS } from "./sarvam";
import type { Incident, LogEntry, Alert } from "./mock-data";

// ============= State Graph Types =============
interface AgentState {
  incident: Incident;
  phase: "sweep" | "triage" | "remediation" | "validation" | "complete";
  analysis: string;
  rootCause: string;
  remediation: string;
  translatedAlert: string;
  audioBase64: string | null;
  priority: number;
  confidence: number;
  timeline: { time: string; event: string; agent: string }[];
}

type AgentNode = (state: AgentState) => Promise<AgentState>;

// ============= Agent Nodes =============

// NODE 1: Sweep Agent - Error fingerprinting & ranking
async function sweepAgent(state: AgentState): Promise<AgentState> {
  const { incident } = state;
  const errorSummary = incident.relatedLogs
    .map((l) => `[${l.level}] ${l.service}: ${l.message}`)
    .join("\n");

  const analysis = await sarvamChat(
    `You are a Sweep Agent in a DevOps AIOps system. Your job is to analyze error logs, rank them by severity, and create a stable fingerprint. Be concise and technical. Respond in JSON format with fields: fingerprint, severity_score (1-10), volume_assessment, pattern_detected.`,
    `Analyze these error logs for incident "${incident.title}":\n\n${errorSummary}\n\nError count: ${incident.errorCount}\nSessions affected: ${incident.sessionsAffected}\nServices: ${incident.services.join(", ")}`
  );

  state.timeline.push({
    time: new Date().toISOString(),
    event: `Sweep complete: ${incident.errorCount} errors fingerprinted across ${incident.services.length} services`,
    agent: "Sweep Agent",
  });
  state.analysis = analysis;
  state.phase = "triage";
  return state;
}

// NODE 2: Triage Agent - Root cause analysis & classification
async function triageAgent(state: AgentState): Promise<AgentState> {
  const { incident } = state;
  const logsContext = incident.relatedLogs
    .slice(0, 5)
    .map((l) => `[${l.level}] ${l.service}: ${l.message}\n${l.stackTrace || ""}`)
    .join("\n---\n");

  const alertsContext = incident.relatedAlerts
    .map((a) => `[${a.severity}] ${a.title} - ${a.service}: ${a.description}`)
    .join("\n");

  const rootCause = await sarvamChat(
    `You are a Triage Agent in a DevOps AIOps system. Analyze the error logs, stack traces, and alerts to determine the root cause. Classify the error as: fatal / hidden-fatal / noise. Identify suspect files and code owners. Be concise and actionable. Format your response as:
ROOT CAUSE: <one line>
CLASSIFICATION: <fatal/hidden-fatal/noise>
SUSPECT FILES: <file paths>
IMPACT: <user impact assessment>
CONFIDENCE: <high/medium/low>`,
    `Incident: ${incident.title}\nSeverity: ${incident.severity}\n\nError Logs:\n${logsContext}\n\nAlerts:\n${alertsContext}\n\nPrevious Analysis:\n${state.analysis}`
  );

  state.rootCause = rootCause;
  state.confidence = rootCause.toLowerCase().includes("high") ? 0.9 : rootCause.toLowerCase().includes("medium") ? 0.7 : 0.5;
  state.timeline.push({
    time: new Date().toISOString(),
    event: `Triage complete: Root cause identified with ${Math.round(state.confidence * 100)}% confidence`,
    agent: "Triage Agent",
  });
  state.phase = "remediation";
  return state;
}

// NODE 3: Remediation Agent - Fix suggestions
async function remediationAgent(state: AgentState): Promise<AgentState> {
  const { incident } = state;

  const remediation = await sarvamChat(
    `You are a Remediation Agent in a DevOps AIOps system. Based on the root cause analysis, provide actionable remediation steps. Include:
1. Immediate mitigation (what to do RIGHT NOW)
2. Code fix (specific code changes needed)
3. Prevention (how to prevent recurrence)
4. Verification steps (how to confirm the fix works)
Be specific with file paths, commands, and code snippets.`,
    `Incident: ${incident.title}\nServices: ${incident.services.join(", ")}\n\nRoot Cause Analysis:\n${state.rootCause}\n\nRelated Stack Traces:\n${incident.relatedLogs[0]?.stackTrace || "N/A"}`
  );

  state.remediation = remediation;
  state.timeline.push({
    time: new Date().toISOString(),
    event: "Remediation plan generated with code fix suggestions",
    agent: "Remediation Agent",
  });
  state.phase = "validation";
  return state;
}

// NODE 4: Validation Agent - Post-fix monitoring setup
async function validationAgent(state: AgentState): Promise<AgentState> {
  // Translate alert to Hindi for multilingual support
  const alertSummary = `Critical incident: ${state.incident.title}. Root cause: ${state.rootCause.slice(0, 200)}. Status: Remediation in progress.`;

  const [translated, audio] = await Promise.all([
    sarvamTranslate(alertSummary.slice(0, 500), "hi-IN"),
    sarvamTTS(alertSummary.slice(0, 200), "hi-IN"),
  ]);

  state.translatedAlert = translated;
  state.audioBase64 = audio;
  state.timeline.push({
    time: new Date().toISOString(),
    event: "Multilingual alert generated (Hindi). Monitoring post-fix metrics.",
    agent: "Validation Agent",
  });
  state.phase = "complete";
  return state;
}

// ============= State Graph Execution =============
const AGENT_PIPELINE: Record<string, { node: AgentNode; next: string | null }> = {
  sweep: { node: sweepAgent, next: "triage" },
  triage: { node: triageAgent, next: "remediation" },
  remediation: { node: remediationAgent, next: "validation" },
  validation: { node: validationAgent, next: null },
};

export async function runAgentPipeline(incident: Incident): Promise<AgentState> {
  let state: AgentState = {
    incident,
    phase: "sweep",
    analysis: "",
    rootCause: incident.rootCause || "",
    remediation: incident.remediation || "",
    translatedAlert: "",
    audioBase64: null,
    priority: incident.severity === "critical" ? 1 : incident.severity === "high" ? 2 : incident.severity === "medium" ? 3 : 4,
    confidence: 0,
    timeline: [...incident.timeline],
  };

  let currentPhase: string | null = "sweep";

  while (currentPhase) {
    const step = AGENT_PIPELINE[currentPhase];
    if (!step) break;

    try {
      state = await step.node(state);
    } catch (error) {
      console.error(`Agent ${currentPhase} failed:`, error);
      state.timeline.push({
        time: new Date().toISOString(),
        event: `Agent error in ${currentPhase}: ${error}`,
        agent: currentPhase,
      });
    }
    currentPhase = step.next;
  }

  return state;
}

export type { AgentState };
