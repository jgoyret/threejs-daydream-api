import { useState } from "react";

/**
 * DaydreamControls - UI panel for controlling Daydream streaming
 * This is just the control panel, not the video display
 */
export default function DaydreamControls({
  onStart,
  onStop,
  onParamsChange,
  isStreaming,
  status,
}) {
  const [prompt, setPrompt] = useState(
    "plaza indepencia de montevideo uruguay, pepe mujica, tambores, candombe, artigas, monumento artigas, vibrant colors, dreamlike atmosphere, magical lighting, detailed environment"
  );
  const [numInferenceSteps, setNumInferenceSteps] = useState(50);
  const [useVideoTest, setUseVideoTest] = useState(false);

  const handleStart = () => {
    onStart({
      prompt,
      num_inference_steps: numInferenceSteps,
      useVideoTest,
    });
  };

  const handleParamsUpdate = () => {
    if (onParamsChange) {
      onParamsChange({
        prompt,
        num_inference_steps: numInferenceSteps,
      });
    }
  };

  const statusColors = {
    idle: "bg-gray-500",
    connecting: "bg-yellow-500",
    streaming: "bg-green-500",
    error: "bg-red-500",
  };

  const statusText = {
    idle: "Not streaming",
    connecting: "Connecting...",
    streaming: "Live",
    error: "Error",
  };

  // Bottom layout when NOT streaming
  if (!isStreaming) {
    return (
      <div
        data-daydream-ui
        className="fixed bottom-0 left-0 right-0 bg-black/90 text-white p-4 border-t border-gray-700"
        style={{ zIndex: 200, pointerEvents: 'auto' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3">
              <div
                className={`w-3 h-3 rounded-full ${statusColors[status]} animate-pulse`}
              ></div>
              <span className="text-sm font-semibold">
                {statusText[status]}
              </span>
            </div>

            {/* Prompt Input */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the visual style..."
            />

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={status === "connecting"}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-full font-semibold transition text-sm whitespace-nowrap"
            >
              {status === "connecting" ? "Connecting..." : "Start Stream"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bottom chat-style layout when streaming
  return (
    <div
      data-daydream-ui
      className="fixed bottom-0 left-0 right-0 bg-black/90 text-white p-4 border-t border-gray-700"
      style={{ zIndex: 200, pointerEvents: 'auto' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3">
            <div
              className={`w-2 h-2 rounded-full ${statusColors[status]}`}
            ></div>
            <span className="text-xs text-gray-400">{statusText[status]}</span>
          </div>

          {/* Mouse lock hint */}
          <div className="text-xs text-gray-500">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">ESC</kbd>{" "}
            to unlock mouse
          </div>

          {/* Prompt input - chat style */}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Update visual style..."
          />

          {/* Send button */}
          <button
            onClick={handleParamsUpdate}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full font-semibold transition text-sm"
          >
            Send
          </button>

          {/* Stop button */}
          <button
            onClick={onStop}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full font-semibold transition text-sm"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
