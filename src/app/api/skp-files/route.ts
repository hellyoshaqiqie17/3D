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

export async function GET(req: NextRequest) {
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
    const userIdCookie = req.cookies.get('hc_user_id')?.value;

    for (const { item, folder } of candidateSkpItems) {
      const lower = item.ObjectName.toLowerCase();
      if (!lower.endsWith('.skp') && !lower.endsWith('.glb')) continue;

      if (item.ObjectName.includes('__USER__')) {
        if (userIdCookie && !item.ObjectName.startsWith(`${userIdCookie}__USER__`)) continue;
      } else {
        if (userIdCookie && userIdCookie !== 'usr-admin-lead') continue;
      }

      const storagePath = `${folder}/${item.ObjectName}`;
      if (seenFilenames.has(item.ObjectName)) continue;
      seenFilenames.add(item.ObjectName);

      const ext = path.extname(item.ObjectName);
      let rawBase = path.basename(item.ObjectName, ext);
      
      const cleanName = rawBase
        .replace(/^.*__USER__/, '')
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
    let rawPath = searchParams.get('storagePath');

    if (!rawPath) {
      try {
        const body = await req.json();
        rawPath = body.storagePath;
      } catch {}
    }

    if (!rawPath) {
      return NextResponse.json({ error: 'storagePath parameter is required' }, { status: 400 });
    }

    // Extract clean uploads/... path even if full URL or leading slash was passed
    const cleanStoragePath =
      rawPath.split('?')[0].match(/(?:uploads\/[a-zA-Z0-9_\-\.\/]+)/)?.[0] ||
      rawPath.replace(/^\/+/, '');

    // Ensure path is within uploads
    if (!cleanStoragePath.startsWith('uploads/')) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    const success = await bunnyStorage.delete(cleanStoragePath);

    // Also attempt deleting associated GLB and thumbnail if deleting an SKP
    if (cleanStoragePath.endsWith('.skp')) {
      const base = path.basename(cleanStoragePath, '.skp');
      await bunnyStorage.delete(`uploads/models/${base}.glb`).catch(() => {});
      await bunnyStorage.delete(`uploads/models/${base}_thumb.png`).catch(() => {});
    }

    return NextResponse.json({ success, deletedPath: cleanStoragePath });
  } catch (error: any) {
    console.error('[API skp-files DELETE] Error:', error);
    return NextResponse.json({ error: 'Gagal menghapus file dari storage' }, { status: 500 });
  }
}
