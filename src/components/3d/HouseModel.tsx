'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MaterialZone, BuildingFloorLevel } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { applyMaterialToZone, backupOriginalMaterials, restoreOriginalMaterials, restoreZoneOriginalMaterial } from '@/lib/material-applier';
import { getMaterialById, SOLID_COLOR_MATERIAL } from '@/lib/materials';
import { splitMergedSurfaces, ensureUniqueSceneMeshes } from '@/lib/mesh-splitter';
import { calculateRoomBounds, isStructuralShellMesh } from '@/lib/furniture-filter';

const ARCHITECTURAL_SURFACES: {
  tag: string;
  id: string;
  name: string;
  category: MaterialZone['category'];
  description: string;
}[] = [
  // Interior Walls (Bagian Dalam Ruangan)
  { tag: '__Dinding_Kanan_Dalam', id: 'surface_dinding_kanan_dalam', name: 'Dinding Kanan Dalam (Interior Right Wall)', category: 'wall', description: 'Permukaan dinding kanan bagian dalam ruangan.' },
  { tag: '__Dinding_Kiri_Dalam', id: 'surface_dinding_kiri_dalam', name: 'Dinding Kiri Dalam (Interior Left Wall)', category: 'wall', description: 'Permukaan dinding kiri bagian dalam ruangan.' },
  { tag: '__Dinding_Depan_Dalam', id: 'surface_dinding_depan_dalam', name: 'Dinding Depan Dalam (Interior Front Wall)', category: 'wall', description: 'Permukaan dinding depan bagian dalam ruangan.' },
  { tag: '__Dinding_Belakang_Dalam', id: 'surface_dinding_belakang_dalam', name: 'Dinding Belakang Dalam (Interior Back Wall)', category: 'wall', description: 'Permukaan dinding belakang bagian dalam ruangan.' },

  // Exterior Walls (Bagian Luar Bangunan)
  { tag: '__Dinding_Kanan_Luar', id: 'surface_dinding_kanan_luar', name: 'Dinding Kanan Luar (Exterior Right Wall)', category: 'exterior', description: 'Permukaan dinding kanan bagian luar bangunan.' },
  { tag: '__Dinding_Kiri_Luar', id: 'surface_dinding_kiri_luar', name: 'Dinding Kiri Luar (Exterior Left Wall)', category: 'exterior', description: 'Permukaan dinding kiri bagian luar bangunan.' },
  { tag: '__Dinding_Depan_Luar', id: 'surface_dinding_depan_luar', name: 'Dinding Depan Luar (Exterior Front Wall)', category: 'exterior', description: 'Permukaan dinding depan bagian luar bangunan.' },
  { tag: '__Dinding_Belakang_Luar', id: 'surface_dinding_belakang_luar', name: 'Dinding Belakang Luar (Exterior Back Wall)', category: 'exterior', description: 'Permukaan dinding belakang bagian luar bangunan.' },

  // Floor & Ceiling (Strictly Decoupled)
  { tag: '__Lantai_Bawah', id: 'surface_lantai_bawah', name: 'Lantai Ruangan (Floor)', category: 'floor', description: 'Seluruh permukaan lantai ruangan.' },
  { tag: '__Plafon_Atas', id: 'surface_plafon_atas', name: 'Plafon Ruangan (Ceiling)', category: 'roof', description: 'Seluruh permukaan plafon/atap ruangan.' },

  // Legacy fallback tags (for models that haven't been resplit or old saved configurations)
  { tag: '__Dinding_Kanan', id: 'surface_dinding_kanan', name: 'Dinding Kanan (Right Wall)', category: 'wall', description: 'Permukaan dinding kanan ruangan.' },
  { tag: '__Dinding_Kiri', id: 'surface_dinding_kiri', name: 'Dinding Kiri (Left Wall)', category: 'wall', description: 'Permukaan dinding kiri ruangan.' },
  { tag: '__Dinding_Depan', id: 'surface_dinding_depan', name: 'Dinding Depan (Front Wall)', category: 'wall', description: 'Permukaan dinding depan ruangan.' },
  { tag: '__Dinding_Belakang', id: 'surface_dinding_belakang', name: 'Dinding Belakang (Back Wall)', category: 'wall', description: 'Permukaan dinding belakang ruangan.' },
];

interface HouseModelProps {
  modelUrl: string;
  zones: MaterialZone[];
  onMeshClick?: (meshName: string, zone?: MaterialZone) => void;
}

