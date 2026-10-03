'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialZone, BuildingFloorLevel } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { applyMaterialToZone, backupOriginalMaterials, restoreOriginalMaterials, restoreZoneOriginalMaterial } from '@/lib/material-applier';
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
  const selectedMeshName = useConfiguratorStore((s) => s.selectedMeshName);
  const setSelectedMesh = useConfiguratorStore((s) => s.setSelectedMesh);
  const setDetectedFootprint = useConfiguratorStore((s) => s.setDetectedFootprint);
  const uploadedMaterials = useConfiguratorStore((s) => s.uploadedMaterials);
  const zoneTextureSettings = useConfiguratorStore((s) => s.zoneTextureSettings);
  const addDynamicZone = useConfiguratorStore((s) => s.addDynamicZone);
  const isRoofHidden = useConfiguratorStore((s) => s.isRoofHidden);
  const isEnvironmentHidden = useConfiguratorStore((s) => s.isEnvironmentHidden);
  const detectedFloors = useConfiguratorStore((s) => s.detectedFloors);
  const setDetectedFloors = useConfiguratorStore((s) => s.setDetectedFloors);
  const hiddenFloors = useConfiguratorStore((s) => s.hiddenFloors);
  const [roofElevationY, setRoofElevationY] = useState<number>(2.80);
  const setHouseBounds = useConfiguratorStore((s) => s.setHouseBounds);
  const isCeilingCut = useConfiguratorStore((s) => s.isCeilingCut);
  const ceilingCutHeight = useConfiguratorStore((s) => s.ceilingCutHeight);

  // Deep clone scene so modifications are isolated to this session
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone(true);

    // 1. Calculate overall model box and dedicated house box (excluding outer trees and giant site grounds)
    const totalBox = new THREE.Box3().setFromObject(clone);
    const houseBox = new THREE.Box3();
    let hasHouseMeshes = false;

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name || '';
        const lower = name.toLowerCase();

        const isEnv =
          lower.includes('tree') ||
          lower.includes('palm') ||
          lower.includes('bush') ||
          lower.includes('plant') ||
          lower.includes('hydrant') ||
          lower.includes('ball') ||
          lower.includes('basketball') ||
          lower.includes('motorbike') ||
          lower.includes('kangaroo') ||
          lower.includes('pampas') ||
          lower.includes('evergreen') ||
          lower.includes('foliage') ||
          name.startsWith('Group#63') ||
          name.startsWith('Component#47') ||
          name.startsWith('Group#55') ||
          name.startsWith('Group#54') ||
          name.startsWith('Group#53') ||
          name.startsWith('Group#85') ||
          name.startsWith('Component_337') ||
          name.startsWith('Component_338') ||
          name.startsWith('Component_342') ||
          name.startsWith('Component_3434');

        const isBigSite =
          name === 'Group#95' ||
          name === 'Group#363' ||
          name === 'Component#47' ||
          name.startsWith('Component_33') ||
          name.startsWith('Component_34') ||
          lower.includes('road') ||
          lower.includes('jalan') ||
          lower.includes('aspal') ||
          lower.includes('asphalt') ||
          lower.includes('neighbor') ||
          lower.includes('neighbour') ||
          lower.includes('terrain') ||
          lower.includes('boundary') ||
          lower.includes('site');

        if (!isEnv && !isBigSite) {
          houseBox.expandByObject(child);
          hasHouseMeshes = true;
        }
      }
    });

    const activeBox = hasHouseMeshes && !houseBox.isEmpty() ? houseBox : totalBox;
    const center = new THREE.Vector3();
    activeBox.getCenter(center);

    // Center model at origin and ground level based on the house itself
    clone.position.x = -center.x;
    clone.position.y = -activeBox.min.y;
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

    setHouseBounds(
      [0, parseFloat((mainSize.y / 2).toFixed(2)), 0],
      [
        parseFloat(mainSize.x.toFixed(2)),
        parseFloat(mainSize.y.toFixed(2)),
        parseFloat(mainSize.z.toFixed(2)),
      ]
    );

    // 3. Intelligent Multi-level Floor and Roof Base Elevation Detection
    const envKeywords = [
      'tree', 'palm', 'bush', 'plant', 'hydrant', 'ball', 'motorbike',
      'kangaroo', 'pampas', 'evergreen', 'foliage', 'car', 'vehicle'
    ];

    const buildingMeshes: {
      minY: number;
      maxY: number;
      centerY: number;
      areaXZ: number;
      sizeY: number;
      sizeX: number;
      sizeZ: number;
    }[] = [];

    sceneClone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = (child.name || '').toLowerCase();
        const isEnv = envKeywords.some((k) => name.includes(k));
        if (!isEnv) {
          const b = new THREE.Box3().setFromObject(child);
          const s = new THREE.Vector3();
          b.getSize(s);
          buildingMeshes.push({
            minY: b.min.y,
            maxY: b.max.y,
            centerY: (b.min.y + b.max.y) / 2,
            areaXZ: s.x * s.z,
            sizeY: s.y,
            sizeX: s.x,
            sizeZ: s.z,
          });
        }
      }
    });

    const buildingBox = new THREE.Box3();
    buildingMeshes.forEach((m) => {
      buildingBox.min.y = Math.min(buildingBox.min.y, m.minY);
      buildingBox.max.y = Math.max(buildingBox.max.y, m.maxY);
    });

    // Detect horizontal slabs (slabs have thin height <= 0.8m and significant horizontal footprint)
    const slabCandidates = buildingMeshes.filter(
      (m) => m.sizeY <= 0.8 && m.areaXZ > 6 && m.sizeX > 1.2 && m.sizeZ > 1.2
    );
    slabCandidates.sort((a, b) => a.minY - b.minY);

    const slabLevels: { y: number; area: number }[] = [];
    slabCandidates.forEach((m) => {
      const existing = slabLevels.find((lvl) => Math.abs(lvl.y - m.minY) < 0.8);
      if (existing) {
        existing.area += m.areaXZ;
      } else {
        slabLevels.push({ y: m.minY, area: m.areaXZ });
      }
    });

    // Filter significant slabs (combined area > 12m2)
    const significantSlabs = slabLevels.filter((lvl) => lvl.area > 12);
    significantSlabs.sort((a, b) => a.y - b.y);

    // Group distinct boundaries separated by standard floor height (>= 2.2m)
    const boundaries: number[] = [];
    significantSlabs.forEach((s) => {
      if (boundaries.length === 0) {
        boundaries.push(s.y);
      } else {
        const last = boundaries[boundaries.length - 1];
        if (s.y - last >= 2.2) {
          boundaries.push(s.y);
        }
      }
    });

    let detectedRoofY = 2.80;
    const computedFloors: BuildingFloorLevel[] = [];

    if (boundaries.length <= 1) {
      // 1-story house
      detectedRoofY = (boundaries[0] ?? buildingBox.min.y) + 2.80;
      computedFloors.push({
        levelNumber: 1,
        name: 'Lantai 1',
        elevationY: buildingBox.min.y,
        ceilingY: detectedRoofY,
      });
    } else {
      // Multi-story house (e.g. 2 stories or 3 stories)
      detectedRoofY = boundaries[boundaries.length - 1];
      for (let i = 0; i < boundaries.length - 1; i++) {
        computedFloors.push({
          levelNumber: i + 1,
          name: `Lantai ${i + 1}`,
          elevationY: boundaries[i],
          ceilingY: boundaries[i + 1],
        });
      }
    }

    setDetectedFloors(computedFloors);
    setRoofElevationY(detectedRoofY);
  }, [sceneClone, setDetectedFootprint, setHouseBounds, setDetectedFloors]);

  // Set of mesh names belonging to roof zones
  const roofMeshSet = useMemo(() => {
    const set = new Set<string>();
    zones.forEach((z) => {
      if (z.category === 'roof') {
        z.meshNames.forEach((name) => set.add(name));
      }
    });
    return set;
  }, [zones]);

  // Dynamic Roof & Environment Visibility Effect (Dollhouse view & Hide Trees)
  useEffect(() => {
    if (!sceneClone) return;

    sceneClone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name || '';
        const lower = name.toLowerCase();

        // Check if environment tree or exterior clutter prop
        const isEnv =
          lower.includes('tree') ||
          lower.includes('palm') ||
          lower.includes('bush') ||
          lower.includes('plant') ||
          lower.includes('hydrant') ||
          lower.includes('ball') ||
          lower.includes('basketball') ||
          lower.includes('motorbike') ||
          lower.includes('kangaroo') ||
          lower.includes('pampas') ||
          lower.includes('evergreen') ||
          lower.includes('foliage') ||
          name.startsWith('Group#63') ||
          name.startsWith('Component#47') ||
          name.startsWith('Group#55') ||
          name.startsWith('Group#54') ||
          name.startsWith('Group#53') ||
          name.startsWith('Group#85') ||
          name.startsWith('Component_337') ||
          name.startsWith('Component_338') ||
          name.startsWith('Component_342') ||
          name.startsWith('Component_3434');

        // Check world bounding box of this child
        const box = new THREE.Box3().setFromObject(child);

        const minY = box.min.y;
        const centerY = (box.min.y + box.max.y) / 2;

        // Check if explicit roof component
        const isExplicitRoof =
          roofMeshSet.has(name) ||
          lower.includes('roof') ||
          lower.includes('atap') ||
          lower.includes('genteng') ||
          lower.includes('dak') ||
          lower.includes('kanopi') ||
          lower.includes('canopy') ||
          lower.includes('plafon') ||
          lower.includes('ceiling') ||
          lower.includes('pergola') ||
          name.includes('PointLight') ||
          name.startsWith('Group#137') ||
          name.startsWith('Group#138') ||
          name.startsWith('Group#139') ||
          name.startsWith('Group#140') ||
          name.startsWith('Group#141') ||
          name === 'Component_205840' ||
          name === 'Component_205790' ||
          name === 'Component_205546' ||
          name === 'Component_205695' ||
          name === 'Component_205519' ||
          name === 'Component_201197' ||
          name === 'Component_196963' ||
          name === 'Component_192413' ||
          name.startsWith('Component_196') ||
          name.startsWith('Component_197');

        if (isEnv) {
          child.visible = !isEnvironmentHidden;
          return;
        }

        // Roof: explicit roof keywords OR meshes located at/above the detected roof elevation
        const isRoof =
          (isExplicitRoof || minY >= roofElevationY - 0.1 || centerY >= roofElevationY) &&
          minY > 0.8;

        if (isRoof) {
          child.visible = !isRoofHidden;
          return;
        }

        // Check if belonging to a floor level that is toggled off (e.g. Lantai 2, Lantai 3)
        let floorHidden = false;
        if (detectedFloors.length > 1) {
          for (const floor of detectedFloors) {
            if (floor.levelNumber > 1 && hiddenFloors.includes(floor.levelNumber)) {
              if (centerY >= floor.elevationY - 0.2 && minY < floor.ceilingY + 0.1) {
                floorHidden = true;
                break;
              }
            }
          }
        }

        child.visible = !floorHidden;
      }
    });
  }, [
    sceneClone,
    isRoofHidden,
    isEnvironmentHidden,
    hiddenFloors,
    detectedFloors,
    roofElevationY,
    roofMeshSet,
  ]);

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

    const isDemo = modelUrl.includes('modern-villa.glb') || modelUrl === '/models/modern-villa.glb';

    zones.forEach((zone) => {
      const selectedMatId = selectedMaterials[zone.id] || (isDemo ? zone.defaultMaterialId : 'original');
      const customColor = customColors[zone.id];

      // If zone is in original state and no custom color tint, restore native CAD materials
      if ((selectedMatId === 'original' || !selectedMatId) && !customColor) {
        restoreZoneOriginalMaterial(sceneClone, zone);
        return;
      }

      const material =
        uploadedMaterials.find((m) => m.id === selectedMatId) ||
        getMaterialById(selectedMatId) ||
        (customColor ? getMaterialById('wall-pure-white') : undefined);

      if (material) {
        applyMaterialToZone(
          sceneClone,
          zone,
          material,
          customColor,
          zoneTextureSettings[zone.id]
        );
      }
    });
  }, [
    sceneClone,
    zones,
    selectedMaterials,
    customColors,
    uploadedMaterials,
    zoneTextureSettings,
    isOriginalMode,
  ]);

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
  }, [sceneClone, isWireframeMode, selectedMaterials, customColors, zoneTextureSettings, uploadedMaterials, isOriginalMode, zones]);

  // Helper to guess category and display name for dynamic meshes
  const guessCategoryFromMeshName = (name: string): MaterialZone['category'] => {
    const lower = name.toLowerCase();
    if (
      lower.includes('floor') ||
      lower.includes('lantai') ||
      lower.includes('carport') ||
      lower.includes('teras') ||
      lower.includes('paving') ||
      lower.includes('ubin') ||
      lower.includes('keramik') ||
      lower.includes('step') ||
      lower.includes('jalan') ||
      lower.includes('road')
    ) {
      return 'floor';
    }
    if (
      lower.includes('roof') ||
      lower.includes('atap') ||
      lower.includes('kanopi') ||
      lower.includes('canopy') ||
      lower.includes('dak') ||
      lower.includes('genteng')
    ) {
      return 'roof';
    }
    if (
      lower.includes('door') ||
      lower.includes('pintu') ||
      lower.includes('kusen') ||
      lower.includes('frame')
    ) {
      return 'door';
    }
    if (
      lower.includes('window') ||
      lower.includes('jendela') ||
      lower.includes('kaca') ||
      lower.includes('glass')
    ) {
      return 'window';
    }
    if (lower.includes('bath') || lower.includes('toilet') || lower.includes('wc')) {
      return 'bathroom';
    }
    if (
      lower.includes('garden') ||
      lower.includes('taman') ||
      lower.includes('rumput') ||
      lower.includes('grass')
    ) {
      return 'exterior';
    }
    return 'wall';
  };

  const formatMeshDisplayName = (name: string): string => {
    if (name.includes('Group#1_2') || name === 'Group#1') {
      return 'Lantai Carport & Garasi';
    }
    if (name.includes('Group#150')) {
      return 'Lantai Teras Depan';
    }
    if (name.includes('Component_343384') || name === 'Group#95') {
      return 'Area Jalan Aspal (Site)';
    }
    if (name.startsWith('Group#')) {
      return `Bagian 3D (${name})`;
    }
    if (name.startsWith('Component_')) {
      return `Komponen 3D (${name.replace('Component_', '#')})`;
    }
    return name.replace(/_/g, ' ');
  };

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
      setHoveredMesh(zone ? zone.name : formatMeshDisplayName(mesh.name));
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
      } else {
        // Automatically create a dynamic customizable zone for this clicked mesh!
        const autoCat = guessCategoryFromMeshName(mesh.name);
        const dynamicId = `zone_mesh_${mesh.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const newDynamicZone: MaterialZone = {
          id: dynamicId,
          name: formatMeshDisplayName(mesh.name),
          category: autoCat,
          meshNames: [mesh.name],
          defaultMaterialId: 'original',
          description: `Bidang objek 3D terpilih: ${mesh.name}`,
        };
        addDynamicZone(newDynamicZone);
        selectZone(newDynamicZone.id);
        setActiveCategory(newDynamicZone.category);
      }

      if (onMeshClick) {
        onMeshClick(mesh.name, zone);
      }
    }
  };

  // Locate the currently selected 3D object for visual highlight
  const selectedObject = useMemo(() => {
    if (!sceneClone) return null;
    if (selectedMeshName) {
      const obj = sceneClone.getObjectByName(selectedMeshName);
      if (obj) return obj;
    }
    if (selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId);
      if (zone && zone.meshNames.length > 0) {
        for (const name of zone.meshNames) {
          const obj = sceneClone.getObjectByName(name);
          if (obj) return obj;
        }
      }
    }
    return null;
  }, [sceneClone, selectedMeshName, selectedZoneId, zones]);

  return (
    <group ref={modelRef}>
      <primitive
        object={sceneClone}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      <MeshSelectionBox target={selectedObject} />
    </group>
  );
}

/**
 * Visual 3D wireframe bounding box indicating the currently selected zone/mesh
 */
function MeshSelectionBox({ target }: { target: THREE.Object3D | null }) {
  const helper = useMemo(() => {
    if (!target) return null;
    const h = new THREE.BoxHelper(target, 0x2563eb); // Blueprint blue
    const mat = h.material as THREE.LineBasicMaterial;
    mat.depthTest = false;
    mat.transparent = true;
    mat.opacity = 0.88;
    return h;
  }, [target]);

  useFrame(() => {
    if (helper && target) {
      helper.update();
    }
  });

  if (!helper) return null;

  return <primitive object={helper} />;
}
