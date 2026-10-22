import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { BUNNY_STORAGE_CONFIG, bunnyStorage } from '@/lib/bunny-storage';
import { isAdminWorkspaceUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const originalName = body.filename || 'model.glb';
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    let userIdCookie = req.cookies.get('hc_user_id')?.value;
    
    // Normalize admin workspace users to use the shared admin workspace prefix
    if (isAdminWorkspaceUser(userIdCookie)) {
      userIdCookie = 'usr-admin-lead';
    }

    const prefix = userIdCookie ? `${userIdCookie}__USER__` : '';
    const safeFilename = `${prefix}${baseName}_${timestamp}${ext}`;

    const isSkp = ext === '.skp';
    const targetFolder = body.targetFolder || (isSkp ? 'temp' : 'models');
    const storagePath = `uploads/${targetFolder}/${safeFilename}`;

    const endpoint = BUNNY_STORAGE_CONFIG.endpoint.replace(/\/$/, '');
    const uploadUrl = `${endpoint}/${BUNNY_STORAGE_CONFIG.zone}/${storagePath}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      storagePath,
      accessKey: BUNNY_STORAGE_CONFIG.accessKey,
      isSkp,
      safeFilename,
      baseName,
      timestamp,
      publicUrl: bunnyStorage.getPublicUrl(storagePath),
    });
  } catch (err: any) {
    console.error('[Upload Direct Sign] Error:', err);
    return NextResponse.json({ error: 'Failed to prepare direct upload' }, { status: 500 });
  }
}
