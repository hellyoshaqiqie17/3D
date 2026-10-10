import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out of studio workspace.',
  });

  response.cookies.set('hc_session_user', '', {
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('hc_user_id', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
