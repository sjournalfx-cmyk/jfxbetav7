import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js to use local models if needed, but by default it fetches from Hugging Face
env.allowLocalModels = false;

let transcriber: any = null;

const toMonoChannel = (audioBuffer: AudioBuffer): Float32Array => {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  const mono = new Float32Array(audioBuffer.length);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let index = 0; index < audioBuffer.length; index += 1) {
      mono[index] += channelData[index] / audioBuffer.numberOfChannels;
    }
  }

  return mono;
};

export const localWhisperService = {
  async init() {
    if (transcriber) return;
    
    // Using whisper-tiny.en for speed and small download size (~40MB)
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
  },

  async transcribe(audioBlob: Blob): Promise<string> {
    await this.init();

    // Convert Blob to AudioBuffer
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const audioData = toMonoChannel(audioBuffer);

    try {
      const output = await transcriber(audioData, {
        chunk_length_s: 20,
        stride_length_s: 4,
        language: 'english',
        task: 'transcribe',
      });

      return typeof output === 'string' ? output : (output.text || '');
    } catch (error) {
      console.error('Local Whisper Error:', error);
      throw error;
    } finally {
      await audioContext.close();
    }
  }
};
