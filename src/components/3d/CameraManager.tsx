'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_PRESETS } from '@/lib/demo-project';
import { useConfiguratorStore } from '@/lib/configurator-store';

export function CameraManager() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const activeCameraPreset = useConfiguratorStore((s) => s.activeCameraPreset);

  const targetCamPos = useRef(new THREE.Vector3(12, 8, 14));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.5, 0));
  const isTransitioning = useRef(false);

  useEffect(() => {
    const preset = CAMERA_PRESETS.find((p) => p.id === activeCameraPreset);
    if (preset) {
      targetCamPos.current.set(...preset.position);
      targetLookAt.current.set(...preset.target);
      isTransitioning.current = true;
    }
  }, [activeCameraPreset]);

  useFrame((_, delta) => {
    if (!isTransitioning.current || !controlsRef.current) return;

    // Smooth architectural camera glide
    const lerpSpeed = Math.min(delta * 3.5, 0.2);

    camera.position.lerp(targetCamPos.current, lerpSpeed);
    controlsRef.current.target.lerp(targetLookAt.current, lerpSpeed);
    controlsRef.current.update();

    const distPos = camera.position.distanceTo(targetCamPos.current);
    const distTarget = controlsRef.current.target.distanceTo(targetLookAt.current);

    if (distPos < 0.05 && distTarget < 0.05) {
      camera.position.copy(targetCamPos.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      isTransitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 + 0.02} // Allow slightly below horizon for interior looking up
      minDistance={1.0}
      maxDistance={250}
      onStart={() => {
        // User started dragging, stop automated glide
        isTransitioning.current = false;
      }}
    />
  );
}
