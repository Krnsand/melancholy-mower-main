"use server";

import { redirect } from "next/navigation";
import { createSettings, getSettingsByName } from "@/db/settings";
import { getAvailableVoices } from "@/db/voices";
import { Voice } from "@/types/voice";
import { ActionResponse } from "@/types/action-response";
import { Settings } from "@/types/settings";
import { revalidatePath } from "next/cache";

async function createElevenLabsAgent(
  name: string,
  instructions: string,
  voiceId: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/agents/create",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: {
              prompt: instructions,
              tool_ids: [
                "tool_8301k5gk9z9tfb8t4qhej6fty8cv",
              ],
            },
          },
          tts: {
            voice_id: voiceId,
          },
        },
        name: `Bloom - ${name}`,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create ElevenLabs agent: ${error}`);
  }

  const data = await response.json();
  return data.agent_id;
}

export async function getAvailableVoicesAction(): Promise<
  ActionResponse<Voice[]>
> {
  try {
    const voices = await getAvailableVoices();
    return {
      success: true,
      data: voices,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch voices",
    };
  }
}

export async function createSettingsAction(
  name: string,
  voiceId: string
): Promise<ActionResponse<Settings>> {
  try {
    if (!name.trim()) {
      return {
        success: false,
        error: "Name is required",
      };
    }

    const existing = await getSettingsByName(name.trim());
    if (existing) {
      return {
        success: false,
        error: "A setting with this name already exists",
      };
    }

    const instructions = "# Intro\nYou are an old lawn mower";

    const agentId = await createElevenLabsAgent(
      name.trim(),
      instructions,
      voiceId
    );

    const newSettings = await createSettings({
      name: name.trim(),
      agent_id: agentId,
      voice_id: voiceId,
      instructions: instructions,
      bump_instruction: "",
      accelerometer_sensitivity: 0.5,
      session_length: 30,
    });

    revalidatePath("/");
    redirect(`/edit/${newSettings.id}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create settings",
    };
  }
}
