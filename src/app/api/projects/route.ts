import { NextRequest, NextResponse } from 'next/server';
import { db, isAdminWorkspaceUser } from '@/lib/db';
import { Project, User } from '@/types';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let requestedUserId = searchParams.get('userId');

    // If no userId query param, check session cookies
    if (!requestedUserId) {
      const userIdCookie = req.cookies.get('hc_user_id');
      if (userIdCookie?.value) {
        requestedUserId = userIdCookie.value;
      }
    }

    if (!requestedUserId) {
      const sessionCookie = req.cookies.get('hc_session_user');
      if (sessionCookie?.value) {
        const parsed = parseCookieUser(sessionCookie.value);
        if (parsed?.id) {
          requestedUserId = parsed.id;
        }
      }
    }

    const projects = await db.getProjectsByUser(requestedUserId || undefined);
    return NextResponse.json(projects, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
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

    // Determine owner userId
    let ownerUserId = body.userId;
    if (!ownerUserId) {
      const userIdCookie = req.cookies.get('hc_user_id');
      if (userIdCookie?.value) {
        ownerUserId = userIdCookie.value;
      }
    }

    if (!ownerUserId) {
      const sessionCookie = req.cookies.get('hc_session_user');
      if (sessionCookie?.value) {
        const parsed = parseCookieUser(sessionCookie.value);
        if (parsed?.id) {
          ownerUserId = parsed.id;
        }
      }
    }

    // If owner belongs to admin workspace, keep workspace unified under usr-admin-lead
    if (isAdminWorkspaceUser(ownerUserId)) {
      ownerUserId = 'usr-admin-lead';
    }

    const newProject: Project = {
      id: body.id || `proj_${Date.now()}`,
      userId: ownerUserId || 'usr-admin-lead',
      isPublic: body.isPublic || false,
      name: body.name,
      clientName: body.clientName || 'General Client',
      description: body.description || '',
      modelUrl: body.modelUrl,
      thumbnailUrl: body.thumbnailUrl || '/models/villa-thumb.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'published',
      viewsCount: 0,
      savedConfigsCount: 0,
      zones: body.zones || [],
      modelType: body.modelType || 'architecture',
    };

    const saved = await db.createProject(newProject);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
