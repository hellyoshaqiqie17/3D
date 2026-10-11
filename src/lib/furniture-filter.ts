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

const ENV_KEYWORDS = [
  'tree', 'palm', 'bush', 'plant', 'hydrant', 'ball', 'motorbike',
  'kangaroo', 'pampas', 'evergreen', 'foliage', 'car', 'vehicle'
];

// Keywords that are DEFINITELY furniture, appliances, or loose fixtures
const FURNITURE_KEYWORDS = [
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
  'lamp', 'lampu', 'chandelier', 'pendant', 'sconce', 'lantern', 'standing_lamp',
  'tv', 'television', 'monitor', 'screen', 'audio', 'speaker',
  'decor', 'decoration', 'hiasan', 'pajangan', 'accessories',
  'pot', 'plant', 'tanaman', 'flower', 'bunga', 'vase', 'vas',
  'carpet', 'karpet', 'rug', 'curtain', 'gorden', 'blind', 'drape',
  'pillow', 'bantal', 'cushion', 'blanket', 'selimut',
  'picture', 'frame', 'bingkai', 'lukisan', 'painting',
  'plate', 'piring', 'bowl', 'mangkok', 'glass', 'gelas', 'cup', 'cangkir',
  'pan', 'panci', 'pot_cook', 'wajan', 'knife', 'pisau', 'spoon', 'sendok', 'fork', 'garpu',
  'bottle', 'botol', 'book', 'buku', 'magazine',
  'person', 'human', 'man', 'woman', 'people', 'orang',
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
 * - Room Perimeter & Partition Walls (Dinding)
 *
 * Everything else inside the room (kitchen counters, island, cabinetry,
 * sinks, appliances, tables, chairs, shelves, tableware, props) is classified
 * as furniture/fixtures and will be HIDDEN in Bare Room Mode.
 */
export function isStructuralShellMesh(
  mesh: THREE.Mesh,
  bounds: RoomStructuralBounds,
  roofElevationY?: number
): boolean {
  const name = (mesh.name || '').toLowerCase();
  const splitFrom = ((mesh.userData as any)?.splitFrom || '').toLowerCase();
  const originalName = ((mesh.userData as any)?.originalName || '').toLowerCase();
  const fullName = `${name} ${splitFrom} ${originalName}`;

  // 1. Explicit furniture / appliance / kitchen fixture keyword: ALWAYS HIDE
  for (const keyword of FURNITURE_KEYWORDS) {
    if (fullName.includes(keyword)) {
      return false;
    }
  }

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());

  // Tiny props / decor / tableware: ALWAYS HIDE
  if (size.x * size.y * size.z < 0.005) {
    return false;
  }

  const effectiveCeilingY = roofElevationY && roofElevationY > bounds.groundY + 1.8
    ? roofElevationY
    : bounds.ceilingY;

  // 2. Room Floor Slab (Lantai):
  // Sits flat at ground level and covers significant room footprint
  const isRoomFloor =
    box.min.y <= bounds.groundY + 0.25 &&
    box.max.y <= bounds.groundY + 0.40 &&
    size.y <= 0.35 &&
    size.x >= bounds.roomWidth * 0.45 &&
    size.z >= bounds.roomDepth * 0.45;

  if (isRoomFloor) return true;

  // 3. Room Ceiling / Plafon Slab:
  // Sits flat near the top ceiling elevation and covers significant room footprint
  const isRoomCeiling =
    box.max.y >= effectiveCeilingY - 0.35 &&
    box.min.y >= effectiveCeilingY - 0.60 &&
    size.y <= 0.50 &&
    size.x >= bounds.roomWidth * 0.45 &&
    size.z >= bounds.roomDepth * 0.45;

  if (isRoomCeiling) return true;

  // 4. Interior Partition Wall (Full-height room divider):
  // Spans nearly full room height, touches ground and ceiling, and is thin
  const isFullHeightWall =
    size.y >= bounds.roomHeight * 0.65 &&
    box.min.y <= bounds.groundY + 0.35 &&
    box.max.y >= effectiveCeilingY - 0.35 &&
    (size.x >= 0.80 || size.z >= 0.80) &&
    Math.min(size.x, size.z) <= 0.25;

  if (isFullHeightWall) return true;

  // 5. Perimeter Envelope Walls (Dinding Keliling Ruangan):
  // Crucial: A real wall surface along the perimeter has thickness <= 0.20m (20 cm).
  // In contrast, kitchen counters have depth 0.60m-0.70m, upper cabinets 0.35m,
  // refrigerators 0.75m-0.85m, and islands sit in the middle of the room.
  const nearBoundaryZ =
    Math.abs(box.min.z - bounds.minZ) <= 0.25 ||
    Math.abs(box.max.z - bounds.maxZ) <= 0.25;

  const nearBoundaryX =
    Math.abs(box.min.x - bounds.minX) <= 0.25 ||
    Math.abs(box.max.x - bounds.maxX) <= 0.25;

  // Perimeter wall along North/South (Back or Front Wall):
  // - Flat in Z (thickness <= 0.20m)
  // - Spans in X (width >= 0.40m) and height (size.y >= 0.30m)
  if (nearBoundaryZ && size.z <= 0.20 && size.x >= 0.40 && size.y >= 0.30) {
    return true;
  }

  // Perimeter wall along East/West (Left or Right Wall):
  // - Flat in X (thickness <= 0.20m)
  // - Spans in Z (length >= 0.40m) and height (size.y >= 0.30m)
  if (nearBoundaryX && size.x <= 0.20 && size.z >= 0.40 && size.y >= 0.30) {
    return true;
  }

  // Everything else inside the room (island, counter, cabinets, kulkas, sink, etc.) -> HIDE
  return false;
}
