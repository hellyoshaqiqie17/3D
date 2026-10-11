import * as THREE from 'three';

/**
 * Smart Surface Splitting
 * -----------------------
 * SketchUp → glTF converters merge every face that shares the same material into a single
 * primitive. When a designer paints the left AND right wall with the same paint, both walls
 * end up in ONE mesh, so clicking one wall recolors the other too.
 *
 * This utility splits such meshes into separate meshes per physical surface using
 * connected-component analysis on welded vertices (walls that don't touch become separate
 * pieces). If everything is connected, it falls back to grouping by face orientation
 * (+X / -X / +Y / -Y / +Z / -Z) and then re-runs the connectivity pass.
 *
 * Only room-scale meshes are split (furniture & decor are left untouched).
 */

const WELD_PRECISION = 1000; // 1 mm
const MIN_ROOM_SCALE = 2.0; // mesh must span >= 2 m on at least two axes to be considered architectural
const MIN_PIECE_SIZE = 0.8; // a piece must span >= 0.8 m to become its own selectable surface
const MAX_PIECES = 24;
const MAX_TRIANGLES = 300_000;

interface Piece {
  triangles: number[];
  box: THREE.Box3;
  orientKey: string;
  normal: THREE.Vector3;
}

function getTriangleVertexIndex(geo: THREE.BufferGeometry, tri: number, corner: number): number {
  return geo.index ? geo.index.getX(tri * 3 + corner) : tri * 3 + corner;
}

function connectedComponents(geo: THREE.BufferGeometry, triangles: number[]): number[][] {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const keyToId = new Map<string, number>();
  const parent: number[] = [];

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const weldId = (vi: number): number => {
    const key = `${Math.round(pos.getX(vi) * WELD_PRECISION)}|${Math.round(pos.getY(vi) * WELD_PRECISION)}|${Math.round(
      pos.getZ(vi) * WELD_PRECISION
    )}`;
    let id = keyToId.get(key);
    if (id === undefined) {
      id = parent.length;
      parent.push(id);
      keyToId.set(key, id);
    }
    return id;
  };

  const triRoot: number[] = new Array(triangles.length);
  triangles.forEach((tri, i) => {
    const a = weldId(getTriangleVertexIndex(geo, tri, 0));
    const b = weldId(getTriangleVertexIndex(geo, tri, 1));
    const c = weldId(getTriangleVertexIndex(geo, tri, 2));
    union(a, b);
    union(b, c);
    triRoot[i] = a;
  });

  const groups = new Map<number, number[]>();
  triangles.forEach((tri, i) => {
    const root = find(triRoot[i]);
    let list = groups.get(root);
    if (!list) {
      list = [];
      groups.set(root, list);
    }
    list.push(tri);
  });
  return Array.from(groups.values());
}

function orientationGroups(geo: THREE.BufferGeometry, triangles: number[]): number[][] {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  const groups = new Map<string, number[]>();

  triangles.forEach((tri) => {
    a.fromBufferAttribute(pos, getTriangleVertexIndex(geo, tri, 0));
    b.fromBufferAttribute(pos, getTriangleVertexIndex(geo, tri, 1));
    c.fromBufferAttribute(pos, getTriangleVertexIndex(geo, tri, 2));
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);
    let key: string;
    if (ax >= ay && ax >= az) key = n.x >= 0 ? '+x' : '-x';
    else if (ay >= ax && ay >= az) key = n.y >= 0 ? '+y' : '-y';
    else key = n.z >= 0 ? '+z' : '-z';
    let list = groups.get(key);
    if (!list) {
      list = [];
      groups.set(key, list);
    }
    list.push(tri);
  });

  // Re-run connectivity inside each orientation group so opposite walls facing the same way stay apart
  const result: number[][] = [];
  groups.forEach((tris, key) => {
    const comps = connectedComponents(geo, tris);
    comps.forEach((comp) => ((comp as any)._orientKey = key));
    result.push(...comps);
  });
  return result;
}

function boxOfTriangles(geo: THREE.BufferGeometry, triangles: number[], matrix: THREE.Matrix4): THREE.Box3 {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  triangles.forEach((tri) => {
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, getTriangleVertexIndex(geo, tri, k)).applyMatrix4(matrix);
      box.expandByPoint(v);
    }
  });
  return box;
}

function computeDominantNormal(geo: THREE.BufferGeometry, triangles: number[]): THREE.Vector3 {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const avg = new THREE.Vector3();
  triangles.forEach((t) => {
    a.fromBufferAttribute(pos, getTriangleVertexIndex(geo, t, 0));
    b.fromBufferAttribute(pos, getTriangleVertexIndex(geo, t, 1));
    c.fromBufferAttribute(pos, getTriangleVertexIndex(geo, t, 2));
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
    avg.add(n);
  });
  return avg.normalize();
}

