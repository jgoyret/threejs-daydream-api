# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A demonstration of real-time 3D scene streaming to Daydream AI API. This project showcases how to integrate Three.js rendering with AI-powered visual transformations via WebRTC streaming.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Architecture

### Directory Structure

```
src/
├── components/
│   ├── player/
│   │   ├── Player.jsx           # First-person controller with Rapier physics
│   │   └── IdleCamera.jsx       # Orbital camera when player is inactive
│   ├── world/
│   │   ├── Square.jsx           # 3D plaza scene (GLB model)
│   │   └── Clouds.jsx           # Decorative atmospheric clouds
│   ├── ui/
│   │   ├── ControlsInfo.jsx     # Controls help panel
│   │   ├── UsageInfo.jsx        # Usage instructions
│   │   └── AnimatedBackground.jsx
│   ├── daydream/
│   │   ├── DaydreamManager.jsx  # WebRTC streaming manager
│   │   ├── DaydreamControls.jsx # Stream control panel
│   │   └── DaydreamVideoOverlay.jsx
│   └── Experience.jsx           # Main scene orchestrator
├── services/
│   └── daydreamAPI.js           # Daydream API client
├── App.jsx                      # Root component
└── main.jsx                     # Entry point
```

### Core Components

**App.jsx** - Root component that:
- Mounts the Three.js Canvas with Rapier physics
- Manages Daydream streaming state
- Layers: AnimatedBackground → Canvas → VideoOverlay → UI

**Experience.jsx** - Main 3D scene containing:
- Physics world setup (gravity: [0, -30, 0])
- Square scene (3D plaza model)
- Player with first-person controls
- Decorative clouds
- Idle camera system

**DaydreamManager.jsx** - Streaming logic:
- Creates stream via Daydream API
- Captures canvas at 30 FPS
- Sends via WHIP protocol
- Receives AI-processed stream via WHEP

## Key Systems

### Player Controls

- WASD: Movement
- Space: Jump
- Mouse: Look around
- Click: Lock cursor
- ESC: Release cursor

### Daydream Integration

1. Canvas renders 3D scene (invisible, but active)
2. DaydreamManager captures canvas stream
3. Stream sent to Daydream API via WebRTC
4. AI processes frames with user prompt
5. Processed stream displayed in VideoOverlay

### Idle Camera

After 30 seconds of inactivity, camera switches to orbital mode around the player position. Returns to first-person on any interaction.

## Tech Stack

- React 19 + React Three Fiber
- @react-three/rapier for physics
- @react-three/drei for helpers
- Vite with SWC
- Tailwind CSS v4
- WebRTC for streaming

## Static Assets

- `public/scene.glb` - 3D plaza scene model
- `public/icon.png` - App favicon
