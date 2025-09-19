"use client";

import { useState, useEffect } from "react";
import { createSettingsAction, getAvailableVoicesAction } from "./actions";
import { Voice } from "@/types/voice";

export default function CreatePage() {
  const [name, setName] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const result = await getAvailableVoicesAction();
        if (result.success && result.data) {
          setVoices(result.data);
          if (result.data.length > 0) {
            setVoiceId(result.data[0].voice_id);
          }
        } else {
          setError(result.error || "Failed to load voices");
        }
      } catch {
        setError("Failed to load voices");
      } finally {
        setLoading(false);
      }
    };

    loadVoices();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!voiceId) {
      setError("Voice selection is required");
      return;
    }

    const result = await createSettingsAction(name, voiceId);

    if (!result.success) {
      setError(result.error || "Failed to create settings");
      return;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Create New Settings</h1>

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter settings name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="voice" className="block text-sm font-medium">
            Voice
          </label>
          <select
            id="voice"
            value={voiceId}
            onChange={(e) => {
              setVoiceId(e.target.value);
              setError("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading || !voiceId}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create
        </button>
      </div>
    </div>
  );
}
