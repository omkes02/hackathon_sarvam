# 🛡️ AIOps Sentinel — Autonomous Incident Remediation Platform

> **An Agentic Error Remediation & DevOps Intelligence Platform powered end-to-end by Sarvam AI.**
> Built during the **Sarvam AI Hackathon**.

[![Sarvam AI](https://img.shields.io/badge/Powered%20By-Sarvam%20AI-blueviolet?style=for-the-badge)](https://www.sarvam.ai/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LangGraph Pattern](https://img.shields.io/badge/Architecture-LangGraph%20State%20Graph-orange?style=for-the-badge)](https://langchain-ai.github.io/langgraph/)

---

## 📌 Problem Statement

In modern distributed microservice architectures:
- Production errors land continuously from APM tools (New Relic, Datadog, Splunk).
- Today, on-call engineers manually execute a 7-step triage relay per incident:
  1. Detect & filter critical errors
  2. Search prior tickets / deduplicate
  3. Triage & assign to domain teams
  4. Trace logs & diagnose root cause
  5. Formulate remediation & draft fixes
  6. Validate in staging
  7. Broadcast alerts to regional engineering hubs
- **At high scale, over 80% of critical warnings and silent regressions go unaddressed**, causing cascading outages and SLA penalties.

---

## 💡 The Solution: AIOps Sentinel

**AIOps Sentinel** replaces the manual on-call relay with an **autonomous 4-Agent Pipeline** modeled after enterprise remediation workflows, with **Sarvam AI serving as the centralized cognitive core**.

### 🔄 Multi-Agent Workflow

```
[ Error Logs + Metrics + Alerts + Distributed Traces ]
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│  🔍 1. Sweep Agent (Sarvam-M Chat API)                 │
│  • Clusters high-volume error bursts                   │
│  • Calculates severity & produces error fingerprints   │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│  🏷️ 2. Triage Agent (Sarvam-M Chat API)               │
│  • Correlates stack traces & APM alerts                │
│  • Classifies: Fatal vs. Hidden-Fatal vs. Noise        │
│  • Pinpoints suspect code files & root cause           │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│  🔧 3. Remediation Agent (Sarvam-M Chat API)          │
│  • Formulates immediate mitigation steps               │
│  • Generates targeted code fixes & regression tests    │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│  ✅ 4. Validation & Dispatch Agent (Mayura + Bulbul)   │
│  • Synthesizes incident intelligence                   │
│  • Sarvam Translate (Mayura:v1): Translates to Indic   │
│  • Sarvam TTS (Bulbul:v1): Generates Voice Audio Alerts│
└────────────────────────────────────────────────────────┘
```

---

## 🧠 Sarvam AI Integration (Core Architecture)

Sarvam AI is **not** an auxiliary translation widget; it is the **decision-making brain of the entire platform**, handling up to **5 API interactions per incident cycle**:

| Capability | Sarvam API Endpoint | Model | Purpose in AIOps Sentinel |
|---|---|---|---|
| **Incident Sweep** | `POST /v1/chat/completions` | `sarvam-m` | Ranks raw log bursts and establishes stable fingerprints |
| **Root Cause Triage** | `POST /v1/chat/completions` | `sarvam-m` | Synthesizes stack traces, APM metrics & classifies error impact |
| **Code Remediation** | `POST /v1/chat/completions` | `sarvam-m` | Produces exact code patches, mitigating commands & unit tests |
| **Multilingual Alerting** | `POST /translate` | `mayura:v1` | Translates technical incident summaries into Indic languages (Hindi, Tamil, etc.) |
| **Voice Dispatch** | `POST /text-to-speech` | `bulbul:v1` | Generates clear spoken audio alerts for on-call responders |

---

## ✨ Key Features

1. **Real-time Observability Matrix**: Live telemetry tracking CPU, memory, request volume, error percentage, and latency SLA breaches across 8 critical microservices.
2. **Autonomous Incident Fingerprinting**: Prevents alert fatigue by clustering duplicate failures under a single fingerprint (`fp-payment-db-001`, `fp-auth-jwt-002`, etc.).
3. **Interactive Agent Pipeline Execution**: Live trigger button allows on-call leads to observe the Sweep → Triage → Remediation → Validation steps execute in real time.
4. **Multilingual Voice Dispatch**: Translates incident briefs into Hindi and plays them back via Sarvam Bulbul TTS for immediate auditory awareness on critical Sev-1 alerts.
5. **Human-in-the-Loop Safeguards**: AI provides root cause analysis, confidence scores, and code patches while preserving engineer oversight for production deployment.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (Tested on Node v24)
- **Sarvam AI API Key**

### 2. Installation & Run
```bash
cd aiops-sentinel
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🏆 Hackathon Submission Details

- **Project Name**: AIOps Sentinel
- **Team Repository**: [https://github.com/omkes02/hackathon_sarvam](https://github.com/omkes02/hackathon_sarvam)
- **Primary Technologies**: Sarvam AI (`sarvam-m`, `mayura:v1`, `bulbul:v1`), Next.js 15, TypeScript, Tailwind CSS
