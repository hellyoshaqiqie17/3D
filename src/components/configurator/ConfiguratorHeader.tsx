'use client';

import React from 'react';
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
  History,
} from 'lucide-react';

interface ConfiguratorHeaderProps {
  project: Project;
}

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

  if (isPresentationMode) return null;

  return (
    <header className="h-16 px-6 bg-white border-b border-border flex items-center justify-between z-20 shrink-0">
      {/* Left: Brand & Back to Dashboard */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-100"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <div className="h-4 w-px bg-border" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-primary">{project.name}</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium bg-surface-100 text-secondary rounded border border-border">
              3D Live
            </span>
          </div>
          <p className="text-xs text-secondary">{project.clientName}</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Original CAD Version Toggle */}
        <button
          onClick={toggleOriginalMode}
          title={isOriginalMode ? "Kembali ke Desain Kustom" : "Lihat Versi Desain Asli (Original Model)"}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
            isOriginalMode
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'text-secondary hover:text-primary hover:bg-surface-100 border-border'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isOriginalMode ? 'Versi Asli (Original)' : 'Lihat Desain Asli'}</span>
        </button>

        {/* Reset */}
        <button
          onClick={() => resetConfiguration(project.zones)}
          title="Reset configuration to defaults"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors border border-transparent hover:border-border"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Wireframe toggle */}
        <button
          onClick={toggleWireframe}
          title="Toggle structural wireframe view"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            isWireframeMode
              ? 'bg-primary text-white border-primary'
              : 'text-secondary hover:text-primary hover:bg-surface-100 border-border'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Wireframe</span>
        </button>

        {/* Editor link */}
        <Link
          href={`/projects/${project.id}/editor`}
          title="Open Material Zone Editor"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors border border-border"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Zone Editor</span>
        </Link>

        {/* Presentation mode */}
        <button
          onClick={togglePresentationMode}
          title="Enter Fullscreen Presentation Mode"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors border border-border"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Present</span>
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Share */}
        <button
          onClick={() => setShareModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-surface-100 rounded-lg transition-colors border border-border"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Save */}
        <button
          onClick={() => setSaveModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-subtle"
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Save Design</span>
        </button>
      </div>
    </header>
  );
}
