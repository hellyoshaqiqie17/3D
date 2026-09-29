'use client';

import React from 'react';
import { ContactShadows } from '@react-three/drei';

export function LightingEnvironment() {
  return (
    <>
      {/* Gentle architectural ambient light */}
      <ambientLight intensity={0.65} color="#FBFBFA" />

      {/* Primary architectural sun/directional light with soft shadows */}
      <directionalLight
        position={[14, 22, 16]}
        intensity={1.8}
        color="#FFF9F0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0002}
        shadow-radius={3}
      />

      {/* Sky fill light from opposite angle to soften dark recesses */}
      <directionalLight
        position={[-12, 16, -10]}
        intensity={0.6}
        color="#E2EEF8"
      />

      {/* Ground bounce fill light */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={0.2}
        color="#EADDC8"
      />

      {/* Realistic contact ground shadow at base */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.65}
        scale={28}
        blur={1.8}
        far={6}
        resolution={1024}
        color="#1E1C1A"
      />
    </>
  );
}
