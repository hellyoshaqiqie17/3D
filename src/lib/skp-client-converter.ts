/**
 * Client-Side SketchUp (.skp) to GLB Converter
 * 
 * Runs openskp directly inside the browser web worker / client runtime.
 * This completely avoids Vercel Serverless Function timeouts (FUNCTION_INVOCATION_TIMEOUT)
 * and eliminates payload limits for large architectural models (30MB - 100MB+).
 */

export interface SkpClientConvertResult {
  glbBlob: Blob;
  glbBytes: Uint8Array;
  thumbnailBlob?: Blob;
  sizeMB: string;
}

export async function convertSkpClientSide(
  arrayBuffer: ArrayBuffer,
  onProgress?: (stageMessage: string, percentage: number) => void
): Promise<SkpClientConvertResult> {
  onProgress?.('Memuat modul parser SketchUp 3D...', 15);

  const { buildInstancedScene, buildScene, toInstancedGLB, toGLB, extractThumbnail } = await import('openskp');

  onProgress?.('Membaca geometri dan struktur komponen SketchUp...', 25);

  let glbBytes: Uint8Array;
  try {
    try {
      onProgress?.('Membangun struktur geometri dan komponen 3D...', 40);
      const instanced = buildInstancedScene(arrayBuffer);
      onProgress?.('Mengonversi ke Web 3D GLB (Instanced format)...', 70);
      glbBytes = toInstancedGLB(instanced, { textures: true });
    } catch (instErr) {
      console.warn('[SKP Converter] Instanced conversion failed, falling back to flat scene:', instErr);
      onProgress?.('Memproses geometri alternatif (Flat scene mode)...', 55);
      const scene = buildScene(arrayBuffer);
      onProgress?.('Mengonversi ke Web 3D GLB (Binary format)...', 75);
      glbBytes = toGLB(scene);
    }
  } catch (convErr: any) {
    console.error('[SKP Converter] Conversion failed:', convErr);
    throw new Error(`Gagal mengonversi geometri SketchUp: ${convErr?.message || 'Format tidak didukung'}`);
  }

  if (!glbBytes || glbBytes.length === 0) {
    throw new Error('Hasil konversi GLB kosong. File SketchUp mungkin rusak atau tidak berisi geometri 3D.');
  }

  onProgress?.('Mengekstrak gambar pratinjau thumbnail...', 85);
  let thumbnailBlob: Blob | undefined;
  try {
    const thumb = extractThumbnail(arrayBuffer);
    if (thumb && thumb.data && thumb.data.length > 0) {
      thumbnailBlob = new Blob([thumb.data as unknown as BlobPart], { type: 'image/png' });
    }
  } catch (thumbErr) {
    console.warn('[SKP Converter] Embedded thumbnail extraction skipped:', thumbErr);
  }

  onProgress?.('Model 3D GLB berhasil dibuat!', 95);

  const glbBlob = new Blob([glbBytes as unknown as BlobPart], { type: 'model/gltf-binary' });
  const sizeMB = (glbBytes.length / (1024 * 1024)).toFixed(2);

  return {
    glbBlob,
    glbBytes,
    thumbnailBlob,
    sizeMB,
  };
}
