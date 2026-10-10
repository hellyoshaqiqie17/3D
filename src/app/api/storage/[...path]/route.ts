import { NextRequest, NextResponse } from 'next/server';
import { bunnyStorage } from '@/lib/bunny-storage';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    const storagePath = pathSegments.join('/');
    const rangeHeader = req.headers.get('range');

    const bunnyRes = await bunnyStorage.download(storagePath, rangeHeader);

    if (!bunnyRes.ok && bunnyRes.status !== 206) {
      return new NextResponse('File not found or inaccessible', {
        status: bunnyRes.status === 404 ? 404 : 502,
      });
    }

    // Determine content type
    let contentType = bunnyRes.headers.get('content-type') || 'application/octet-stream';
    const lower = storagePath.toLowerCase();
    if (lower.endsWith('.glb')) {
      contentType = 'model/gltf-binary';
    } else if (lower.endsWith('.gltf')) {
      contentType = 'model/gltf+json';
    } else if (lower.endsWith('.skp')) {
      contentType = 'application/octet-stream';
    } else if (lower.endsWith('.png')) {
      contentType = 'image/png';
    } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (lower.endsWith('.json')) {
      contentType = 'application/json';
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    const contentLength = bunnyRes.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    const contentRange = bunnyRes.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    const acceptRanges = bunnyRes.headers.get('accept-ranges') || 'bytes';
    headers.set('Accept-Ranges', acceptRanges);

    return new NextResponse(bunnyRes.body, {
      status: bunnyRes.status,
      headers,
    });
  } catch (err: any) {
    console.error('[Storage Proxy] Error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
