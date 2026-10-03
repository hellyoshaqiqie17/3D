'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  RotateCcw,
  Share2,
  BookmarkCheck,
  Maximize2,
  Box,
  ChevronLeft,
  SlidersHorizontal,
  Eye,
  EyeOff,
  MoreHorizontal,
  Check,
} from 'lucide-react';

interface ConfiguratorHeaderProps {
  project: Project;
}

/**
 * Top header: only project-level actions live here (compare, reset, present, share, save).
 * All 3D view/navigation controls live inside the viewport (ViewportToolbar + CameraPresetBar)
 * so each control appears exactly once and is easy to find.
 */
export function ConfiguratorHeader({ project }: ConfiguratorHeaderProps) {
  const isPresentationMode = useConfiguratorStore((s) => s.isPresentationMode);
  const togglePresentationMode = useConfiguratorStore((s) => s.togglePresentationMode);
  const isWireframeMode = useConfiguratorStore((s) => s.isWireframeMode);
  const toggleWireframe = useConfiguratorStore((s) => s.toggleWireframe);
  const isOriginalMode = useConfiguratorStore((s) => s.isOriginalMode);
  const toggleOriginalMode = useConfiguratorStore((s) => s.toggleOriginalMode);
  const setSaveModalOpen = useConfiguratorStore((s) => s.setSaveModalOpen);
  const setShareModalOpen = useConfiguratorStore((s) => s.setShareModalOpen);
  const resetConfiguration = useConfiguratorStore((s) => s.resetConfiguration);

  const [isMoreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close "Lainnya" menu on outside click / Escape
  useEffect(() => {
    if (!isMoreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMoreOpen]);

  if (isPresentationMode) return null;

  const handleReset = () => {
    const ok = window.confirm(
      'Kembalikan semua warna & material ke pengaturan awal?\nPerubahan yang belum disimpan akan hilang.'
    );
    if (ok) resetConfiguration(project.zones, project.id === 'house-001');
  };

  const ghostBtn =
    'flex items-center gap-1.5 h-9 px-3 text-xs font-medium whitespace-nowrap rounded-lg border transition-colors';

  return (
    <header className="h-14 px-4 bg-white border-b border-border flex items-center justify-between gap-3 z-20 shrink-0">
      {/* Left: Back & project title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          title="Kembali ke Dashboard"
          className="flex items-center gap-1 h-9 px-2 text-xs font-medium text-secondary hover:text-primary rounded-lg hover:bg-surface-100 transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="h-5 w-px bg-border shrink-0" />

        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-primary truncate max-w-[220px]" title={project.name}>
              {project.name}
            </h1>
            <span className="hidden md:inline px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200 shrink-0">
              3D Live
            </span>
          </div>
          {project.clientName && (
            <p className="text-[11px] text-secondary truncate max-w-[220px]">{project.clientName}</p>
          )}
        </div>
      </div>

      {/* Right: project actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Compare with original design */}
        <button
          onClick={toggleOriginalMode}
          title={isOriginalMode ? 'Kembali ke desain hasil kustom Anda' : 'Bandingkan dengan desain asli dari file CAD'}
          className={`${ghostBtn} ${
            isOriginalMode
              ? 'bg-amber-500 text-white border-amber-600'
              : 'text-secondary hover:text-primary hover:bg-surface-100 border-border'
          }`}
        >
          {isOriginalMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isOriginalMode ? 'Tutup Desain Asli' : 'Lihat Desain Asli'}</span>
        </button>

        {/* Reset (with confirmation) */}
        <button
          onClick={handleReset}
          title="Kembalikan semua material ke pengaturan awal"
          className={`${ghostBtn} text-secondary hover:text-primary hover:bg-surface-100 border-transparent hover:border-border`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset</span>
        </button>

        {/* More menu: advanced tools */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            title="Alat lainnya"
            aria-expanded={isMoreOpen}
            className={`${ghostBtn} ${
              isMoreOpen || isWireframeMode
                ? 'bg-surface-100 text-primary border-border'
                : 'text-secondary hover:text-primary hover:bg-surface-100 border-transparent hover:border-border'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="hidden lg:inline">Lainnya</span>
          </button>

          {isMoreOpen && (
            <div className="absolute right-0 top-11 w-60 bg-white border border-border rounded-xl shadow-float p-1.5 z-50">
              <button
                onClick={() => {
                  toggleWireframe();
                  setMoreOpen(false);
                }}
                className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-100 text-left"
              >
                <Box className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
                <span className="flex-1">
                  <span className="block text-xs font-semibold text-primary">Mode Garis (Wireframe)</span>
                  <span className="block text-[10px] text-secondary">Lihat struktur rangka model</span>
                </span>
                {isWireframeMode && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
              <Link
                href={`/projects/${project.id}/editor`}
                className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-100 text-left"
              >
                <SlidersHorizontal className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
                <span className="flex-1">
                  <span className="block text-xs font-semibold text-primary">Atur Zona Material</span>
                  <span className="block text-[10px] text-secondary">Untuk admin: kelompokkan bagian model</span>
                </span>
              </Link>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Presentation mode */}
        <button
          onClick={togglePresentationMode}
          title="Tampilkan layar penuh untuk presentasi ke klien"
          className={`${ghostBtn} text-secondary hover:text-primary hover:bg-surface-100 border-border`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Presentasi</span>
        </button>

        {/* Share */}
        <button
          onClick={() => setShareModalOpen(true)}
          title="Bagikan link desain"
          className={`${ghostBtn} text-primary hover:bg-surface-100 border-border`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Bagikan</span>
        </button>

        {/* Save */}
        <button
          onClick={() => setSaveModalOpen(true)}
          title="Simpan desain ini"
          className="flex items-center gap-1.5 h-9 px-4 text-xs font-semibold whitespace-nowrap text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-subtle"
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Simpan</span>
        </button>
      </div>
    </header>
  );
}
