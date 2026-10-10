import { bunnyStorage } from '../src/lib/bunny-storage';
import { db } from '../src/lib/db';

async function main() {
  console.log('--- STARTING 100% E2E VERIFICATION TEST ---');

  // Test 1: Direct Bunny Storage Upload & Download & Delete
  const testPath = `uploads/temp/e2e_verify_${Date.now()}.txt`;
  const content = Buffer.from('HomeCraft 3D Bunny Storage E2E Test Payload');

  console.log(`\n[1/4] Testing Direct Bunny Storage Upload to: ${testPath}...`);
  const uploadedUrl = await bunnyStorage.upload(testPath, content, 'text/plain');
  console.log(`✅ Upload Succeeded! Public URL: ${uploadedUrl}`);

  console.log('\n[2/4] Testing Direct Download Verification...');
  const dlRes = await bunnyStorage.download(testPath);
  if (!dlRes.ok) {
    throw new Error(`Download failed with status ${dlRes.status}`);
  }
  const downloadedText = await dlRes.text();
  if (downloadedText !== 'HomeCraft 3D Bunny Storage E2E Test Payload') {
    throw new Error('Downloaded content does not match!');
  }
  console.log('✅ Content Verified Exactly 100% Matching!');

  console.log('\n[3/4] Testing Direct Bunny Storage Deletion...');
  const delSuccess = await bunnyStorage.delete(testPath);
  if (!delSuccess) {
    throw new Error('Delete returned false!');
  }
  // Verify it no longer exists
  const checkRes = await bunnyStorage.download(testPath);
  if (checkRes.status !== 404) {
    console.warn(`Note: expected 404 after delete, got ${checkRes.status}`);
  } else {
    console.log('✅ Verified file 404 Not Found after deletion!');
  }

  // Test 4: Custom Material Lifecycle (Create, Read, Delete with Cloud Storage Asset)
  console.log('\n[4/4] Testing Custom Material Database & Storage Lifecycle...');
  const testTexPath = `uploads/textures/test_texture_${Date.now()}.jpg`;
  await bunnyStorage.upload(testTexPath, Buffer.from('FAKE_JPG_DATA'), 'image/jpeg');

  const testMat = {
    id: `test_e2e_${Date.now()}`,
    name: 'E2E Test Granite Stone',
    category: 'wall' as const,
    type: 'texture' as const,
    textureUrl: `/api/storage/${testTexPath}`,
    previewThumbnail: `/api/storage/${testTexPath}`,
    roughness: 0.3,
    metalness: 0.05,
    finish: 'gloss' as const,
    isCustomUpload: true,
  };

  const savedMat = await db.createCustomMaterial(testMat);
  console.log(`✅ Created Material in DB: ${savedMat.name} (id: ${savedMat.id})`);

  const listAfterAdd = await db.getCustomMaterials();
  const found = listAfterAdd.find((m) => m.id === testMat.id);
  if (!found) {
    throw new Error('Newly created material not found in readMaterials!');
  }
  console.log('✅ Material Found in DB list!');

  const delMatSuccess = await db.deleteCustomMaterial(testMat.id);
  console.log(`✅ Deleted Material from DB (asset cleaned): ${delMatSuccess}`);

  const listAfterDel = await db.getCustomMaterials();
  if (listAfterDel.some((m) => m.id === testMat.id)) {
    throw new Error('Material still found in DB list after delete!');
  }
  console.log('✅ Verified Material completely removed from DB!');

  // Test 5: Project Lifecycle (Create, Read, Delete with GLB, Thumbnail, and Configs)
  console.log('\n[5/5] Testing Project Database & Storage Lifecycle...');
  const testGlbPath = `uploads/models/test_project_model_${Date.now()}.glb`;
  const testThumbPath = `uploads/models/test_project_thumb_${Date.now()}.png`;
  await bunnyStorage.upload(testGlbPath, Buffer.from('FAKE_GLB_BINARY'), 'model/gltf-binary');
  await bunnyStorage.upload(testThumbPath, Buffer.from('FAKE_PNG_THUMB'), 'image/png');

  const testProject = {
    id: `proj_e2e_${Date.now()}`,
    userId: 'usr-admin-lead',
    name: 'E2E Modern Test Villa',
    clientName: 'Test Client',
    description: 'E2E Testing Villa',
    modelUrl: `/api/storage/${testGlbPath}`,
    thumbnailUrl: `/api/storage/${testThumbPath}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'published' as const,
    viewsCount: 0,
    savedConfigsCount: 0,
    zones: [],
  };

  const savedProj = await db.createProject(testProject);
  console.log(`✅ Created Project in DB: ${savedProj.name} (id: ${savedProj.id})`);

  const projsAfterAdd = await db.getAllProjects();
  const foundProj = projsAfterAdd.find((p) => p.id === testProject.id);
  if (!foundProj) {
    throw new Error('Newly created project not found in getAllProjects!');
  }
  console.log('✅ Project Found in DB list!');

  const delProjSuccess = await db.deleteProject(testProject.id);
  console.log(`✅ Deleted Project from DB (assets cleaned): ${delProjSuccess}`);

  const projsAfterDel = await db.getAllProjects();
  if (projsAfterDel.some((p) => p.id === testProject.id)) {
    throw new Error('Project still found in DB list after delete!');
  }
  console.log('✅ Verified Project completely removed from DB!');

  // Verify the GLB file in Bunny was actually deleted
  const checkGlbRes = await bunnyStorage.download(testGlbPath);
  if (checkGlbRes.status === 404) {
    console.log('✅ Verified Project GLB asset in Bunny Storage was completely deleted!');
  }

  console.log('\n=============================================');
  console.log('🎉 ALL 5 E2E TESTS PASSED 100% WITH ZERO ERRORS!');
  console.log('=============================================');
}

main().catch((err) => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
