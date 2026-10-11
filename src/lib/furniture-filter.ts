import * as THREE from 'three';

export interface RoomStructuralBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  groundY: number;
  ceilingY: number;
  roomHeight: number;
  roomWidth: number;
  roomDepth: number;
}

export const ENV_KEYWORDS = [
  'tree', 'palm', 'bush', 'plant', 'hydrant', 'ball', 'motorbike',
  'kangaroo', 'pampas', 'evergreen', 'foliage', 'car', 'vehicle'
];

// Keywords that are DEFINITELY furniture, appliances, loose fixtures, curtains, decor, or environment
export const FURNITURE_KEYWORDS = [
  'fridge', 'kulkas', 'refrigerator', 'freezer',
  'stove', 'kompor', 'cooktop', 'burner',
  'oven', 'microwave', 'hood', 'exhaust', 'chimney',
  'sink', 'faucet', 'kran', 'wastafel', 'cuci', 'bak_cuci',
  'dishwasher', 'blender', 'toaster', 'kettle', 'dispenser',
  'cabinet', 'kabinet', 'counter', 'island', 'kitchen_island',
  'drawer', 'laci', 'shelf', 'rak', 'cupboard', 'credenza', 'buffet',
  'wardrobe', 'lemari', 'closet',
  'chair', 'kursi', 'stool', 'barstool', 'sofa', 'couch', 'armchair',
  'bench', 'bangku', 'ottoman', 'beanbag',
  'table', 'meja', 'desk', 'coffee_table', 'dining',
  'bed', 'kasur', 'ranjang', 'mattress', 'headboard', 'nightstand', 'nakas',
  'toilet', 'closet_wc', 'wc', 'urinal', 'bidet',
  'bathtub', 'shower', 'vanity', 'mirror', 'cermin',
  'lamp', 'lampu', 'chandelier', 'pendant', 'sconce', 'lantern', 'standing_lamp', 'light', 'spotlight', 'pointlight', 'linear',
  'tv', 'television', 'monitor', 'screen', 'audio', 'speaker',
  'decor', 'decoration', 'hiasan', 'pajangan', 'accessories', 'sculpture', 'statue', 'art', 'print', 'frame', 'framed', 'potato', 'fragrance',
  'pot', 'plant', 'tanaman', 'flower', 'bunga', 'vase', 'vas', 'cactus', 'palm', 'tree', 'bush', 'foliage',
  'carpet', 'karpet', 'rug', 'curtain', 'gorden', 'blind', 'drape', 'drapery', 'shutter', 'louver', 'slat', 'rod', 'rail',
  'pillow', 'bantal', 'cushion', 'blanket', 'selimut',
  'picture', 'bingkai', 'lukisan', 'painting',
  'plate', 'piring', 'bowl', 'mangkok', 'glass', 'gelas', 'cup', 'cangkir',
  'pan', 'panci', 'pot_cook', 'wajan', 'knife', 'pisau', 'spoon', 'sendok', 'fork', 'garpu',
  'bottle', 'botol', 'book', 'buku', 'magazine',
  'laptop', 'computer', 'pencil', 'pen', 'stationery', 'phone', 'telephone',
  'person', 'human', 'man', 'woman', 'people', 'orang', 'laura', 'standing',
  'dog', 'cat', 'pet', 'animal',
  'car', 'mobil', 'bike', 'motor', 'vehicle', 'bicycle', 'sepeda'
];

/**
 * Calculates room structural boundaries from the largest vertical architectural envelopes
 */
export function calculateRoomBounds(scene: THREE.Object3D): RoomStructuralBounds {
  const roomBox = new THREE.Box3();
  let hasFoundWall = false;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const name = (child.name || '').toLowerCase();
      const isEnv = ENV_KEYWORDS.some((k) => name.includes(k));
      if (isEnv) return;

      const b = new THREE.Box3().setFromObject(child);
      const s = b.getSize(new THREE.Vector3());

      // Only large vertical surfaces spanning room scale or explicit wall/floor/ceiling meshes
      if (
        (s.y >= 2.0 && (s.x >= 2.0 || s.z >= 2.0)) ||
        name.includes('__dinding') ||
        name.includes('__lantai') ||
        name.includes('__plafon')
      ) {
        roomBox.union(b);
        hasFoundWall = true;
      }
    }
  });

  if (!hasFoundWall || roomBox.isEmpty()) {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = (child.name || '').toLowerCase();
        if (!ENV_KEYWORDS.some((k) => name.includes(k))) {
          const b = new THREE.Box3().setFromObject(child);
          const s = b.getSize(new THREE.Vector3());
          // Ignore stray tiny dots/pins high up in the sky
          if (s.x >= 0.5 || s.y >= 0.5 || s.z >= 0.5) {
            roomBox.union(b);
          }
        }
      }
    });
  }

  const size = roomBox.getSize(new THREE.Vector3());
  return {
    minX: roomBox.min.x,
    maxX: roomBox.max.x,
    minZ: roomBox.min.z,
    maxZ: roomBox.max.z,
    groundY: roomBox.min.y,
    ceilingY: roomBox.max.y,
    roomHeight: Math.max(size.y, 2.4),
    roomWidth: Math.max(size.x, 3.0),
    roomDepth: Math.max(size.z, 3.0),
  };
}

