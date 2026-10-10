import { jsPDF } from 'jspdf';
import { Project, MaterialZone, MaterialOption } from '@/types';

export interface CapturedView {
  id: string;
  title: string;
  subtitle: string;
  dataUrl: string;
}

export interface ViewpointConfig {
  id: string;
  title: string;
  subtitle: string;
  hideRoof: boolean;
  fov: number;
  pos: [number, number, number];
  target: [number, number, number];
}

/**
 * Universal Camera Calculation for ANY architectural 3D model.
 * Automatically adapts to any bounding box dimensions (W x H x D),
 * ensuring eye-level interior views and clear floor plans regardless of model size.
 */
export function calculateUniversalViewpoints(
  size: [number, number, number],
  center: [number, number, number]
): ViewpointConfig[] {
  const w = Math.max(size[0] || 4.7, 2.5);
  const h = Math.max(size[1] || 3.0, 2.2);
  const d = Math.max(size[2] || 6.0, 2.5);

  const cX = center[0] || 0;
  const cY = 0; // Ground / floor level inside model
  const cZ = center[2] || 0;

  // Comfortable human eye-level (standard architectural 1.40m - 1.50m)
  const eyeLevel = Math.min(cY + 1.45, h * 0.52);

  return [
    {
      id: 'hero',
      title: 'Tampak Isometrik 3D Utama',
      subtitle: 'Sudut pandang 3D diagonal arsitektural (Hero Perspective Mockup)',
      hideRoof: false,
      fov: 50,
      pos: [cX + w * 0.95, h * 1.05 + Math.max(w, d) * 0.35, cZ + d * 0.95],
      target: [cX, h * 0.35, cZ],
    },
    {
      id: 'top',
      title: 'Tampak Atas / Denah Ruang',
      subtitle: 'Tata letak denah interior, partisi & lantai (Top Plan View)',
      hideRoof: true, // Slices roof/ceiling to reveal the interior floor plan layout
      fov: 42,
      pos: [cX, h + Math.max(w, d) * 1.25, cZ + 0.001],
      target: [cX, 0, cZ],
    },
    {
      id: 'interior_front',
      title: 'Bagian Dalam - Tampak Depan',
      subtitle: 'Sudut pandang interior mata manusia menghadap area depan ruangan',
      hideRoof: false,
      fov: 76,
      pos: [cX, eyeLevel, cZ - d * 0.30], // Placed inside rear seating area looking forward
      target: [cX, eyeLevel - 0.02, cZ + d * 0.46], // Looking straight forward
    },
    {
      id: 'interior_back',
      title: 'Bagian Dalam - Tampak Belakang',
      subtitle: 'Sudut pandang interior mata manusia menghadap area belakang ruangan',
      hideRoof: false,
      fov: 76,
      pos: [cX, eyeLevel, cZ + d * 0.30], // Placed inside front area (clears perimeter window mullions)
      target: [cX, eyeLevel - 0.02, cZ - d * 0.46], // Looking straight rear
    },
    {
      id: 'interior_left',
      title: 'Bagian Dalam - Samping Kiri',
      subtitle: 'Sudut pandang interior mata manusia menghadap bidang dinding kiri',
      hideRoof: false,
      fov: 78,
      pos: [cX + w * 0.18, eyeLevel, cZ], // Open central walkway, safe clearance from right wall
      target: [cX - w * 0.46, eyeLevel - 0.02, cZ], // Looking across to left wall & furnishings
    },
    {
      id: 'interior_right',
      title: 'Bagian Dalam - Samping Kanan',
      subtitle: 'Sudut pandang interior mata manusia menghadap bidang dinding kanan',
      hideRoof: false,
      fov: 78,
      pos: [cX - w * 0.18, eyeLevel, cZ], // Open central walkway, prevents clipping into left wall & panels
      target: [cX + w * 0.46, eyeLevel - 0.02, cZ], // Looking across to right wall (TV/entertainment)
    },
  ];
}

