import OpenAI from "openai";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY?.trim();

export const openaiService = {
  isConfigured(): boolean {
    return Boolean(API_KEY);
  },

  async transcribeAudio(
    audioBlob: Blob,
    options: {
      prompt?: string;
      language?: string;
      model?: 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe' | 'whisper-1';
    } = {}
  ): Promise<string> {
    if (!API_KEY) {
      throw new Error("OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment.");
    }

    const openai = new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true,
    });

    try {
      const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });
      
      const response = await openai.audio.transcriptions.create({
        file: file,
        model: options.model || "gpt-4o-mini-transcribe",
        ...(options.prompt ? { prompt: options.prompt } : {}),
        ...(options.language ? { language: options.language } : {}),
        response_format: "text",
      });

      return typeof response === 'string' ? response : ((response as any)?.text || '');
    } catch (error: any) {
      console.error("Transcription Error:", error);
      throw error;
    }
  }
};
