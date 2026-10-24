import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { bunnyStorage } from '@/lib/bunny-storage';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawFiles = formData.getAll('files') as File[];
    const singleFiles = formData.getAll('file') as File[];
    const allFiles = [...rawFiles, ...singleFiles].filter(
      (f) => f && typeof f === 'object' && f.name && f.size > 0
    );

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file gambar yang diunggah' }, { status: 400 });
    }

    const localDir = path.join(process.cwd(), 'public', 'uploads', 'textures');
    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
    } catch {
      // Expected on serverless Vercel read-only filesystem
    }

    const uploadedResults: Array<{
      url: string;
      filename: string;
      originalName: string;
      cleanName: string;
      size: number;
    }> = [];

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      const originalName = file.name || `texture_${i + 1}.jpg`;
      const ext = path.extname(originalName).toLowerCase() || '.jpg';
      const rawBase = path.basename(originalName, ext);
      const safeBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const filename = `texture_${safeBase}_${timestamp}_${randomSuffix}${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 1. Local copy (only if filesystem is writable)
      try {
        fs.writeFileSync(path.join(localDir, filename), buffer);
      } catch {
        // Read-only on serverless, safely ignored
      }

      // 2. Bunny Cloud Storage CDN upload
      const storagePath = `uploads/textures/${filename}`;
      let publicUrl = `/api/storage/uploads/textures/${filename}`;
      try {
        publicUrl = await bunnyStorage.upload(
          storagePath,
          buffer,
          file.type || (ext === '.png' ? 'image/png' : 'image/jpeg')
        );
      } catch (cloudErr) {
        console.warn(`[Texture Upload] Warning uploading ${filename} to cloud, using local fallback:`, cloudErr);
        publicUrl = `/api/storage/uploads/textures/${filename}`;
      }

      // Clean formatted title name
      const cleanName = rawBase
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      uploadedResults.push({
        url: publicUrl,
        filename,
        originalName,
        cleanName: cleanName || `Material Tekstur ${i + 1}`,
        size: buffer.length,
      });
    }

    return NextResponse.json({
      success: true,
      count: uploadedResults.length,
      uploaded: uploadedResults,
      // Backward compatibility for single upload callers:
      url: uploadedResults[0]?.url,
      filename: uploadedResults[0]?.filename,
      originalName: uploadedResults[0]?.originalName,
      size: uploadedResults[0]?.size,
    });
  } catch (err: any) {
    console.error('[Texture Upload] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Gagal memproses upload file tekstur' },
      { status: 500 }
    );
  }
}
