import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { User } from '@/types';
import { db, ADMIN_USER, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER } from '@/lib/db';

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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hc_session_user');
    const userIdCookie = cookieStore.get('hc_user_id');

    let resolvedUser: User | null = null;

    // 1. Try resolving via session cookie
    if (sessionCookie?.value) {
      const parsed = parseCookieUser(sessionCookie.value);
      if (parsed && parsed.id) {
        resolvedUser = (await db.getUserById(parsed.id)) || parsed;
      }
    }

    // 2. Fallback to lightweight hc_user_id cookie
    if (!resolvedUser && userIdCookie?.value) {
      resolvedUser = await db.getUserById(userIdCookie.value);
    }

    if (resolvedUser) {
      return NextResponse.json({
        success: true,
        user: resolvedUser,
      });
    }

    return NextResponse.json({
      success: false,
      user: null,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, user: null },
      { status: 500 }
    );
  }
}
