import { NextResponse } from 'next/server';
import { db, ADMIN_USER, USER_01, USER_02, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER } from '@/lib/db';
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
      const expectedAdminPassword = await db.getPasswordForUser('admin');
      if (password === expectedAdminPassword || password === 'admin123') {
        const response = NextResponse.json({
          success: true,
          user: ADMIN_USER,
          message: 'Selamat datang kembali, Administrator Mitra Megah Interior.',
        });
        setAuthCookies(response, ADMIN_USER);
        return response;
      } else {
        return NextResponse.json(
          { success: false, message: 'Kata sandi salah. Silakan periksa kembali kata sandi Anda.' },
          { status: 401 }
        );
      }
    }

    // 1b. Shared Workspace Accounts: user01 & user02
    if (identifier === 'user01' || identifier === 'user01@mitramegahinterior.com') {
      const expectedPassword = await db.getPasswordForUser('user01');
      if (password === expectedPassword || password === '123456') {
        const response = NextResponse.json({
          success: true,
          user: USER_01,
          message: 'Selamat datang kembali, User 01.',
        });
        setAuthCookies(response, USER_01);
        return response;
      } else {
        return NextResponse.json(
          { success: false, message: 'Kata sandi salah. Silakan periksa kembali kata sandi Anda.' },
          { status: 401 }
        );
      }
    }

    if (identifier === 'user02' || identifier === 'user02@mitramegahinterior.com') {
      const expectedPassword = await db.getPasswordForUser('user02');
      if (password === expectedPassword || password === '234567') {
        const response = NextResponse.json({
          success: true,
          user: USER_02,
          message: 'Selamat datang kembali, User 02.',
        });
        setAuthCookies(response, USER_02);
        return response;
      } else {
        return NextResponse.json(
          { success: false, message: 'Kata sandi salah. Silakan periksa kembali kata sandi Anda.' },
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
    const user = await db.getUserByEmail(identifier);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akun tidak ditemukan. Pendaftaran akun baru dinonaktifkan.' },
        { status: 404 }
      );
    }

    const expectedUserPassword = await db.getPasswordForUser(user.id || user.username || user.email);
    if (password !== expectedUserPassword) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi salah. Silakan periksa kembali kata sandi Anda.' },
        { status: 401 }
      );
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
