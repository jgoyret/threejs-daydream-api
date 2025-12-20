import React, { useMemo } from "react";

export default function Clouds({ count = 8, radius = 40, height = 15 }) {
  const clouds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * radius * 2;
      const z = -Math.random() * radius - 10;
      const y = height + Math.random() * 6 - 2;
      const scale = 3 + Math.random() * 4;
      arr.push({ x, y, z, scale });
    }
    return arr;
  }, [count, radius, height]);

  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={[c.scale, c.scale * 0.6, c.scale]}>
          <mesh position={[-0.8, 0, 0]}>
            <sphereGeometry args={[0.9, 12, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.95} />
          </mesh>
          <mesh position={[0.6, 0.2, 0]}>
            <sphereGeometry args={[1.1, 12, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.95} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[0.8, 12, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
