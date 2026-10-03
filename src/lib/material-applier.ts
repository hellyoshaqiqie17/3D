import * as THREE from 'three';
import { MaterialOption, MaterialZone, ZoneTextureSettings } from '@/types';
import { getProceduralTexture } from './texture-generator';

// Map of mesh uuid -> original material backup (so we can restore if needed)
export const originalMaterialMap = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

// Cache for loaded image textures to prevent re-fetching on state updates
const loadedTextureCache = new Map<string, THREE.Texture>();
// Cache of world-UV clones of procedural textures (procedural cache is shared with ProceduralFloor)
const proceduralWorldCache = new Map<string, THREE.Texture>();

/**
 * UV channel used for applied textures. We write real-world projected UVs into
 * `uv3` so the model's native `uv` stays untouched (original CAD look stays restorable).
 */
const WORLD_UV_CHANNEL = 3;
const WORLD_UV_ATTR = 'uv3';

/**
 * Real-world size (meters) of one texture image at repeat = 1.
 * repeat 4 => one image covers 50 cm, repeat 8 => 25 cm, etc.
 */
const BASE_TILE_METERS = 2;

/** Converts a repeat value from the UI into the texture.repeat used on meter-based UVs. */
function worldRepeat(repeat: [number, number]): [number, number] {
  return [repeat[0] / BASE_TILE_METERS, repeat[1] / BASE_TILE_METERS];
}

function getLoadedTexture(url: string, repeat: [number, number], rotation = 0): THREE.Texture {
  const cacheKey = `${url}_${repeat[0]}x${repeat[1]}_rot${rotation}`;
  if (loadedTextureCache.has(cacheKey)) {
    return loadedTextureCache.get(cacheKey)!;
  }

  const loader = new THREE.TextureLoader();
  const texture = loader.load(url);
  const [rx, ry] = worldRepeat(repeat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(rx, ry);
  texture.rotation = rotation;
  texture.channel = WORLD_UV_CHANNEL;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;

  loadedTextureCache.set(cacheKey, texture);
  return texture;
}

function getWorldProceduralTexture(
  type: Parameters<typeof getProceduralTexture>[0],
  repeat: [number, number],
  rotation = 0
): THREE.Texture {
  const cacheKey = `${type}_${repeat[0]}x${repeat[1]}_rot${rotation}`;
  if (proceduralWorldCache.has(cacheKey)) {
    return proceduralWorldCache.get(cacheKey)!;
  }
  // Clone shares the underlying image source, but lets us use our own channel/repeat
  const tex = getProceduralTexture(type, repeat).clone();
  const [rx, ry] = worldRepeat(repeat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.rotation = rotation;
  tex.channel = WORLD_UV_CHANNEL;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  proceduralWorldCache.set(cacheKey, tex);
  return tex;
}

/**
 * Generates real-world (meter based) box-projected UVs for a mesh into the `uv3` attribute.
 *
 * Why: SketchUp exports UVs of untextured faces in raw inches (values like ±140), so a
 * tiled texture repeats thousands of times and collapses into a flat black/white/grey colour.
 * Projecting by world position + face normal gives every surface (walls, floors, roads)
 * consistent, correctly-scaled tiles regardless of how the CAD file stored its UVs.
 */
function ensureWorldUVs(mesh: THREE.Mesh): void {
  if (mesh.userData.__worldUVReady) return;

  const srcGeom = mesh.geometry as THREE.BufferGeometry | undefined;
  const position = srcGeom?.attributes?.position;
  if (!srcGeom || !position) return;

  // Geometry can be shared between component instances; give this mesh its own copy
  // because the projection depends on the mesh's world transform.
  const geom = srcGeom.clone();
  if (!geom.attributes.normal) {
    geom.computeVertexNormals();
  }
  const normal = geom.attributes.normal;

  mesh.updateWorldMatrix(true, false);
  const matrixWorld = mesh.matrixWorld;
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrixWorld);

  const count = position.count;
  const uvs = new Float32Array(count * 2);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    p.fromBufferAttribute(position, i).applyMatrix4(matrixWorld);
    n.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix);

    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);

    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) {
      // Floors / ceilings / roads: project from top
      u = p.x;
      v = n.y >= 0 ? -p.z : p.z;
    } else if (ax >= az) {
      // Walls facing ±X
      u = n.x >= 0 ? -p.z : p.z;
      v = p.y;
    } else {
      // Walls facing ±Z
      u = n.z >= 0 ? p.x : -p.x;
      v = p.y;
    }
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  geom.setAttribute(WORLD_UV_ATTR, new THREE.BufferAttribute(uvs, 2));
  mesh.geometry = geom;
  mesh.userData.__worldUVReady = true;
}

/**
 * Collects all meshes targeted by a zone. A zone entry may reference a mesh directly
 * or a parent group/component node, in which case all its descendant meshes are included.
 */
function collectZoneMeshes(scene: THREE.Object3D, meshNames: string[]): THREE.Mesh[] {
  const targetNames = new Set(meshNames);
  const result = new Set<THREE.Mesh>();

  scene.traverse((node) => {
    if (!node.name || !targetNames.has(node.name)) return;
    if (node instanceof THREE.Mesh) {
      result.add(node);
    } else {
      node.traverse((child) => {
        if (child instanceof THREE.Mesh) result.add(child);
      });
    }
  });

  return Array.from(result);
}