/**
 * Safely locates the actual WebGL HTMLCanvasElement across React Three Fiber wrapper divs.
 */
export function getThreeCanvasElement(): HTMLCanvasElement {
  if (typeof window === 'undefined') {
    throw new Error('Window environment tidak tersedia.');
  }

  // 1. Explicit window reference set in ConfiguratorCanvas
  if ((window as any).__THREE_CANVAS__ instanceof HTMLCanvasElement) {
    return (window as any).__THREE_CANVAS__;
  }
  if ((window as any).__THREE_GL__?.domElement instanceof HTMLCanvasElement) {
    return (window as any).__THREE_GL__.domElement;
  }

  // 2. Direct canvas ID
  const direct = document.getElementById('configurator-3d-webgl-canvas');
  if (direct instanceof HTMLCanvasElement) {
    return direct;
  }

  // 3. Child canvas inside the R3F wrapper div
  const wrapper = document.getElementById('configurator-3d-canvas');
  if (wrapper instanceof HTMLCanvasElement) {
    return wrapper;
  }
  if (wrapper) {
    const child = wrapper.querySelector('canvas');
    if (child instanceof HTMLCanvasElement) {
      return child;
    }
  }

  // 4. Any canvas element in document
  const anyCanvas = document.querySelector('canvas');
  if (anyCanvas instanceof HTMLCanvasElement) {
    return anyCanvas;
  }

  throw new Error('Canvas 3D WebGL tidak ditemukan. Pastikan 3D Configurator telah dimuat sepenuhnya.');
}

/**
 * Automates the 3D camera to capture all 6 architectural viewpoints sequentially.
 * Safely restores the user's camera and visibility state afterwards.
 */
