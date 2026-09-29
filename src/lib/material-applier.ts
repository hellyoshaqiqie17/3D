import * as THREE from 'three';
import { MaterialOption, MaterialZone } from '@/types';
import { getProceduralTexture } from './texture-generator';

// Map of mesh uuid -> original material backup (so we can restore if needed)
export const originalMaterialMap = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>();

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
 * Applies a material option (or custom hex color) to all meshes belonging to a specific zone.
 * Conforms strictly to:
 * - Preserving geometry, transforms, UVs
 * - Cloning materials so unrelated meshes sharing a material aren't corrupted
 * - Proper Three.js PBR properties (MeshStandardMaterial)
 */
export function applyMaterialToZone(
  scene: THREE.Object3D,
  zone: MaterialZone,
  material: MaterialOption,
  customColor?: string
): void {
  const targetMeshNames = new Set(zone.meshNames);

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !targetMeshNames.has(child.name)) {
      return;
    }

    // Backup original material on first encounter
    if (!originalMaterialMap.has(child)) {
      originalMaterialMap.set(child, child.material);
    }

    // Determine target color: custom color takes precedence if provided and type is color
    const effectiveColorHex = (material.type === 'color' && customColor) ? customColor : material.color;

    // Create or reconfigure a dedicated MeshStandardMaterial
    // Always create a new or cloned material for this specific mesh
    let newMat: THREE.MeshStandardMaterial;

    if (material.type === 'texture' && material.textureUrl) {
      // Custom uploaded texture URL
      const texture = new THREE.TextureLoader().load(material.textureUrl);
      const repeat = material.repeat || [4, 4];
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat[0], repeat[1]);
      texture.colorSpace = THREE.SRGBColorSpace;

      newMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: material.roughness ?? 0.3,
        metalness: material.metalness ?? 0.05,
        name: `${child.name}_${material.id}_mat`,
      });
      newMat.map!.anisotropy = 8;
    } else if (material.type === 'texture' && material.textureType) {
      // Procedural PBR texture
      const repeat = material.repeat || [3, 3];
      const texture = getProceduralTexture(material.textureType, repeat);

      newMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: material.roughness ?? 0.4,
        metalness: material.metalness ?? 0.05,
        name: `${child.name}_${material.id}_mat`,
      });

      // Maintain crisp texture filtering
      newMat.map!.anisotropy = 8;
    } else {
      // Color-based PBR material
      newMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(effectiveColorHex || '#FFFFFF'),
        roughness: material.roughness ?? 0.8,
        metalness: material.metalness ?? 0.02,
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
