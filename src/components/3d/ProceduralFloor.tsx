'use client';

import React, { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { getProceduralTexture } from '@/lib/texture-generator';
import { TextureGeneratorType } from '@/types';

// Mapping from floor preset IDs to procedural texture generator types
const PRESET_TO_TEXTURE_TYPE: Record<string, TextureGeneratorType> = {
  'floor-carrara-marble': 'marble-carrara',
  'floor-nero-marble': 'marble-nero',
  'floor-terrazzo': 'tile-terrazzo',
  'floor-oak-natural': 'wood-oak',
  'floor-herringbone': 'wood-herringbone',
  'floor-polished-concrete': 'concrete-polished',
  'floor-tile-stone': 'tile-stone',
  'floor-tile-travertine': 'tile-travertine',
  'floor-tile-subway': 'tile-subway',
};

export function ProceduralFloor() {
  const floorEnabled = useConfiguratorStore((s) => s.floorEnabled);
  const floorTextureUrl = useConfiguratorStore((s) => s.floorTextureUrl);
  const floorPresetId = useConfiguratorStore((s) => s.floorPresetId);
  const floorTileRepeat = useConfiguratorStore((s) => s.floorTileRepeat);
  const floorRoughness = useConfiguratorStore((s) => s.floorRoughness);
  const floorColor = useConfiguratorStore((s) => s.floorColor);
  const floorSizeScale = useConfiguratorStore((s) => s.floorSizeScale);
  const floorElevation = useConfiguratorStore((s) => s.floorElevation);
  const isOriginalMode = useConfiguratorStore((s) => s.isOriginalMode);
  const setActiveCategory = useConfiguratorStore((s) => s.setActiveCategory);
  const setHoveredMesh = useConfiguratorStore((s) => s.setHoveredMesh);
  const setSelectedMesh = useConfiguratorStore((s) => s.setSelectedMesh);

  const [customTexture, setCustomTexture] = useState<THREE.Texture | null>(null);

  // Load imported custom tile image when provided
  useEffect(() => {
    if (!floorTextureUrl) {
      setCustomTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    let isCancelled = false;

    loader.load(
      floorTextureUrl,
      (tex) => {
        if (isCancelled) return;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(floorTileRepeat, floorTileRepeat);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setCustomTexture(tex);
      },
      undefined,
      (err) => {
        console.error('Failed to load custom tile texture:', err);
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [floorTextureUrl]);

  // Update repeat scale when slider changes
  useEffect(() => {
    if (customTexture) {
      customTexture.repeat.set(floorTileRepeat, floorTileRepeat);
      customTexture.needsUpdate = true;
    }
  }, [floorTileRepeat, customTexture]);

  // Compute active texture (custom uploaded or procedural architectural preset)
  const activeTexture = useMemo(() => {
    if (customTexture) {
      return customTexture;
    }
    const texType = PRESET_TO_TEXTURE_TYPE[floorPresetId] || 'marble-carrara';
    try {
      return getProceduralTexture(texType, [floorTileRepeat, floorTileRepeat]);
    } catch {
      return null;
    }
  }, [customTexture, floorPresetId, floorTileRepeat]);

  const detectedFootprint = useConfiguratorStore((s) => s.detectedFootprint);
  const floorFitMode = useConfiguratorStore((s) => s.floorFitMode);
  const floorCustomWidth = useConfiguratorStore((s) => s.floorCustomWidth);
  const floorCustomDepth = useConfiguratorStore((s) => s.floorCustomDepth);
  const floorOffsetX = useConfiguratorStore((s) => s.floorOffsetX);
  const floorOffsetZ = useConfiguratorStore((s) => s.floorOffsetZ);

  // If disabled by user or viewing purely original CAD geometry without additions
  if (!floorEnabled || isOriginalMode) {
    return null;
  }

  // Calculate floor dimensions based on detected building footprint
  let baseWidth = 13.0;
  let baseDepth = 25.8;
  let centerX = 0;
  let centerZ = 0;

  if (detectedFootprint) {
    if (floorFitMode === 'interior') {
      // Fit strictly within interior walls (inset 2.5% so floor stays inside without outer edge bleeding)
      baseWidth = detectedFootprint.mainWidth * 0.975;
      baseDepth = detectedFootprint.mainDepth * 0.975;
      centerX = detectedFootprint.mainCenterX;
      centerZ = detectedFootprint.mainCenterZ;
    } else if (floorFitMode === 'full') {
      // Covers full building footprint including porches / canopies
      baseWidth = detectedFootprint.totalWidth;
      baseDepth = detectedFootprint.totalDepth;
      centerX = detectedFootprint.totalCenterX;
      centerZ = detectedFootprint.totalCenterZ;
    } else {
      // Custom manual sizing
      baseWidth = floorCustomWidth || detectedFootprint.mainWidth;
      baseDepth = floorCustomDepth || detectedFootprint.mainDepth;
      centerX = detectedFootprint.mainCenterX;
      centerZ = detectedFootprint.mainCenterZ;
    }
  }

  const finalWidth = Math.max(1, baseWidth * floorSizeScale);
  const finalDepth = Math.max(1, baseDepth * floorSizeScale);
  const posX = centerX + floorOffsetX;
  const posZ = centerZ + floorOffsetZ;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setActiveCategory('floor');
    setSelectedMesh('Lantai & Keramik Ubin (Floor)');
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    setHoveredMesh('Klik untuk kustomisasi Ubin / Lantai');
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
    setHoveredMesh(null);
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[posX, floorElevation, posZ]}
      receiveShadow
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <planeGeometry args={[finalWidth, finalDepth, 32, 32]} />
      <meshStandardMaterial
        map={activeTexture || undefined}
        color={floorColor || '#FFFFFF'}
        roughness={floorRoughness}
        metalness={0.04}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}
