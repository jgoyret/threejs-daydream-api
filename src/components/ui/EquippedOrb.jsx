import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

export default function EquippedOrb({ quickbar }) {
  const ref = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    if (quickbar.activeIndex !== 0) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir).normalize();
    const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
    const pos = camera.position.clone().addScaledVector(dir, 0.8).addScaledVector(right, 0.4);
    pos.y -= 0.2;
    ref.current.position.copy(pos);
    ref.current.rotation.set(0, -Math.atan2(dir.x, dir.z), 0);
  });

  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#00ffff" emissive="#00a7a7" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}
