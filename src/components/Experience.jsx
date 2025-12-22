import React, { useRef } from "react";
import { Physics } from "@react-three/rapier";

// Components
import Player from "./player/Player";
import IdleCamera from "./player/IdleCamera";
import Clouds from "./world/Clouds";
import Square from "./world/Square";

/* ---------- EXPERIENCE (main) ---------- */
export default function Experience() {
  const playerRef = useRef(null);

  return (
    <>
      <color attach="background" args={["#87CEEB"]} />
      <fog attach="fog" args={["#87CEEB", 20, 300]} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[30, 80, 30]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Physics gravity={[0, -30, 0]}>
        {/* Square scene */}
        <Square position={[0, -1, 0]} scale={5} rotation={[0, Math.PI, 0]} />
        <Player ref={playerRef} spawn={[-64, 10, 3.32]} />
      </Physics>

      {/* Clouds */}
      <Clouds count={12} radius={120} height={8} />

      {/* Idle camera that orbits when no interaction */}
      <IdleCamera playerRef={playerRef} />
    </>
  );
}
