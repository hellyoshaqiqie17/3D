import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Project } from '@/types';

export async function GET() {
  try {
    const projects = await db.getAllProjects();
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Failed to get projects:', error);
    return NextResponse.json({ error: 'Failed to retrieve projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.modelUrl) {
      return NextResponse.json(
        { error: 'Project name and modelUrl are required' },
        { status: 400 }
      );
    }

    const newProject: Project = {
      id: body.id || `proj_${Date.now()}`,
      name: body.name,
      clientName: body.clientName || 'General',
      description: body.description || '',
      modelUrl: body.modelUrl,
      thumbnailUrl: body.thumbnailUrl || '/models/villa-thumb.jpg',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: body.status || 'published',
      viewsCount: body.viewsCount || 0,
      savedConfigsCount: body.savedConfigsCount || 0,
      zones: body.zones || [],
    };

    const created = await db.createProject(newProject);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
