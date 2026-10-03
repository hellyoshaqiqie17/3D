import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = 3889;

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script type="importmap">
  {
    "imports": {
      "three": "/three/build/three.module.js"
    }
  }
  </script>
</head>
<body style="background:#111;margin:0;">
  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js';

    window.THREE = THREE;
    window.GLTFLoader = GLTFLoader;

    window.captureModel = async function(modelUrl) {
      console.log('Starting capture for', modelUrl);
      const loader = new GLTFLoader();
      const gltf = await new Promise((res, rej) => loader.load(modelUrl, res, undefined, rej));
      console.log('Model loaded into Three.js scene');

      const width = 800;
      const height = 450;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#F7F7F5');

      const clone = gltf.scene.clone(true);
      clone.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(clone);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      console.log('Box size:', size.x, size.y, size.z);

      clone.position.x = -center.x;
      clone.position.y = -box.min.y;
      clone.position.z = -center.z;
      scene.add(clone);

      const maxDim = Math.max(size.x, size.y, size.z, 5);
      const fov = 36;
      const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 200);

      const camX = maxDim * 1.15;
      const camY = maxDim * 0.75 + size.y * 0.3;
      const camZ = maxDim * 1.3;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, size.y * 0.35, 0);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfff6ea, 2.0);
      sunLight.position.set(maxDim * 1.5, maxDim * 2.2, maxDim * 1.8);
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0xdcebf8, 0.9);
      fillLight.position.set(-maxDim * 1.5, maxDim * 1.2, -maxDim * 1.2);
      scene.add(fillLight);

      const groundGeo = new THREE.CylinderGeometry(maxDim * 1.8, maxDim * 1.8, 0.05, 32);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0xeeeeeb,
        roughness: 0.9,
        metalness: 0.05
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.position.y = -0.03;
      scene.add(ground);

      renderer.render(scene, camera);
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      console.log('Rendering complete, length:', dataUrl.length);

      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();

      return dataUrl;
    };

    window.__ready = true;
    console.log('Capture environment initialized successfully!');
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
    return;
  }

  if (url.pathname.startsWith('/three/')) {
    const rel = url.pathname.slice('/three/'.length);
    const filePath = path.join(rootDir, 'node_modules', 'three', rel);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  if (url.pathname === '/modern-villa.glb') {
    const file = path.join(rootDir, 'public', 'models', 'modern-villa.glb');
    res.writeHead(200, { 'Content-Type': 'model/gltf-binary' });
    fs.createReadStream(file).pipe(res);
    return;
  }

  if (url.pathname === '/minimalist-studio.glb') {
    const file = path.join(rootDir, 'public', 'models', 'minimalist-studio.glb');
    res.writeHead(200, { 'Content-Type': 'model/gltf-binary' });
    fs.createReadStream(file).pipe(res);
    return;
  }

  if (url.pathname === '/sample-sketchup-house.glb') {
    const file = path.join(rootDir, 'public', 'models', 'sample-sketchup-house.glb');
    res.writeHead(200, { 'Content-Type': 'model/gltf-binary' });
    fs.createReadStream(file).pipe(res);
    return;
  }

  console.warn('404:', url.pathname);
  res.writeHead(404);
  res.end('Not found');
});

async function main() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`Server running at http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`Launching browser: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ]
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[PAGE]', msg.text()));
  page.on('pageerror', err => console.error('[PAGE ERROR]', err));

  console.log('Navigating to capture page...');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
  console.log('Page ready!');

  // Capture Modern Villa
  console.log('Rendering modern-villa.glb...');
  const villaDataUrl = await page.evaluate(async () => {
    return await window.captureModel('/modern-villa.glb');
  });
  const villaBuffer = Buffer.from(villaDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const villaPath = path.join(rootDir, 'public', 'models', 'villa-thumb.png');
  fs.writeFileSync(villaPath, villaBuffer);
  console.log(`[OK] Saved villa-thumb.png (${villaBuffer.length} bytes) to ${villaPath}`);

  // Capture Minimalist Studio
  console.log('Rendering minimalist-studio.glb...');
  const studioDataUrl = await page.evaluate(async () => {
    return await window.captureModel('/minimalist-studio.glb');
  });
  const studioBuffer = Buffer.from(studioDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const studioPath = path.join(rootDir, 'public', 'models', 'studio-thumb.png');
  fs.writeFileSync(studioPath, studioBuffer);
  console.log(`[OK] Saved studio-thumb.png (${studioBuffer.length} bytes) to ${studioPath}`);

  // Capture Sample SketchUp House
  console.log('Rendering sample-sketchup-house.glb...');
  const skpDataUrl = await page.evaluate(async () => {
    return await window.captureModel('/sample-sketchup-house.glb');
  });
  const skpBuffer = Buffer.from(skpDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const skpPath = path.join(rootDir, 'public', 'models', 'sample-sketchup-thumb.png');
  fs.writeFileSync(skpPath, skpBuffer);
  console.log(`[OK] Saved sample-sketchup-thumb.png (${skpBuffer.length} bytes) to ${skpPath}`);

  await browser.close();
  server.close();
  console.log('ALL SNAPSHOTS SUCCESSFULLY CAPTURED!');
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  server.close();
  process.exit(1);
});
