import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

export default function PlazaScene(props) {
  const { nodes, materials } = useGLTF('/Plaza independencia2.glb');

  useEffect(() => {
    console.log("Plaza nodes:", Object.keys(nodes));
    console.log("Plaza materials:", Object.keys(materials));
  }, [nodes, materials]);

  return (
    <group {...props}>
      <RigidBody type="fixed" colliders="trimesh">
        {/* Elementos principales con colisiones */}
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Plaza.geometry}
          material={nodes.Plaza.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Escaleras001.geometry}
          material={nodes.Escaleras001.material}
          position={[-0.936, -0.535, 0.017]}
          scale={[0.858, 0.858, 0.927]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Kiosko.geometry}
          material={nodes.Kiosko.material}
        />
      </RigidBody>

      {/* Elementos decorativos sin colisiones */}
      <group>
        {/* Cubos */}
        {['Cube', 'Cube001', 'Cube002', 'Cube003', 'Cube004', 
          'Cube005', 'Cube006', 'Cube007', 'Cube008', 'Cube009'].map((name) => (
          <mesh
            key={name}
            castShadow
            receiveShadow
            geometry={nodes[name]?.geometry}
            material={nodes[name]?.material || materials['Dark Brown Marble']}
          />
        ))}

        {/* Esferas (árboles) */}
        {['Icosphere', 'Icosphere001', 'Icosphere002', 
          'Icosphere003', 'Icosphere004', 'Icosphere005'].map((name) => (
          <mesh
            key={name}
            castShadow
            receiveShadow
            geometry={nodes[name]?.geometry}
            material={materials.Material}
          />
        ))}

        {/* Otros elementos */}
        {['Mesh', 'Mesh001', 'Mesh003'].map((name) => (
          <mesh
            key={name}
            castShadow
            receiveShadow
            geometry={nodes[name]?.geometry}
            material={materials['Dark Brown Marble']}
          />
        ))}
      </group>
    </group>
  );
}

useGLTF.preload('/Plaza independencia2.glb');