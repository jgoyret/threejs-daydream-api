import "./App.css";
import { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "./components/Experience";
import ControlsInfo from "./components/ui/ControlsInfo";
import UsageInfo from "./components/ui/UsageInfo";
import AnimatedBackground from "./components/ui/AnimatedBackground";
import DaydreamControls from "./components/daydream/DaydreamControls";
import DaydreamManager from "./components/daydream/DaydreamManager";
import DaydreamVideoOverlay from "./components/daydream/DaydreamVideoOverlay";

export default function App() {
  const canvasRef = useRef(null);
  const [outputStreamUrl, setOutputStreamUrl] = useState(null);

  // Initialize Daydream manager
  const { startStreaming, stopStreaming, updateParams, isStreaming, status } =
    DaydreamManager({
      canvasRef,
      onStreamReady: (data) => {
        console.log("Stream ready:", data);
        if (typeof data === "object") {
          setOutputStreamUrl(data.webrtc);
        } else {
          setOutputStreamUrl(data);
        }
      },
      onError: (error) => {
        console.error("Daydream error:", error);
        alert("Error with Daydream stream: " + error.message);
      },
    });

  // Callback when canvas is mounted
  const handleCanvasReady = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvasRef.current = canvas;
      // Configure canvas for 16:9 streaming
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
  };

  return (
    <>
      {/* Layer 0: Animated Background */}
      <AnimatedBackground />

      {/* Layer 1: Three.js Canvas - Active but invisible, streams to Daydream */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1920px",
          height: "1080px",
          zIndex: 1,
        }}
      >
        <Canvas
          onCreated={handleCanvasReady}
          gl={{
            preserveDrawingBuffer: true, // Required for canvas.captureStream()
            antialias: true,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Experience />
        </Canvas>
      </div>

      {/* Layer 2: Video Overlay (z-index: 40) - The actual game display */}
      <DaydreamVideoOverlay
        outputStreamUrl={outputStreamUrl}
        isStreaming={isStreaming}
      />

      {/* Layer 3: UI (z-index: 150+) - Always visible on top */}
      <ControlsInfo />
      <UsageInfo />

      <DaydreamControls
        onStart={startStreaming}
        onStop={stopStreaming}
        onParamsChange={updateParams}
        isStreaming={isStreaming}
        status={status}
      />
    </>
  );
}
