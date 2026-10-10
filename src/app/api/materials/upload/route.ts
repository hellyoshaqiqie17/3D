import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { bunnyStorage } from '@/lib/bunny-storage';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const originalName = file.name || 'texture.jpg';
    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const filename = `texture_${baseName}_${timestamp}${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Save local copy in public/uploads/textures for instantaneous local & production access
    const localDir = path.join(process.cwd(), 'public', 'uploads', 'textures');
    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      fs.writeFileSync(path.join(localDir, filename), buffer);
    } catch (localErr) {
      console.warn('[Texture Upload] Warning saving local copy:', localErr);
    }

    // 2. Upload to Bunny Storage Cloud CDN
    const storagePath = `uploads/textures/${filename}`;
    let publicUrl = `/uploads/textures/${filename}`;
    try {
      publicUrl = await bunnyStorage.upload(
        storagePath,
        buffer,
        file.type || (ext === '.png' ? 'image/png' : 'image/jpeg')
      );
    } catch (cloudErr) {
      console.warn('[Texture Upload] Warning uploading to Bunny Storage, using local fallback:', cloudErr);
      publicUrl = `/uploads/textures/${filename}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      originalName,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('[Texture Upload] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to upload texture file' },
      { status: 500 }
    );
  }
}
