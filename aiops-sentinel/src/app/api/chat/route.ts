// API Route: POST /api/chat — Interactive DevOps & Incident Chat with Sarvam AI
import { NextRequest, NextResponse } from "next/server";
import { sarvamChat, sarvamTranslate, sarvamTTS } from "@/lib/sarvam";

export async function POST(req: NextRequest) {
  try {
    const { message, incidentContext, speakHindi } = await req.json();

    const systemPrompt = `You are the AIOps Sentinel Revise & Operations Agent. You help on-call engineers diagnose infrastructure incidents, explain code remediations, investigate logs, and review fixes. Be technical, sharp, and concise.`;
    
    const contextPrompt = incidentContext 
      ? `Current Incident Context: ${JSON.stringify(incidentContext)}\n\nEngineer question: ${message}`
      : message;

    const reply = await sarvamChat(systemPrompt, contextPrompt);

    let hindiReply = "";
    let audioBase64: string | null = null;

    if (speakHindi) {
      hindiReply = await sarvamTranslate(reply.slice(0, 300), "hi-IN");
      audioBase64 = await sarvamTTS(hindiReply.slice(0, 300), "hi-IN");
    }

    return NextResponse.json({
      success: true,
      reply,
      hindiReply,
      audioBase64,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
