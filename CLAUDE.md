# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + Three.js first-person 3D game built with Vite and Rapier physics. The player navigates a procedurally generated terrain, fights AI enemies using physics-based projectile combat, and interacts with a custom HUD system.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR (port 5175)
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
│   │   └── PlayerPhysics.jsx      # First-person controller with Rapier physics
│   ├── terrain/
│   │   └── Terrain.jsx             # Procedural terrain with TrimeshCollider
│   ├── world/
│   │   └── Clouds.jsx              # Decorative atmospheric clouds
│   ├── ui/
│   │   ├── HUD.jsx                 # Player health bar and quickbar
│   │   ├── ChargeBar.jsx           # Charge indicator (unused)
│   │   └── EquippedOrb.jsx         # Visual indicator for equipped weapon
│   ├── combat/
│   │   └── Projectile.jsx          # Physics-based projectile with bounce
│   ├── enemies/
│   │   └── Enemy.jsx               # Enemy with kinematicPosition physics
│   ├── Experience.jsx              # Main scene orchestrator
│   └── README.md                   # Component documentation
├── utils/
│   └── pathfinding.js              # A* pathfinding algorithm
├── App.jsx                         # Root component
└── main.jsx                        # Entry point
```

### Core Components

**App.jsx** - Root component that mounts the Three.js Canvas with Rapier physics and HUD overlay

**Experience.jsx** - Main 3D scene controller containing all game logic:
- Physics world setup (gravity: [0, -30, 0])
- Terrain generation with procedural heightmaps
- Enemy AI with A* pathfinding and physics
- Projectile physics and collision detection
- Event-driven communication with HUD
- State management with throttling for performance

**HUD.jsx** - 2D overlay UI for player health and quickbar inventory system

## Key Systems

### Physics System (@react-three/rapier)

All physics objects are wrapped in `<Physics gravity={[0, -30, 0]}>`:

**PlayerPhysics** (CapsuleCollider)
- Height: 0.5, Radius: 0.3
- Type: dynamic with lockRotations
- First-person WASD movement + mouse look
- Sprint (Shift), Jump (Space)
- Pointer lock: Click to lock cursor, ESC to release

**Terrain** (TrimeshCollider)
- Accurate collision matching visual terrain geometry
- Built from PlaneGeometry vertices and indices
- Rotated -90° on X axis to be horizontal
- Type: fixed (immovable)

**Projectile** (Ball collider)
- Type: dynamic
- restitution: 0.9 (high bounce)
- friction: 0.05 (very low)
- gravityScale: 0.3 (floaty)
- mass: 0.1 (light)
- linearDamping: 0.1 (slight air resistance)
- Memoized to prevent re-renders
- Stops useFrame execution when expired or hit

**Enemy** (Cuboid collider)
- Type: kinematicPosition (AI-controlled movement)
- Updated via setNextKinematicTranslation()
- Memoized with custom comparison (id, hp, position)
- Stops useFrame execution when dead (hp <= 0)

### Terrain System

- **Grid**: 64x64 with 5-unit cell size (320x320 world units)
- **Generation**: Procedural heightmap using sin/cos waves with blur smoothing
- **Coloring**: Vertex colors based on elevation (green low → brown high)
- **Physics**: TrimeshCollider for accurate terrain collision
- **Helpers**: worldToGrid() and gridToWorld() for AI pathfinding integration

### Enemy AI

**Spawning**
- Chunk-based system (60-unit chunks)
- 1-3 enemies per chunk when player enters new chunk
- Initial HP: 3-4 (random)
- Speed: 1.2-2.0 units/sec (random)

**Pathfinding**
- A* algorithm on walkable grid (avoids elevation > 1.2)
- Recalculates path every 0.8s when chasing player
- Chase radius: 30 units
- Path following with waypoint progression

**Combat**
- Collision with player deals 10 damage
- HP bar rendered above enemy head (black background, red fill)
- Color changes based on HP: #884444 (>1 HP) / #aa2222 (1 HP)
- Dies when HP reaches 0

**Performance**
- State updates throttled to 50ms (20 FPS) to reduce re-renders
- useFrame exits early when enemy is dead
- Memoized component prevents unnecessary re-renders

### Combat System

**Weapon Equipping**
- Quickbar slot 0 = Cyan orb projectile weapon
- Press E to toggle active slot
- Left-click fires when slot 0 is active

**Projectiles**
- Spawn position: Camera + forward 1.2 units + right 0.45 units - down 0.15
- Initial velocity: Camera direction * 36 units/sec
- Lifetime: 1.8 seconds
- Physics-based bouncing on terrain and objects
- Collision detection via RigidBody.onCollisionEnter
- Checks userData.isEnemy on collision target
- Each hit deals 1 damage to enemy

**Optimizations**
- Velocity applied only once via useRef flag
- Fade animation via direct material manipulation (no re-renders)
- useFrame exits early when projectile expires or hits
- Geometry and material disposed on unmount (prevents memory leaks)

### HUD Communication

Custom DOM events for decoupled 3D ↔ 2D communication:

- `quickbar-update` - Experience receives slot selection changes from HUD
- `player-damage` - HUD receives damage amount to update health bar
- `hit-enemy` - Emitted when projectile hits enemy (with id and new HP)
- `enemy-killed` - Emitted when enemy dies (with id)

**Quickbar Controls**
- 6 slots total
- Mouse wheel to cycle selection
- E to toggle active slot
- Number keys 1-6 for direct slot selection

### EquippedOrb Component

- Renders equipped weapon as floating cyan icosahedron
- Positioned relative to camera (right side, slightly forward and down)
- Only visible when quickbar slot 0 is active
- Position updates every frame to follow camera

### Performance Optimizations

**State Management**
- Enemy state updates throttled to 50ms (20 FPS instead of 60 FPS)
- Immediate updates on important events (death, spawn, damage)
- Separate ref (enemiesRef) for fast access in useFrame

**Component Memoization**
- Projectile: React.memo() to prevent re-renders from parent
- Enemy: React.memo() with custom comparison (id, hp, position array)

**useFrame Optimizations**
- Early return when projectile is expired or hit
- Early return when enemy is dead
- Velocity applied once with ref flag instead of every frame

**Resource Cleanup**
- Projectile disposes geometry and material on unmount
- Prevents memory leaks during long play sessions

## Static Assets

- `public/avatar.png` - Player avatar image for HUD
- `public/Manufacturing_Consent_Regular.json` - 3D text font for Text3D component

## Tech Stack

- React 19 with React Three Fiber for declarative Three.js
- @react-three/rapier for physics simulation
- @react-three/drei for Text3D and helper components
- Three.js for 3D graphics primitives
- Vite with SWC for fast builds and HMR
- Tailwind CSS v4 (minimal usage, most styling is inline)

## Development Notes

- Physics gravity is set to -30 (faster fall than default -9.8)
- Some comments are in Spanish (e.g., terrain generation)
- GridHelper is commented out in Experience.jsx (useful for debugging)
- ChargeBar component exists but is not currently used
- Player.jsx is unused - actual player is PlayerPhysics.jsx
- All physics components must be inside `<Physics>` wrapper
- Terrain must render before player for proper spawn positioning
- EquippedOrb and Clouds are outside Physics (no collision needed)

## Common Tasks

**Adding new enemy types**: Modify enemy spawn logic in Experience.jsx:100-98, adjust HP/speed ranges

**Changing projectile behavior**: Edit Projectile.jsx physics properties (restitution, friction, gravityScale)

**Adjusting terrain**: Modify terrain generation in Terrain.jsx, change grid size in Experience.jsx:24

**Performance tuning**: Adjust throttle interval in Experience.jsx:179 (currently 0.05 = 50ms)

**Adding weapons**: Create new projectile variants in combat/ folder, add quickbar slots in Experience.jsx
