import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";

export default function Terrain({ terrainGrid, onTerrainReady }) {
  const planeRef = useRef();
  const [terrainReady, setTerrainReady] = useState(false);

  useEffect(() => {
    if (!planeRef.current) return;

    const gridW = terrainGrid.current.widths;
    const gridH = terrainGrid.current.depths;
    const cell = terrainGrid.current.cellSize;

    // escala vertical: aumentar para mayor visibilidad del relieve
    const heightScale = 3.6;
    terrainGrid.current.heightScale = heightScale;

    // generar heightmap y suavizar
    let heights = new Float32Array(gridW * gridH);
    for (let z = 0; z < gridH; z++) {
      for (let x = 0; x < gridW; x++) {
        const nx = x / gridW - 0.5;
        const nz = z / gridH - 0.5;
        const base = (Math.sin(nx * 6) * 0.4 + Math.cos(nz * 4) * 0.35 + (Math.random() - 0.5) * 0.12);
        heights[x + z * gridW] = base * heightScale;
      }
    }

    const blur = (src) => {
      const dst = new Float32Array(src.length);
      for (let z = 0; z < gridH; z++) {
        for (let x = 0; x < gridW; x++) {
          let sum = 0, cnt = 0;
          for (let oz = -1; oz <= 1; oz++) {
            for (let ox = -1; ox <= 1; ox++) {
              const nx = x + ox;
              const nz = z + oz;
              if (nx >= 0 && nx < gridW && nz >= 0 && nz < gridH) {
                sum += src[nx + nz * gridW];
                cnt++;
              }
            }
          }
          dst[x + z * gridW] = sum / cnt;
        }
      }
      return dst;
    };
    heights = blur(heights);
    heights = blur(heights);

    // normalizar: centrar el heightmap alrededor de 0 para no tapar la cámara
    let minH = Infinity, maxH = -Infinity;
    for (let i = 0; i < heights.length; i++) {
      if (heights[i] < minH) minH = heights[i];
      if (heights[i] > maxH) maxH = heights[i];
    }
    const mid = (minH + maxH) / 2;
    for (let i = 0; i < heights.length; i++) heights[i] = heights[i] - mid;

    terrainGrid.current.heights = heights;

    // aplicar alturas y colores INMEDIATAMENTE
    const geom = planeRef.current.geometry;
    const pos = geom.attributes.position;
    const vertsX = gridW + 1;
    const vertsZ = gridH + 1;

    // aplicar alturas y colores
    let cmin = Infinity, cmax = -Infinity;
    for (let i = 0; i < heights.length; i++) {
      if (heights[i] < cmin) cmin = heights[i];
      if (heights[i] > cmax) cmax = heights[i];
    }

    const colors = new Float32Array(pos.count * 3);
    // colores con más contraste para detectar cambios fácilmente
    const colLow = new THREE.Color("#3f7a2b"); // verde oscuro
    const colHigh = new THREE.Color("#6b3f1f"); // marrón más oscuro

    for (let iz = 0; iz < vertsZ; iz++) {
      for (let ix = 0; ix < vertsX; ix++) {
        const gi = ix + iz * vertsX;
        const sx = Math.min(gridW - 1, Math.max(0, ix));
        const sz = Math.min(gridH - 1, Math.max(0, iz));
        const h = heights[sx + sz * gridW];

        // El plano está rotado -90° en X, así que Y local = Z mundial
        // Modificamos Z (índice 2) en lugar de Y (índice 1)
        pos.setZ(gi, h * 1.2);

        const t = (h - cmin) / Math.max(1e-6, cmax - cmin);
        const c = colLow.clone().lerp(colHigh, t);
        colors[gi * 3 + 0] = c.r;
        colors[gi * 3 + 1] = c.g;
        colors[gi * 3 + 2] = c.b;
      }
    }

    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    pos.needsUpdate = true;
    geom.computeVertexNormals();

    console.log("terrain applied (centered):", { min: cmin, max: cmax });

    // Marcar terreno como listo para crear el collider
    setTerrainReady(true);
    if (onTerrainReady) onTerrainReady();
  }, [terrainGrid, onTerrainReady]);

  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh
        ref={planeRef}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry
          args={[
            terrainGrid.current.widths * terrainGrid.current.cellSize,
            terrainGrid.current.depths * terrainGrid.current.cellSize,
            terrainGrid.current.widths,
            terrainGrid.current.depths,
          ]}
        />
        <meshStandardMaterial
          vertexColors={true}
          roughness={0.7}
          metalness={0.03}
          side={THREE.DoubleSide}
          flatShading={false}
        />
      </mesh>
      {/* Collider que sigue la geometría exacta del terreno */}
      {terrainReady && planeRef.current && (
        <TrimeshCollider
          args={[
            planeRef.current.geometry.attributes.position.array,
            planeRef.current.geometry.index.array,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      )}
    </RigidBody>
  );
}
