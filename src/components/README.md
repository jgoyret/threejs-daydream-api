# Components Structure

This directory contains all the React components for the 3D game, organized by functionality.

## Directory Structure

```
components/
├── player/
│   └── PlayerPhysics.jsx          # First-person player controller with Rapier physics
├── terrain/
│   └── Terrain.jsx                 # Procedural terrain with heightmap and TrimeshCollider
├── world/
│   └── Clouds.jsx                  # Decorative clouds
├── ui/
│   ├── HUD.jsx                     # Player health bar and quickbar
│   ├── ChargeBar.jsx               # Charge indicator (currently unused)
│   └── EquippedOrb.jsx            # Visual indicator for equipped weapon
└── Experience.jsx                  # Main scene orchestrator
```

## Component Descriptions

### PlayerPhysics
- **Location**: `player/PlayerPhysics.jsx`
- **Purpose**: First-person player controller with physics
- **Features**:
  - WASD movement + mouse look
  - Sprint (Shift), Jump (Space)
  - Pointer lock support (Click to capture, ESC to release)
  - Capsule collider for smooth movement
  - Camera synchronization with RigidBody

### Terrain
- **Location**: `terrain/Terrain.jsx`
- **Purpose**: Procedural terrain generation with physics
- **Features**:
  - 64x64 grid with 5-unit cells
  - Procedural heightmap using sin/cos waves
  - Blur smoothing for natural hills
  - Vertex coloring (green low → brown high)
  - TrimeshCollider for accurate physics collision

### Clouds
- **Location**: `world/Clouds.jsx`
- **Purpose**: Decorative atmospheric clouds
- **Features**:
  - Procedurally positioned around player spawn
  - Multi-sphere composition for cloud shape
  - Configurable count, radius, and height

### EquippedOrb
- **Location**: `ui/EquippedOrb.jsx`
- **Purpose**: Visual indicator for equipped weapon slot
- **Features**:
  - Renders when quickbar slot 0 is active
  - Follows camera position (right side of view)
  - Emissive cyan icosahedron

### Experience (Main Orchestrator)
- **Location**: `Experience.jsx`
- **Purpose**: Main scene controller
- **Responsibilities**:
  - Physics world setup
  - Enemy AI and pathfinding
  - Projectile system
  - Event coordination between 3D scene and HUD
  - Quickbar management

## Utils

### Pathfinding
- **Location**: `../utils/pathfinding.js`
- **Exports**:
  - `astar()` - A* pathfinding algorithm
  - `getNeighbors4Way()` - 4-way grid neighbor function
- **Usage**: Enemy AI navigation on terrain grid

## Integration Example

```jsx
import { Physics } from "@react-three/rapier";
import PlayerPhysics from "./player/PlayerPhysics";
import Terrain from "./terrain/Terrain";
import Clouds from "./world/Clouds";
import EquippedOrb from "./ui/EquippedOrb";

export default function Experience() {
  const terrainGrid = useRef({ widths: 64, depths: 64, cellSize: 5, heights: null });
  const [quickbar, setQuickbar] = useState({ selected: 0, activeIndex: null });

  return (
    <>
      <Physics gravity={[0, -30, 0]}>
        <PlayerPhysics spawn={[0, 5, 0]} />
        <Terrain terrainGrid={terrainGrid} />
      </Physics>
      <Clouds count={12} radius={120} height={8} />
      <EquippedOrb quickbar={quickbar} />
    </>
  );
}
```

## Development Notes

- All physics components must be inside `<Physics>` wrapper
- Terrain must be rendered before player for proper spawn positioning
- EquippedOrb and Clouds should be outside Physics (no collision needed)
- terrainGrid ref is shared between Experience and Terrain for pathfinding
