import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { bunnyStorage } from '@/lib/bunny-storage';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storagePath, originalName, baseName, timestamp } = body;

    if (!storagePath) {
      return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 });
    }

    console.log(`[Convert SKP] Fetching SKP from Bunny Storage: ${storagePath}...`);
    const skpRes = await bunnyStorage.download(storagePath);
    if (!skpRes.ok) {
      return NextResponse.json({ error: 'SKP file not found in storage' }, { status: 404 });
    }

    const arrayBuffer = await skpRes.arrayBuffer();
    console.log(`[Convert SKP] SKP downloaded (${arrayBuffer.byteLength} bytes), converting with openskp...`);

    const { buildInstancedScene, buildScene, toInstancedGLB, toGLB, extractThumbnail } = await import('openskp');

    let glbBytes: Uint8Array;
    const isLarge = arrayBuffer.byteLength > 12 * 1024 * 1024;
    try {
      if (!isLarge) {
        try {
          const instanced = buildInstancedScene(arrayBuffer);
          glbBytes = toInstancedGLB(instanced, { textures: true });
        } catch {
          const scene = buildScene(arrayBuffer);
          glbBytes = toGLB(scene);
        }
      } else {
        console.log('[Convert SKP] Large model detected, converting using flat scene to preserve memory...');
        const scene = buildScene(arrayBuffer);
        glbBytes = toGLB(scene);
      }
    } catch (err: any) {
      console.error('[Convert SKP] Geometry build failed:', err);
      throw new Error(`Gagal memproses geometri 3D SketchUp: ${err?.message || 'Format tidak valid'}`);
    }

    const cleanBase = baseName || path.basename(storagePath, path.extname(storagePath));
    const cleanTime = timestamp || Date.now();
    const glbFilename = `${cleanBase}_${cleanTime}.glb`;
    const glbStoragePath = `uploads/models/${glbFilename}`;

    console.log(`[Convert SKP] Uploading converted GLB to Bunny Storage: ${glbStoragePath} (${glbBytes.length} bytes)...`);
    const glbUrl = await bunnyStorage.upload(glbStoragePath, glbBytes, 'model/gltf-binary');

    // Extract thumbnail if available
    let extractedThumbUrl: string | undefined;
    try {
      const thumb = extractThumbnail(arrayBuffer);
      if (thumb && thumb.data && thumb.data.length > 0) {
        const thumbFilename = `${cleanBase}_${cleanTime}_thumb.png`;
        const thumbStoragePath = `uploads/models/${thumbFilename}`;
        extractedThumbUrl = await bunnyStorage.upload(thumbStoragePath, thumb.data, 'image/png');
        console.log(`[Convert SKP] Extracted embedded thumbnail: ${extractedThumbUrl}`);
      }
    } catch (thumbErr) {
      console.warn('[Convert SKP] Could not extract embedded thumbnail:', thumbErr);
    }

    // Move or copy SKP to permanent uploads/models for preservation
    const permanentSkpPath = `uploads/models/${cleanBase}_${cleanTime}.skp`;
    try {
      if (storagePath !== permanentSkpPath) {
        await bunnyStorage.upload(permanentSkpPath, Buffer.from(arrayBuffer), 'application/octet-stream');
        // Only delete original file if it was a temporary upload
        if (storagePath.startsWith('uploads/temp/')) {
          await bunnyStorage.delete(storagePath);
        }
      }
    } catch (moveErr) {
      console.warn('[Convert SKP] Warning moving temporary SKP:', moveErr);
    }

    return NextResponse.json({
      success: true,
      url: glbUrl,
      skpOriginalUrl: bunnyStorage.getPublicUrl(permanentSkpPath),
      filename: glbFilename,
      originalName: originalName || `${cleanBase}.skp`,
      isConvertedFromSkp: true,
      sizeBytes: glbBytes.length,
      thumbnailUrl: extractedThumbUrl,
      mimeType: 'model/gltf-binary',
    });
  } catch (err: any) {
    console.error('[Convert SKP] Failed:', err);
    return NextResponse.json(
      { error: `Gagal mengonversi file SketchUp (.skp): ${err?.message || 'Format tidak valid'}` },
      { status: 500 }
    );
  }
}
