import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

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

function createMinimalistStudio() {
  const scene = new THREE.Scene();
  scene.name = "Nordic_Minimalist_Studio";

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

  // Base
  const base = createBoxMesh('Foundation_Base', 12, 0.4, 9, [0, 0.2, 0], '#C5C5BF', 0.8, 0.05);
  scene.add(base);

  // Studio Living / Kitchen Floor
  const studioFloor = createBoxMesh('Floor_Living', 7, 0.05, 8, [-2, 0.425, 0], '#BFA98F', 0.4, 0.05);
  scene.add(studioFloor);

  // Bathroom Floor
  const bathFloor = createBoxMesh('Floor_Bathroom', 3.8, 0.05, 3.8, [3.6, 0.425, -2.1], '#D5D9DC', 0.2, 0.05);
  scene.add(bathFloor);

  // Patio
  const patio = createBoxMesh('Deck_Patio', 3.8, 0.05, 3.8, [3.6, 0.425, 2.1], '#7A5B3E', 0.6, 0.05);
  scene.add(patio);

  // Exterior Walls
  const backWall = createBoxMesh('Wall_Exterior_Main', 11.2, 3.0, 0.3, [0, 1.9, -4.1], '#F0EFEA', 0.85, 0.02);
  scene.add(backWall);

  const leftWall = createBoxMesh('Wall_Exterior_Main', 0.3, 3.0, 8.2, [-5.6, 1.9, 0], '#F0EFEA', 0.85, 0.02);
  scene.add(leftWall);

  const rightWall = createBoxMesh('Wall_Exterior_Main', 0.3, 3.0, 8.2, [5.6, 1.9, 0], '#F0EFEA', 0.85, 0.02);
  scene.add(rightWall);

  const frontAccent = createBoxMesh('Wall_Exterior_Accent', 3.2, 3.0, 0.4, [3.8, 1.9, 4.1], '#26282B', 0.7, 0.1);
  scene.add(frontAccent);

  // Bathroom Walls
  const bathWall = createBoxMesh('Wall_Bathroom', 3.8, 3.0, 0.2, [3.6, 1.9, -0.2], '#EAE8E3', 0.35, 0.05);
  scene.add(bathWall);

  // Roof
  const roof = createBoxMesh('Roof_Main', 12.5, 0.3, 9.8, [0, 3.55, 0], '#1D1E20', 0.5, 0.2);
  scene.add(roof);

  // Glass Front
  const glassGeo = new THREE.BoxGeometry(6.8, 2.8, 0.08);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#D0E8F5'),
    transparent: true,
    opacity: 0.3,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.name = 'Glass_Windows';
  glass.position.set(-1.8, 1.8, 4.1);
  scene.add(glass);

  // Entrance Door
  const door = createBoxMesh('Door_Entrance', 1.1, 2.6, 0.08, [2.0, 1.7, 4.1], '#6E472D', 0.5, 0.1);
  scene.add(door);

  return scene;
}

const scene = createMinimalistStudio();
const exporter = new GLTFExporter();
const publicDir = path.resolve('public', 'models');
const outputPath = path.join(publicDir, 'minimalist-studio.glb');

exporter.parse(
  scene,
  (gltf) => {
    fs.writeFileSync(outputPath, Buffer.from(gltf));
    console.log(`Successfully exported Studio GLB to: ${outputPath} (${gltf.byteLength} bytes)`);
  },
  (err) => console.error(err),
  { binary: true }
);
