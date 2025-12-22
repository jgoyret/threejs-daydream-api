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

## Quick Start

### 1. Install & Run
```bash
npm install
npm run dev
```

### 2. Enter API Key
Get your API key from [daydream.live](https://daydream.live)

Enter it in the input field at the bottom when the app loads.

### 3. Start Streaming
1. Enter a prompt describing the visual style
2. Click "Start Stream"
3. Wait for the pipeline to load
4. Explore with WASD + mouse

### Controls
| Key | Action |
|-----|--------|
| WASD | Move |
| Space | Jump |
| Mouse | Look around |
| Click | Lock cursor |
| ESC | Release cursor |

## Stream Status Polling

After creating a stream, you need to poll its status to know when the video is ready.

### 1. Get the Stream ID

When you create a stream, the API returns an object with the stream ID:

```javascript
const stream = await createStream(apiKey, params);
const streamId = stream.id;  // e.g. "str_9UQrn8an2tWzfWm"
```

### 2. Poll the Status Endpoint

```
GET https://api.daydream.live/v1/streams/{STREAM_ID}/status
Authorization: Bearer {API_KEY}
```

Example: `https://api.daydream.live/v1/streams/str_9UQrn8an2tWzfWm/status`

### 3. Check the Response

The status response has this structure:

```javascript
{
  "success": true,
  "data": {
    "state": "ONLINE",                    // <-- Pipeline state
    "gateway_status": {
      "whep_url": "https://..../whep"     // <-- URL to receive video
    }
  }
}
```

Key fields:
- **`data.state`** - Pipeline state (`LOADING`, `ONLINE`, etc.)
- **`data.gateway_status.whep_url`** - URL to connect and receive the AI-processed video

### Pipeline States

| State | Description |
|-------|-------------|
| `LOADING` | Initializing AI model. Show loading indicator. |
| `ONLINE` | Ready! Video is streaming. |

### Wait for Ready State

The `whep_url` appears before video is actually ready. Always check `state`:

```javascript
const statusData = await getStreamStatus(apiKey, streamId);
const state = statusData?.data?.state;
const whepUrl = statusData?.data?.gateway_status?.whep_url;

// Stream is ready when state is ONLINE
const isReady = state === 'ONLINE' && whepUrl;
```

## API Configuration

```javascript
{
  pipeline: "streamdiffusion",
  params: {
    model_id: "stabilityai/sdxl-turbo",
    prompt: "your prompt here",
    width: 1024,
    height: 576,
    num_inference_steps: 50,
    delta: 0.7,           // AI transformation strength (0-1)
    guidance_scale: 1,
    acceleration: "tensorrt"
  }
}
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `prompt` | Text description of visual style | - |
| `delta` | AI transformation strength (0-1) | 0.7 |
| `num_inference_steps` | Quality (higher = slower) | 50 |

## Tech Stack

- **React 19** + **Three.js** / React Three Fiber
- **WebRTC** (WHIP/WHEP)
- **@eyevinn/webrtc-player**
- **Vite** + **Tailwind CSS**

---

## Technical Details

### Project Structure

```
src/
├── components/
│   ├── daydream/
│   │   ├── DaydreamManager.jsx      # WebRTC streaming logic
│   │   ├── DaydreamControls.jsx     # UI for prompt & controls
│   │   └── DaydreamVideoOverlay.jsx # Displays AI output
│   ├── player/
│   │   └── Player.jsx               # First-person controller
│   └── Experience.jsx               # Main 3D scene
├── services/
│   └── daydreamAPI.js               # Daydream REST API client
└── App.jsx                          # Root component
```

### Key Components

**DaydreamManager** - Custom hook managing the streaming lifecycle:
- Creates stream session on Daydream API
- Captures canvas via `captureStream(30)`
- Sends video via WHIP, receives via WHEP
- Polls status until pipeline is `ONLINE`

**daydreamAPI.js** - REST client:
- `createStream(apiKey, params)` - Create stream session
- `updateStream(apiKey, id, params)` - Update prompt live
- `getStreamStatus(apiKey, id)` - Poll for status

### WebRTC Flow

**1. Capture & Send (WHIP)**
```javascript
const captureStream = canvas.captureStream(30);
const pc = new RTCPeerConnection();

captureStream.getTracks().forEach(track => pc.addTrack(track, captureStream));

const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

const response = await fetch(whipUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/sdp' },
  body: offer.sdp
});

await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() });
```

**2. Receive (WHEP)**
```javascript
import { WebRTCPlayer } from '@eyevinn/webrtc-player';

const player = new WebRTCPlayer({ video: videoElement, type: 'whep' });
await player.load(new URL(whepUrl));
```

### Status Flow

```
Start Stream
     │
     ▼
status: 'connecting'  →  Spinner: "Starting stream..."
     │
     ▼
status: 'loading'     →  Spinner: "Loading pipeline..."
     │
     ▼
status: 'streaming'   →  Video plays
```

## License

MIT