/**
 * Backs up initial materials of all meshes in the scene before any modifications.
 */
export function backupOriginalMaterials(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && !originalMaterialMap.has(child) && child.material) {
      originalMaterialMap.set(
        child,
        Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone()
      );
    }
  });
}

/**
 * Restores all meshes in the scene to their original imported CAD materials.
 */
export function restoreOriginalMaterials(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && originalMaterialMap.has(child)) {
      const orig = originalMaterialMap.get(child);
      if (orig) {
        child.material = Array.isArray(orig)
          ? orig.map((m) => m.clone())
          : orig.clone();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => (m.needsUpdate = true));
        } else {
          child.material.needsUpdate = true;
        }
      }
    }
  });
}

/**
 * Applies a material option (or custom hex color/imported image texture) to all meshes belonging to a specific zone.
 * Conforms strictly to:
 * - Preserving geometry, transforms, UVs
 * - 3D tactile relief bump mapping so imported 2D textures look like real 3D tiles or relief walls
 * - Dynamic color tinting of imported textures
 * - Safe material cloning and resource disposal
 */
export function applyMaterialToZone(
  scene: THREE.Object3D,
  zone: MaterialZone,
  material: MaterialOption,
  customColor?: string,
  settings?: ZoneTextureSettings
): void {
  const isTextured = material.type === 'texture' && Boolean(material.textureUrl || material.textureType);

  collectZoneMeshes(scene, zone.meshNames).forEach((child) => {
    // Backup original material on first encounter
    if (!originalMaterialMap.has(child)) {
      originalMaterialMap.set(child, child.material);
    }

    // Textures need sane real-world UVs (SketchUp stores untextured faces' UVs in inches)
    if (isTextured) {
      ensureWorldUVs(child);
    }

    // Determine target color:
    // For imported/custom textures, color acts as tint multiplier (defaults to white if no tint)
    const effectiveColorHex = settings?.colorTint || customColor || material.color || '#FFFFFF';

    // Create a dedicated MeshStandardMaterial
    let newMat: THREE.MeshStandardMaterial;

    if (material.type === 'texture' && material.textureUrl) {
      // Custom uploaded texture URL (e.g. client imported PNG/JPG)
      const repeat = settings?.repeat || material.repeat || [4, 4];
      const rotation = settings?.rotation ?? material.rotation ?? 0;
      const texture = getLoadedTexture(material.textureUrl, repeat, rotation);

      const bumpScale = settings?.bumpScale ?? material.bumpScale ?? 0.12;
      const roughness = settings?.roughness ?? material.roughness ?? 0.35;

      newMat = new THREE.MeshStandardMaterial({
        map: texture,
        bumpMap: texture, // Gives tactile 3D relief so grout lines and textures pop out in 3D!
        bumpScale: bumpScale,
        color: new THREE.Color(effectiveColorHex),
        roughness: roughness,
        metalness: material.metalness ?? 0.05,
        side: THREE.DoubleSide,
        name: `${child.name}_${material.id}_mat`,
      });
    } else if (material.type === 'texture' && material.textureType) {
      // Procedural PBR texture
      const repeat = settings?.repeat || material.repeat || [3, 3];
      const rotation = settings?.rotation ?? material.rotation ?? 0;
      const texture = getWorldProceduralTexture(material.textureType, repeat, rotation);
      const roughness = settings?.roughness ?? material.roughness ?? 0.4;

      newMat = new THREE.MeshStandardMaterial({
        map: texture,
        bumpMap: texture,
        bumpScale: settings?.bumpScale ?? material.bumpScale ?? 0.05,
        color: new THREE.Color(effectiveColorHex || '#FFFFFF'),
        roughness: roughness,
        metalness: material.metalness ?? 0.05,
        side: THREE.DoubleSide,
        name: `${child.name}_${material.id}_mat`,
      });
    } else {
      // Pure color-based PBR material
      newMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(effectiveColorHex || '#FFFFFF'),
        roughness: settings?.roughness ?? material.roughness ?? 0.8,
        metalness: material.metalness ?? 0.02,
        side: THREE.DoubleSide,
        name: `${child.name}_${material.id}_mat`,
      });
    }

    // Preserve mesh shadow properties
    child.castShadow = true;
    child.receiveShadow = true;

    // Dispose previous custom material if it was dynamically allocated
    if (child.material && child.material !== originalMaterialMap.get(child)) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }

    child.material = newMat;
    child.material.needsUpdate = true;
  });
}

/**
 * Traverses a 3D scene and extracts all identifiable mesh metadata.
 */
export function extractSceneMeshes(scene: THREE.Object3D): {
  name: string;
  materialName: string;
  initialColor: string;
  vertexCount: number;
}[] {
  const result: {
    name: string;
    materialName: string;
    initialColor: string;
    vertexCount: number;
  }[] = [];

  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      let color = '#CCCCCC';
      let matName = 'Default';

      if (mat && 'color' in mat && mat.color instanceof THREE.Color) {
        color = `#${mat.color.getHexString()}`;
      }
      if (mat && mat.name) {
        matName = mat.name;
      }

      const vertexCount = obj.geometry?.attributes?.position?.count || 0;

      result.push({
        name: obj.name || `Mesh_${obj.id}`,
        materialName: matName,
        initialColor: color,
        vertexCount,
      });
    }
  });

  return result;
}
