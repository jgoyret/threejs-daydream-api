import React, { useRef, useEffect, memo, useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";

// Geometría compartida entre todos los proyectiles (creada solo una vez)
const sharedGeometry = new THREE.SphereGeometry(0.18, 8, 6);

function Projectile({
  id,
  position,
  velocity,
  color = "#66ffff",
  radius = 0.18,
  lifetime = 1.8,
  onExpire,
  onHit
}) {
  const rbRef = useRef();
  const meshRef = useRef();
  const lightRef = useRef();
  const createdAt = useRef(Date.now());
  const hasHit = useRef(false);
  const velocityApplied = useRef(false);
  const isExpired = useRef(false);

  // Material único por proyectil (para poder cambiar opacity individualmente)
  // pero memoizado para evitar recreación en re-renders
  const material = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }),
  [color]);

  useEffect(() => {
    // Configurar timer para eliminar después del lifetime
    const timer = setTimeout(() => {
      isExpired.current = true;
      if (onExpire) onExpire(id);
    }, lifetime * 1000);

    return () => {
      clearTimeout(timer);
      // Limpiar solo el material (geometría es compartida)
      material.dispose();
    };
  }, [id, lifetime, onExpire, material]);

  // Aplicar velocidad y actualizar fade en useFrame
  useFrame(() => {
    // Detener si expiró
    if (isExpired.current) return;

    // Aplicar velocidad solo una vez
    if (rbRef.current && !velocityApplied.current) {
      rbRef.current.setLinvel(velocity, true);
      velocityApplied.current = true;
    }

    // Actualizar fade sin causar re-renders (directamente en el material)
    const elapsed = (Date.now() - createdAt.current) / 1000;
    const fade = Math.max(0, 1 - elapsed / lifetime);

    material.opacity = 0.6 * fade;

    if (lightRef.current) {
      lightRef.current.intensity = 1.2 * fade;
    }
  });

  const handleCollision = (event) => {
    // Detectar colisión con enemigos
    if (!hasHit.current && onHit && event.other.rigidBodyObject) {
      const otherObject = event.other.rigidBodyObject;
      // Verificar si es un enemigo (tiene userData.isEnemy)
      if (otherObject.userData && otherObject.userData.isEnemy) {
        hasHit.current = true;
        isExpired.current = true; // Detener useFrame
        onHit(otherObject.userData.enemyId, id);
      }
    }
  };

  return (
    <RigidBody
      ref={rbRef}
      position={position}
      colliders="ball"
      restitution={0.9} // Rebote alto
      friction={0.05}   // Muy baja fricción
      gravityScale={0.3} // Menos gravedad que objetos normales
      mass={0.1}         // Muy ligero
      linearDamping={0.1} // Poca resistencia al aire
      type="dynamic"
      onCollisionEnter={handleCollision}
    >
      <mesh ref={meshRef} geometry={sharedGeometry} material={material} />
      <pointLight
        ref={lightRef}
        color={color}
        intensity={1.2}
        distance={4 + radius * 10}
        decay={2}
      />
    </RigidBody>
  );
}

// Memoizar para evitar re-renders innecesarios
export default memo(Projectile);
