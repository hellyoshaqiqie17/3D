import { NextRequest, NextResponse } from 'next/server';
import { db, canDeleteProject } from '@/lib/db';
import { User } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseCookieUser(raw: string): User | null {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const project = await db.getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    console.error('Failed to get project:', error);
    return NextResponse.json({ error: 'Failed to retrieve project' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

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

    // Check user permissions: user01 and user02 cannot delete projects
    let requesterId: string | undefined = req.cookies.get('hc_user_id')?.value;
    if (!requesterId) {
      const sessionCookie = req.cookies.get('hc_session_user')?.value;
      if (sessionCookie) {
        const parsed = parseCookieUser(sessionCookie);
        if (parsed?.id) requesterId = parsed.id;
      }
    }

    if (!requesterId || !canDeleteProject(requesterId)) {
      return NextResponse.json(
        { error: 'Hanya akun Admin utama yang memiliki izin untuk menghapus project.' },
        { status: 403 }
      );
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
