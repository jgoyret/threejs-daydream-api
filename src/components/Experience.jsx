import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Text3D, Html } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";

// Components
import PlayerPhysics from "./player/PlayerPhysics";
import IdleCamera from "./player/IdleCamera";
import Clouds from "./world/Clouds";
import EquippedOrb from "./ui/EquippedOrb";
import Projectile from "./combat/Projectile";
import Enemy from "./enemies/Enemy";
import PlazaSceneMin from "./world/PlazaSceneMin";
// Utils
import { astar, getNeighbors4Way } from "../utils/pathfinding";

/* ---------- EXPERIENCE (main) ---------- */
export default function Experience() {
  const { camera } = useThree();
  const [quickbar, setQuickbar] = useState({ selected: 0, activeIndex: null });
  const [showCoords, setShowCoords] = useState(false);
  const playerRef = useRef(null);

  // terrain params
  const terrainGrid = useRef({
    widths: 64,
    depths: 64,
    cellSize: 5,
    heights: null,
  });

  // enemies - cambiado a estado para re-render
  const [enemies, setEnemies] = useState([]);
  const enemiesRef = useRef([]); // Mantener ref para actualización rápida en useFrame
  const spawnedChunks = useRef(new Set());
  const nextEnemyId = useRef(1);

  // projectiles (lightballs) - ahora con física
  const [projectiles, setProjectiles] = useState([]);
  const nextId = useRef(1);
  const MAX_PROJECTILES = 15; // Límite de proyectiles activos para mantener performance

  // state para tracking de items recogibles
  const [pickupItems, setPickupItems] = useState([
    {
      id: "sword1",
      type: "sword",
      position: [0, 0.5, 8], // cerca del spawn inicial
      rotation: [0, Math.PI / 4, 0],
      isPickedUp: false,
    },
  ]);

  useEffect(() => {
    function onQuickbar(e) {
      const { selected, activeIndex } = e.detail || {};
      setQuickbar({ selected, activeIndex });
    }
    window.addEventListener("quickbar-update", onQuickbar);
    return () => window.removeEventListener("quickbar-update", onQuickbar);
  }, []);

  /* ---- helpers: world <-> grid ---- */
  const worldToGrid = (x, z) => {
    const gridW = terrainGrid.current.widths;
    const gridH = terrainGrid.current.depths;
    const cell = terrainGrid.current.cellSize;
    const gx = Math.floor((x + (gridW * cell) / 2) / cell);
    const gz = Math.floor((z + (gridH * cell) / 2) / cell);
    return [
      Math.max(0, Math.min(gridW - 1, gx)),
      Math.max(0, Math.min(gridH - 1, gz)),
    ];
  };
  const gridToWorld = (ix, iz) => {
    const gridW = terrainGrid.current.widths;
    const gridH = terrainGrid.current.depths;
    const cell = terrainGrid.current.cellSize;
    const x = ix * cell - (gridW * cell) / 2 + cell / 2;
    const z = iz * cell - (gridH * cell) / 2 + cell / 2;
    const h = terrainGrid.current.heights
      ? terrainGrid.current.heights[ix + iz * gridW]
      : 0;
    return new THREE.Vector3(x, h, z);
  };

  /* ---- spawn enemies on new chunks near player ---- */
  useFrame(() => {
    const chunkSize = 60;
    const px = camera.position.x;
    const pz = camera.position.z;
    const cx = Math.floor(px / chunkSize);
    const cz = Math.floor(pz / chunkSize);

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${cx + dx},${cz + dz}`;
        if (spawnedChunks.current.has(key)) continue;
        spawnedChunks.current.add(key);
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          const rx = (cx + dx) * chunkSize + (Math.random() - 0.5) * chunkSize;
          const rz = (cz + dz) * chunkSize + (Math.random() - 0.5) * chunkSize;
          const [gix, giz] = worldToGrid(rx, rz);
          const wp = gridToWorld(gix, giz);
          wp.y += 0.5;
          enemiesRef.current.push({
            id: nextEnemyId.current++,
            pos: wp.clone(),
            speed: 1.2 + Math.random() * 0.8,
            path: null,
            pathIdx: 0,
            alive: true,
            lastPathTime: 0,
            hp: 3 + Math.floor(Math.random() * 2), // 3-4 golpes
          });
        }
      }
    }
  });

  /* ---- enemy AI, collision (player) and projectile collision ---- */
  const lastEnemyUpdate = useRef(0);
  useFrame((_, delta) => {
    const now = performance.now() / 1000;
    const gridW = terrainGrid.current.widths;
    const gridH = terrainGrid.current.depths;

    // build walkable set from heightmap (avoid very high bumps)
    const walkable = new Set();
    if (terrainGrid.current.heights) {
      for (let i = 0; i < gridW * gridH; i++) {
        if (terrainGrid.current.heights[i] < 1.2) walkable.add(i);
      }
    }

    const px = camera.position.x;
    const pz = camera.position.z;
    const [pgx, pgz] = worldToGrid(px, pz);
    const playerIdx = pgx + pgz * gridW;

    // update enemies: pathfinding / movement / player collision
    const keepEnemies = [];
    let needsUpdate = false;
    for (const e of enemiesRef.current) {
      if (!e.alive) {
        needsUpdate = true;
        continue;
      }
      const dist = e.pos.distanceTo(camera.position);

      if (dist < 1.0) {
        window.dispatchEvent(
          new CustomEvent("player-damage", { detail: { amount: 10 } })
        );
        e.alive = false;
        needsUpdate = true;
        continue;
      }

      const chaseRadius = 30;
      if (dist < 80 && dist < chaseRadius * 2) {
        if (!e.path || now - e.lastPathTime > 0.8) {
          const [ex, ez] = worldToGrid(e.pos.x, e.pos.z);
          const startIdx = ex + ez * gridW;
          const path = astar(
            startIdx,
            playerIdx,
            gridW,
            gridH,
            walkable,
            getNeighbors4Way
          );
          if (path && path.length > 1) {
            e.path = path.map((node) => {
              const nx = Math.round(node.x);
              const nz = Math.round(node.z);
              return gridToWorld(nx, nz);
            });
            e.pathIdx = 0;
            e.lastPathTime = now;
          } else {
            e.path = null;
          }
        }

        if (e.path && e.pathIdx < e.path.length) {
          const target = e.path[e.pathIdx];
          const dir = target.clone().sub(e.pos);
          dir.y = 0;
          const d = dir.length();
          if (d < 0.5) e.pathIdx++;
          else {
            dir.normalize();
            e.pos.addScaledVector(dir, e.speed * delta);
          }
        } else {
          const dir = camera.position.clone().sub(e.pos);
          dir.y = 0;
          dir.normalize();
          e.pos.addScaledVector(dir, e.speed * delta * 0.9);
        }
      }

      keepEnemies.push(e);
    }
    enemiesRef.current = keepEnemies;

    // Actualizar estado solo cada 100ms para movimiento fluido sin saturar renders
    // (optimizado para dar más recursos a proyectiles)
    if (now - lastEnemyUpdate.current > 0.1 || needsUpdate) {
      setEnemies([...keepEnemies]);
      lastEnemyUpdate.current = now;
    }
  });

  /* ---- shooting (slot 1) ---- */
  useEffect(() => {
    function onMouseDown(e) {
      if (quickbar.activeIndex === 0 && e.button === 0) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir).normalize();
        const right = new THREE.Vector3()
          .crossVectors(dir, camera.up)
          .normalize();
        const spawnPos = camera.position
          .clone()
          .addScaledVector(dir, 1.2)
          .addScaledVector(right, 0.45);
        spawnPos.y -= 0.15;
        const speed = 36;
        const vel = dir.clone().multiplyScalar(speed);

        const newProjectile = {
          id: nextId.current++,
          position: [spawnPos.x, spawnPos.y, spawnPos.z],
          velocity: { x: vel.x, y: vel.y, z: vel.z },
          color: "#66ffff",
          radius: 0.18,
          lifetime: 1.8,
        };

        setProjectiles((prev) => {
          // Si ya hay muchos proyectiles, eliminar el más viejo
          const updated = prev.length >= MAX_PROJECTILES ? prev.slice(1) : prev;
          return [...updated, newProjectile];
        });
      }
    }
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [quickbar, camera, MAX_PROJECTILES]);

  // Función para eliminar proyectiles expirados (memoizada para evitar re-renders)
  const handleProjectileExpire = useCallback((id) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Función para manejar colisión proyectil-enemigo (memoizada para evitar re-renders)
  const handleProjectileHit = useCallback((enemyId, projectileId) => {
    // Dañar al enemigo
    const enemy = enemiesRef.current.find((e) => e.id === enemyId);
    if (enemy && enemy.alive) {
      enemy.hp = (enemy.hp || 1) - 1;
      window.dispatchEvent(
        new CustomEvent("hit-enemy", { detail: { id: enemy.id, hp: enemy.hp } })
      );

      if (enemy.hp <= 0) {
        enemy.alive = false;
        window.dispatchEvent(
          new CustomEvent("enemy-killed", { detail: { id: enemy.id } })
        );
      }
    }

    // Eliminar el proyectil
    setProjectiles((prev) => prev.filter((p) => p.id !== projectileId));
  }, []);

  // Añade este useFrame específicamente para las coordenadas
  useFrame(() => {
    if (showCoords) {
      const position = {
        x: Number(camera.position.x).toFixed(2),
        y: Number(camera.position.y).toFixed(2),
        z: Number(camera.position.z).toFixed(2),
      };
      // console.log("Sending coords:", position); // Debug
      window.dispatchEvent(
        new CustomEvent("update-coords", {
          detail: position,
        })
      );
    }
  });

  // Modifica el useEffect existente para el toggle de coordenadas
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "KeyL") {
        setShowCoords((prev) => {
          const newValue = !prev;
          console.log("Coords visibility:", newValue); // Debug
          return newValue;
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  /* ---- Render ---- */
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
        {/* Plaza con escala reducida */}
        {/* <PlazaScene
          position={[0, -1, 0]}
          scale={5}
          rotation={[0, Math.PI, 0]}
        /> */}
        <PlazaSceneMin
          position={[0, -1, 0]}
          scale={5}
          rotation={[0, Math.PI, 0]}
        />
        <PlayerPhysics ref={playerRef} spawn={[-64, 10, 3.32]} />{" "}
        {/* X: 0 (centro), Y: 4 (altura), Z: -4 (cerca del kiosko) */}
        {/* Texto del juego */}
        <RigidBody position={[-25, 8, 0]} colliders="trimesh">
          <Text3D font={"./Manufacturing_Consent_Regular.json"} castShadow>
            Te parió un raviol!!!!
            <meshNormalMaterial />
          </Text3D>
        </RigidBody>
        {/* Proyectiles */}
        {projectiles &&
          projectiles.map((p) => (
            <Projectile
              key={p.id}
              {...p}
              onExpire={handleProjectileExpire}
              onHit={handleProjectileHit}
            />
          ))}
        {/* Enemies */}
        {enemies &&
          enemies
            .filter((e) => e.alive)
            .map((e) => (
              <Enemy
                key={e.id}
                id={e.id}
                position={[e.pos.x, e.pos.y, e.pos.z]}
                hp={e.hp}
              />
            ))}
      </Physics>

      {/* Nubes y elementos UI */}
      <Clouds count={12} radius={120} height={8} />
      <EquippedOrb quickbar={quickbar} />

      {/* Cámara idle que orbita cuando no hay interacción */}
      <IdleCamera playerRef={playerRef} />
    </>
  );
}
