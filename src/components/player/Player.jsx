import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";

const Player = forwardRef(function Player({ speed = 4, spawn = null }, ref) {
  const keys = useRef({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const { camera } = useThree();
  const rbRef = useRef();
  const initialSpawn = useRef(spawn);

  // Exponer el RigidBody ref al componente padre
  useImperativeHandle(ref, () => ({
    get current() {
      return rbRef.current;
    }
  }), []);

  useEffect(() => {
    camera.rotation.order = "YXZ";

    // Listener para detectar cambios en pointer lock
    const onPointerLockChange = () => {
      if (document.pointerLockElement) {
        document.body.classList.add('pointer-locked');
      } else {
        document.body.classList.remove('pointer-locked');
      }
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onKeyDown = (e) => {
      keys.current[e.code] = true;
      if (e.code === "Escape") {
        document.exitPointerLock();
      }
    };
    const onKeyUp = (e) => (keys.current[e.code] = false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function onMouseMove(e) {
      const mx = e.movementX || 0;
      const my = e.movementY || 0;
      yaw.current -= mx * 0.0025;
      pitch.current -= my * 0.0025;
      const limit = Math.PI / 2 - 0.01;
      pitch.current = Math.max(-limit, Math.min(limit, pitch.current));
    }
    window.addEventListener("mousemove", onMouseMove);

    function onClick(e) {
      // NO hacer pointer lock si clickeas en la UI de Daydream
      const daydreamUI = e.target.closest('[data-daydream-ui]');
      if (daydreamUI) {
        return; // Ignorar clicks en la UI
      }

      // Solo hacer pointer lock si clickeas dentro del canvas
      const canvas = document.querySelector("canvas");
      if (canvas && (e.target === canvas || canvas.contains(e.target))) {
        document.body.requestPointerLock();
      }
    }
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("click", onClick);
      document.body.classList.remove('pointer-locked');
    };
  }, [camera]);

  useFrame((_, delta) => {
    if (!rbRef.current) return;

    const inputX =
      (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) +
      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? -1 : 0);
    const inputZ =
      (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) +
      (keys.current["KeyS"] || keys.current["ArrowDown"] ? -1 : 0);
    const isSprinting = keys.current["ShiftLeft"] || keys.current["ShiftRight"];
    const runSpeed = speed * (isSprinting ? 2 : 1);

    const sinY = Math.sin(yaw.current);
    const cosY = Math.cos(yaw.current);
    const forward = { x: -sinY, z: -cosY };
    const right = { x: cosY, z: -sinY };

    const vx = (forward.x * inputZ + right.x * inputX) * runSpeed;
    const vz = (forward.z * inputZ + right.z * inputX) * runSpeed;

    // Obtener velocidad actual del RigidBody
    const currentVel = rbRef.current.linvel();

    // Salto
    const isGrounded = Math.abs(currentVel.y) < 0.5;
    let newVelY = currentVel.y;
    if (keys.current["Space"] && isGrounded) {
      newVelY = 7;
    }

    // Aplicar velocidad al RigidBody
    rbRef.current.setLinvel({ x: vx, y: newVelY, z: vz }, true);

    // Sincronizar cámara con posición del RigidBody
    const pos = rbRef.current.translation();
    camera.position.set(pos.x, pos.y + 0.6, pos.z);
    camera.rotation.set(pitch.current, yaw.current, 0);
  });

  const sx = initialSpawn.current && initialSpawn.current[0] !== undefined ? initialSpawn.current[0] : 0;
  const sy = initialSpawn.current && initialSpawn.current[1] !== undefined ? initialSpawn.current[1] : 2;
  const sz = initialSpawn.current && initialSpawn.current[2] !== undefined ? initialSpawn.current[2] : 0;

  return (
    <RigidBody
      ref={rbRef}
      position={[sx, sy, sz]}
      enabledRotations={[false, false, false]}
      lockRotations
      type="dynamic"
      colliders={false}
    >
      <CapsuleCollider args={[0.5, 0.3]} />
    </RigidBody>
  );
});

export default Player;
