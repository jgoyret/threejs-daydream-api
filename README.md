# Three.js + Daydream API Integration Demo

A demonstration of real-time 3D scene streaming with AI-powered visual transformations. This project shows how to integrate a Three.js rendered scene with the [Daydream API](https://daydream.live) using WebRTC streaming.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                        │
│                                                                             │
│  ┌──────────────┐    captureStream()    ┌──────────────────┐               │
│  │  Three.js    │ ──────────────────►   │  WebRTC          │               │
│  │  Canvas      │        30 FPS         │  PeerConnection  │               │
│  │  (hidden)    │                       │                  │               │
│  └──────────────┘                       └────────┬─────────┘               │
│                                                  │                          │
│                                                  │ WHIP (send)              │
│                                                  ▼                          │
│                                         ┌──────────────────┐               │
│                                         │  Daydream API    │               │
│                                         │  (AI Processing) │               │
│                                         └────────┬─────────┘               │
│                                                  │                          │
│                                                  │ WHEP (receive)           │
│                                                  ▼                          │
│  ┌──────────────┐                       ┌──────────────────┐               │
│  │  Video       │ ◄──────────────────── │  WebRTC Player   │               │
│  │  Overlay     │    AI-transformed     │  (@eyevinn)      │               │
│  │  (visible)   │       stream          │                  │               │
│  └──────────────┘                       └──────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Layer System

The app uses a layered architecture where the Three.js canvas is **hidden but active**, while the AI-processed video is displayed on top:

| Layer | Z-Index | Component | Visibility |
|-------|---------|-----------|------------|
| 0 | 0 | AnimatedBackground | Visible (gradient) |
| 1 | 1 | Three.js Canvas | **Hidden** (but rendering) |
| 2 | 40 | Video Overlay | **Visible** (AI output) |
| 3 | 200 | UI Controls | Visible |

This allows the 3D scene to be captured and streamed while the user sees only the AI-transformed result.

## WebRTC Streaming Flow

### 1. Canvas Capture
```javascript
// Capture the Three.js canvas at 30 FPS
const canvas = canvasRef.current;
const captureStream = canvas.captureStream(30);
```

### 2. WHIP (WebRTC-HTTP Ingestion Protocol)
The captured stream is sent to Daydream via WHIP:
```javascript
// Create WebRTC peer connection
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Add video track
captureStream.getTracks().forEach(track => {
  pc.addTrack(track, captureStream);
});

// Send offer to WHIP endpoint
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const response = await fetch(stream.whip_url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/sdp' },
  body: offer.sdp
});

const answerSdp = await response.text();
await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
```

### 3. AI Processing
Daydream processes each frame using StreamDiffusion with parameters like:
- `prompt`: Text description of the desired visual style
- `model_id`: AI model (default: `stabilityai/sdxl-turbo`)
- `num_inference_steps`: Quality/speed tradeoff
- `delta`: How much the AI transforms the image (0-1)

### 4. WHEP (WebRTC-HTTP Egress Protocol)
The AI-processed stream is received via WHEP:
```javascript
import { WebRTCPlayer } from '@eyevinn/webrtc-player';

const player = new WebRTCPlayer({
  video: videoElement,
  type: 'whep'
});

await player.load(new URL(whepUrl));
```

## Project Structure

```
src/
├── components/
│   ├── daydream/
│   │   ├── DaydreamManager.jsx      # WebRTC streaming logic
│   │   ├── DaydreamControls.jsx     # UI for prompt & controls
│   │   └── DaydreamVideoOverlay.jsx # Displays AI output
│   ├── player/
│   │   ├── Player.jsx               # First-person controller
│   │   └── IdleCamera.jsx           # Orbital camera (idle mode)
│   ├── world/
│   │   ├── Square.jsx               # 3D scene (GLB model)
│   │   └── Clouds.jsx               # Decorative clouds
│   ├── ui/
│   │   └── ...                      # UI components
│   └── Experience.jsx               # Main 3D scene
├── services/
│   └── daydreamAPI.js               # Daydream REST API client
└── App.jsx                          # Root component
```

## Key Components

### DaydreamManager
Custom hook that manages the entire streaming lifecycle:
- Creates stream session on Daydream API
- Captures canvas and sends via WHIP
- Polls for WHEP URL availability
- Handles parameter updates in real-time
- Cleans up on stop

### DaydreamVideoOverlay
Displays the AI-processed stream:
- Uses `@eyevinn/webrtc-player` for WHEP playback
- Positioned as overlay on top of hidden canvas
- Same dimensions as canvas (1920x1080)

### daydreamAPI.js
REST API client for Daydream:
- `createStream(params)` - Create new stream session
- `updateStream(id, params)` - Update prompt/settings live
- `getStreamStatus(id)` - Poll for WHEP URL and status

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure API Key
Create a `.env` file:
```env
VITE_DAYDREAM_API_KEY=your_api_key_here
```

Get your API key from [daydream.live](https://daydream.live)

### 3. Run development server
```bash
npm run dev
```

## Usage

1. **Start the stream**: Enter a prompt and click "Start Stream"
2. **Explore**: Use WASD to move, mouse to look around
3. **Change style**: Update the prompt and click "Send" to apply new visuals
4. **Stop**: Click "Stop" to end the stream

### Controls
- **WASD**: Move
- **Space**: Jump
- **Mouse**: Look around
- **Click**: Lock cursor
- **ESC**: Release cursor

## API Configuration

The stream is created with these default parameters:

```javascript
{
  pipeline: "streamdiffusion",
  params: {
    model_id: "stabilityai/sdxl-turbo",
    prompt: "your prompt here",
    width: 1024,
    height: 576,
    num_inference_steps: 50,
    delta: 0.7,              // AI transformation strength
    guidance_scale: 1,
    acceleration: "tensorrt"
  }
}
```

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `prompt` | Text description of visual style | - |
| `delta` | AI transformation strength (0-1) | 0.7 |
| `num_inference_steps` | Quality (higher = better but slower) | 50 |
| `guidance_scale` | How closely to follow prompt | 1 |

## Tech Stack

- **React 19** - UI framework
- **Three.js** + **React Three Fiber** - 3D rendering
- **@react-three/rapier** - Physics simulation
- **WebRTC** - Real-time streaming
- **@eyevinn/webrtc-player** - WHEP playback
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## How the Integration Works

### App.jsx - The Orchestrator
```jsx
// 1. Reference to the Three.js canvas
const canvasRef = useRef(null);

// 2. Initialize DaydreamManager with canvas reference
const { startStreaming, stopStreaming, isStreaming } = DaydreamManager({
  canvasRef,
  onStreamReady: (whepUrl) => setOutputStreamUrl(whepUrl),
  onError: (error) => console.error(error)
});

// 3. Layer structure
return (
  <>
    {/* Layer 0: Background */}
    <AnimatedBackground />

    {/* Layer 1: Three.js Canvas (hidden, but captured) */}
    <Canvas onCreated={() => canvasRef.current = document.querySelector('canvas')}>
      <Experience />
    </Canvas>

    {/* Layer 2: AI-processed video (visible) */}
    <DaydreamVideoOverlay
      outputStreamUrl={outputStreamUrl}
      isStreaming={isStreaming}
    />

    {/* Layer 3: UI Controls */}
    <DaydreamControls onStart={startStreaming} onStop={stopStreaming} />
  </>
);
```

## License

MIT
