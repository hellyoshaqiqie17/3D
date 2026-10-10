import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, studioName, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Work email and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 4 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await db.getUserByEmail(normalizedEmail);

    if (existingUser) {
      // User already exists, update studio name if provided and log in
      const updatedUser = await db.createUser({
        name: name || existingUser.name,
        email: normalizedEmail,
        studioName: studioName || existingUser.studioName,
        role: role || existingUser.role,
      });

      const response = NextResponse.json({
        success: true,
        user: updatedUser,
        message: 'Studio account authenticated.',
      });

      response.cookies.set('hc_session_user', JSON.stringify(updatedUser), {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      response.cookies.set('hc_user_id', updatedUser.id, {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });

      return response;
    }

    // Determine readable name and studio
    const finalName =
      name?.trim() ||
      normalizedEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') ||
      'Principal Architect';

    const finalStudio =
      studioName?.trim() ||
      normalizedEmail.split('@')[1]?.split('.')[0].toUpperCase() + ' Architecture Studio' ||
      'Independent Architectural Studio';

    const newUser = await db.createUser({
      name: finalName,
      email: normalizedEmail,
      studioName: finalStudio,
      role: role?.trim() || 'Principal Partner',
    });

    const response = NextResponse.json({
      success: true,
      user: newUser,
      message: 'Studio workspace initialized successfully.',
    });

    response.cookies.set('hc_session_user', JSON.stringify(newUser), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    response.cookies.set('hc_user_id', newUser.id, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create studio account.' },
      { status: 500 }
    );
  }
}
