# Three.js + Daydream API Integration Demo

A demonstration of real-time 3D scene streaming with AI-powered visual transformations. This project shows how to integrate a Three.js rendered scene with the [Daydream API](https://daydream.live) using WebRTC streaming.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                        │
│                                                                             │
│  ┌──────────────┐    captureStream()    ┌──────────────────┐                │
│  │  Three.js    │ ──────────────────►   │  WebRTC          │                │
│  │  Canvas      │        30 FPS         │  PeerConnection  │                │
│  │  (hidden)    │                       │                  │                │
│  └──────────────┘                       └────────┬─────────┘                │
│                                                  │                          │
│                                                  │ WHIP (send)              │
│                                                  ▼                          │
│                                         ┌──────────────────┐                │
│                                         │  Daydream API    │                │
│                                         │  (AI Processing) │                │
│                                         └────────┬─────────┘                │
│                                                  │                          │
│                                                  │ WHEP (receive)           │
│                                                  ▼                          │
│  ┌──────────────┐                       ┌──────────────────┐                │
│  │  Video       │ ◄──────────────────── │  WebRTC Player   │                │
│  │  Overlay     │    AI-transformed     │  (@eyevinn)      │                │
│  │  (visible)   │       stream          │                  │                │
│  └──────────────┘                       └──────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


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
- `createStream(apiKey, params)` - Create new stream session
- `updateStream(apiKey, id, params)` - Update prompt/settings live
- `getStreamStatus(apiKey, id)` - Poll for stream status and WHEP URL

## Stream Status Polling

After creating a stream and connecting via WHIP, you need to poll the status endpoint to know when the stream is ready. The pipeline goes through several states:

### Pipeline States

| State | Description |
|-------|-------------|
| `LOADING` | Pipeline is initializing the AI model. Show a loading indicator. |
| `ONLINE` | Pipeline is ready and streaming. Video should be visible. |

### How to Check if Stream is Ready

```javascript
// Poll the status endpoint
const statusData = await getStreamStatus(apiKey, streamId);

// Get the pipeline state
const pipelineState = statusData?.data?.state;

// Check if ready (any of these means video is available)
const isReady = ['ONLINE', 'DEGRADED_INFERENCE', 'INFERENCE', 'RUNNING'].includes(pipelineState);

// Get WHEP URL for playback
const whepUrl = statusData?.data?.gateway_status?.whep_url;
```

### Status Response Structure

```json
{
  "success": true,
  "data": {
    "state": "ONLINE",
    "gateway_status": {
      "whep_url": "https://..../whep",
      "ingest_metrics": {
        "stats": {
          "track_stats": [
            { "type": "video", "packets_received": 4905 }
          ],
          "conn_quality": "good"
        }
      }
    },
    "inference_status": {
      "fps": 0,
      "last_error": null,
      "last_params": { ... }
    },
    "input_status": {
      "fps": 23.98,
      "last_input_time": 1766413112878
    }
  }
}
```

### Important: Wait for Video Data

The `whep_url` appears before the video is actually ready. To ensure the stream is truly ready:

1. **Check `state`**: Wait until it's `ONLINE`
2. **Verify `ingest_metrics`**: Presence of `track_stats` with `type: "video"` confirms video data is flowing

```javascript
// Full readiness check
const isVideoReady =
  whepUrl &&
  (pipelineState === 'ONLINE') &&
  statusData?.data?.gateway_status?.ingest_metrics?.stats?.track_stats?.some(
    track => track.type === 'video'
  );
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Get your API Key
Get your API key from [daydream.live](https://daydream.live)

API keys start with `sk_` (e.g., `sk_eCqYRZhQ...`)

### 3. Run development server
```bash
npm run dev
```

### 4. Enter API Key
When the app loads, enter your Daydream API key in the input field at the bottom of the screen. The key is validated client-side (must start with `sk_`) and is never stored - you'll need to enter it each session.

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
- **WebRTC** - Real-time streaming
- **@eyevinn/webrtc-player** - WHEP playback
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## How the Integration Works

### App.jsx - The Orchestrator
```jsx
// 1. State for API key (entered by user) and canvas reference
const [apiKey, setApiKey] = useState(null);
const canvasRef = useRef(null);

// 2. Initialize DaydreamManager with canvas reference and API key
const { startStreaming, stopStreaming, isStreaming, status, pipelineState } = DaydreamManager({
  canvasRef,
  apiKey,
  onStreamReady: (whepUrl) => setOutputStreamUrl(whepUrl),
  onError: (error) => console.error(error)
});

// 3. Layer structure
return (
  <>
    {/* Layer 0: Background */}
    <AnimatedBackground />

    {/* Layer 1: Three.js Canvas (hidden, but captured for streaming) */}
    <Canvas onCreated={() => canvasRef.current = document.querySelector('canvas')}>
      <Experience />
    </Canvas>

    {/* Layer 2: AI-processed video overlay + loading spinner */}
    <DaydreamVideoOverlay
      outputStreamUrl={outputStreamUrl}
      isStreaming={isStreaming}
      status={status}           // 'idle' | 'connecting' | 'loading' | 'streaming' | 'error'
      pipelineState={pipelineState}  // 'LOADING' | 'ONLINE' | 'DEGRADED_INFERENCE' | etc.
    />

    {/* Layer 3: UI Controls (API key input → Prompt input → Stream controls) */}
    <DaydreamControls
      onStart={startStreaming}
      onStop={stopStreaming}
      apiKey={apiKey}
      onApiKeyChange={setApiKey}
    />
  </>
);
```

### DaydreamManager - Status Flow
```
User clicks "Start Stream"
         │
         ▼
   status: 'connecting'     ← Spinner: "Starting stream..."
         │
         ▼
   Create stream via API
   Connect via WHIP
         │
         ▼
   Poll /streams/{id}/status
         │
         ├─► state: 'LOADING'
         │   status: 'loading'  ← Spinner: "Loading pipeline..."
         │
         ├─► state: 'ONLINE'
         │   status: 'streaming' ← Spinner disappears, video plays
         │
         └─► Error
             status: 'error'
```


