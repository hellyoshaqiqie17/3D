import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Destination folder for uploaded CAD models
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'models');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const safeFilename = `${baseName}_${timestamp}${ext}`;
    const destinationPath = path.join(UPLOAD_DIR, safeFilename);

    // Convert file arrayBuffer to Buffer and write
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destinationPath, buffer);

    const fileUrl = `/uploads/models/${safeFilename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: safeFilename,
      originalName,
      sizeBytes: buffer.length,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
