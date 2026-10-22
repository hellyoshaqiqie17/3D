import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Pendaftaran akun baru telah dinonaktifkan oleh administrator.',
    },
    { status: 403 }
  );
}
