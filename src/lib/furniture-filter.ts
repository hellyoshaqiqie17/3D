import * as THREE from 'three';
import { MaterialZone } from '@/types';

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

const FURNITURE_KEYWORDS = [
  // Kitchen appliances & equipment
  'fridge', 'kulkas', 'refrigerator', 'freezer',
  'stove', 'kompor', 'cooktop', 'burner',
  'oven', 'microwave', 'hood', 'exhaust', 'chimney',
  'sink', 'faucet', 'kran', 'wastafel', 'cuci', 'bak_cuci',
  'dishwasher', 'blender', 'toaster', 'kettle', 'dispenser',

  // Cabinetry, counters & island
  'cabinet', 'kabinet', 'counter', 'island', 'kitchen_island',
  'drawer', 'laci', 'shelf', 'rak', 'cupboard', 'credenza', 'buffet',
  'wardrobe', 'lemari', 'closet',

  // Living & Dining Furniture
  'chair', 'kursi', 'stool', 'barstool', 'sofa', 'couch', 'armchair',
  'bench', 'bangku', 'ottoman', 'beanbag',
  'table', 'meja', 'desk', 'coffee_table', 'dining',
  'bed', 'kasur', 'ranjang', 'mattress', 'headboard', 'nightstand', 'nakas',

  // Bathroom fixtures
  'toilet', 'closet_wc', 'wc', 'urinal', 'bidet',
  'bathtub', 'shower', 'vanity', 'mirror', 'cermin',

  // Lighting & Electrical props
  'lamp', 'lampu', 'chandelier', 'pendant', 'sconce', 'lantern', 'standing_lamp',
  'tv', 'television', 'monitor', 'screen', 'audio', 'speaker',

  // Decor, tableware & indoor clutter
  'decor', 'decoration', 'hiasan', 'pajangan', 'accessories',
  'pot', 'plant', 'tanaman', 'flower', 'bunga', 'vase', 'vas',
  'carpet', 'karpet', 'rug', 'curtain', 'gorden', 'blind', 'drape',
  'pillow', 'bantal', 'cushion', 'blanket', 'selimut',
  'picture', 'frame', 'bingkai', 'lukisan', 'painting',
  'plate', 'piring', 'bowl', 'mangkok', 'glass', 'gelas', 'cup', 'cangkir',
  'pan', 'panci', 'pot_cook', 'wajan', 'knife', 'pisau', 'spoon', 'sendok', 'fork', 'garpu',
  'bottle', 'botol', 'book', 'buku', 'magazine',

  // Cutouts, figures & exterior clutter
  'person', 'human', 'man', 'woman', 'people', 'orang',
  'car', 'mobil', 'bike', 'motor', 'vehicle', 'bicycle', 'sepeda'
];

