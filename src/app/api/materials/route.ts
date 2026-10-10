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

    // 1. Batch materials creation
    if (body.materials && Array.isArray(body.materials)) {
      const itemsToSave: MaterialOption[] = body.materials.map((item: any, idx: number) => ({
        id: item.id || `custom_mat_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name: (item.name || `Material Tekstur ${idx + 1}`).trim(),
        category: item.category || 'wall',
        type: 'texture',
        color: item.color || '#FFFFFF',
        textureUrl: item.textureUrl,
        previewThumbnail: item.previewThumbnail || item.textureUrl,
        roughness: typeof item.roughness === 'number' ? item.roughness : 0.35,
        metalness: typeof item.metalness === 'number' ? item.metalness : 0.05,
        bumpScale: typeof item.bumpScale === 'number' ? item.bumpScale : 0.15,
        rotation: typeof item.rotation === 'number' ? item.rotation : 0,
        repeat: Array.isArray(item.repeat) ? item.repeat : [4, 4],
        finish: item.finish || 'gloss',
        description: item.description || 'Custom user uploaded architectural PBR material.',
        tag: item.tag || 'Custom PBR',
        isCustomUpload: true,
      }));

      const saved = await db.createCustomMaterials(itemsToSave);
      return NextResponse.json(
        {
          success: true,
          count: saved.length,
          materials: saved,
        },
        { status: 201 }
      );
    }

    // 2. Single material creation
    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: 'Material name and category are required' },
        { status: 400 }
      );
    }

    const newMaterial: MaterialOption = {
      id: body.id || `custom_mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

    return NextResponse.json(
      {
        success: true,
        material: saved,
      },
      { status: 201 }
    );
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
