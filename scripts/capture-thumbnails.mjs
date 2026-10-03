import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = 3888;
const tmpProfile = path.join(os.tmpdir(), `chrome-capture-${Date.now()}`);

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Snapshot Capture</title>
  <script type="importmap">
  {
    "imports": {
      "three": "/three.js"
    }
  }
  </script>
</head>
<body style="background:#111;color:#fff;margin:0;padding:20px;font-family:sans-serif;">
  <h2>3D Auto Capture Headless</h2>
  <div id="status">Starting...</div>
  <script>
    const origLog = console.log;
    console.log = function(...args) {
      origLog(...args);
      fetch('/log?msg=' + encodeURIComponent(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))).catch(() => {});
    };
    window.onerror = function(msg, url, line) {
      fetch('/log?msg=' + encodeURIComponent('WINDOW_ERR: ' + msg + ' line ' + line)).catch(() => {});
    };
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { GLTFLoader } from '/GLTFLoader.js';

    console.log('THREE loaded successfully, version:', THREE.REVISION);

    function renderThumbnail(model, width = 800, height = 450) {
      console.log('Rendering model thumbnail...');
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

      const clone = model.clone(true);
      clone.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(clone);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      console.log('Model bounding box size:', size.x, size.y, size.z);

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

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
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
      console.log('Capture completed, dataUrl length:', dataUrl.length);

      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();

      return dataUrl;
    }

    async function processModel(url, filename) {
      console.log('Processing model:', url, '->', filename);
      const loader = new GLTFLoader();
      const gltf = await new Promise((res, rej) => loader.load(url, res, undefined, rej));
      console.log('GLTF loaded:', url);
      const pngData = renderThumbnail(gltf.scene);
      console.log('Posting saved thumbnail to server:', filename);
      await fetch('/save?file=' + encodeURIComponent(filename), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: pngData })
      });
      console.log('Successfully saved to disk:', filename);
    }

    async function run() {
      try {
        await processModel('/modern-villa.glb', 'villa-thumb.png');
        await processModel('/minimalist-studio.glb', 'studio-thumb.png');
        console.log('ALL MODELS CAPTURED SUCCESSFULLY!');
        await fetch('/done');
      } catch (err) {
        console.error('RUN ERROR:', err);
        await fetch('/error?msg=' + encodeURIComponent(err.stack || err.message));
      }
    }

    run();
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

  if (url.pathname === '/three.js') {
    const file = path.join(rootDir, 'node_modules', 'three', 'build', 'three.module.js');
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.createReadStream(file).pipe(res);
    return;
  }

  if (url.pathname === '/GLTFLoader.js') {
    const file = path.join(rootDir, 'node_modules', 'three', 'examples', 'jsm', 'loaders', 'GLTFLoader.js');
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.createReadStream(file).pipe(res);
    return;
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

  if (url.pathname === '/log') {
    console.log('[BROWSER CONSOLE]', url.searchParams.get('msg'));
    res.writeHead(200);
    res.end('ok');
    return;
  }

  if (url.pathname === '/save' && req.method === 'POST') {
    const fileName = url.searchParams.get('file');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        const base64Data = json.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const targetPath = path.join(rootDir, 'public', 'models', fileName);
        fs.writeFileSync(targetPath, buffer);
        console.log(`[OK] Saved ${fileName} (${buffer.length} bytes) to ${targetPath}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, size: buffer.length }));
      } catch (e) {
        console.error('Error saving image:', e);
        res.writeHead(500);
        res.end(e.message);
      }
    });
    return;
  }

  if (url.pathname === '/done') {
    console.log('[SUCCESS] All snapshots captured and saved!');
    res.writeHead(200);
    res.end('done');
    setTimeout(() => {
      try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
      server.close();
      process.exit(0);
    }, 1500);
    return;
  }

  if (url.pathname === '/error') {
    console.error('[BROWSER ERROR]', url.searchParams.get('msg'));
    res.writeHead(200);
    res.end('ack');
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Capture server listening at http://localhost:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`Using browser: ${browserPath}`);
  console.log(`Using profile: ${tmpProfile}`);

  const child = spawn(browserPath, [
    '--headless=new',
    '--use-gl=angle',
    '--enable-webgl',
    '--no-sandbox',
    '--disable-gpu-sandbox',
    `--user-data-dir=${tmpProfile}`,
    `http://localhost:${PORT}`
  ]);

  child.stdout?.on('data', (d) => console.log('[BROWSER STDOUT]', d.toString()));
  child.stderr?.on('data', (d) => console.log('[BROWSER STDERR]', d.toString()));

  child.on('error', (err) => {
    console.error('Failed to start browser process:', err);
  });

  child.on('exit', (code) => {
    console.log(`Browser exited with code ${code}`);
  });

  // Safety timeout: 25 seconds
  setTimeout(() => {
    console.log('Timeout reached.');
    child.kill();
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
    server.close();
    process.exit(0);
  }, 25000);
});
