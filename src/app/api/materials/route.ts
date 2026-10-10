import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MaterialOption } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const materials = await db.getCustomMaterials();
    return NextResponse.json({
      success: true,
      materials,
    });
  } catch (err: any) {
    console.error('[API Materials GET] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve custom materials' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: 'Material name and category are required' },
        { status: 400 }
      );
    }

    const newMaterial: MaterialOption = {
      id: body.id || `custom_mat_${Date.now()}`,
      name: body.name.trim(),
      category: body.category,
      type: body.type || 'texture',
      color: body.color || '#FFFFFF',
      textureUrl: body.textureUrl,
      previewThumbnail: body.previewThumbnail || body.textureUrl,
      roughness: typeof body.roughness === 'number' ? body.roughness : 0.35,
      metalness: typeof body.metalness === 'number' ? body.metalness : 0.05,
      bumpScale: typeof body.bumpScale === 'number' ? body.bumpScale : 0.15,
      rotation: typeof body.rotation === 'number' ? body.rotation : 0,
      repeat: Array.isArray(body.repeat) ? body.repeat : [4, 4],
      finish: body.finish || (body.roughness < 0.3 ? 'gloss' : 'textured'),
      description: body.description || 'Custom user uploaded architectural PBR material.',
      tag: body.tag || 'Custom PBR',
      isCustomUpload: true,
    };

    const saved = await db.createCustomMaterial(newMaterial);

    return NextResponse.json({
      success: true,
      material: saved,
    }, { status: 201 });
  } catch (err: any) {
    console.error('[API Materials POST] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to save custom material' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    const success = await db.deleteCustomMaterial(id);
    return NextResponse.json({ success, id });
  } catch (err: any) {
    console.error('[API Materials DELETE] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to delete custom material' },
      { status: 500 }
    );
  }
}