function isSurfacePiece(box: THREE.Box3): boolean {
  const s = box.getSize(new THREE.Vector3());
  const dims = [s.x, s.y, s.z].sort((a, b) => a - b);
  // Real surfaces span a meaningful area; smaller strips get attached or filtered
  return dims[2] >= 0.5 && dims[1] >= 0.25;
}

/** Group raw triangle lists into surface pieces, attaching small trims strictly to plane-compatible pieces */
function buildPieces(geo: THREE.BufferGeometry, groups: number[][], matrix: THREE.Matrix4): Piece[] {
  const all: Piece[] = groups.map((triangles) => ({
    triangles,
    box: boxOfTriangles(geo, triangles, matrix),
    orientKey: (triangles as any)._orientKey || '+y',
    normal: computeDominantNormal(geo, triangles),
  }));

  const large = all.filter((p) => isSurfacePiece(p.box));
  const small = all.filter((p) => !isSurfacePiece(p.box));
  if (large.length < 2) return [];

  const center = new THREE.Vector3();
  const lc = new THREE.Vector3();
  small.forEach((s) => {
    s.box.getCenter(center);
    // Strictly attach ONLY to a large piece sharing the SAME orientation AND same plane elevation!
    // Never attach a ceiling piece to a floor piece or an interior wall to an exterior wall!
    const candidates = large.filter((l) => {
      if (l.orientKey !== s.orientKey) return false;
      l.box.getCenter(lc);
      if (s.orientKey === '+y' || s.orientKey === '-y') {
        return Math.abs(center.y - lc.y) < 0.6; // must be on same horizontal level (floor or ceiling)
      } else if (s.orientKey === '+x' || s.orientKey === '-x') {
        return Math.abs(center.x - lc.x) < 0.6; // must be on same wall plane
      } else {
        return Math.abs(center.z - lc.z) < 0.6; // must be on same wall plane
      }
    });

    if (candidates.length === 0) return;

    let best = candidates[0];
    let bestDist = Infinity;
    candidates.forEach((l) => {
      const d = l.box.distanceToPoint(center);
      if (d < bestDist) {
        bestDist = d;
        best = l;
      }
    });
    best.triangles.push(...s.triangles);
    best.box.union(s.box);
  });
  return large;
}

