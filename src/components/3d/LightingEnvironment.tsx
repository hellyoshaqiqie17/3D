'use client';

import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { useConfiguratorStore } from '@/lib/configurator-store';

export function LightingEnvironment() {
  const isCapturingViews = useConfiguratorStore((s) => s.isCapturingViews);
  const disableShadows = useConfiguratorStore((s) => s.disableShadows);

  const isShadowOff = disableShadows || isCapturingViews;

  return (
    <>
      {/* Gentle architectural ambient light (calibrated for crisp, shadow-free illumination without clipping whites) */}
      <ambientLight
        intensity={isShadowOff ? 0.85 : 0.65}
        color={isShadowOff ? '#FFFFFF' : '#FBFBFA'}
      />

      {/* Primary architectural sun/directional light (castShadow strictly disabled when shadows are disabled) */}
      <directionalLight
        position={[14, 22, 16]}
        intensity={isShadowOff ? 0.85 : 1.8}
        color="#FFF9F0"
        castShadow={!isShadowOff}
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
        intensity={isShadowOff ? 0.50 : 0.6}
        color="#E2EEF8"
      />

      {/* Ground bounce fill light */}
      <directionalLight
        position={[0, -10, 0]}
        intensity={isShadowOff ? 0.25 : 0.2}
        color="#EADDC8"
      />

      {/* Balanced overhead fill light when shadows are disabled to illuminate all room corners uniformly */}
      {isShadowOff && (
        <directionalLight
          position={[0, 20, 0]}
          intensity={0.35}
          color="#FFFFFF"
        />
      )}

      {/* Realistic contact ground shadow at base - disabled when shadows are disabled */}
      {!isShadowOff && (
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
