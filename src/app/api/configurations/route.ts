import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProjectConfiguration } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const configs = await db.getConfigurations(projectId);
    return NextResponse.json(configs);
  } catch (error: any) {
    console.error('Failed to get configurations:', error);
    return NextResponse.json({ error: 'Failed to retrieve configurations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.projectId || !body.materials) {
      return NextResponse.json(
        { error: 'projectId and materials are required' },
        { status: 400 }
      );
    }

    const newConfig: ProjectConfiguration = {
      id: body.id || `cfg_${Date.now()}`,
      projectId: body.projectId,
      title: body.title || 'Custom Preset',
      materials: body.materials,
      customColors: body.customColors || {},
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.saveConfiguration(newConfig);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Failed to save configuration:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