const ARCH_EXPLICIT_KEYWORDS = [
  'wall', 'dinding', 'tembok', 'facade', 'fasad', 'exterior', 'interior', 'ibuilding',
  'floor', 'lantai', 'ground', 'deck', 'patio', 'slab', 'keramik', 'tile', 'parquet',
  'ceiling', 'plafon', 'roof', 'atap', 'genteng', 'canopy', 'kanopi', 'dak',
  'window', 'jendela', 'glass', 'kaca', 'kusen', 'door', 'pintu'
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

      // Prioritize vertical surfaces spanning room scale, or split architectural meshes
      if (
        (s.y >= 1.8 && (s.x >= 1.8 || s.z >= 1.8)) ||
        name.includes('__dinding') ||
        name.includes('__lantai') ||
        name.includes('__plafon') ||
        name.includes('wall') ||
        name.includes('dinding') ||
        name.includes('floor') ||
        name.includes('lantai')
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
          roomBox.expandByObject(child);
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
 * Checks if a mesh belongs to the core architectural enclosure:
 * Walls (Dinding), Floors (Lantai), or Ceiling/Roof (Plafon/Atap).
 *
 * All loose furniture, appliances (kulkas, kompor, microwave, oven),
 * cabinetry, island, chairs, tableware & decor will be hidden in Bare Room Mode.
 */
export function isStructuralShellMesh(
  mesh: THREE.Mesh,
  bounds: RoomStructuralBounds,
  roofElevationY?: number,
  zones?: MaterialZone[]
): boolean {
  const name = (mesh.name || '').toLowerCase();
  const splitFrom = ((mesh.userData as any)?.splitFrom || '').toLowerCase();
  const originalName = ((mesh.userData as any)?.originalName || '').toLowerCase();
  const fullName = `${name} ${splitFrom} ${originalName}`;

  // 1. Surfaces split by smart mesh-splitter (__Dinding_, __Lantai_, __Plafon_)
  // are ALWAYS authentic architectural surfaces: NEVER hide them!
  if (
    name.includes('__dinding') ||
    name.includes('__lantai') ||
    name.includes('__plafon')
  ) {
    return true;
  }

  // 2. Explicit furniture & appliance keywords: ALWAYS classify as furniture
  for (const keyword of FURNITURE_KEYWORDS) {
    if (fullName.includes(keyword)) {
      return false;
    }
  }

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());

  // Tiny props (switches, knobs, cutlery, small bottles): always hide
  if (size.x * size.y * size.z < 0.004) {
    return false;
  }

  // 3. Explicit architectural keywords (Wall, Floor, Ceiling/Roof, Window, Door)
  for (const archWord of ARCH_EXPLICIT_KEYWORDS) {
    if (fullName.includes(archWord)) {
      // Confirm it's not a tiny prop (e.g. wall switch)
      if (size.x >= 0.20 || size.y >= 0.20 || size.z >= 0.20) {
        return true;
      }
    }
  }

  // 4. Check if registered in an architectural zone
  if (zones && zones.length > 0) {
    const matchingZone = zones.find((z) => z.meshNames && z.meshNames.includes(mesh.name));
    if (matchingZone) {
      const cat = matchingZone.category;
      if (cat === 'wall' || cat === 'floor' || cat === 'roof' || cat === 'exterior') {
        return true;
      }
    }
  }

  const effectiveCeilingY = roofElevationY && roofElevationY > bounds.groundY + 1.8
    ? roofElevationY
    : bounds.ceilingY;

  // 5. Room Floor Slab (Lantai):
  const isRoomFloor =
    box.min.y <= bounds.groundY + 0.25 &&
    box.max.y <= bounds.groundY + 0.45 &&
    size.y <= 0.40 &&
    size.x >= bounds.roomWidth * 0.30 &&
    size.z >= bounds.roomDepth * 0.30;

  if (isRoomFloor) return true;

  // 6. Room Ceiling / Plafon Slab:
  const isRoomCeiling =
    box.max.y >= effectiveCeilingY - 0.40 &&
    size.y <= 0.60 &&
    size.x >= bounds.roomWidth * 0.30 &&
    size.z >= bounds.roomDepth * 0.30;

  if (isRoomCeiling) return true;

  // 7. Tall Wall / Partition Wall:
  // Substantial vertical slab spanning at least 50% room height
  const isTallWall =
    size.y >= bounds.roomHeight * 0.50 &&
    (size.x >= 0.60 || size.z >= 0.60) &&
    Math.min(size.x, size.z) <= 0.40;

  if (isTallWall) return true;

  // 8. Room Perimeter Envelope Walls (Crucial for SketchUp models where walls have
  // window/door openings, sill walls, header walls, jambs, and backsplash tile sections)
  const nearBoundaryZ =
    Math.abs(box.min.z - bounds.minZ) <= 0.40 ||
    Math.abs(box.max.z - bounds.maxZ) <= 0.40;

  const nearBoundaryX =
    Math.abs(box.min.x - bounds.minX) <= 0.40 ||
    Math.abs(box.max.x - bounds.maxX) <= 0.40;

  // Wall on North / South Z boundary (Back or Front Wall)
  if (nearBoundaryZ && size.z <= 0.45 && (size.x >= 0.40 || size.y >= 0.35)) {
    // Exclude base cabinets: depth > 0.28m sitting at ground level with height <= 1.15m
    const isBaseCabinet =
      box.min.y <= bounds.groundY + 0.20 &&
      box.max.y <= bounds.groundY + 1.15 &&
      size.z > 0.28;

    // Exclude hanging wall cabinets: depth > 0.25m hanging in mid-air
    const isHangingCabinet =
      box.min.y >= bounds.groundY + 0.90 &&
      box.max.y <= effectiveCeilingY - 0.20 &&
      size.z > 0.25;

    // Exclude tall freestanding appliance (refrigerator): depth > 0.28m, height >= 1.2m
    const isTallAppliance =
      size.z > 0.28 &&
      size.y >= 1.20 &&
      box.max.y < effectiveCeilingY - 0.30;

    if (!isBaseCabinet && !isHangingCabinet && !isTallAppliance) {
      return true;
    }
  }

  // Wall on East / West X boundary (Left or Right Wall)
  if (nearBoundaryX && size.x <= 0.45 && (size.z >= 0.40 || size.y >= 0.35)) {
    const isBaseCabinet =
      box.min.y <= bounds.groundY + 0.20 &&
      box.max.y <= bounds.groundY + 1.15 &&
      size.x > 0.28;

    const isHangingCabinet =
      box.min.y >= bounds.groundY + 0.90 &&
      box.max.y <= effectiveCeilingY - 0.20 &&
      size.x > 0.25;

    const isTallAppliance =
      size.x > 0.28 &&
      size.y >= 1.20 &&
      box.max.y < effectiveCeilingY - 0.30;

    if (!isBaseCabinet && !isHangingCabinet && !isTallAppliance) {
      return true;
    }
  }

  // 9. Structural column
  const isStructuralColumn =
    size.y >= bounds.roomHeight * 0.70 &&
    box.min.y <= bounds.groundY + 0.30 &&
    box.max.y >= effectiveCeilingY - 0.30 &&
    size.x <= 0.80 &&
    size.z <= 0.80;

  if (isStructuralColumn) return true;

  // By default, any loose object, appliance, cabinet piece, or decor is furniture -> hide
  return false;
}
