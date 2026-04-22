import { openaiService } from './openaiService';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface BrowserSpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

const getSpeechRecognitionConstructor = (): BrowserSpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const browserSpeechService = {
  isSupported(): boolean {
    return Boolean(getSpeechRecognitionConstructor());
  },

  createRecognition(
    onResult: (payload: { finalTranscript: string; interimTranscript: string }) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): BrowserSpeechRecognition | null {
    const RecognitionCtor = getSpeechRecognitionConstructor();
    if (!RecognitionCtor) return null;

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;

        if (result.isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      onResult({
        finalTranscript: finalTranscript.trim(),
        interimTranscript: interimTranscript.trim(),
      });
    };

    recognition.onerror = (event) => {
      onError?.(event.error || 'speech-recognition-error');
    };

    recognition.onend = () => {
      onEnd?.();
    };

    return recognition;
  },
};

export const voiceInputService = {
  async transcribeBlob(
    audioBlob: Blob,
    options: {
      prompt?: string;
      language?: string;
      model?: 'gpt-4o-mini-transcribe' | 'gpt-4o-transcribe' | 'whisper-1';
    } = {}
  ): Promise<string> {
    if (openaiService.isConfigured()) {
      return await openaiService.transcribeAudio(audioBlob, {
        model: options.model || 'gpt-4o-mini-transcribe',
        prompt: options.prompt,
        language: options.language,
      });
    }

    throw new Error('OpenAI API key is not configured. Voice recording requires a model transcription endpoint.');
  },
};