function extractGeometry(geo: THREE.BufferGeometry, triangles: number[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  const vertexCount = triangles.length * 3;

  Object.keys(geo.attributes).forEach((name) => {
    const src = geo.getAttribute(name) as THREE.BufferAttribute;
    if (!src) return;
    const itemSize = src.itemSize;
    const ArrayType = (src.array as any).constructor as { new (n: number): ArrayLike<number> & { [i: number]: number } };
    const arr = new ArrayType(vertexCount * itemSize);
    let w = 0;
    triangles.forEach((tri) => {
      for (let k = 0; k < 3; k++) {
        const vi = getTriangleVertexIndex(geo, tri, k);
        for (let c = 0; c < itemSize; c++) {
          arr[w++] = src.getComponent(vi, c);
        }
      }
    });
    out.setAttribute(name, new THREE.BufferAttribute(arr as any, itemSize, src.normalized));
  });

  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

function labelForPiece(box: THREE.Box3, parentBox: THREE.Box3, normal: THREE.Vector3): string {
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  const pc = parentBox.getCenter(new THREE.Vector3());
  const midY = pc.y;

  // 1. Horizontal surfaces: Floor vs Ceiling
  const isHorizontal = Math.abs(normal.y) >= 0.7 || (size.y <= 0.35 && (size.x >= 1.0 || size.z >= 1.0));
  if (isHorizontal) {
    return c.y < midY ? 'Lantai_Bawah' : 'Plafon_Atas';
  }

  // 2. Vertical walls: Distinguish Left/Right/Front/Back AND Interior vs Exterior
  // Vector pointing from wall piece center toward room center:
  const toRoomX = pc.x - c.x;
  const toRoomZ = pc.z - c.z;
  const isInterior = (normal.x * toRoomX + normal.z * toRoomZ) > 0;
  const suffix = isInterior ? '_Dalam' : '_Luar';

  if (size.x <= size.z || Math.abs(normal.x) >= Math.abs(normal.z)) {
    const side = c.x <= pc.x ? 'Dinding_Kiri' : 'Dinding_Kanan';
    return `${side}${suffix}`;
  } else {
    const side = c.z <= pc.z ? 'Dinding_Belakang' : 'Dinding_Depan';
    return `${side}${suffix}`;
  }
}

/**
 * Split merged room-scale meshes in-place. Returns the number of meshes that were split.
 * Must be called BEFORE materials are cloned/backed up so each new piece gets its own material instance.
 */
export function splitMergedSurfaces(root: THREE.Object3D): number {
  root.updateMatrixWorld(true);

  const candidates: THREE.Mesh[] = [];
  root.traverse((child) => {
    if (
      (child as any).isMesh &&
      !(child as any).isInstancedMesh &&
      !(child as any).isSkinnedMesh &&
      (child as THREE.Mesh).geometry?.getAttribute('position') &&
      !Array.isArray((child as THREE.Mesh).material) &&
      (!(child as THREE.Mesh).geometry.groups || (child as THREE.Mesh).geometry.groups.length <= 1)
    ) {
      candidates.push(child as THREE.Mesh);
    }
  });

  const usedNames = new Set<string>();
  root.traverse((o) => o.name && usedNames.add(o.name));

  let splitCount = 0;

  candidates.forEach((mesh) => {
    const geo = mesh.geometry as THREE.BufferGeometry;
    const pos = geo.getAttribute('position');
    const triCount = geo.index ? geo.index.count / 3 : pos.count / 3;
    if (triCount < 4 || triCount > MAX_TRIANGLES) return;

    const parentBox = new THREE.Box3().setFromObject(mesh);
    const ps = parentBox.getSize(new THREE.Vector3());
    // Only true room-scale architectural enclosures should be split into walls & ceilings:
    // 1) Vertical room walls: height >= 1.8m and length >= 2.0m
    // 2) Horizontal room slabs: thin slab <= 0.6m covering >= 2.0m on both X and Z
    const isRoomWallMesh = ps.y >= 1.8 && (ps.x >= MIN_ROOM_SCALE || ps.z >= MIN_ROOM_SCALE);
    const isRoomSlabMesh = ps.y <= 0.6 && ps.x >= MIN_ROOM_SCALE && ps.z >= MIN_ROOM_SCALE;
    if (!isRoomWallMesh && !isRoomSlabMesh) return; // furniture / counters / cabinets / island → leave untouched!

    // Ignore degenerate (zero-area) sliver triangles
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
    const allTris = Array.from({ length: triCount }, (_, i) => i).filter((t) => {
      va.fromBufferAttribute(pos as THREE.BufferAttribute, getTriangleVertexIndex(geo, t, 0));
      vb.fromBufferAttribute(pos as THREE.BufferAttribute, getTriangleVertexIndex(geo, t, 1));
      vc.fromBufferAttribute(pos as THREE.BufferAttribute, getTriangleVertexIndex(geo, t, 2));
      return vb.sub(va).cross(vc.sub(va)).lengthSq() > 1e-12;
    });
    if (allTris.length < 4) return;

    // 1) Planar grouping: faces pointing the same direction AND physically connected form one surface.
    let pieces = buildPieces(geo, orientationGroups(geo, allTris), mesh.matrixWorld);
    // 2) Fallback: pure connectivity (e.g. curved surfaces)
    if (pieces.length < 2 || pieces.length > MAX_PIECES) {
      pieces = buildPieces(geo, connectedComponents(geo, allTris), mesh.matrixWorld);
    }
    if (pieces.length < 2 || pieces.length > MAX_PIECES) return;

    const parent = mesh.parent;
    if (!parent) return;

    const baseName = mesh.name || 'Mesh';
    pieces.forEach((piece) => {
      const newGeo = extractGeometry(geo, piece.triangles);
      // Clone material so each piece gets its own material instance immediately
      const partMat = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : (mesh.material ? mesh.material.clone() : new THREE.MeshStandardMaterial());
      const part = new THREE.Mesh(newGeo, partMat);

      const label = labelForPiece(piece.box, parentBox, piece.normal);
      let name = `${baseName}__${label}`;
      let n = 2;
      while (usedNames.has(name)) name = `${baseName}__${label}_${n++}`;
      usedNames.add(name);

      part.name = name;
      part.position.copy(mesh.position);
      part.quaternion.copy(mesh.quaternion);
      part.scale.copy(mesh.scale);
      part.castShadow = mesh.castShadow;
      part.receiveShadow = mesh.receiveShadow;
      part.renderOrder = mesh.renderOrder;
      part.userData = { ...mesh.userData, splitFrom: baseName };
      parent.add(part);
    });

    parent.remove(mesh);
    splitCount++;
  });

  if (splitCount > 0) root.updateMatrixWorld(true);
  return splitCount;
}
