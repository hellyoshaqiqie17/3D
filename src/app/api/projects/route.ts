import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    // Optional proxy to VPS Database when hosted on Vercel
    if (process.env.VPS_API_URL) {
      try {
        const vpsBase = process.env.VPS_API_URL.replace(/\/$/, '');
        const targetUrl = new URL(`${vpsBase}/api/projects`);
        if (requestedUserId) {
          targetUrl.searchParams.set('userId', requestedUserId);
        }
        const vpsRes = await fetch(targetUrl.toString(), {
          headers: {
            cookie: req.headers.get('cookie') || '',
          },
          cache: 'no-store',
        });
        if (vpsRes.ok) {
          const vpsProjects = await vpsRes.json();
          return NextResponse.json(vpsProjects);
        }
      } catch (proxyErr) {
        console.warn('[Vercel->VPS] Failed proxying /api/projects to VPS, using local fallback:', proxyErr);
      }
    }

    const projects = await db.getProjectsByUser(requestedUserId || undefined);
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

    // Optional proxy to VPS Database when hosted on Vercel
    if (process.env.VPS_API_URL) {
      try {
        const vpsBase = process.env.VPS_API_URL.replace(/\/$/, '');
        const vpsRes = await fetch(`${vpsBase}/api/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: req.headers.get('cookie') || '',
          },
          body: JSON.stringify({ ...body, userId: ownerUserId || 'usr-admin-lead' }),
        });
        if (vpsRes.ok) {
          const vpsSaved = await vpsRes.json();
          return NextResponse.json(vpsSaved, { status: 201 });
        }
      } catch (proxyErr) {
        console.warn('[Vercel->VPS] Failed proxying POST /api/projects to VPS, saving locally:', proxyErr);
      }
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
    };

    const saved = await db.createProject(newProject);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
