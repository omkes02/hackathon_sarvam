// API Route: GET /api/incidents — List all incidents
// API Route: POST /api/incidents — Run agent pipeline on an incident
import { NextRequest, NextResponse } from "next/server";
import { generateIncidents } from "@/lib/mock-data";
import { runAgentPipeline } from "@/lib/agent-pipeline";

// Cache incidents so they persist across requests during the demo
let cachedIncidents: ReturnType<typeof generateIncidents> | null = null;

function getIncidents() {
  if (!cachedIncidents) {
    cachedIncidents = generateIncidents();
  }
  return cachedIncidents;
}

export async function GET() {
  const incidents = getIncidents();
  return NextResponse.json({ incidents });
}

export async function POST(req: NextRequest) {
  try {
    const { incidentId } = await req.json();
    const incidents = getIncidents();
    const incident = incidents.find((i) => i.id === incidentId);

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Run the full agent pipeline (Sweep → Triage → Remediation → Validation)
    const result = await runAgentPipeline(incident);

    // Update the cached incident with results
    incident.rootCause = result.rootCause;
    incident.remediation = result.remediation;
    incident.translatedAlert = result.translatedAlert;
    incident.audioAlert = result.audioBase64;
    incident.timeline = result.timeline;
    incident.status = "remediating";

    return NextResponse.json({
      success: true,
      result: {
        analysis: result.analysis,
        rootCause: result.rootCause,
        remediation: result.remediation,
        translatedAlert: result.translatedAlert,
        audioBase64: result.audioBase64,
        confidence: result.confidence,
        priority: result.priority,
        timeline: result.timeline,
        phase: result.phase,
      },
    });
  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json({ error: "Pipeline execution failed" }, { status: 500 });
  }
}
