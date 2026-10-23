import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { bunnyStorage, BunnyFileItem } from '@/lib/bunny-storage';
import { isAdminWorkspaceUser, canDeleteProject } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  modelType?: 'architecture' | 'furniture';
}

function getCleanBaseName(filename: string): string {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext);
  // Remove user prefix: usr-admin-lead__USER__
  base = base.replace(/^.*?__USER__/, '');
  // Remove timestamp suffixes: _1791705578385 or _1791705578385_1791705794297
  base = base.replace(/_\d{10,}/g, '');
  return base.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    // Only scan legitimate library and models folders; NEVER scan temporary folders
    const [libFiles, modelFiles] = await Promise.all([
      bunnyStorage.listFiles('uploads/skp_library').catch(() => [] as BunnyFileItem[]),
      bunnyStorage.listFiles('uploads/models').catch(() => [] as BunnyFileItem[]),
    ]);

    const userIdCookie = req.cookies.get('hc_user_id')?.value;

    // Build GLB lookup map: maps raw base name & clean base name to GLB item
    const glbMap = new Map<string, BunnyFileItem>();
    const standaloneGlbs = new Map<string, { item: BunnyFileItem; folder: string }>();

    for (const f of modelFiles) {
      if (f.ObjectName.toLowerCase().endsWith('.glb')) {
        const rawBase = path.basename(f.ObjectName, '.glb');
        const cleanBase = getCleanBaseName(f.ObjectName);
        glbMap.set(rawBase, f);
        glbMap.set(cleanBase, f);
        standaloneGlbs.set(cleanBase, { item: f, folder: 'uploads/models' });
      }
    }

    // Candidate SKP items: skp_library and models
    const candidateSkpItems: Array<{ item: BunnyFileItem; folder: string }> = [
      ...libFiles.map((f) => ({ item: f, folder: 'uploads/skp_library' })),
      ...modelFiles.map((f) => ({ item: f, folder: 'uploads/models' })),
    ].filter(({ item }) => item.ObjectName.toLowerCase().endsWith('.skp'));

    // Deduplicate by clean model name, keeping newest version of each unique model
    const groupedSkp = new Map<string, { item: BunnyFileItem; folder: string; date: number }>();

    for (const { item, folder } of candidateSkpItems) {
      // User tenancy check
      if (item.ObjectName.includes('__USER__')) {
        if (userIdCookie && !item.ObjectName.startsWith(`${userIdCookie}__USER__`)) {
          // If the item belongs to an admin workspace user, allow other admin workspace users to see it
          const ownerPrefix = item.ObjectName.split('__USER__')[0];
          if (!isAdminWorkspaceUser(userIdCookie) || !isAdminWorkspaceUser(ownerPrefix)) {
            continue;
          }
        }
      } else {
        if (userIdCookie && !isAdminWorkspaceUser(userIdCookie)) continue;
      }

      const cleanKey = getCleanBaseName(item.ObjectName);
      const itemDate = new Date(item.LastChanged || 0).getTime();
      const existing = groupedSkp.get(cleanKey);

      if (!existing || itemDate > existing.date) {
        groupedSkp.set(cleanKey, { item, folder, date: itemDate });
      }
    }

    const records: SkpFileRecord[] = [];
    const matchedCleanKeys = new Set<string>();

    for (const [cleanKey, { item, folder }] of groupedSkp.entries()) {
      matchedCleanKeys.add(cleanKey);
      const storagePath = `${folder}/${item.ObjectName}`;
      const rawBase = path.basename(item.ObjectName, '.skp');
      const matchingGlb = glbMap.get(rawBase) || glbMap.get(cleanKey);

      const isConverted = Boolean(matchingGlb);
      const glbUrl = matchingGlb
        ? bunnyStorage.getPublicUrl(`uploads/models/${matchingGlb.ObjectName}`)
        : undefined;

      records.push({
        id: storagePath,
        name: cleanKey,
        filename: item.ObjectName,
        storagePath,
        size: item.Length,
        sizeMB: (item.Length / 1024 / 1024).toFixed(2),
        updatedAt: item.LastChanged || new Date().toISOString(),
        isConverted,
        glbUrl,
        publicUrl: bunnyStorage.getPublicUrl(storagePath),
        modelType: /meja|table|kursi|chair|furniture|lemari|cabinet|sofa/i.test(item.ObjectName)
          ? 'furniture'
          : 'architecture',
      });
    }

    // Include standalone GLBs if no matching SKP exists
    for (const [cleanKey, { item, folder }] of standaloneGlbs.entries()) {
      if (!matchedCleanKeys.has(cleanKey)) {
        if (item.ObjectName.includes('__USER__')) {
          if (userIdCookie && !item.ObjectName.startsWith(`${userIdCookie}__USER__`)) {
            const ownerPrefix = item.ObjectName.split('__USER__')[0];
            if (!isAdminWorkspaceUser(userIdCookie) || !isAdminWorkspaceUser(ownerPrefix)) {
              continue;
            }
          }
        } else {
          if (userIdCookie && !isAdminWorkspaceUser(userIdCookie)) continue;
        }

        const storagePath = `${folder}/${item.ObjectName}`;
        const glbUrl = bunnyStorage.getPublicUrl(storagePath);

        records.push({
          id: storagePath,
          name: cleanKey,
          filename: item.ObjectName,
          storagePath,
          size: item.Length,
          sizeMB: (item.Length / 1024 / 1024).toFixed(2),
          updatedAt: item.LastChanged || new Date().toISOString(),
          isConverted: true,
          glbUrl,
          publicUrl: glbUrl,
          modelType: /meja|table|kursi|chair|furniture|lemari|cabinet|sofa/i.test(cleanKey || item.ObjectName)
            ? 'furniture'
            : 'architecture',
        });
      }
    }

    // Sort newest first
    records.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json(
      {
        success: true,
        files: records,
        totalCount: records.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
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
    // Check user permissions: user01 and user02 cannot delete files
    const userIdCookie = req.cookies.get('hc_user_id')?.value;
    if (!userIdCookie || !canDeleteProject(userIdCookie)) {
      return NextResponse.json(
        { error: 'Hanya akun Admin utama yang memiliki izin untuk menghapus file dari storage.' },
        { status: 403 }
      );
    }

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
