'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialZone } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { applyMaterialToZone, backupOriginalMaterials, restoreOriginalMaterials } from '@/lib/material-applier';
import { getMaterialById } from '@/lib/materials';

interface HouseModelProps {
  modelUrl: string;
  zones: MaterialZone[];
  onMeshClick?: (meshName: string, zone?: MaterialZone) => void;
}

export function HouseModel({ modelUrl, zones, onMeshClick }: HouseModelProps) {
  const gltf = useGLTF(modelUrl);
  const modelRef = useRef<THREE.Group>(null);

  const selectedZoneId = useConfiguratorStore((s) => s.selectedZoneId);
  const selectedMaterials = useConfiguratorStore((s) => s.selectedMaterials);
  const customColors = useConfiguratorStore((s) => s.customColors);
  const isWireframeMode = useConfiguratorStore((s) => s.isWireframeMode);
  const isOriginalMode = useConfiguratorStore((s) => s.isOriginalMode);
  const selectZone = useConfiguratorStore((s) => s.selectZone);
  const setActiveCategory = useConfiguratorStore((s) => s.setActiveCategory);
  const setHoveredMesh = useConfiguratorStore((s) => s.setHoveredMesh);
  const setSelectedMesh = useConfiguratorStore((s) => s.setSelectedMesh);
  const setDetectedFootprint = useConfiguratorStore((s) => s.setDetectedFootprint);

  // Deep clone scene so modifications are isolated to this session
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone(true);

    // Calculate bounding box to automatically center model at ground level
    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Center model at origin and ground level
    clone.position.x = -center.x;
    clone.position.y = -box.min.y;
    clone.position.z = -center.z;

    // Ensure all materials are cloned so meshes don't share instances across zones
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = Array.isArray(child.material)
            ? child.material.map((m) => m.clone())
            : child.material.clone();
        }
      }
    });

    // Backup original materials before any custom materials are assigned
    backupOriginalMaterials(clone);

    return clone;
  }, [gltf.scene]);

  // Automatically calculate building footprint bounds and interior wall dimensions
  useEffect(() => {
    if (!sceneClone) return;

    // Ensure world transform is fully updated
    sceneClone.updateMatrixWorld(true);

    // 1. Overall model bounding box
    const totalBox = new THREE.Box3().setFromObject(sceneClone);
    const totalSize = new THREE.Vector3();
    totalBox.getSize(totalSize);
    const totalCenter = new THREE.Vector3();
    totalBox.getCenter(totalCenter);

    // 2. Primary wall mesh bounding box
    const wallBox = new THREE.Box3();
    let hasWall = false;

    sceneClone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const nameLower = child.name.toLowerCase();
        // Specifically detect main wall / building body mesh
        if (
          nameLower === 'ibuilding10' ||
          nameLower.includes('building') ||
          nameLower.includes('wall') ||
          nameLower.includes('facade') ||
          nameLower.includes('body') ||
          nameLower.includes('house')
        ) {
          wallBox.expandByObject(child);
          hasWall = true;
        }
      }
    });

    const mainBox = hasWall ? wallBox : totalBox;
    const mainSize = new THREE.Vector3();
    mainBox.getSize(mainSize);
    const mainCenter = new THREE.Vector3();
    mainBox.getCenter(mainCenter);

    setDetectedFootprint({
      mainWidth: parseFloat(mainSize.x.toFixed(2)),
      mainDepth: parseFloat(mainSize.z.toFixed(2)),
      mainCenterX: parseFloat(mainCenter.x.toFixed(2)),
      mainCenterZ: parseFloat(mainCenter.z.toFixed(2)),
      totalWidth: parseFloat(totalSize.x.toFixed(2)),
      totalDepth: parseFloat(totalSize.z.toFixed(2)),
      totalCenterX: parseFloat(totalCenter.x.toFixed(2)),
      totalCenterZ: parseFloat(totalCenter.z.toFixed(2)),
    });
  }, [sceneClone, setDetectedFootprint]);

  // Mesh to zone lookup map
  const meshToZoneMap = useMemo(() => {
    const map = new Map<string, MaterialZone>();
    zones.forEach((zone) => {
      zone.meshNames.forEach((meshName) => {
        map.set(meshName, zone);
      });
    });
    return map;
  }, [zones]);

  // Apply default/custom materials or restore original model based on mode
  useEffect(() => {
    if (!sceneClone) return;

    if (isOriginalMode) {
      restoreOriginalMaterials(sceneClone);
      return;
    }

    zones.forEach((zone) => {
      const selectedMatId = selectedMaterials[zone.id] || zone.defaultMaterialId;
      const customColor = customColors[zone.id];
      const material = getMaterialById(selectedMatId);

      if (material) {
        applyMaterialToZone(sceneClone, zone, material, customColor);
      }
    });
  }, [sceneClone, zones, selectedMaterials, customColors, isOriginalMode]);

  // Wireframe toggle effect for architectural drafting view
  useEffect(() => {
    if (!sceneClone) return;

    sceneClone.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => (m.wireframe = isWireframeMode));
        } else {
          obj.material.wireframe = isWireframeMode;
        }
      }
    });
  }, [sceneClone, isWireframeMode]);

  // Helper to find matching zone including parent node hierarchy
  const findZoneForObject = (obj: THREE.Object3D): MaterialZone | undefined => {
    let curr: THREE.Object3D | null = obj;
    while (curr && curr !== sceneClone) {
      if (curr.name && meshToZoneMap.has(curr.name)) {
        return meshToZoneMap.get(curr.name);
      }
      curr = curr.parent;
    }
    return undefined;
  };

  // Handle pointer interactions
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object;
    if (mesh instanceof THREE.Mesh) {
      const zone = findZoneForObject(mesh) || meshToZoneMap.get(mesh.name);
      document.body.style.cursor = 'pointer';
      setHoveredMesh(zone ? zone.name : mesh.name);
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
    setHoveredMesh(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = e.object;
    if (mesh instanceof THREE.Mesh) {
      const zone = findZoneForObject(mesh) || meshToZoneMap.get(mesh.name);
      setSelectedMesh(mesh.name);

      if (zone) {
        selectZone(zone.id);
        setActiveCategory(zone.category);
      }

      if (onMeshClick) {
        onMeshClick(mesh.name, zone);
      }
    }
  };

  return (
    <group ref={modelRef}>
      <primitive
        object={sceneClone}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
    </group>
  );
}
