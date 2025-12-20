import React, { useRef, useEffect, memo } from "react";
import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";

function Enemy({ id, position, hp }) {
  const rbRef = useRef();
  const lastPos = useRef({ x: 0, y: 0, z: 0 });
  const isDead = useRef(hp <= 0);

  // Actualizar si está muerto
  if (hp <= 0) {
    isDead.current = true;
  }

  // Actualizar posición cada frame para que siga al enemigo manejado por IA
  useFrame(() => {
    // No ejecutar si está muerto
    if (isDead.current || !rbRef.current) return;

    const [x, y, z] = position;

    // Solo actualizar si la posición cambió
    if (lastPos.current.x !== x || lastPos.current.y !== y || lastPos.current.z !== z) {
      rbRef.current.setNextKinematicTranslation({ x, y, z });
      lastPos.current = { x, y, z };
    }
  });

  return (
    <RigidBody
      ref={rbRef}
      position={position}
      type="kinematicPosition"
      colliders="cuboid"
      sensor={false}
      userData={{ isEnemy: true, enemyId: id }}
    >
      <group position={[0, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 1.2, 0.6]} />
          <meshStandardMaterial color={hp > 1 ? "#884444" : "#aa2222"} />
        </mesh>
        {/* hp indicator */}
        <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.06]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.6} />
        </mesh>
        <mesh position={[(-0.25 + (hp / 4) * 0.25), 0.9, 0.001]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[(0.5 * (hp / 4)), 0.05]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.95} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// Memoizar con comparación personalizada para evitar re-renders innecesarios
export default memo(Enemy, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.hp === nextProps.hp &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2]
  );
});
