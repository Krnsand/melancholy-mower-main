"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import Link from "next/link";
import { Settings } from "@/types/settings";
import { getSignedUrlAction } from "./actions";

interface VoiceInteractionProps {
  settings: Settings;
}

export function VoiceInteraction({ settings }: VoiceInteractionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [agentMode, setAgentMode] = useState<
    "listening" | "speaking" | "thinking"
  >("listening");
  const [lastShakeTime, setLastShakeTime] = useState(0);
  const [debugShakeIntensity, setDebugShakeIntensity] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const motionReadingCount = useRef(0);
  const [shakeDetectionEnabled, setShakeDetectionEnabled] = useState(false);

  const roundedSessionLength = Math.ceil(settings.session_length / 10) * 10;

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRemainingTime(null);
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to agent");
      setConversationStatus("connected");
      setIsConnecting(false);
      motionReadingCount.current = 0; // Reset motion reading count for fresh start

      if (roundedSessionLength > 0) {
        let currentRemainingTime = roundedSessionLength;
        setRemainingTime(currentRemainingTime);
        timerRef.current = setInterval(() => {
          currentRemainingTime -= 10;
          setRemainingTime(currentRemainingTime);
          if (currentRemainingTime < -60) {
            window.location.reload();
          } else if (currentRemainingTime <= 0) {
            sendContextualUpdate(
              `**IMPORTANT** This conversation need to be wrapped up now. Say goodbye immediately (it's OK to be a bit abrupt, no need to make an excuse or be polite). Always say goodbye in the user language. Don't wait for the user to say goodbye, but make sure you **FINISH** saying goodbye **BEFORE** calling the tool "Avsluta" to end the conversation.`
            );
          } else if (currentRemainingTime < 31) {
            sendContextualUpdate(
              `This conversation need to be wrapped up in ${currentRemainingTime} seconds. Start saying goodbye in the user's language.`
            );
          } else {
            sendContextualUpdate(
              `This conversation will end in about ${currentRemainingTime} seconds.`
            );
          }
        }, 10000);
      }
    },
    onDisconnect: () => {
      setConversationStatus("disconnected");
      cleanupTimers();
      motionReadingCount.current = 0; // Reset for next connection
      window.location.reload();
    },
    onMessage: (message) => {
      console.log("Agent message:", message);
    },
    onError: (error: string | Error) => {
      console.error("Conversation error:", error);
      setError(typeof error === "string" ? error : error.message);
      setIsConnecting(false);
      window.location.reload();
    },
    /* eslint-disable @typescript-eslint/no-explicit-any */
    onModeChange: (mode: any) => {
      console.log("Mode changed:", mode);
      setAgentMode(mode.mode as "listening" | "speaking" | "thinking");
    },
    clientTools: {
      Avsluta: async () => {
        console.log("Avsluta tool called");
        window.location.reload();
      },
      avsluta: async () => {
        console.log("avsluta tool called");
        window.location.reload();
      },
    },
  });

  const sendContextualUpdate = useCallback(
    (message: string) => {
      const { sendContextualUpdate } = conversation;
      console.log("Sending contextual update:", message);
      sendContextualUpdate(message);
    },
    [conversation]
  );

  const startConversation = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Microphone access requires HTTPS. Please access this page over HTTPS."
        );
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      const signedUrlResponse = await getSignedUrlAction(settings.agent_id);

      if (!signedUrlResponse.success) {
        throw new Error(signedUrlResponse.error || "Failed to get signed URL");
      }

      await conversation.startSession({
        signedUrl: signedUrlResponse.data!.signedUrl,
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      let errorMessage = "Failed to start conversation";

      if (error instanceof Error) {
        if (
          error.message.includes("getUserMedia") ||
          error.message.includes("mediaDevices")
        ) {
          errorMessage =
            "Microphone access requires HTTPS. Please access this page over HTTPS.";
        } else if (error.name === "NotAllowedError") {
          errorMessage =
            "Microphone permission was denied. Please allow microphone access and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No microphone found. Please connect a microphone and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setIsConnecting(false);
    }
  }, [conversation, settings.agent_id]);

  const restartConversation = async () => {
    try {
      setError(null);
      cleanupTimers();
      await conversation.endSession();
      await startConversation();
    } catch (error) {
      console.error("Failed to restart conversation:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to restart conversation"
      );
    }
  };

  const sendBump = () => {
    if (conversationStatus !== "connected") return;

    const { sendUserMessage } = conversation;
    sendUserMessage(settings.bump_instruction);
  };

  const requestMotionPermission = async () => {
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      (DeviceMotionEvent as any).requestPermission
    ) {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === "granted") {
          return true;
        }
      } catch (error) {
        console.error("Motion permission error:", error);
      }
      return false;
    }
    return true;
  };

  const handleDeviceMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const x = acceleration.x ?? 0;
      const y = acceleration.y ?? 0;
      const z = acceleration.z ?? 0;

      // Skip first few readings to let accelerometer stabilize and avoid gravity-induced initial bump
      motionReadingCount.current++;
      if (motionReadingCount.current <= 3) {
        lastAcceleration.current = { x, y, z };
        return;
      }

      const lastX = lastAcceleration.current.x;
      const lastZ = lastAcceleration.current.z;

      // Only use X and Z axes to avoid gravity effects on Y axis
      const deltaX = Math.abs(x - lastX);
      const deltaZ = Math.abs(z - lastZ);

      const shakeIntensity = deltaX + deltaZ;
      setDebugShakeIntensity(shakeIntensity);

      lastAcceleration.current = { x, y, z };

      const now = Date.now();
      const timeSinceLastShake = now - lastShakeTime;

      if (
        shakeIntensity > settings.accelerometer_sensitivity &&
        timeSinceLastShake > 2000
      ) {
        setLastShakeTime(now);
        sendBump();
      }
    },
    [conversationStatus, settings.accelerometer_sensitivity, lastShakeTime]
  );

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    const setupMotionDetection = async () => {
      if (conversationStatus === "connected") {
        const hasPermission = await requestMotionPermission();
        if (hasPermission) {
          window.addEventListener("devicemotion", handleDeviceMotion);
        }
      }
    };

    setupMotionDetection();

    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, [conversationStatus, handleDeviceMotion]);

  // Test for motion support
  useEffect(() => {
    const testMotionHandler = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (
        acceleration &&
        (acceleration.x !== null ||
          acceleration.y !== null ||
          acceleration.z !== null)
      ) {
        window.removeEventListener("devicemotion", testMotionHandler);
        setShakeDetectionEnabled(true);
        clearTimeout(motionTestTimeout);
      }
    };

    window.addEventListener("devicemotion", testMotionHandler);

    const motionTestTimeout = setTimeout(() => {
      window.removeEventListener("devicemotion", testMotionHandler);
    }, 2000);

    return () => {
      window.removeEventListener("devicemotion", testMotionHandler);
      clearTimeout(motionTestTimeout);
    };
  }, []);

  useEffect(() => {
    return () => {
      cleanupTimers();
      conversation.endSession().catch(console.error);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Bloom</h2>
        <p className="text-gray-600 mb-6">{settings.name}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="text-sm text-gray-500 mb-2">
            Status: <span className="font-medium">{conversationStatus}</span>
          </div>
          {conversationStatus === "connected" && (
            <div className="text-sm text-gray-500">
              Agent is: <span className="font-medium">{agentMode}</span>
            </div>
          )}
          {remainingTime !== null && remainingTime > 0 ? (
            <div className="text-sm text-gray-500">
              Time remaining:{" "}
              <span className="font-medium">{remainingTime}s</span>
            </div>
          ) : (
            <div className="text-sm text-red-600 font-medium">Time is up!</div>
          )}
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-lg text-xs text-black">
          <div className="mb-1">
            Shake Detection Enabled:{" "}
            <span className="font-medium">
              {shakeDetectionEnabled ? "Yes" : "No"}
            </span>
          </div>
          <div className="mb-1">
            Shake Intensity:{" "}
            <span className="font-medium">
              {debugShakeIntensity.toFixed(2)}
            </span>
          </div>
          <div className="mb-1">
            Threshold:{" "}
            <span className="font-medium">
              {settings.accelerometer_sensitivity}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isConnecting ? (
            <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-full flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Connecting...
            </div>
          ) : conversationStatus === "connected" ? (
            <>
              <button
                onClick={sendBump}
                className="bg-yellow-500 text-white px-6 py-3 rounded-full hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Bump!
              </button>

              <button
                onClick={restartConversation}
                className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Restart
              </button>

              <Link
                href="/"
                className="bg-gray-500 text-white px-6 py-3 rounded-full hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </Link>
            </>
          ) : conversationStatus === "disconnected" ? (
            <div className="bg-gray-100 text-gray-600 px-6 py-3 rounded-full flex items-center justify-center">
              Connection stopped
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
