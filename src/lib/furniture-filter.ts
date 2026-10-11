import * as THREE from 'three';

export interface RoomStructuralBounds {
  groundY: number;
  ceilingY: number;
  roomHeight: number;
  roomWidth: number;
  roomDepth: number;
}

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
  'wall', 'dinding', 'facade', 'fasad', 'exterior', 'interior', 'ibuilding',
  'floor', 'lantai', 'ground', 'deck', 'patio', 'slab',
  'ceiling', 'plafon', 'roof', 'atap', 'genteng', 'canopy', 'kanopi', 'dak'
];

/**
 * Calculates room structural boundaries from the largest vertical architectural envelopes
 */
export function calculateRoomBounds(scene: THREE.Object3D): RoomStructuralBounds {
  const roomBox = new THREE.Box3();
  let hasFoundWall = false;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const b = new THREE.Box3().setFromObject(child);
      const s = b.getSize(new THREE.Vector3());
      const name = (child.name || '').toLowerCase();

      // Prioritize large vertical surfaces spanning room height
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
    roomBox.setFromObject(scene);
  }

  const size = roomBox.getSize(new THREE.Vector3());
  return {
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
 * Everything else (cabinets, island, refrigerator, furniture, appliances, tableware, decor)
 * is classified as furniture/fixtures and will be hidden in Bare Room Mode.
 */
export function isStructuralShellMesh(
  mesh: THREE.Mesh,
  bounds: RoomStructuralBounds,
  roofElevationY?: number
): boolean {
  const name = (mesh.name || '').toLowerCase();
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());

  // 1. Explicit furniture & appliance keywords: ALWAYS classify as furniture
  for (const keyword of FURNITURE_KEYWORDS) {
    if (name.includes(keyword)) {
      return false;
    }
  }

  // Check split pieces: If split from a counter, island, or lower cabinet (height < 1.3m)
  const splitFrom = (mesh.userData as any)?.splitFrom?.toLowerCase?.() || '';
  for (const keyword of FURNITURE_KEYWORDS) {
    if (splitFrom.includes(keyword)) {
      return false;
    }
  }

  const effectiveCeilingY = roofElevationY && roofElevationY > bounds.groundY + 1.8
    ? roofElevationY
    : bounds.ceilingY;

  // 2. Room Wall (Dinding):
  // Must span nearly full room height (from near ground to near ceiling)
  const isRoomWall =
    size.y >= bounds.roomHeight * 0.65 &&
    box.min.y <= bounds.groundY + 0.40 &&
    box.max.y >= effectiveCeilingY - 0.40 &&
    (size.x >= 0.8 || size.z >= 0.8);

  if (isRoomWall) return true;

  // 3. Room Floor Slab (Lantai):
  // Must sit flat at ground level and cover significant floor footprint
  const isRoomFloor =
    box.min.y <= bounds.groundY + 0.20 &&
    box.max.y <= bounds.groundY + 0.40 &&
    size.y <= 0.35 &&
    size.x >= bounds.roomWidth * 0.40 &&
    size.z >= bounds.roomDepth * 0.40;

  if (isRoomFloor) return true;

  // 4. Room Ceiling / Plafon Slab:
  // Must sit flat near the ceiling elevation and cover significant footprint
  const isRoomCeiling =
    box.max.y >= effectiveCeilingY - 0.30 &&
    box.min.y >= effectiveCeilingY - 0.50 &&
    size.y <= 0.35 &&
    size.x >= bounds.roomWidth * 0.40 &&
    size.z >= bounds.roomDepth * 0.40;

  if (isRoomCeiling) return true;

  // 5. Explicit architectural keywords matching room-scale geometry
  for (const archWord of ARCH_EXPLICIT_KEYWORDS) {
    if (name.includes(archWord)) {
      // Confirm it's not a tiny prop (e.g. wall clock or wall switch)
      if (
        (size.y >= bounds.roomHeight * 0.5 && (size.x >= 1.0 || size.z >= 1.0)) || // Wall
        (size.y <= 0.5 && size.x >= 1.5 && size.z >= 1.5) // Floor or ceiling slab
      ) {
        return true;
      }
    }
  }

  // By default, any loose object, appliance, cabinet piece, or decor is furniture
  return false;
}
