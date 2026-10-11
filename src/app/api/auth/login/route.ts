import { NextResponse } from 'next/server';
import { db, ADMIN_USER, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER } from '@/lib/db';
import { User } from '@/types';

function setAuthCookies(response: NextResponse, user: User) {
  // Set JSON user cookie (URL-safe stringified)
  response.cookies.set('hc_session_user', JSON.stringify(user), {
    path: '/',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  // Set lightweight string user ID cookie (guaranteed no JSON encoding issues)
  response.cookies.set('hc_user_id', user.id, {
    path: '/',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password, isGoogle, provider } = body;

    // Handle Google Login Flow
    if (isGoogle || provider === 'google') {
      const response = NextResponse.json({
        success: true,
        user: GOOGLE_DEMO_USER,
        message: 'Google Workspace authenticated successfully.',
      });
      setAuthCookies(response, GOOGLE_DEMO_USER);
      return response;
    }

    const identifier = (email || username || '').toLowerCase().trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Please enter both username/email and password.' },
        { status: 400 }
      );
    }

    // 1. SPECIFIC REQUIREMENT: Check admin / admin123
    if (
      identifier === 'admin' ||
      identifier === 'admin@mitramegahinterior.com' ||
      identifier === 'admin@homecraft3d.com' ||
      identifier === 'admin@atelier3d.com'
    ) {
      if (password === 'admin123') {
        const response = NextResponse.json({
          success: true,
          user: ADMIN_USER,
          message: 'Welcome back, Super Admin Architect.',
        });
        setAuthCookies(response, ADMIN_USER);
        return response;
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid password for admin account. Hint: admin123' },
          { status: 401 }
        );
      }
    }

    // 2. Demo Account (demo / any password)
    if (
      identifier === 'demo' ||
      identifier === DEFAULT_DEMO_USER.email.toLowerCase()
    ) {
      const response = NextResponse.json({
        success: true,
        user: DEFAULT_DEMO_USER,
        message: 'Welcome back, Lead Architect.',
      });
      setAuthCookies(response, DEFAULT_DEMO_USER);
      return response;
    }

    // 3. Lookup user in DB
    let user = await db.getUserByEmail(identifier);

    if (!user) {
      if (password.length < 3) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 3 characters long.' },
          { status: 400 }
        );
      }

      // Automatically register user for smooth experience
      const domain = identifier.includes('@') ? identifier.split('@')[1] : 'studio';
      const studioName = domain.split('.')[0].toUpperCase() + ' Architecture Studio';
      const rawName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
      const capitalizedName = rawName
        .replace(/[._]/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      user = await db.createUser({
        name: capitalizedName || 'Studio Architect',
        email: identifier.includes('@') ? identifier : `${identifier}@studio.arch`,
        username: identifier,
        studioName: studioName,
        role: 'Architectural Associate',
      });
    }

    const response = NextResponse.json({
      success: true,
      user,
      message: `Signed in as ${user.name}.`,
    });
    setAuthCookies(response, user);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
