import * as THREE from 'three';

/**
 * Offscreen 3D Snapshot Generator
 * Renders any Three.js Object3D / GLTF scene into an architectural PNG snapshot.
 * Runs client-side in browser memory without displaying canvas on the screen.
 */
export function generateModelThumbnail(
  model: THREE.Object3D,
  width = 640,
  height = 360
): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '';
  }

  try {
    // 1. Offscreen canvas & WebGL renderer
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 2. Dedicated temporary snapshot scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F7F7F5'); // Architectural light studio backdrop

    // 3. Clone model and calculate bounding box
    const clone = model.clone(true);
    clone.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Center model at ground level
    clone.position.x = -center.x;
    clone.position.y = -box.min.y;
    clone.position.z = -center.z;
    scene.add(clone);

    // 4. Calculate camera distance to frame the house nicely
    const maxDim = Math.max(size.x, size.y, size.z, 5);
    const fov = 38;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 200);

    // Optimal 3/4 architectural perspective angle
    const camX = maxDim * 1.1;
    const camY = maxDim * 0.7 + size.y * 0.3;
    const camZ = maxDim * 1.25;

    camera.position.set(camX, camY, camZ);
    camera.lookAt(0, size.y * 0.35, 0);

    // 5. Studio Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff6ea, 1.8);
    sunLight.position.set(maxDim * 1.5, maxDim * 2.2, maxDim * 1.8);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xdcebf8, 0.8);
    fillLight.position.set(-maxDim * 1.5, maxDim * 1.2, -maxDim * 1.2);
    scene.add(fillLight);

    // Ground disk / subtle podium
    const groundGeo = new THREE.CylinderGeometry(maxDim * 1.8, maxDim * 1.8, 0.05, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeeb,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.03;
    scene.add(ground);

    // 6. Render
    renderer.render(scene, camera);

    // 7. Capture PNG Data URL
    const dataUrl = canvas.toDataURL('image/png', 0.92);

    // 8. Cleanup GPU memory
    renderer.dispose();
    groundGeo.dispose();
    groundMat.dispose();

    return dataUrl;
  } catch (err) {
    console.error('Failed to generate 3D model thumbnail:', err);
    return '';
  }
}
