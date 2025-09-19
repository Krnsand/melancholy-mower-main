import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Voice } from "@/types/voice";

export async function getAvailableVoices(): Promise<Voice[]> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const elevenlabs = new ElevenLabsClient({ apiKey });

  try {
    const response = await elevenlabs.voices.search();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const voices: Voice[] = response.voices.map((voice: any) => ({
      voice_id: voice.voiceId,
      name: voice.name,
      description: voice.description || undefined,
    }));

    return voices;
  } catch (error) {
    throw new Error(
      `Failed to fetch voices: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
