import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MaterialOption } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const materials = await db.getCustomMaterials();
    return NextResponse.json(
      {
        success: true,
        materials,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
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
      const itemsToSave: MaterialOption[] = body.materials.map((item: any, idx: number) => {
        const isPaint = item.category === 'paint' || item.tag?.toLowerCase().includes('cat');
        const itemCategory = isPaint ? 'paint' : (item.category || 'wall');
        const itemSurfaceType = isPaint ? 'wall' : (item.surfaceType || (itemCategory === 'floor' ? 'floor' : 'wall'));
        const isFloor = itemSurfaceType === 'floor';

        return {
          id: item.id || `custom_mat_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          name: (item.name || (isPaint ? `Warna Cat ${idx + 1}` : `Material Tekstur ${idx + 1}`)).trim(),
          category: itemCategory,
          type: item.type || 'texture',
          color: item.color || '#FFFFFF',
          textureUrl: item.textureUrl,
          previewThumbnail: item.previewThumbnail || item.textureUrl,
          roughness: typeof item.roughness === 'number' ? item.roughness : (isPaint ? 0.88 : 0.35),
          metalness: typeof item.metalness === 'number' ? item.metalness : 0.01,
          bumpScale: typeof item.bumpScale === 'number' ? item.bumpScale : (isPaint ? 0.04 : 0.15),
          rotation: typeof item.rotation === 'number' ? item.rotation : 0,
          repeat: Array.isArray(item.repeat) ? item.repeat : (isPaint ? [2, 2] : [4, 4]),
          finish: item.finish || (isPaint ? 'matte' : 'gloss'),
          tileSizeCm: Array.isArray(item.tileSizeCm) ? item.tileSizeCm : isFloor ? [60, 60] : [30, 60],
          surfaceType: itemSurfaceType,
          showGrout: typeof item.showGrout === 'boolean' ? item.showGrout : !isPaint,
          groutWidthMm: typeof item.groutWidthMm === 'number' ? item.groutWidthMm : (isPaint ? 0 : 2),
          groutColor: item.groutColor || '#8E9297',
          description: item.description || (isPaint ? 'Warna cat dinding arsitektural.' : `Pola keramik ${isFloor ? 'lantai' : 'dinding'} kustom.`),
          tag: item.tag || (isPaint ? 'Cat Dinding' : (isFloor ? 'Keramik Lantai' : 'Keramik Dinding')),
          isCustomUpload: true,
        };
      });

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

    const isPaint = body.category === 'paint' || body.tag?.toLowerCase().includes('cat');
    const itemCategory = isPaint ? 'paint' : body.category;
    const itemSurfaceType = isPaint ? 'wall' : (body.surfaceType || (itemCategory === 'floor' ? 'floor' : 'wall'));
    const isFloor = itemSurfaceType === 'floor';

    const newMaterial: MaterialOption = {
      id: body.id || `custom_mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: body.name.trim(),
      category: itemCategory,
      type: body.type || 'texture',
      color: body.color || '#FFFFFF',
      textureUrl: body.textureUrl,
      previewThumbnail: body.previewThumbnail || body.textureUrl,
      roughness: typeof body.roughness === 'number' ? body.roughness : (isPaint ? 0.88 : 0.35),
      metalness: typeof body.metalness === 'number' ? body.metalness : 0.01,
      bumpScale: typeof body.bumpScale === 'number' ? body.bumpScale : (isPaint ? 0.04 : 0.15),
      rotation: typeof body.rotation === 'number' ? body.rotation : 0,
      repeat: Array.isArray(body.repeat) ? body.repeat : (isPaint ? [2, 2] : [4, 4]),
      finish: body.finish || (isPaint ? 'matte' : body.roughness < 0.3 ? 'gloss' : 'textured'),
      tileSizeCm: Array.isArray(body.tileSizeCm) ? body.tileSizeCm : isFloor ? [60, 60] : [30, 60],
      surfaceType: itemSurfaceType,
      showGrout: typeof body.showGrout === 'boolean' ? body.showGrout : !isPaint,
      groutWidthMm: typeof body.groutWidthMm === 'number' ? body.groutWidthMm : (isPaint ? 0 : 2),
      groutColor: body.groutColor || '#8E9297',
      description: body.description || (isPaint ? 'Warna cat dinding arsitektural.' : `Pola keramik ${isFloor ? 'lantai' : 'dinding'} kustom.`),
      tag: body.tag || (isPaint ? 'Cat Dinding' : (isFloor ? 'Keramik Lantai' : 'Keramik Dinding')),
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
