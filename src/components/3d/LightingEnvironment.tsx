'use client';

import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { useConfiguratorStore } from '@/lib/configurator-store';

export function LightingEnvironment() {
  const isCapturingViews = useConfiguratorStore((s) => s.isCapturingViews);

  return (
    <>
      {/* Gentle architectural ambient light (amplified to bright, shadow-free illumination during export) */}
      <ambientLight
        intensity={isCapturingViews ? 1.35 : 0.65}
        color={isCapturingViews ? '#FFFFFF' : '#FBFBFA'}
      />

      {/* Primary architectural sun/directional light (castShadow strictly disabled during export) */}
      <directionalLight
        position={[14, 22, 16]}
        intensity={isCapturingViews ? 0.95 : 1.8}
        color="#FFF9F0"
        castShadow={!isCapturingViews}
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

      {/* Sky fill light from opposite angle to soften recesses */}
      <directionalLight
        position={[-12, 16, -10]}
        intensity={isCapturingViews ? 0.85 : 0.6}
        color="#E2EEF8"
      />

      {/* Ground bounce fill light */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={isCapturingViews ? 0.45 : 0.2}
        color="#EADDC8"
      />

      {/* Balanced overhead fill light during export to illuminate all room corners uniformly */}
      {isCapturingViews && (
        <directionalLight
          position={[0, 20, 0]}
          intensity={0.65}
          color="#FFFFFF"
        />
      )}

      {/* Realistic contact ground shadow at base - disabled during export */}
      {!isCapturingViews && (
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.65}
          scale={28}
          blur={1.8}
          far={6}
          resolution={1024}
          color="#1E1C1A"
        />
      )}
    </>
  );
}
