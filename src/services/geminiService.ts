import { GoogleGenAI, Modality } from "@google/genai";

const MODEL_NAME = "gemini-3.1-flash-tts-preview";

export interface TTSResponse {
  audioBase64: string;
  error?: string;
}

export async function generateHondurasAudio(text: string): Promise<TTSResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found. Please check your environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Actúa como un locutor profesional nativo de Honduras. CARACTERÍSTICAS OBLIGATORIAS: Tono naturalmente GRAVE y PROFUNDO; Estilo JOVEN, DINÁMICO, ENÉRGICO y MODERNO; Acento Hondureño auténtico; Habla de forma clara y profesional con ritmo natural en el siguiente texto: ${text}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("No response candidates received from Gemini API.");
    }

    const parts = candidate.content?.parts;
    let base64Audio = "";
    
    if (parts && parts.length > 0) {
      for (const part of parts) {
        if (part.inlineData) {
          base64Audio = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Audio) {
      // Fallback: check if the model returned text instead of audio (error or refusal)
      const textResponse = response.text;
      if (textResponse) {
        throw new Error(`The AI returned text instead of audio: ${textResponse}`);
      }
      throw new Error("No audio data received from Gemini API.");
    }

    return { audioBase64: base64Audio };
  } catch (error: any) {
    console.error("Error generating audio:", error);
    return { 
      audioBase64: "", 
      error: error.message || "An unexpected error occurred while generating audio." 
    };
  }
}
