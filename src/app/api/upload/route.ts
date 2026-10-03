import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Destination folder for uploaded CAD models
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'models');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const safeFilename = `${baseName}_${timestamp}${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, safeFilename);

    // Convert file arrayBuffer to Buffer and write
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destinationPath, buffer);

    const fileUrl = `/uploads/models/${safeFilename}`;

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
        const glbPath = path.join(UPLOAD_DIR, glbFilename);
        fs.writeFileSync(glbPath, Buffer.from(glbBytes));
        console.log(`[Upload] SKP successfully converted to GLB: ${glbFilename} (${glbBytes.length} bytes)`);

        // Check if SKP contains an embedded thumbnail
        let extractedThumbUrl: string | undefined;
        try {
          const thumb = extractThumbnail(arrayBuffer);
          if (thumb && thumb.data && thumb.data.length > 0) {
            const thumbFilename = `${baseName}_${timestamp}_thumb.png`;
            const thumbPath = path.join(UPLOAD_DIR, thumbFilename);
            fs.writeFileSync(thumbPath, Buffer.from(thumb.data));
            extractedThumbUrl = `/uploads/models/${thumbFilename}`;
          }
        } catch (thumbErr) {
          console.warn('[Upload] Could not extract embedded SKP thumbnail:', thumbErr);
        }

        return NextResponse.json({
          success: true,
          url: `/uploads/models/${glbFilename}`,
          skpOriginalUrl: fileUrl,
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

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: safeFilename,
      originalName,
      sizeBytes: buffer.length,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
