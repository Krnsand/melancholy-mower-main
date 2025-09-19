"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings } from "@/types/settings";
import { Voice, findVoiceById } from "@/types/voice";
import Link from "next/link";

export function EditForm({ settings }: { settings: Settings }) {
  const [formData, setFormData] = useState(settings);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBlur = useCallback(
    async (field: keyof Settings, value: Settings[keyof Settings]) => {
      console.log(`handleBlur called for field: ${field}, value:`, value);
      
      console.log(`About to call API route for id: ${settings.id}, field: ${field}`);
      try {
        const url = `/api/settings/${settings.id}`;
        const body = { [field]: value };
        
        console.log(`FETCH REQUEST: ${url}`, { method: 'PATCH', body });
        
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        console.log(`FETCH RESPONSE: Status ${response.status}, OK: ${response.ok}`);
        console.log(`FETCH RESPONSE Headers:`, Object.fromEntries(response.headers.entries()));
        
        const result = await response.json();
        console.log(`API route result for ${field}:`, result);

        if (!result.success) {
          console.error(`Update failed for ${field}:`, result.error);
          setErrors((prev) => ({
            ...prev,
            [field]: result.error || "Update failed",
          }));
        } else {
          console.log(`Update successful for ${field}:`, result.data);
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      } catch (error) {
        console.error(`Exception calling API route for ${field}:`, error);
        setErrors((prev) => ({
          ...prev,
          [field]: "Network error",
        }));
      }
    },
    [settings.id]
  );

  useEffect(() => {
    const loadVoices = async () => {
      try {
        // Test server execution first
        console.log("Testing server execution...");
        const testResponse = await fetch('/api/test');
        const testResult = await testResponse.json();
        console.log("Test API result:", testResult);

        const result = await fetch('/api/voices');
        if (result.ok) {
          const voices = await result.json();
          setVoices(voices);

          // Check if current voice_id exists in available voices
          const currentVoice = findVoiceById(voices, settings.voice_id);
          if (!currentVoice && voices.length > 0) {
            // Current voice not found, use the first available voice
            const newVoiceId = voices[0].voice_id;
            setFormData((prev) => ({ ...prev, voice_id: newVoiceId }));
            // Update the backend with the new voice ID
            await handleBlur("voice_id", newVoiceId);
          }
        }
      } catch (error) {
        console.error("Error loading voices:", error);
      } finally {
        setVoicesLoading(false);
      }
    };

    loadVoices();
  }, [settings.voice_id, handleBlur]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          onBlur={(e) => handleBlur("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="agent_id" className="block text-sm font-medium">
          Agent ID (Read-only)
        </label>
        <input
          id="agent_id"
          type="text"
          value={formData.agent_id}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="voice_id" className="block text-sm font-medium">
          Voice
        </label>
        {voicesLoading ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
            Loading voices...
          </div>
        ) : (
          <select
            id="voice_id"
            value={formData.voice_id}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, voice_id: e.target.value }))
            }
            onBlur={(e) => handleBlur("voice_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name}
              </option>
            ))}
          </select>
        )}
        {errors.voice_id && (
          <p className="text-sm text-red-600">{errors.voice_id}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="instructions" className="block text-sm font-medium">
          Instructions
        </label>
        <textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, instructions: e.target.value }))
          }
          onBlur={(e) => {
            console.log("handleBlur called for instructions");
            handleBlur("instructions", e.target.value);
          }}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.instructions && (
          <p className="text-sm text-red-600">{errors.instructions}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="bump_instruction" className="block text-sm font-medium">
          Bump Instruction
        </label>
        <textarea
          id="bump_instruction"
          value={formData.bump_instruction}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              bump_instruction: e.target.value,
            }))
          }
          onBlur={(e) => handleBlur("bump_instruction", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.bump_instruction && (
          <p className="text-sm text-red-600">{errors.bump_instruction}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="accelerometer_sensitivity"
          className="block text-sm font-medium"
        >
          Bump Threshold:{" "}
          {formData.accelerometer_sensitivity.toFixed(1)}
        </label>
        <input
          id="accelerometer_sensitivity"
          type="range"
          min="0"
          max="5"
          step="0.1"
          value={formData.accelerometer_sensitivity}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              accelerometer_sensitivity: parseFloat(e.target.value),
            }))
          }
          onMouseUp={(e) =>
            handleBlur(
              "accelerometer_sensitivity",
              parseFloat((e.target as HTMLInputElement).value)
            )
          }
          onTouchEnd={(e) =>
            handleBlur(
              "accelerometer_sensitivity",
              parseFloat((e.target as HTMLInputElement).value)
            )
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 (More sensitive)</span>
          <span>5 (Less sensitive)</span>
        </div>
        {errors.accelerometer_sensitivity && (
          <p className="text-sm text-red-600">
            {errors.accelerometer_sensitivity}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="session_length" className="block text-sm font-medium">
          Session Length (seconds)
        </label>
        <input
          id="session_length"
          type="number"
          min="1"
          value={formData.session_length}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              session_length: parseInt(e.target.value),
            }))
          }
          onBlur={(e) => handleBlur("session_length", parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.session_length && (
          <p className="text-sm text-red-600">{errors.session_length}</p>
        )}
      </div>

      <Link
        href="/"
        className="block w-full text-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
