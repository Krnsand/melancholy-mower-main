export interface Voice {
  voice_id: string;
  name: string;
  description?: string;
}

export function findVoiceById(voices: Voice[], voiceId: string): Voice | null {
  return voices.find((voice) => voice.voice_id === voiceId) || null;
}