export async function captureArchitectureViews(
  size: [number, number, number],
  center: [number, number, number],
  setRoofHidden: (val: boolean) => void,
  wasRoofHidden: boolean,
  onProgress: (step: number, total: number, message: string) => void
): Promise<CapturedView[]> {
  const viewpoints = calculateUniversalViewpoints(size, center);
  const total = viewpoints.length;
  const results: CapturedView[] = [];

  const canvas = getThreeCanvasElement();

  // Backup current camera state from window.__THREE_CAMERA__
  const threeCam = (window as any).__THREE_CAMERA__;
  const threeControls = (window as any).__THREE_CONTROLS__;
  const renderFrame = (window as any).__THREE_RENDER_FRAME__;

  const initialCamPos = threeCam?.position ? [threeCam.position.x, threeCam.position.y, threeCam.position.z] : null;
  const initialTarget = threeControls?.target ? [threeControls.target.x, threeControls.target.y, threeControls.target.z] : null;
  const initialFov = threeCam?.fov || 50;

  try {
    for (let i = 0; i < viewpoints.length; i++) {
      const vp = viewpoints[i];
      onProgress(i + 1, total, `Mengambil ${vp.title}...`);

      // 1. Set roof visibility
      setRoofHidden(vp.hideRoof);

      // 2. Dispatch instant camera orientation
      window.dispatchEvent(
        new CustomEvent('cad-orient-camera', {
          detail: {
            pos: vp.pos,
            target: vp.target,
            fov: vp.fov,
            instant: true,
          },
        })
      );

      // 3. Render frame and wait for WebGL flush
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (typeof renderFrame === 'function') {
        renderFrame();
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (typeof renderFrame === 'function') {
        renderFrame();
      }

      // 4. Capture high-res snapshot
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      results.push({
        id: vp.id,
        title: vp.title,
        subtitle: vp.subtitle,
        dataUrl,
      });
    }
  } finally {
    // Restore user's original camera, target, fov, and roof visibility
    setRoofHidden(wasRoofHidden);
    if (initialCamPos && initialTarget) {
      window.dispatchEvent(
        new CustomEvent('cad-orient-camera', {
          detail: {
            pos: initialCamPos,
            target: initialTarget,
            fov: initialFov,
            instant: true,
          },
        })
      );
      if (typeof renderFrame === 'function') {
        renderFrame();
      }
    }
  }

  return results;
}

/** Helper to convert Hex to RGB array */
function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Builds a professional 3-page Landscape A4 Architectural Report PDF.
 */
export function buildArchitectureReportPdf(
  project: Project,
  size: [number, number, number],
  views: CapturedView[],
  zones: MaterialZone[],
  selectedMaterials: Record<string, string>,
  customColors: Record<string, string>,
  uploadedMaterials: MaterialOption[]
): jsPDF {
  // Landscape A4: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  const w = (size[0] || 4.7).toFixed(2);
  const h = (size[1] || 3.2).toFixed(2);
  const d = (size[2] || 7.9).toFixed(2);
  const floorArea = (parseFloat(w) * parseFloat(d)).toFixed(1);
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const heroView = views.find((v) => v.id === 'hero');
  const topView = views.find((v) => v.id === 'top');
  const frontView = views.find((v) => v.id === 'interior_front');
  const backView = views.find((v) => v.id === 'interior_back');
  const leftView = views.find((v) => v.id === 'interior_left');
  const rightView = views.find((v) => v.id === 'interior_right');

  // Helper for consistent headers
  const renderHeader = (sheetNumber: string, sheetTitle: string, subtitle: string) => {
    // Dark Charcoal Header Banner
    doc.setFillColor(24, 24, 27); // #18181B
    doc.rect(0, 0, pageWidth, 20, 'F');

    // Accent line (Gold/Amber)
    doc.setFillColor(217, 119, 6); // #D97706
    doc.rect(0, 20, pageWidth, 1.2, 'F');

    // Left: Project title
    doc.setTextColor(244, 244, 245); // #F4F4F5
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text((project.name || 'PROYEK ARSITEKTUR').toUpperCase(), 14, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 161, 170); // #A1A1AA
    doc.text(`HOMECRAFT 3D ARCHITECTURAL CAD REPORT | ${sheetTitle.toUpperCase()}`, 14, 15);

    // Right: Date & Sheet Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(244, 244, 245);
    doc.text(sheetNumber, pageWidth - 14, 9, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 161, 170);
    doc.text(`${dateStr} | REV 1.0`, pageWidth - 14, 15, { align: 'right' });

    // Subtitle plaque
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(82, 82, 91);
    doc.text(subtitle, 14, 27);
  };

  // Helper for consistent footer
  const renderFooter = (pageStr: string) => {
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 113, 122);
    doc.text('Dihasilkan secara otomatis oleh HomeCraft 3D CAD - Interactive Architectural Configurator', 14, pageHeight - 7);
    doc.text(pageStr, pageWidth - 14, pageHeight - 7, { align: 'right' });
  };

  // ==========================================
  // SHEET 01: COVER & HERO 3D PERSPECTIVE VIEW
  // ==========================================
  renderHeader(
    'SHEET 01 / 03',
    'PERSPEKTIF 3D & SPESIFIKASI MATERIAL',
    'Tampilan isometrik 3D utama beserta data dimensi bangunan dan tabel spesifikasi material kustom.'
  );

  // Left Column: 3D Hero Render (Width: 172mm, Height: 115mm)
  if (heroView?.dataUrl) {
    const imgX = 14;
    const imgY = 32;
    const imgW = 172;
    const imgH = 112;

    // Outer frame & shadow box
    doc.setFillColor(244, 244, 245);
    doc.rect(imgX - 1, imgY - 1, imgW + 2, imgH + 2, 'F');
    doc.addImage(heroView.dataUrl, 'JPEG', imgX, imgY, imgW, imgH);

    // Frame border
    doc.setDrawColor(212, 212, 216);
    doc.setLineWidth(0.5);
    doc.rect(imgX, imgY, imgW, imgH, 'S');

    // Title badge inside frame
    doc.setFillColor(24, 24, 27);
    doc.roundedRect(imgX + 3, imgY + 3, 76, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('MOCKUP 01: TAMPAK ISOMETRIK 3D UTAMA', imgX + 6, imgY + 7.5);
  }

  // Right Column: Project Metadata & Material Schedule (Width: 92mm)
  const metaX = 192;
  let metaY = 32;

  // Project Info Card
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(228, 228, 231);
  doc.roundedRect(metaX, metaY, 91, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('INFORMASI PROYEK & DIMENSI', metaX + 4, metaY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(82, 82, 91);
  doc.text(`Klien: ${project.clientName || 'Architectural Client'}`, metaX + 4, metaY + 12);
  doc.text(`Arsitek / Tim: ${project.author || 'Super Admin Architect'}`, metaX + 4, metaY + 17);
  doc.text(`ID Proyek: ${project.id}`, metaX + 4, metaY + 22);

  // Dimensions summary line
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text(`Dimensi Ruang: ${w} m × ${d} m (Tinggi: ${h} m)`, metaX + 4, metaY + 28);
  doc.text(`Estimasi Luas Lantai: ${floorArea} m²`, metaX + 4, metaY + 33);

  // Material Specification Schedule
  metaY += 42;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(228, 228, 231);
  doc.roundedRect(metaX, metaY, 91, 108, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('TABEL SPESIFIKASI MATERIAL KUSTOM', metaX + 4, metaY + 6);

  // Table header
  doc.setFillColor(244, 244, 245);
  doc.rect(metaX + 2, metaY + 9, 87, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text('SWATCH', metaX + 4, metaY + 13.2);
  doc.text('KOMPONEN / ZONA', metaX + 18, metaY + 13.2);
  doc.text('FINISH / WARNA', metaX + 58, metaY + 13.2);

  let rowY = metaY + 18;
  const activeZones = zones.slice(0, 10); // Show up to 10 customized surfaces

  if (activeZones.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 161, 170);
    doc.text('Menggunakan material bawaan file CAD 3D.', metaX + 6, rowY + 10);
  } else {
    activeZones.forEach((z) => {
      const customCol = customColors[z.id];
      const matId = selectedMaterials[z.id] || z.defaultMaterialId;
      const uploaded = uploadedMaterials.find((m) => m.id === matId);
      const isOriginal = !customCol && (!matId || matId === 'original');

      // Swatch square
      let swatchRgb: [number, number, number] = [200, 200, 200];
      if (customCol) {
        swatchRgb = hexToRgb(customCol);
      } else if (uploaded?.color) {
        swatchRgb = hexToRgb(uploaded.color);
      }

      doc.setFillColor(swatchRgb[0], swatchRgb[1], swatchRgb[2]);
      doc.rect(metaX + 4, rowY - 3, 8, 5, 'F');
      doc.setDrawColor(212, 212, 216);
      doc.rect(metaX + 4, rowY - 3, 8, 5, 'S');

      // Zone name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(24, 24, 27);
      const cleanName = (z.name || z.id).slice(0, 25);
      doc.text(cleanName, metaX + 18, rowY + 0.5);

      // Finish label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(82, 82, 91);
      const finishDesc = isOriginal
        ? 'Original CAD'
        : customCol
        ? `Custom (${customCol.toUpperCase()})`
        : uploaded?.name || matId || 'Kustom';
      doc.text(finishDesc.slice(0, 20), metaX + 58, rowY + 0.5);

      rowY += 8;
    });
  }

  // Bottom note on sheet 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(161, 161, 170);
  doc.text('* Semua warna & tekstur telah disinkronkan dengan visualisasi 3D real-time.', 14, pageHeight - 16);

  renderFooter('Halaman 1 dari 3');

  // ==========================================
  // SHEET 02: TAMPAK ATAS / DENAH RUANG (TOP PLAN)
  // ==========================================
  doc.addPage();
  renderHeader(
    'SHEET 02 / 03',
    'TAMPAK ATAS & DENAH RUANG (TOP PLAN VIEW)',
    'Tata letak interior tampak atas dengan potongan plafon/atap terbuka untuk analisis sirkulasi dan denah.'
  );

  if (topView?.dataUrl) {
    const planX = 28;
    const planY = 32;
    const planW = 241;
    const planH = 142;

    doc.setFillColor(244, 244, 245);
    doc.rect(planX - 1, planY - 1, planW + 2, planH + 2, 'F');
    doc.addImage(topView.dataUrl, 'JPEG', planX, planY, planW, planH);

    doc.setDrawColor(212, 212, 216);
    doc.setLineWidth(0.5);
    doc.rect(planX, planY, planW, planH, 'S');

    // Title badge
    doc.setFillColor(24, 24, 27);
    doc.roundedRect(planX + 4, planY + 4, 86, 7.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('MOCKUP 02: TAMPAK ATAS / DENAH RUANGAN', planX + 7, planY + 9);

    // Dimension annotation badge (Bottom-right of plan)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(212, 212, 216);
    doc.roundedRect(planX + planW - 78, planY + planH - 14, 74, 10, 1.5, 1.5, 'FD');
    doc.setTextColor(24, 24, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`PANJANG (X): ${w} m  |  LEBAR (Z): ${d} m`, planX + planW - 75, planY + planH - 8.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(113, 113, 122);
    doc.text(`TINGGI PLAFON (Y): ${h} m  |  LUAS: ${floorArea} m²`, planX + planW - 75, planY + planH - 5.5);
  }

  // Dimension explanation notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 113, 122);
  doc.text('Catatan: Atap dan penutup plafon disembunyikan otomatis untuk menampilkan tata letak interior & furnitur.', 14, pageHeight - 16);

  renderFooter('Halaman 2 dari 3');

  // ==========================================
  // SHEET 03: MOCKUP INTERIOR 4-SUDUT PANDANG
  // ==========================================
  doc.addPage();
  renderHeader(
    'SHEET 03 / 03',
    'PERSPEKTIF INTERIOR 4-SUDUT PANDANG',
    'Dokumentasi visual ruang dalam dari 4 kuadran: Depan, Belakang, Samping Kiri, dan Samping Kanan.'
  );

  const quadW = 129;
  const quadH = 70;
  const col1X = 14;
  const col2X = 154;
  const row1Y = 32;
  const row2Y = 110;

  const quadViews = [
    { v: frontView, x: col1X, y: row1Y, badge: 'MOCKUP 03: BAGIAN DALAM - TAMPAK DEPAN' },
    { v: backView, x: col2X, y: row1Y, badge: 'MOCKUP 04: BAGIAN DALAM - TAMPAK BELAKANG' },
    { v: leftView, x: col1X, y: row2Y, badge: 'MOCKUP 05: BAGIAN DALAM - SAMPING KIRI' },
    { v: rightView, x: col2X, y: row2Y, badge: 'MOCKUP 06: BAGIAN DALAM - SAMPING KANAN' },
  ];

  quadViews.forEach((q) => {
    if (q.v?.dataUrl) {
      doc.setFillColor(244, 244, 245);
      doc.rect(q.x - 1, q.y - 1, quadW + 2, quadH + 2, 'F');
      doc.addImage(q.v.dataUrl, 'JPEG', q.x, q.y, quadW, quadH);

      doc.setDrawColor(212, 212, 216);
      doc.setLineWidth(0.4);
      doc.rect(q.x, q.y, quadW, quadH, 'S');

      // Title badge
      doc.setFillColor(24, 24, 27);
      doc.roundedRect(q.x + 3, q.y + 3, 78, 6.5, 1.2, 1.2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text(q.badge, q.x + 5, q.y + 7.2);
    }
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 113, 122);
  doc.text('Kamera diposisikan pada ketinggian mata manusia (~1.45m) dengan lensa interior sudut lebar 76° - 78° FOV.', 14, pageHeight - 16);

  renderFooter('Halaman 3 dari 3 - Akhir Dokumen Laporan Arsitektur');

  return doc;
}
