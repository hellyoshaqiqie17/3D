import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (process.env.VPS_API_URL) {
      try {
        const vpsBase = process.env.VPS_API_URL.replace(/\/$/, '');
        const vpsRes = await fetch(`${vpsBase}/api/projects/${id}`, {
          headers: { cookie: req.headers.get('cookie') || '' },
          cache: 'no-store',
        });
        if (vpsRes.ok) {
          const vpsData = await vpsRes.json();
          return NextResponse.json(vpsData);
        }
      } catch (err) {
        console.warn(`[Vercel->VPS] Failed GET /api/projects/${id} proxy, using local DB:`, err);
      }
    }

    const project = await db.getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Failed to get project:', error);
    return NextResponse.json({ error: 'Failed to retrieve project' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (process.env.VPS_API_URL) {
      try {
        const vpsBase = process.env.VPS_API_URL.replace(/\/$/, '');
        const vpsRes = await fetch(`${vpsBase}/api/projects/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            cookie: req.headers.get('cookie') || '',
          },
          body: JSON.stringify(body),
        });
        if (vpsRes.ok) {
          const vpsData = await vpsRes.json();
          return NextResponse.json(vpsData);
        }
      } catch (err) {
        console.warn(`[Vercel->VPS] Failed PUT /api/projects/${id} proxy, using local DB:`, err);
      }
    }

    const updated = await db.updateProject(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (process.env.VPS_API_URL) {
      try {
        const vpsBase = process.env.VPS_API_URL.replace(/\/$/, '');
        const vpsRes = await fetch(`${vpsBase}/api/projects/${id}`, {
          method: 'DELETE',
          headers: { cookie: req.headers.get('cookie') || '' },
        });
        if (vpsRes.ok) {
          const vpsData = await vpsRes.json();
          return NextResponse.json(vpsData);
        }
      } catch (err) {
        console.warn(`[Vercel->VPS] Failed DELETE /api/projects/${id} proxy, deleting locally:`, err);
      }
    }

    const deleted = await db.deleteProject(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
