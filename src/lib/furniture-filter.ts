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

// Keywords that are DEFINITELY furniture, appliances, loose fixtures, curtains, or decor
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
  'lamp', 'lampu', 'chandelier', 'pendant', 'sconce', 'lantern', 'standing_lamp', 'light', 'spotlight', 'pointlight', 'enscape', 'linear', 'spot', 'point', 'pole', 'rod', 'rail',
  'tv', 'television', 'monitor', 'screen', 'audio', 'speaker',
  'decor', 'decoration', 'hiasan', 'pajangan', 'accessories', 'sculpture', 'statue', 'art', 'print', 'frame', 'framed', 'potato', 'fragrance', 'candle', 'basket', 'cestas', 'bolas',
  'pot', 'plant', 'tanaman', 'flower', 'bunga', 'vase', 'vas', 'cactus', 'potted',
  'carpet', 'karpet', 'rug',
  // Curtains, drapery, window treatments, blinds, shades, fabric panels
  'curtain', 'gorden', 'blind', 'drape', 'drapery', 'valance', 'pleat', 'pleats', 'shutter', 'louver', 'slat', 'vitrase', 'vitrage', 'hordeng', 'korden', 'curtains', 'gordyn', 'kordeng', 'shade', 'shades', 'roller',
  // Specific curtain / drapery component IDs from SketchUp models
  'group36', '346', '1227364', '1058147', '1023226', '1040408', '968424', '988213', '1058173', '1041326', '991426',
  'pillow', 'bantal', 'cushion', 'blanket', 'selimut',
  'picture', 'bingkai', 'lukisan', 'painting',
  'plate', 'piring', 'bowl', 'mangkok', 'glass', 'gelas', 'cup', 'cangkir',
  'pan', 'panci', 'pot_cook', 'wajan', 'knife', 'pisau', 'spoon', 'sendok', 'fork', 'garpu',
  'bottle', 'botol', 'book', 'buku', 'magazine',
  'laptop', 'computer', 'pencil', 'pen', 'stationery', 'phone', 'telephone',
  'person', 'human', 'man', 'woman', 'people', 'orang', 'laura', 'standing',
  'dog', 'cat', 'pet', 'animal',
  'car', 'mobil', 'bike', 'motor', 'vehicle', 'bicycle', 'sepeda',
  // Generic 3D Warehouse furniture tokens & labels
  'furniture', 'perabot', 'furnitur', 'mebel', 'meubel', 'indones', 'cestas', 'bolas', 'deco', 'decor'
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
 * Everything else inside the room (sofa, meja, kursi, TV, karpet, cabinets,
 * island, kulkas, sink, appliances, shelves, tableware, props) is classified
 * as furniture/fixtures and will be HIDDEN in Bare Room Mode.
 */
export function isStructuralShellMesh(
  mesh: THREE.Mesh,
  bounds: RoomStructuralBounds,
  roofElevationY?: number
): boolean {
  // 1. Explicit structural split tag from mesh-splitter: ALWAYS KEEP
  const name = (mesh.name || '').toLowerCase();
  const splitFrom = ((mesh.userData as any)?.splitFrom || '').toLowerCase();
  const originalName = ((mesh.userData as any)?.originalName || '').toLowerCase();

  const isExplicitSplit =
    name.includes('__dinding') ||
    name.includes('__bibir_dinding') ||
    name.includes('__lantai') ||
    name.includes('__plafon') ||
    name.includes('__atap') ||
    splitFrom.includes('__dinding') ||
    splitFrom.includes('__bibir_dinding') ||
    splitFrom.includes('__lantai') ||
    splitFrom.includes('__plafon') ||
    splitFrom.includes('__atap');

  if (isExplicitSplit) {
    return true;
  }

  // 2. Collect all hierarchy names (self + all ancestors up to scene root)
  const namesList: string[] = [
    name,
    splitFrom,
    originalName,
    ((mesh.userData as any)?.name || '').toLowerCase(),
  ];

  let curr: THREE.Object3D | null = mesh.parent;
  while (curr) {
    if (curr.name) namesList.push(curr.name.toLowerCase());
    curr = curr.parent;
  }

  const allNames = namesList.join(' ');
  const tokens = new Set(
    allNames
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );

  // 3. Furniture keywords check: if ANY furniture keyword matches anywhere in hierarchy -> ALWAYS HIDE
  for (const keyword of FURNITURE_KEYWORDS) {
    const parts = keyword.split('_');
    const matched = parts.length > 1
      ? parts.every((p) => tokens.has(p))
      : tokens.has(keyword) || tokens.has(`${keyword}s`);
    if (matched) {
      return false;
    }
  }

  // 4. Check for explicit architectural enclosure keywords in mesh name (NOT furniture)
  const isExplicitStructural =
    name.includes('wall') || name.includes('dinding') ||
    name.includes('floor') || name.includes('lantai') ||
    name.includes('ceiling') || name.includes('plafon') ||
    name.includes('roof') || name.includes('atap') ||
    name.includes('dak') || name.includes('facade') ||
    name.includes('root_model') || name.includes('ibuilding') ||
    name.includes('house') || name.includes('building');

  if (isExplicitStructural) {
    return true;
  }

  // 5. In SketchUp, 3D Warehouse furniture models are grouped as generic Components / Groups:
  // e.g. "Component_1409711" (sofa), "Component_1442317" (meja), "Component_1410723" (kabinet),
  // "Group#586", "建立群組", "INDONES", etc.
  // In Bare Room Mode, ALL such loose interior components are FURNITURE -> ALWAYS HIDE!
  const isSubComponentOfGenericObject = namesList.some((n) =>
    n.startsWith('component_') ||
    n.startsWith('component#') ||
    n.startsWith('group#') ||
    n.startsWith('groupe#') ||
    n.startsWith('group') ||
    n.includes('群組') ||
    n.includes('indones')
  );

  if (isSubComponentOfGenericObject) {
    return false;
  }

  // 6. Size check fallback: only large room-scale slabs spanning majority of room footprint are structural
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());

  // Tiny props / decor / tableware: ALWAYS HIDE
  if (Math.max(size.x, size.y, size.z) < 0.30) {
    return false;
  }

  // Room Floor Slab (Lantai): Sits flat at ground level covering majority of room footprint
  const isRoomFloor =
    box.min.y <= bounds.groundY + 0.25 &&
    size.y <= 0.45 &&
    size.x >= bounds.roomWidth * 0.55 &&
    size.z >= bounds.roomDepth * 0.55;

  if (isRoomFloor) return true;

  // Room Ceiling / Plafon Slab: Sits flat near ceiling elevation covering majority of room footprint
  const isRoomCeiling =
    box.max.y >= bounds.ceilingY - 0.35 &&
    size.y <= 0.60 &&
    size.x >= bounds.roomWidth * 0.55 &&
    size.z >= bounds.roomDepth * 0.55;

  if (isRoomCeiling) return true;

  // By default in Bare Room Mode: everything else inside the room is furniture/decor -> HIDE
  return false;
}
