"use server";

import { ActionResponse } from "@/types/action-response";

export async function getSignedUrlAction(
  agentId: string
): Promise<ActionResponse<{ signedUrl: string }>> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "ELEVENLABS_API_KEY is not configured",
      };
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get signed URL: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: { signedUrl: data.signed_url },
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get signed URL",
    };
  }
}
