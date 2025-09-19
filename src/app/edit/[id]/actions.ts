"use server";

import { updateSettings, getSettingsByName, getSettings } from "@/db/settings";
import { getAvailableVoices } from "@/db/voices";
import { Voice } from "@/types/voice";
import { ActionResponse } from "@/types/action-response";
import { UpdateSettings, Settings } from "@/types/settings";
import { revalidatePath } from "next/cache";

async function updateElevenLabsAgent(
  agentId: string,
  instructions?: string,
  voice_id?: string
): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
    {
      method: "PATCH",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_config: {
          tts: {
            model_id: "eleven_flash_v2_5",
            voice_id: voice_id,
          },
          agent: {
            language: "sv",
            prompt: {
              prompt: instructions,
              tool_ids: [
                "tool_8301k5gk9z9tfb8t4qhej6fty8cv",
              ],
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update ElevenLabs agent: ${error}`);
  }
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

export async function updateSettingsAction(
  id: string,
  updates: UpdateSettings
): Promise<ActionResponse<Settings>> {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] updateSettingsAction: Called with id ${id}, updates:`, updates);
  
  try {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        return {
          success: false,
          error: "Name cannot be empty",
        };
      }

      const existing = await getSettingsByName(updates.name.trim());
      if (existing && existing.id !== id) {
        return {
          success: false,
          error: "A setting with this name already exists",
        };
      }
    }

    if (updates.accelerometer_sensitivity !== undefined) {
      if (
        updates.accelerometer_sensitivity < 0 ||
        updates.accelerometer_sensitivity > 5
      ) {
        return {
          success: false,
          error: "Accelerometer sensitivity must be between 0 and 1",
        };
      }
    }

    if (updates.session_length !== undefined) {
      if (updates.session_length < 1) {
        return {
          success: false,
          error: "Session length must be at least 1 second",
        };
      }
    }

    console.log(`[${timestamp}] updateSettingsAction: About to call updateSettings with id ${id}`);
    const updatedSettings = await updateSettings(id, updates);
    console.log(`[${timestamp}] updateSettingsAction: updateSettings completed, result:`, updatedSettings);
    
    // Force cache invalidation for the edit page
    revalidatePath(`/edit/${id}`);
    
    // If instructions are being updated, also update the ElevenLabs agent
    if (updates.instructions !== undefined || updates.voice_id !== undefined) {
      const currentSettings = await getSettings(id);
      if (currentSettings && currentSettings.agent_id) {
        await updateElevenLabsAgent(
          currentSettings.agent_id,
          updates.instructions,
          updates.voice_id
        );
      }
    }

    return { 
      success: true, 
      data: updatedSettings, 
      error: null 
    };
  } catch (error) {
    console.error(`[${timestamp}] Error updating settings:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