/**
 * Checks if a mesh belongs EXCLUSIVELY to the core architectural enclosure:
 * - Room Floor (Lantai)
 * - Room Ceiling/Roof (Plafon/Atap)
 * - Room Perimeter & Structural Partition Walls (Dinding)
 *
 * Everything else inside the room (kitchen counters, island, cabinetry,
 * sinks, appliances, tables, chairs, shelves, tableware, props, curtains, decor)
 * is classified as furniture/fixtures and will be HIDDEN in Bare Room Mode.
 */
export function isStructuralShellMesh(
  mesh: THREE.Mesh,
  bounds: RoomStructuralBounds,
  roofElevationY?: number
): boolean {
  // 1. Gather all tokens from self name, parent names, grandParent names, userData, and materials
  const matNames = Array.isArray(mesh.material)
    ? mesh.material.map((m) => m?.name || '').join(' ')
    : mesh.material?.name || '';

  const allNames = [
    mesh.name || '',
    (mesh.userData as any)?.name || '',
    (mesh.userData as any)?.splitFrom || '',
    (mesh.userData as any)?.originalName || '',
    mesh.parent?.name || '',
    mesh.parent?.parent?.name || '',
    matNames,
  ].join(' ');

  const tokens = new Set(
    allNames
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );

  for (const keyword of FURNITURE_KEYWORDS) {
    const parts = keyword.split('_');
    const matched = parts.length > 1
      ? parts.every((p) => tokens.has(p))
      : tokens.has(keyword) || tokens.has(`${keyword}s`);
    if (matched) {
      return false;
    }
  }

  const name = (mesh.name || '').toLowerCase();
  const hasSplitWallTag = name.includes('__dinding');
  const hasSplitFloorTag = name.includes('__lantai');
  const hasSplitCeilingTag = name.includes('__plafon');

  // If mesh was created by mesh-splitter for walls/floors/ceilings, it's explicitly structural
  if (hasSplitWallTag || hasSplitFloorTag || hasSplitCeilingTag) {
    return true;
  }

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());

  // Tiny props / decor / tableware: ALWAYS HIDE
  if (Math.max(size.x, size.y, size.z) < 0.30) {
    return false;
  }

  const effectiveCeilingY = roofElevationY && roofElevationY > bounds.groundY + 1.8
    ? roofElevationY
    : bounds.ceilingY;

  // 2. Room Floor Slab (Lantai):
  // Sits flat at ground level and covers majority of room footprint
  const isRoomFloor =
    box.min.y <= bounds.groundY + 0.25 &&
    size.y <= 0.45 &&
    size.x >= bounds.roomWidth * 0.55 &&
    size.z >= bounds.roomDepth * 0.55;

  if (isRoomFloor) return true;

  // 3. Room Ceiling / Plafon Slab:
  // Sits flat near top ceiling elevation and covers majority of room footprint
  const isRoomCeiling =
    box.max.y >= effectiveCeilingY - 0.08 &&
    size.y <= 0.60 &&
    size.x >= bounds.roomWidth * 0.55 &&
    size.z >= bounds.roomDepth * 0.55;

  if (isRoomCeiling) return true;

  // 4. Room Wall (Dinding):
  // Must have height >= 1.8m and thickness <= 0.40m
  const isWallCandidate =
    (size.y >= bounds.roomHeight * 0.60 || size.y >= 1.8) &&
    (size.x >= 0.80 || size.z >= 0.80) &&
    Math.min(size.x, size.z) <= 0.40;

  if (!isWallCandidate) return false;

  // Perimeter or structural span verification:
  // A true wall either:
  // 1) Touches the room perimeter AND spans along that perimeter:
  //    - Left/Right wall: touches minX or maxX (within 0.35m) AND spans along Z (length >= min(2.0m, roomDepth * 0.4))
  //    - Front/Back wall: touches minZ or maxZ (within 0.35m) AND spans along X (length >= min(2.0m, roomWidth * 0.4))
  // 2) OR is an interior partition wall spanning across the room (length >= 50% of room width/depth) AND touches floor
  const PERIMETER_TOLERANCE = 0.35;
  const touchesLeft = Math.abs(box.min.x - bounds.minX) <= PERIMETER_TOLERANCE;
  const touchesRight = Math.abs(box.max.x - bounds.maxX) <= PERIMETER_TOLERANCE;
  const touchesBack = Math.abs(box.min.z - bounds.minZ) <= PERIMETER_TOLERANCE;
  const touchesFront = Math.abs(box.max.z - bounds.maxZ) <= PERIMETER_TOLERANCE;

  const minWallLengthZ = Math.min(2.0, bounds.roomDepth * 0.40);
  const minWallLengthX = Math.min(2.0, bounds.roomWidth * 0.40);

  const isLeftRightPerimeterWall = (touchesLeft || touchesRight) && size.z >= minWallLengthZ;
  const isFrontBackPerimeterWall = (touchesBack || touchesFront) && size.x >= minWallLengthX;

  const touchesFloor = box.min.y <= bounds.groundY + 0.20;
  const spansRoom = size.x >= bounds.roomWidth * 0.50 || size.z >= bounds.roomDepth * 0.50;
  const isInteriorPartitionWall = touchesFloor && spansRoom;

  if (isLeftRightPerimeterWall || isFrontBackPerimeterWall || isInteriorPartitionWall) {
    return true;
  }

  // Everything else inside the room (curtains, dividers, island, counter, cabinets, kulkas, sink, etc.) -> HIDE
  return false;
}
