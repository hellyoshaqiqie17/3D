import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { bunnyStorage } from '@/lib/bunny-storage';

// Local cache folder for uploaded CAD models
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'models');

function trySaveLocalFile(subPath: string, data: Buffer | Uint8Array) {
  try {
    const fullPath = path.join(UPLOAD_DIR, subPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, Buffer.from(data));
  } catch (err) {
    // Non-fatal on serverless environments like Vercel with read-only filesystem
    console.warn(`[Upload Local Cache] Could not write local file ${subPath}:`, err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const safeFilename = `${baseName}_${timestamp}${ext}`;

    // Convert file arrayBuffer to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local disk cache if writable
    trySaveLocalFile(safeFilename, buffer);

    // Handle SketchUp (.skp) files -> automatically convert to WebGL-ready GLB
    if (ext === '.skp') {
      try {
        console.log(`[Upload] Processing SketchUp file: ${safeFilename} (${buffer.length} bytes)...`);
        const { buildInstancedScene, buildScene, toInstancedGLB, toGLB, extractThumbnail } = await import('openskp');

        let glbBytes: Uint8Array;
        try {
          const instanced = buildInstancedScene(arrayBuffer);
          glbBytes = toInstancedGLB(instanced, { textures: true });
        } catch (instancedErr) {
          console.warn('[Upload] Instanced GLB conversion fallback to flat scene:', instancedErr);
          const scene = buildScene(arrayBuffer);
          glbBytes = toGLB(scene);
        }

        const glbFilename = `${baseName}_${timestamp}.glb`;
        trySaveLocalFile(glbFilename, glbBytes);

        // Upload GLB to Bunny Storage
        const glbStoragePath = `uploads/models/${glbFilename}`;
        const glbUrl = await bunnyStorage.upload(glbStoragePath, glbBytes, 'model/gltf-binary');
        console.log(`[Upload] SKP successfully converted and uploaded to Bunny: ${glbUrl}`);

        // Upload original SKP to Bunny Storage
        const skpStoragePath = `uploads/models/${safeFilename}`;
        const skpUrl = await bunnyStorage.upload(skpStoragePath, buffer, 'application/octet-stream');

        // Check if SKP contains an embedded thumbnail
        let extractedThumbUrl: string | undefined;
        try {
          const thumb = extractThumbnail(arrayBuffer);
          if (thumb && thumb.data && thumb.data.length > 0) {
            const thumbFilename = `${baseName}_${timestamp}_thumb.png`;
            trySaveLocalFile(thumbFilename, thumb.data);
            const thumbStoragePath = `uploads/models/${thumbFilename}`;
            extractedThumbUrl = await bunnyStorage.upload(thumbStoragePath, thumb.data, 'image/png');
          }
        } catch (thumbErr) {
          console.warn('[Upload] Could not extract embedded SKP thumbnail:', thumbErr);
        }

        return NextResponse.json({
          success: true,
          url: glbUrl,
          skpOriginalUrl: skpUrl,
          filename: glbFilename,
          originalName,
          isConvertedFromSkp: true,
          sizeBytes: glbBytes.length,
          thumbnailUrl: extractedThumbUrl,
          mimeType: 'model/gltf-binary',
        });
      } catch (convErr: any) {
        console.error('[Upload] SKP Conversion failed:', convErr);
        return NextResponse.json(
          { error: `Gagal mengonversi file SketchUp (.skp): ${convErr?.message || 'Format tidak valid'}` },
          { status: 500 }
        );
      }
    }

    // Direct CAD / GLB / GLTF file upload to Bunny Storage
    const storagePath = `uploads/models/${safeFilename}`;
    const contentType = ext === '.glb'
      ? 'model/gltf-binary'
      : ext === '.gltf'
      ? 'model/gltf+json'
      : file.type || 'application/octet-stream';

    const fileUrl = await bunnyStorage.upload(storagePath, buffer, contentType);
    console.log(`[Upload] Successfully uploaded model to Bunny Storage: ${fileUrl}`);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: safeFilename,
      originalName,
      sizeBytes: buffer.length,
      mimeType: contentType,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
