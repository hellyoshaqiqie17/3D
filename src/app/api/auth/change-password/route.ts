import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { User } from '@/types';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword, userId } = body;

    // 1. Resolve user from cookies or payload
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hc_session_user');
    const userIdCookie = cookieStore.get('hc_user_id');

    let resolvedUserId = userId || userIdCookie?.value;
    if (sessionCookie?.value) {
      const parsed = parseCookieUser(sessionCookie.value);
      if (parsed?.id) resolvedUserId = parsed.id;
    }

    if (!resolvedUserId) {
      resolvedUserId = 'admin';
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi baru minimal harus 6 karakter.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.' },
        { status: 400 }
      );
    }

    // 2. Verify current password
    const expectedPassword = await db.getPasswordForUser(resolvedUserId);
    const isValid = currentPassword === expectedPassword;

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi saat ini tidak sesuai.' },
        { status: 401 }
      );
    }

    // 3. Update password
    await db.setPasswordForUser(resolvedUserId, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan gunakan kata sandi baru untuk login berikutnya.',
    });
  } catch (error) {
    console.error('Failed to change password:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat memperbarui kata sandi.' },
      { status: 500 }
    );
  }
}