export function HouseModel({ modelUrl, zones, onMeshClick }: HouseModelProps) {
  const resolvedModelUrl =
    modelUrl.startsWith('/uploads/')
      ? `/api/storage${modelUrl}`
      : modelUrl;
  const gltf = useGLTF(resolvedModelUrl);
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
  const dynamicZones = useConfiguratorStore((s) => s.dynamicZones);
  const isRoofHidden = useConfiguratorStore((s) => s.isRoofHidden);
  const isFurnitureHidden = useConfiguratorStore((s) => s.isFurnitureHidden);
  const isEnvironmentHidden = useConfiguratorStore((s) => s.isEnvironmentHidden);
  const isSelectionHighlightVisible = useConfiguratorStore((s) => s.isSelectionHighlightVisible);
  const setSelectionHighlightVisible = useConfiguratorStore((s) => s.setSelectionHighlightVisible);
  const isCapturingViews = useConfiguratorStore((s) => s.isCapturingViews);
  const detectedFloors = useConfiguratorStore((s) => s.detectedFloors);
  const setDetectedFloors = useConfiguratorStore((s) => s.setDetectedFloors);
  const hiddenFloors = useConfiguratorStore((s) => s.hiddenFloors);
  const modelType = useConfiguratorStore((s) => s.modelType);
  const isFurniture =
    modelType === 'furniture' ||
    Boolean(modelUrl && /meja|table|kursi|chair|furniture|lemari|cabinet|sofa/i.test(modelUrl));
  const [roofElevationY, setRoofElevationY] = useState<number>(2.80);
  const setHouseBounds = useConfiguratorStore((s) => s.setHouseBounds);
  const setInteriorBounds = useConfiguratorStore((s) => s.setInteriorBounds);
  const isCeilingCut = useConfiguratorStore((s) => s.isCeilingCut);
  const ceilingCutHeight = useConfiguratorStore((s) => s.ceilingCutHeight);
  const setSceneReady = useConfiguratorStore((s) => s.setSceneReady);
  const setSceneLoadingStage = useConfiguratorStore((s) => s.setSceneLoadingStage);
  const clearDynamicZones = useConfiguratorStore((s) => s.clearDynamicZones);

  const frameCountRef = useRef(0);

  useEffect(() => {
    clearDynamicZones();
    frameCountRef.current = 0;
    setSceneReady(false);
    setSceneLoadingStage('preparing');
    return () => {
      setSceneReady(false);
      setSceneLoadingStage('idle');
    };
  }, [resolvedModelUrl, clearDynamicZones, setSceneReady, setSceneLoadingStage]);

  useFrame(() => {
    if (frameCountRef.current < 2) {
      frameCountRef.current += 1;
      if (frameCountRef.current === 1) {
        setSceneLoadingStage('rendering');
      } else if (frameCountRef.current === 2) {
        setSceneReady(true);
        setSceneLoadingStage('ready');
      }
    }
  });

  // Deep clone scene so modifications are isolated to this session
  const sceneClone = useMemo(() => {
    const clone = gltf.scene.clone(true);

    // 1. Ensure all meshes have unique names and cloned material instances so duplicated SketchUp
    // components (like table tiers, duplicated chairs/walls) never bleed into each other
    ensureUniqueSceneMeshes(clone);

    // 2. Split room-scale merged surfaces (e.g. SketchUp material-merged walls) into individual surfaces
    // so left wall, right wall, front wall, back wall can be independently selected and customized
    splitMergedSurfaces(clone);

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

    // Intelligent Interior Room Center Detection (finds toilet, bath, sink, fixtures, floors)
    const interiorBox = new THREE.Box3();
    let hasInteriorElements = false;

    sceneClone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = (child.name || '').toLowerCase();
        const isEnv =
          name.includes('tree') ||
          name.includes('palm') ||
          name.includes('bush') ||
          name.includes('plant') ||
          name.includes('grass') ||
          name.includes('soil') ||
          name.includes('gravel') ||
          name.includes('batu') ||
          name.includes('kerikil') ||
          name.includes('road') ||
          name.includes('jalan');

        if (isEnv) return;

        // Interior fixtures and indoor room props
        const isInteriorProp =
          name.includes('toilet') ||
          name.includes('closet') ||
          name.includes('wc') ||
          name.includes('bath') ||
          name.includes('shower') ||
          name.includes('sink') ||
          name.includes('wastafel') ||
          name.includes('vanity') ||
          name.includes('cermin') ||
          name.includes('mirror') ||
          name.includes('bed') ||
          name.includes('kasur') ||
          name.includes('sofa') ||
          name.includes('couch') ||
          name.includes('kitchen') ||
          name.includes('dapur') ||
          name.includes('counter') ||
          name.includes('cabinet') ||
          name.includes('wardrobe') ||
          name.includes('rug') ||
          name.includes('mat') ||
          name.includes('karpet') ||
          name.includes('__lantai_bawah') ||
          name.includes('floor');

        if (isInteriorProp) {
          interiorBox.expandByObject(child);
          hasInteriorElements = true;
        }
      }
    });

    if (hasInteriorElements && !interiorBox.isEmpty()) {
      const intCenter = new THREE.Vector3();
      interiorBox.getCenter(intCenter);
      const intSize = new THREE.Vector3();
      interiorBox.getSize(intSize);

      // Eye-level is 1.45m above the floor of the room
      const camY = Math.max(interiorBox.min.y + 1.45, 1.45);

      // Stand in the room looking across the space
      const isZLonger = intSize.z >= intSize.x;
      const pos = [
        parseFloat(intCenter.x.toFixed(2)),
        parseFloat(camY.toFixed(2)),
        parseFloat((intCenter.z + (isZLonger ? intSize.z * 0.25 : 0)).toFixed(2)),
      ] as [number, number, number];

      const target = [
        parseFloat(intCenter.x.toFixed(2)),
        parseFloat((camY - 0.05).toFixed(2)),
        parseFloat((intCenter.z - (isZLonger ? intSize.z * 0.25 : 1.5)).toFixed(2)),
      ] as [number, number, number];

      setInteriorBounds(pos, target);
    } else {
      setInteriorBounds(
        [parseFloat(mainCenter.x.toFixed(2)), 1.45, parseFloat((mainCenter.z + 0.5).toFixed(2))],
        [parseFloat(mainCenter.x.toFixed(2)), 1.40, parseFloat((mainCenter.z - 1.5).toFixed(2))]
      );
    }

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
  }, [sceneClone, setDetectedFootprint, setHouseBounds, setInteriorBounds, setDetectedFloors]);

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

  // Combined zones for material categorization and structural shell classification
  const combinedZones = useMemo(() => {
    return [...zones, ...dynamicZones];
  }, [zones, dynamicZones]);

  // Automatically discover and register architectural surface zones across all split pieces
  useEffect(() => {
    if (!sceneClone || isFurniture) return;

    ARCHITECTURAL_SURFACES.forEach((surf) => {
      const matching: string[] = [];
      const isLegacyTag =
        surf.tag === '__Dinding_Kanan' ||
        surf.tag === '__Dinding_Kiri' ||
        surf.tag === '__Dinding_Depan' ||
        surf.tag === '__Dinding_Belakang';

      sceneClone.traverse((child) => {
        if ((child as any).isMesh && child.name && child.name.includes(surf.tag)) {
          if (isLegacyTag && (child.name.includes('_Dalam') || child.name.includes('_Luar'))) {
            return;
          }
          matching.push(child.name);
        }
      });
      if (matching.length > 0) {
        const existingDynamic = dynamicZones.find((z) => z.id === surf.id);
        const shouldUpdate =
          !existingDynamic ||
          existingDynamic.meshNames.length !== matching.length ||
          !existingDynamic.meshNames.every((m) => matching.includes(m));

        if (shouldUpdate) {
          addDynamicZone({
            id: surf.id,
            name: surf.name,
            category: surf.category,
            meshNames: matching,
            defaultMaterialId: 'original',
            description: surf.description,
          });
        }
      }
    });
  }, [sceneClone, addDynamicZone, dynamicZones, zones]);

  // Memoize room architectural bounds for structural shell classification
  const roomBounds = useMemo(() => {
    if (!sceneClone) return { minX: -2.5, maxX: 2.5, minZ: -2.5, maxZ: 2.5, groundY: 0, ceilingY: 3, roomHeight: 3, roomWidth: 5, roomDepth: 5 };
    return calculateRoomBounds(sceneClone);
  }, [sceneClone]);

  // Dynamic Roof & Environment Visibility Effect (Dollhouse view & Hide Trees & Bare Room)
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

        if (isEnv) {
          child.visible = !isFurnitureHidden && !isEnvironmentHidden;
          return;
        }

        // Bare Room Mode: Hide all loose furniture, appliances (kulkas, kompor, oven), cabinets, island, decor,
        // lamps, fixtures, and Enscape lights/widgets. Only pure Wall, Floor, and Plafon/Roof remain visible.
        if (isFurnitureHidden) {
          const isStructural = isStructuralShellMesh(child, roomBounds, roofElevationY);
          if (!isStructural) {
            child.visible = false;
            return;
          }
        }

        // Check world bounding box of this child
        const box = new THREE.Box3().setFromObject(child);
        const minY = box.min.y;
        const centerY = (box.min.y + box.max.y) / 2;

        // Wall top caps / lintels (__Bibir_Dinding) and vertical wall strips (__Dinding_)
        // close the hollow thickness of walls and must NEVER be hidden when the roof/ceiling is opened
        const isWallCap =
          name.includes('__Bibir_Dinding') ||
          (name.includes('__Dinding_') && minY <= roofElevationY + 0.15);

        // Check if explicit roof component
        const isExplicitRoof =
          !isWallCap &&
          (roofMeshSet.has(name) ||
            lower.includes('roof') ||
            lower.includes('atap') ||
            lower.includes('genteng') ||
            lower.includes('dak') ||
            lower.includes('kanopi') ||
            lower.includes('canopy') ||
            lower.includes('plafon') ||
            lower.includes('ceiling') ||
            lower.includes('pergola') ||
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
            name.startsWith('Component_197'));

        // Roof: explicit roof keywords OR meshes located at/above the detected roof elevation (excluding wall top caps & wall strips)
        const isRoof =
          !isWallCap &&
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
    isFurnitureHidden,
    isEnvironmentHidden,
    hiddenFloors,
    detectedFloors,
    roofElevationY,
    roofMeshSet,
    roomBounds,
    combinedZones,
  ]);

  // Dynamic Architectural Section Cut / Ceiling Slice Effect (only when explicit Ceiling Cut is enabled)
  useEffect(() => {
    if (!sceneClone) return;

    const shouldCut = isCeilingCut;
    const cutY = Math.min(roofElevationY > 0 ? roofElevationY - 0.15 : 2.70, ceilingCutHeight || 2.70);
    const clipPlanes = shouldCut ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), cutY)] : [];

    sceneClone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const isPrimaryWallCap = child.name.includes('_1__Bibir_Dinding');
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          m.clippingPlanes = clipPlanes;
          m.clipShadows = true;
          m.side = THREE.DoubleSide; // Render both interior and exterior faces
          if (isPrimaryWallCap) {
            m.polygonOffset = true;
            m.polygonOffsetFactor = -1;
            m.polygonOffsetUnits = -1;
          }
          m.needsUpdate = true;
        });
      }
    });
  }, [sceneClone, isRoofHidden, isCeilingCut, ceilingCutHeight, roofElevationY, selectedMaterials, customColors, zoneTextureSettings, isOriginalMode]);

  // Mesh to zone lookup map
  const meshToZoneMap = useMemo(() => {
    const map = new Map<string, MaterialZone>();
    combinedZones.forEach((zone) => {
      zone.meshNames.forEach((meshName) => {
        map.set(meshName, zone);
      });
    });
    return map;
  }, [combinedZones]);

  // Apply default/custom materials or restore original model based on mode
  useEffect(() => {
    if (!sceneClone) return;

    if (isOriginalMode) {
      restoreOriginalMaterials(sceneClone);
      return;
    }

    const isDemo = modelUrl.includes('modern-villa.glb') || modelUrl === '/models/modern-villa.glb';

    combinedZones.forEach((zone) => {
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
        (customColor ? SOLID_COLOR_MATERIAL : undefined);

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
    combinedZones,
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

  // Helper to format friendly display name for any 3D mesh
  const formatMeshDisplayName = (name: string): string => {
    if (!name) return isFurniture ? 'Elemen Meja' : 'Bidang 3D';

    const lower = name.toLowerCase();
    const instMatch = name.match(/__inst(\d+)/);
    const instSuffix = instMatch ? ` #${instMatch[1]}` : '';
    const cleanName = name.replace(/__inst\d+/, '');

    // Furniture / Table Mode: Never use room-related words like "Ruangan", "Bangunan", "Lantai", etc.
    if (isFurniture) {
      if (lower.includes('top') || lower.includes('surface') || lower.includes('daun') || lower.includes('papan') || lower.includes('kaca') || lower.includes('glass')) {
        return `Top Table / Daun Meja${instSuffix}`;
      }
      if (lower.includes('shelf') || lower.includes('ambalan') || lower.includes('bottom') || lower.includes('bawah')) {
        return `Ambalan Meja Bawah${instSuffix}`;
      }
      if (lower.includes('leg') || lower.includes('kaki') || lower.includes('frame') || lower.includes('rangka')) {
        return `Rangka & Kaki Meja${instSuffix}`;
      }
      if (cleanName.startsWith('Group#')) {
        return `Bagian #${cleanName.replace('Group#', '')}${instSuffix}`;
      }
      if (cleanName.startsWith('Component_') || cleanName.startsWith('Component#')) {
        return `Komponen #${cleanName.replace(/^Component[_#]/, '')}${instSuffix}`;
      }
      return `${cleanName.replace(/_/g, ' ')}${instSuffix}`;
    }

    // Specific friendly names for smart-split room surfaces
    if (name.includes('__Dinding_Kanan_Dalam')) {
      return 'Dinding Kanan Dalam (Interior Right Wall)';
    }
    if (name.includes('__Dinding_Kanan_Luar')) {
      return 'Dinding Kanan Luar (Exterior Right Wall)';
    }
    if (name.includes('__Dinding_Kiri_Dalam')) {
      return 'Dinding Kiri Dalam (Interior Left Wall)';
    }
    if (name.includes('__Dinding_Kiri_Luar')) {
      return 'Dinding Kiri Luar (Exterior Left Wall)';
    }
    if (name.includes('__Dinding_Depan_Dalam')) {
      return 'Dinding Depan Dalam (Interior Front Wall)';
    }
    if (name.includes('__Dinding_Depan_Luar')) {
      return 'Dinding Depan Luar (Exterior Front Wall)';
    }
    if (name.includes('__Dinding_Belakang_Dalam')) {
      return 'Dinding Belakang Dalam (Interior Back Wall)';
    }
    if (name.includes('__Dinding_Belakang_Luar')) {
      return 'Dinding Belakang Luar (Exterior Back Wall)';
    }
    if (name.includes('__Dinding_Kanan')) {
      const match = name.match(/__Dinding_Kanan(?:_(\d+))?/);
      return match && match[1] ? `Dinding Kanan #${match[1]}` : 'Dinding Kanan (Right Wall)';
    }
    if (name.includes('__Dinding_Kiri')) {
      const match = name.match(/__Dinding_Kiri(?:_(\d+))?/);
      return match && match[1] ? `Dinding Kiri #${match[1]}` : 'Dinding Kiri (Left Wall)';
    }
    if (name.includes('__Dinding_Depan')) {
      const match = name.match(/__Dinding_Depan(?:_(\d+))?/);
      return match && match[1] ? `Dinding Depan #${match[1]}` : 'Dinding Depan (Front Wall)';
    }
    if (name.includes('__Dinding_Belakang')) {
      const match = name.match(/__Dinding_Belakang(?:_(\d+))?/);
      return match && match[1] ? `Dinding Belakang #${match[1]}` : 'Dinding Belakang (Back Wall)';
    }
    if (name.includes('__Lantai_Bawah')) {
      const match = name.match(/__Lantai_Bawah(?:_(\d+))?/);
      return match && match[1] ? `Lantai Ruangan #${match[1]}` : 'Lantai Ruangan (Floor)';
    }
    if (name.includes('__Plafon_Atas')) {
      const match = name.match(/__Plafon_Atas(?:_(\d+))?/);
      return match && match[1] ? `Plafon Ruangan #${match[1]}` : 'Plafon Ruangan (Ceiling)';
    }
    if (name.includes('__Bibir_Dinding')) {
      return 'Bibir / Penutup Atas Dinding (Wall Cap)';
    }

    if (name.includes('Group#1_2') || name === 'Group#1') {
      return `Lantai Carport & Garasi${instSuffix}`;
    }
    if (name.includes('Group#150')) {
      return `Lantai Teras Depan${instSuffix}`;
    }
    if (name.includes('Component_343384') || name === 'Group#95') {
      return `Area Jalan Aspal (Site)${instSuffix}`;
    }
    if (lower.includes('floor') || lower.includes('lantai')) {
      return `Lantai (${cleanName.replace(/_/g, ' ')}${instSuffix})`;
    }
    if (lower.includes('wall') || lower.includes('dinding')) {
      return `Dinding (${cleanName.replace(/_/g, ' ')}${instSuffix})`;
    }
    if (lower.includes('roof') || lower.includes('atap') || lower.includes('dak') || lower.includes('plafon')) {
      return `Atap / Plafon (${cleanName.replace(/_/g, ' ')}${instSuffix})`;
    }
    if (lower.includes('door') || lower.includes('pintu')) {
      return `Pintu (${cleanName.replace(/_/g, ' ')}${instSuffix})`;
    }
    if (lower.includes('window') || lower.includes('jendela')) {
      return `Jendela (${cleanName.replace(/_/g, ' ')}${instSuffix})`;
    }
    if (cleanName.startsWith('Group#')) {
      return `Bidang (${cleanName}${instSuffix})`;
    }
    if (cleanName.startsWith('Component_') || cleanName.startsWith('Component#')) {
      return `Elemen (${cleanName.replace(/^Component[_#]/, '#')}${instSuffix})`;
    }
    return `Bidang 3D (${cleanName.replace(/_/g, ' ')}${instSuffix})`;
  };

  // Intelligently detect category, friendly name, and description from mesh geometry & names
  const detectMeshCategoryAndName = (mesh: THREE.Mesh): {
    category: MaterialZone['category'];
    name: string;
    description: string;
  } => {
    mesh.updateWorldMatrix(true, false);
    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const lower = (mesh.name || '').toLowerCase();

    // Dedicated Furniture / Table Mode: clean, professional furniture terminology
    if (isFurniture) {
      // Flat horizontal surfaces (tabletop, top surface, or bottom shelf)
      if (size.y <= 0.6 && (size.x >= 0.15 || size.z >= 0.15)) {
        if (box.min.y >= 0.25) {
          return {
            category: 'floor',
            name: `Top Table / Daun Meja (${formatMeshDisplayName(mesh.name)})`,
            description: 'Permukaan atas meja untuk kustomisasi marmer, granit, keramik, kaca, atau kayu.',
          };
        }
        return {
          category: 'floor',
          name: `Ambalan Meja Bawah (${formatMeshDisplayName(mesh.name)})`,
          description: 'Permukaan ambalan bawah meja untuk kustomisasi marmer, keramik, kaca, atau kayu.',
        };
      }

      // Vertical frame, legs, or structure
      if (size.y > 0.15 && (size.y >= size.x * 0.4 || size.y >= size.z * 0.4)) {
        return {
          category: 'wall',
          name: `Rangka & Kaki Meja (${formatMeshDisplayName(mesh.name)})`,
          description: 'Struktur rangka atau kaki meja untuk kustomisasi warna cat, besi, atau kayu.',
        };
      }

      return {
        category: 'exterior',
        name: `Elemen Meja (${formatMeshDisplayName(mesh.name)})`,
        description: 'Bagian elemen meja terpilih untuk kustomisasi material.',
      };
    }

    // 1. Keyword-based matching
    if (
      lower.includes('floor') ||
      lower.includes('lantai') ||
      lower.includes('keramik') ||
      lower.includes('tile') ||
      lower.includes('parquet')
    ) {
      return {
        category: 'floor',
        name: formatMeshDisplayName(mesh.name),
        description: 'Bidang lantai terpilih untuk kustomisasi ubin keramik, granit, atau marmer.',
      };
    }
    if (
      lower.includes('roof') ||
      lower.includes('atap') ||
      lower.includes('genteng') ||
      lower.includes('kanopi') ||
      lower.includes('canopy') ||
      lower.includes('dak') ||
      lower.includes('plafon')
    ) {
      return {
        category: 'roof',
        name: formatMeshDisplayName(mesh.name),
        description: 'Bidang penutup atap atau kanopi dak/plafon bangunan.',
      };
    }
    if (
      lower.includes('door') ||
      lower.includes('pintu') ||
      lower.includes('kusen') ||
      lower.includes('gate')
    ) {
      return {
        category: 'door',
        name: formatMeshDisplayName(mesh.name),
        description: 'Bidang pintu, kusen, atau akses masuk.',
      };
    }
    if (
      lower.includes('wall') ||
      lower.includes('dinding') ||
      lower.includes('tembok') ||
      lower.includes('facade')
    ) {
      return {
        category: 'wall',
        name: formatMeshDisplayName(mesh.name),
        description: 'Bidang dinding terpilih untuk kustomisasi warna cat atau aksen.',
      };
    }

    // 2. Geometry-based matching (handles SketchUp Component_... & Group#... unclassified meshes)
    // Flat horizontal surface (floors, decks, terraces, tabletops, shelves, counters)
    const isFlatHorizontal = size.y <= 0.6 && (size.x >= 0.25 || size.z >= 0.25);
    if (isFlatHorizontal) {
      if (box.min.y >= roofElevationY - 0.25) {
        return {
          category: 'roof',
          name: `Atap & Dak (${formatMeshDisplayName(mesh.name)})`,
          description: 'Bidang dak atap / plafon atas.',
        };
      }
      // If elevated above ground floor level (e.g. table surface, shelf, ambalan, counter):
      if (box.min.y >= 0.15 && box.max.y <= 1.50) {
        return {
          category: 'floor',
          name: `Permukaan Meja / Ambalan (${formatMeshDisplayName(mesh.name)})`,
          description: 'Bidang permukaan meja / ambalan terpilih untuk kustomisasi marmer, granit, keramik, atau kayu.',
        };
      }
      return {
        category: 'floor',
        name: `Lantai Ubin (${formatMeshDisplayName(mesh.name)})`,
        description: 'Bidang lantai terpilih untuk kustomisasi ubin keramik, marmer, atau parket.',
      };
    }

    // Tall vertical surface (walls, columns, partitions)
    if (size.y > 0.7 && (size.y >= size.x * 0.7 || size.y >= size.z * 0.7)) {
      return {
        category: 'wall',
        name: `Dinding / Kolom (${formatMeshDisplayName(mesh.name)})`,
        description: 'Bidang dinding atau pilar terpilih untuk kustomisasi warna cat atau aksen.',
      };
    }

    return {
      category: 'exterior',
      name: `Bidang 3D (${formatMeshDisplayName(mesh.name)})`,
      description: 'Elemen objek 3D terpilih untuk kustomisasi material.',
    };
  };

  const [hoveredMeshes, setHoveredMeshes] = useState<THREE.Object3D[]>([]);
  const [hoveredSurfaceId, setHoveredSurfaceId] = useState<string | null>(null);

  // Filters intersections for the first truly visible surface, passing through section cuts into the room
  const getValidHit = (e: ThreeEvent<any>): { mesh: THREE.Mesh; point: THREE.Vector3 } | null => {
    const shouldCut = isCeilingCut;
    const cutY = Math.min(roofElevationY > 0 ? roofElevationY - 0.15 : 2.70, ceilingCutHeight || 2.70);

    if (e.intersections && e.intersections.length > 0) {
      for (const hit of e.intersections) {
        const obj = hit.object;
        if (!(obj instanceof THREE.Mesh)) continue;

        // Ensure mesh and all ancestors are visible
        let visible = true;
        let curr: THREE.Object3D | null = obj;
        while (curr) {
          if (!curr.visible) {
            visible = false;
            break;
          }
          curr = curr.parent;
        }
        if (!visible) continue;

        // Skip geometry clipped away by section cut / ceiling cut so clicks enter the room cleanly
        if (shouldCut && hit.point.y > cutY) {
          continue;
        }

        return { mesh: obj, point: hit.point };
      }
    }

    if (e.object instanceof THREE.Mesh && e.object.visible) {
      if (shouldCut && e.point && e.point.y > cutY) {
        return null;
      }
      return { mesh: e.object, point: e.point };
    }

    return null;
  };

  // Identifies the surface family (back wall, left wall, floor, etc.) and all sibling member meshes
  const getSurfaceMeshesAndInfo = (mesh: THREE.Mesh) => {
    const matchedSurface = ARCHITECTURAL_SURFACES.find((s) => mesh.name.includes(s.tag));
    let targetMeshes: THREE.Object3D[] = [];
    let surfaceId = '';
    let displayName = '';
    let category: MaterialZone['category'] = 'wall';
    let description = '';

    if (matchedSurface) {
      surfaceId = matchedSurface.id;
      displayName = matchedSurface.name;
      category = matchedSurface.category;
      description = matchedSurface.description;
      const isLegacy =
        matchedSurface.tag === '__Dinding_Kanan' ||
        matchedSurface.tag === '__Dinding_Kiri' ||
        matchedSurface.tag === '__Dinding_Depan' ||
        matchedSurface.tag === '__Dinding_Belakang';

      sceneClone.traverse((child) => {
        if ((child as any).isMesh && child.name && child.name.includes(matchedSurface.tag)) {
          if (isLegacy && (child.name.includes('_Dalam') || child.name.includes('_Luar'))) {
            return;
          }
          targetMeshes.push(child);
        }
      });
    } else {
      const existingZone =
        dynamicZones.find((z) => z.meshNames.includes(mesh.name)) ||
        zones.find((z) => z.meshNames.includes(mesh.name));

      if (existingZone) {
        surfaceId = existingZone.id;
        displayName = existingZone.name;
        category = existingZone.category;
        description = existingZone.description || '';
        existingZone.meshNames.forEach((n) => {
          const obj = sceneClone.getObjectByName(n);
          if (obj) targetMeshes.push(obj);
        });
      } else {
        const detected = detectMeshCategoryAndName(mesh);
        surfaceId = `box_${mesh.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        displayName = detected.name;
        category = detected.category;
        description = detected.description;
        targetMeshes = [mesh];
      }
    }

    if (targetMeshes.length === 0) {
      targetMeshes = [mesh];
    }

    return { surfaceId, displayName, category, description, targetMeshes };
  };

  // Real-time hover tracking: highlights the surface in sky blue whenever cursor moves
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const hit = getValidHit(e);
    if (!hit) {
      if (hoveredMeshes.length > 0) {
        setHoveredMeshes([]);
        setHoveredSurfaceId(null);
        setHoveredMesh(null);
        document.body.style.cursor = 'default';
      }
      return;
    }

    document.body.style.cursor = 'pointer';
    const { surfaceId, displayName, targetMeshes } = getSurfaceMeshesAndInfo(hit.mesh);

    if (hoveredSurfaceId !== surfaceId) {
      setHoveredSurfaceId(surfaceId);
      setHoveredMeshes(targetMeshes);
      setHoveredMesh(displayName);
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredMeshes([]);
    setHoveredSurfaceId(null);
    setHoveredMesh(null);
    document.body.style.cursor = 'default';
  };

  // Click selects the entire architectural surface or zone with solid blueprint blue outline
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const hit = getValidHit(e);
    if (!hit) {
      setSelectionHighlightVisible(false);
      return;
    }

    setSelectionHighlightVisible(true);

    const { surfaceId, displayName, category, description, targetMeshes } = getSurfaceMeshesAndInfo(hit.mesh);
    const targetMeshNames = targetMeshes.map((m) => m.name).filter(Boolean);

    let zone =
      dynamicZones.find((z) => z.id === surfaceId) ||
      zones.find((z) => z.id === surfaceId);

    if (!zone) {
      zone = {
        id: surfaceId,
        name: displayName,
        category: category,
        meshNames: targetMeshNames.length > 0 ? targetMeshNames : [hit.mesh.name],
        defaultMaterialId: 'original',
        description: description,
      };
      addDynamicZone(zone);
    }

    selectZone(zone.id);
    setActiveCategory(zone.category);
    setSelectedMesh(targetMeshNames[0] || hit.mesh.name);

    if (onMeshClick) {
      onMeshClick(hit.mesh.name, zone);
    }
  };

  // Locates all member meshes belonging to the currently selected zone or architectural surface
  const selectedMeshes = useMemo<THREE.Object3D[]>(() => {
    if (!sceneClone) return [];
    const meshes: THREE.Object3D[] = [];

    if (selectedZoneId) {
      const matchedSurface = ARCHITECTURAL_SURFACES.find((s) => s.id === selectedZoneId);
      if (matchedSurface) {
        const isLegacy =
          matchedSurface.tag === '__Dinding_Kanan' ||
          matchedSurface.tag === '__Dinding_Kiri' ||
          matchedSurface.tag === '__Dinding_Depan' ||
          matchedSurface.tag === '__Dinding_Belakang';

        sceneClone.traverse((child) => {
          if ((child as any).isMesh && child.name && child.name.includes(matchedSurface.tag)) {
            if (isLegacy && (child.name.includes('_Dalam') || child.name.includes('_Luar'))) {
              return;
            }
            meshes.push(child);
          }
        });
        if (meshes.length > 0) return meshes;
      }

      const zone = combinedZones.find((z) => z.id === selectedZoneId);
      if (zone && zone.meshNames.length > 0) {
        zone.meshNames.forEach((n) => {
          const obj = sceneClone.getObjectByName(n);
          if (obj) meshes.push(obj);
        });
        if (meshes.length > 0) return meshes;
      }
    }

    if (selectedMeshName) {
      const matchedSurface = ARCHITECTURAL_SURFACES.find((s) => selectedMeshName.includes(s.tag));
      if (matchedSurface) {
        const isLegacy =
          matchedSurface.tag === '__Dinding_Kanan' ||
          matchedSurface.tag === '__Dinding_Kiri' ||
          matchedSurface.tag === '__Dinding_Depan' ||
          matchedSurface.tag === '__Dinding_Belakang';

        sceneClone.traverse((child) => {
          if ((child as any).isMesh && child.name && child.name.includes(matchedSurface.tag)) {
            if (isLegacy && (child.name.includes('_Dalam') || child.name.includes('_Luar'))) {
              return;
            }
            meshes.push(child);
          }
        });
        if (meshes.length > 0) return meshes;
      }

      const obj = sceneClone.getObjectByName(selectedMeshName);
      if (obj) meshes.push(obj);
    }

    return meshes;
  }, [sceneClone, selectedZoneId, selectedMeshName, combinedZones]);

  return (
    <group ref={modelRef}>
      <primitive
        object={sceneClone}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      {/* Interactive real-time hover highlight on cursor move (samar-samar, lembut) */}
      {!isCapturingViews && (
        <SurfaceHighlightBox
          meshes={hoveredMeshes}
          color={0x60a5fa}
          fillOpacity={0.02}
          lineOpacity={0.32}
          isHover={true}
          excludeMeshes={isSelectionHighlightVisible ? selectedMeshes : undefined}
        />
      )}
      {/* Active selection bounding box (hanya muncul saat diklik langsung) */}
      {!isCapturingViews && isSelectionHighlightVisible && (
        <SurfaceHighlightBox
          meshes={selectedMeshes}
          color={0x3b82f6}
          fillOpacity={0.045}
          lineOpacity={0.50}
          isHover={false}
        />
      )}
    </group>
  );
}

/**
 * 3D wireframe bounding box with translucent fill that smoothly envelops single meshes
 * or entire architectural surface groups (e.g. all pieces of Back Wall or Floor).
 * Styled subtly (samar-samar) so it guides the user gracefully without overpowering textures.
 */
function SurfaceHighlightBox({
  meshes,
  color,
  fillOpacity,
  lineOpacity = 0.50,
  isHover,
  excludeMeshes,
}: {
  meshes: THREE.Object3D[];
  color: number;
  fillOpacity: number;
  lineOpacity?: number;
  isHover?: boolean;
  excludeMeshes?: THREE.Object3D[];
}) {
  const isCapturingViews = useConfiguratorStore((s) => s.isCapturingViews);
  const fillMeshRef = useRef<THREE.Mesh>(null);

  // If hovered meshes are identical to selected meshes, do not duplicate hover outline
  const shouldRender = useMemo(() => {
    if (isCapturingViews || (typeof window !== 'undefined' && (window as any).__CAD_CAPTURING_VIEWS__)) return false;
    if (!meshes || meshes.length === 0) return false;
    if (isHover && excludeMeshes && excludeMeshes.length > 0) {
      const isSame = meshes.some((m) => excludeMeshes.includes(m));
      if (isSame) return false;
    }
    return true;
  }, [meshes, isHover, excludeMeshes, isCapturingViews]);

  const helper = useMemo(() => {
    if (!shouldRender) return null;
    const b = new THREE.Box3();
    const h = new THREE.Box3Helper(b, new THREE.Color(color));
    const mat = h.material as THREE.LineBasicMaterial;
    mat.depthTest = false;
    mat.transparent = true;
    mat.opacity = lineOpacity;
    return h;
  }, [shouldRender, color, lineOpacity]);

  useFrame(() => {
    if (isCapturingViews || (typeof window !== 'undefined' && (window as any).__CAD_CAPTURING_VIEWS__)) {
      if (helper) helper.visible = false;
      if (fillMeshRef.current) fillMeshRef.current.visible = false;
      return;
    }
    if (!helper || !shouldRender) return;

    let hasVisible = false;
    const unionBox = new THREE.Box3();

    for (const obj of meshes) {
      let visible = true;
      let curr: THREE.Object3D | null = obj;
      while (curr) {
        if (!curr.visible) {
          visible = false;
          break;
        }
        curr = curr.parent;
      }

      if (visible) {
        unionBox.expandByObject(obj);
        hasVisible = true;
      }
    }

    const isValid = hasVisible && !unionBox.isEmpty();
    helper.visible = isValid;

    if (isValid) {
      // Expand subtly to hug the geometry closely without z-fighting
      unionBox.expandByScalar(0.008);
      helper.box.copy(unionBox);

      if (fillMeshRef.current) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        unionBox.getCenter(center);
        unionBox.getSize(size);
        fillMeshRef.current.position.copy(center);
        fillMeshRef.current.scale.copy(size);
        fillMeshRef.current.visible = true;
      }
    } else if (fillMeshRef.current) {
      fillMeshRef.current.visible = false;
    }
  });

  if (!shouldRender || !helper) return null;

  return (
    <group>
      <primitive object={helper} />
      <mesh ref={fillMeshRef} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={fillOpacity}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
