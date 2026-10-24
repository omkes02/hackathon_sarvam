// Sarvam AI Client - Chat Completions, Translation, TTS
const SARVAM_API_KEY = "sk_i80v7tfy_PlkvctJD4dbaqPMBArRKThmC";
const SARVAM_BASE = "https://api.sarvam.ai";

export async function sarvamChat(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  try {
    const res = await fetch(`${SARVAM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        model: "sarvam-m",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1024,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Analysis unavailable";
  } catch (e) {
    console.error("Sarvam Chat Error:", e);
    return "Error connecting to Sarvam AI";
  }
}

export async function sarvamTranslate(
  text: string,
  targetLang: string = "hi-IN"
): Promise<string> {
  try {
    const res = await fetch(`${SARVAM_BASE}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: "en-IN",
        target_language_code: targetLang,
        mode: "formal",
        model: "mayura:v1",
        enable_preprocessing: true,
      }),
    });
    const data = await res.json();
    return data.translated_text || text;
  } catch (e) {
    console.error("Sarvam Translate Error:", e);
    return text;
  }
}

export async function sarvamTTS(
  text: string,
  lang: string = "hi-IN"
): Promise<string | null> {
  try {
    const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 500)],
        target_language_code: lang,
        speaker: "meera",
        model: "bulbul:v1",
      }),
    });
    const data = await res.json();
    return data.audios?.[0] || null; // base64 wav
  } catch (e) {
    console.error("Sarvam TTS Error:", e);
    return null;
  }
}
