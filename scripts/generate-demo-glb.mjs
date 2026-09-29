import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// Polyfill FileReader for Node.js
class FileReaderPolyfill {
  constructor() {
    this.result = null;
    this.onloadend = null;
  }
  async readAsArrayBuffer(blob) {
    const arrayBuf = await blob.arrayBuffer();
    this.result = arrayBuf;
    if (typeof this.onloadend === 'function') {
      this.onloadend();
    }
  }
}
globalThis.FileReader = FileReaderPolyfill;

function createModernHouseScene() {
  const scene = new THREE.Scene();
  scene.name = "Modern_Pavilion_Villa";

  // Helper
  const createBoxMesh = (name, width, height, depth, pos, color, roughness = 0.5, metalness = 0.1) => {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      name: `${name}_Mat`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // 1. Concrete Foundation / Podium
  const foundation = createBoxMesh('Foundation_Base', 14, 0.4, 11, [0, 0.2, 0], '#DCDCD7', 0.8, 0.05);
  scene.add(foundation);

  // 2. Outdoor Terrace / Patio Deck
  const deck = createBoxMesh('Deck_Patio', 4, 0.05, 5, [4.5, 0.425, 2.5], '#8C6D46', 0.7, 0.05);
  scene.add(deck);

  // 3. Main Living Room Floor
  const livingFloor = createBoxMesh('Floor_Living', 7.5, 0.05, 6.5, [-2.5, 0.425, 1.2], '#D8CAB8', 0.35, 0.05);
  scene.add(livingFloor);

  // 4. Bedroom Floor
  const bedroomFloor = createBoxMesh('Floor_Bedroom', 4.5, 0.05, 4.5, [-3.8, 0.425, -3.8], '#C8B9A6', 0.4, 0.05);
  scene.add(bedroomFloor);

  // 5. Bathroom Floor
  const bathroomFloor = createBoxMesh('Floor_Bathroom', 3.2, 0.05, 3.2, [3.8, 0.425, -3.8], '#E5E7EB', 0.15, 0.1);
  scene.add(bathroomFloor);

  // 6. Exterior Walls
  // Back Wall
  const wallBack = createBoxMesh('Wall_Exterior_Main', 12.5, 3.2, 0.3, [0, 2.0, -5.35], '#F7F7F5', 0.85, 0.02);
  scene.add(wallBack);

  // Left Exterior Wall
  const wallLeft = createBoxMesh('Wall_Exterior_Main', 0.3, 3.2, 10.5, [-6.1, 2.0, 0], '#F7F7F5', 0.85, 0.02);
  scene.add(wallLeft);

  // Right Exterior Wall (Solid section)
  const wallRightSolid = createBoxMesh('Wall_Exterior_Main', 0.3, 3.2, 5.5, [6.1, 2.0, -2.5], '#F7F7F5', 0.85, 0.02);
  scene.add(wallRightSolid);

  // Front Wall Pier / Feature Column (Accent)
  const wallAccent = createBoxMesh('Wall_Exterior_Accent', 0.6, 3.2, 1.2, [2.0, 2.0, 4.5], '#373A3C', 0.7, 0.1);
  scene.add(wallAccent);

  // 7. Interior Partition Walls
  // Living/Bedroom divider
  const wallInterior1 = createBoxMesh('Wall_Interior', 0.2, 3.2, 4.8, [-1.5, 2.0, -3.0], '#F5F5F0', 0.9, 0.0);
  scene.add(wallInterior1);

  // Bathroom Partition (Bathroom Wall)
  const wallBathroom = createBoxMesh('Wall_Bathroom', 3.2, 3.2, 0.2, [3.8, 2.0, -2.1], '#F0F0ED', 0.3, 0.05);
  scene.add(wallBathroom);

  // 8. Modern Floating Roof / Overhang
  const roof = createBoxMesh('Roof_Main', 14.6, 0.35, 12.2, [0, 3.75, 0.2], '#2B2D2F', 0.6, 0.2);
  scene.add(roof);

  // Ceiling underside accent
  const ceiling = createBoxMesh('Ceiling_Interior', 12.0, 0.05, 10.0, [0, 3.55, 0], '#FAF9F6', 0.9, 0.0);
  scene.add(ceiling);

  // 9. Panoramic Glass Windows
  const glassGeo = new THREE.BoxGeometry(6.5, 3.0, 0.08);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#D8ECF8'),
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    name: 'Glass_Material',
  });
  const glassFront = new THREE.Mesh(glassGeo, glassMat);
  glassFront.name = 'Glass_Windows';
  glassFront.position.set(-2.0, 2.0, 4.6);
  scene.add(glassFront);

  // Window Frames (Sleek minimalist black aluminum)
  const frameGeoTop = new THREE.BoxGeometry(6.6, 0.08, 0.12);
  const frameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1F2421'),
    roughness: 0.4,
    metalness: 0.8,
    name: 'Window_Frame_Mat',
  });
  const frameTop = new THREE.Mesh(frameGeoTop, frameMat);
  frameTop.name = 'Frame_Windows';
  frameTop.position.set(-2.0, 3.5, 4.6);
  scene.add(frameTop);

  const frameBottom = frameTop.clone();
  frameBottom.position.y = 0.5;
  scene.add(frameBottom);

  // 10. Entrance Door
  const doorGeo = new THREE.BoxGeometry(1.2, 2.8, 0.1);
  const doorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8C5E3C'),
    roughness: 0.5,
    metalness: 0.1,
    name: 'Door_Wood_Mat',
  });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.name = 'Door_Entrance';
  door.position.set(4.0, 1.8, 4.5);
  door.castShadow = true;
  scene.add(door);

  // Door Handle
  const handle = createBoxMesh('Door_Handle', 0.05, 0.6, 0.08, [4.5, 1.8, 4.6], '#E5E7EB', 0.2, 0.9);
  scene.add(handle);

  // 11. Modern Architectural Accents (Kitchen Island / Countertop)
  const kitchenIsland = createBoxMesh('Kitchen_Countertop', 2.8, 0.9, 1.2, [0.5, 0.85, 0.5], '#FAFAFA', 0.2, 0.1);
  scene.add(kitchenIsland);

  // Bathroom Vanity Counter
  const vanity = createBoxMesh('Bathroom_Vanity', 1.8, 0.85, 0.7, [4.2, 0.85, -3.8], '#2C3E50', 0.3, 0.2);
  scene.add(vanity);

  return scene;
}

async function exportGLB() {
  const scene = createModernHouseScene();
  const exporter = new GLTFExporter();

  const publicDir = path.resolve('public', 'models');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'modern-villa.glb');

  exporter.parse(
    scene,
    (gltf) => {
      if (gltf instanceof ArrayBuffer) {
        fs.writeFileSync(outputPath, Buffer.from(gltf));
        console.log(`Successfully exported GLB to: ${outputPath} (${gltf.byteLength} bytes)`);
      } else {
        const output = JSON.stringify(gltf, null, 2);
        const gltfPath = path.join(publicDir, 'modern-villa.gltf');
        fs.writeFileSync(gltfPath, output);
        console.log(`Exported JSON GLTF to: ${gltfPath}`);
      }
    },
    (err) => {
      console.error('Error during GLTF export:', err);
    },
    { binary: true }
  );
}

exportGLB();
