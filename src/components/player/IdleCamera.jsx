import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

const IDLE_TIMEOUT = 30; // segundos sin interacción
const ORBIT_SPEED = 0.15; // velocidad de rotación
const ORBIT_DISTANCE = 8; // distancia de la cámara al jugador
const ORBIT_HEIGHT = 3; // altura sobre el jugador
const TRANSITION_SPEED = 2; // velocidad de transición

export default function IdleCamera({ playerRef }) {
  const idleCamRef = useRef();
  const { camera: mainCamera, set } = useThree();
  const mainCameraRef = useRef(mainCamera);

  const [isIdle, setIsIdle] = useState(false);
  const lastInteraction = useRef(Date.now());
  const orbitAngle = useRef(0);
  const transitionProgress = useRef(0);
  const wasIdle = useRef(false);

  // Guardar referencia a la cámara principal
  useEffect(() => {
    mainCameraRef.current = mainCamera;
  }, [mainCamera]);

  // Detectar interacción del usuario
  useEffect(() => {
    const resetIdleTimer = () => {
      lastInteraction.current = Date.now();
      if (isIdle) {
        setIsIdle(false);
      }
    };

    // Eventos que resetean el timer
    const events = ["keydown", "mousedown", "mousemove", "wheel", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Chequear cada segundo si pasaron 30s
    const checkInterval = setInterval(() => {
      const elapsed = (Date.now() - lastInteraction.current) / 1000;
      if (elapsed >= IDLE_TIMEOUT && !isIdle) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
      clearInterval(checkInterval);
    };
  }, [isIdle]);

  // Cambiar cámara activa
  useEffect(() => {
    if (isIdle && idleCamRef.current) {
      // Salir de pointer lock al entrar en idle
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      transitionProgress.current = 0;
      wasIdle.current = true;
      set({ camera: idleCamRef.current });
    } else if (!isIdle && wasIdle.current && mainCameraRef.current) {
      wasIdle.current = false;
      set({ camera: mainCameraRef.current });
    }
  }, [isIdle, set]);

  useFrame((_, delta) => {
    if (!isIdle || !idleCamRef.current || !playerRef?.current?.current) return;

    // Obtener posición del jugador
    const playerPos = playerRef.current.current.translation();

    // Transición suave al inicio
    transitionProgress.current = Math.min(1, transitionProgress.current + delta * TRANSITION_SPEED);
    const t = transitionProgress.current;
    const smoothT = t * t * (3 - 2 * t); // smoothstep

    // Orbitar alrededor del jugador
    orbitAngle.current += delta * ORBIT_SPEED;

    const targetX = playerPos.x + Math.sin(orbitAngle.current) * ORBIT_DISTANCE;
    const targetY = playerPos.y + ORBIT_HEIGHT;
    const targetZ = playerPos.z + Math.cos(orbitAngle.current) * ORBIT_DISTANCE;

    // Interpolar posición durante la transición
    if (smoothT < 1) {
      const cam = idleCamRef.current;
      cam.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), smoothT);
    } else {
      idleCamRef.current.position.set(targetX, targetY, targetZ);
    }

    // Mirar al jugador
    idleCamRef.current.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
  });

  return (
    <PerspectiveCamera
      ref={idleCamRef}
      makeDefault={false}
      fov={60}
      near={0.1}
      far={1000}
    />
  );
}
