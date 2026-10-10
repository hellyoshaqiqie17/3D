import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { bunnyStorage, BunnyFileItem } from '@/lib/bunny-storage';

export const dynamic = 'force-dynamic';

export interface SkpFileRecord {
  id: string;
  name: string;
  filename: string;
  storagePath: string;
  size: number;
  sizeMB: string;
  updatedAt: string;
  isConverted: boolean;
  glbUrl?: string;
  publicUrl: string;
}

export async function GET() {
  try {
    const [libFiles, modelFiles, tempFiles] = await Promise.all([
      bunnyStorage.listFiles('uploads/skp_library'),
      bunnyStorage.listFiles('uploads/models'),
      bunnyStorage.listFiles('uploads/temp'),
    ]);

    const glbSet = new Map<string, BunnyFileItem>();
    modelFiles
      .filter((f) => f.ObjectName.toLowerCase().endsWith('.glb'))
      .forEach((f) => {
        const base = f.ObjectName.slice(0, -4);
        glbSet.set(base, f);
      });

    const candidateSkpItems: Array<{ item: BunnyFileItem; folder: string }> = [
      ...libFiles.map((f) => ({ item: f, folder: 'uploads/skp_library' })),
      ...modelFiles.map((f) => ({ item: f, folder: 'uploads/models' })),
      ...tempFiles.map((f) => ({ item: f, folder: 'uploads/temp' })),
    ];

    const seenFilenames = new Set<string>();
    const records: SkpFileRecord[] = [];

    for (const { item, folder } of candidateSkpItems) {
      const lower = item.ObjectName.toLowerCase();
      if (!lower.endsWith('.skp') && !lower.endsWith('.glb')) continue;

      const storagePath = `${folder}/${item.ObjectName}`;
      if (seenFilenames.has(item.ObjectName)) continue;
      seenFilenames.add(item.ObjectName);

      const ext = path.extname(item.ObjectName);
      const rawBase = path.basename(item.ObjectName, ext);
      // Clean name: e.g. "RUANG_TAMU_1791644314148" -> "RUANG TAMU"
      const cleanName = rawBase
        .replace(/_\d{10,}$/, '')
        .replace(/[-_]/g, ' ')
        .trim();

      const isGlb = lower.endsWith('.glb');
      const matchingGlb = glbSet.get(rawBase);
      const isConverted = isGlb || Boolean(matchingGlb);
      const glbUrl = isGlb
        ? bunnyStorage.getPublicUrl(storagePath)
        : matchingGlb
        ? bunnyStorage.getPublicUrl(`uploads/models/${matchingGlb.ObjectName}`)
        : undefined;

      records.push({
        id: storagePath,
        name: cleanName || rawBase,
        filename: item.ObjectName,
        storagePath,
        size: item.Length,
        sizeMB: (item.Length / 1024 / 1024).toFixed(2),
        updatedAt: item.LastChanged || new Date().toISOString(),
        isConverted,
        glbUrl,
        publicUrl: bunnyStorage.getPublicUrl(storagePath),
      });
    }

    // Sort newest first
    records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      success: true,
      files: records,
      totalCount: records.length,
    });
  } catch (error: any) {
    console.error('[API skp-files GET] Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar file SketchUp dari cloud storage' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get('storagePath');

    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath parameter is required' }, { status: 400 });
    }

    // Ensure path is within uploads
    if (!storagePath.startsWith('uploads/')) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const success = await bunnyStorage.delete(storagePath);

    // Also attempt deleting associated GLB if deleting an SKP
    if (storagePath.endsWith('.skp')) {
      const base = path.basename(storagePath, '.skp');
      await bunnyStorage.delete(`uploads/models/${base}.glb`).catch(() => {});
      await bunnyStorage.delete(`uploads/models/${base}_thumb.png`).catch(() => {});
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('[API skp-files DELETE] Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus file dari storage' }, { status: 500 });
  }
}
