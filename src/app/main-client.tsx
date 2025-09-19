"use client";

import { useState } from "react";
import { Settings } from "@/types/settings";
import Link from "next/link";

interface MainClientProps {
  settings: Settings[];
}

export function MainClient({ settings }: MainClientProps) {
  const [selectedSettingId, setSelectedSettingId] = useState<string>("");

  const selectedSetting = settings.find((s) => s.id === selectedSettingId);

  return (
    <>
      <Link
        href="/create"
        className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Create New Setting
      </Link>

      {settings.length > 0 ? (
        <>
          <select
            value={selectedSettingId}
            onChange={(e) => setSelectedSettingId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a setting...</option>
            {settings.map((setting) => (
              <option key={setting.id} value={setting.id}>
                {setting.name}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <Link
              href={selectedSetting ? `/edit/${selectedSetting.id}` : "#"}
              className={`flex-1 text-center px-4 py-2 rounded-md transition-colors ${
                selectedSetting
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
              onClick={selectedSetting ? undefined : (e) => e.preventDefault()}
            >
              Edit
            </Link>

            <Link
              href={selectedSetting ? `/play/${selectedSetting.id}` : "#"}
              className={`flex-1 text-center px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                selectedSetting
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
              onClick={selectedSetting ? undefined : (e) => e.preventDefault()}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play
            </Link>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-600">No settings found</p>
      )}
    </>
  );
}
