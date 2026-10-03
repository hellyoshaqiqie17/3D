'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  Minimize2,
  Camera,
  Check,
  Eye,
  Sofa,
  Layers,
  Trees,
  Sun,
  Grid,
  Home,
  RotateCw,
  Compass,
} from 'lucide-react';

const PRESETS = [
  { id: 'exterior', name: 'Tampak Luar', icon: Eye },
  { id: 'interior', name: 'Ruang Tamu', icon: Sofa },
  { id: 'dollhouse', name: 'Perspektif Atas', icon: Layers },
  { id: 'facade', name: 'Fasad Depan', icon: Sun },
  { id: 'top', name: 'Denah Atas', icon: Grid },
];

interface PresentationOverlayProps {
  project: Project;
}

export function PresentationOverlay({ project }: PresentationOverlayProps) {
  const isPresentationMode = useConfiguratorStore((s) => s.isPresentationMode);
  const setPresentationMode = useConfiguratorStore((s) => s.setPresentationMode);
  const activeCameraPreset = useConfiguratorStore((s) => s.activeCameraPreset);
  const setCameraPreset = useConfiguratorStore((s) => s.setCameraPreset);
  const isRoofHidden = useConfiguratorStore((s) => s.isRoofHidden);
  const toggleRoofHidden = useConfiguratorStore((s) => s.toggleRoofHidden);
  const isEnvironmentHidden = useConfiguratorStore((s) => s.isEnvironmentHidden);
  const toggleEnvironmentHidden = useConfiguratorStore((s) => s.toggleEnvironmentHidden);
  const isLookAround360 = useConfiguratorStore((s) => s.isLookAround360);
  const toggleLookAround360 = useConfiguratorStore((s) => s.toggleLookAround360);
  const isAutoRotate = useConfiguratorStore((s) => s.isAutoRotate);
  const toggleAutoRotate = useConfiguratorStore((s) => s.toggleAutoRotate);

  const [screenshotTaken, setScreenshotTaken] = useState(false);

  if (!isPresentationMode) return null;

  const handleTakeScreenshot = () => {
    const canvas = document.getElementById('configurator-3d-canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const imageUri = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-architectural-view.png`;
        link.href = imageUri;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setScreenshotTaken(true);
        setTimeout(() => setScreenshotTaken(false), 2500);
      } catch (err) {
        console.error('Screenshot failed:', err);
      }
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-6">
      {/* Top Floating Bar */}
      <div className="pointer-events-auto flex items-center justify-between w-full">
        {/* Brand & Project pill */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-border shadow-float">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-xs font-semibold text-primary">{project.name}</h2>
            <p className="text-[10px] text-secondary">Presentation Mode • {project.clientName}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Screenshot capture */}
          <button
            onClick={handleTakeScreenshot}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-primary bg-white/90 backdrop-blur-md hover:bg-white rounded-xl border border-border shadow-float transition-all"
            title="Download high-resolution architectural screenshot"
          >
            {screenshotTaken ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Saved to PNG</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span>Capture Render</span>
              </>
            )}
          </button>

          {/* Exit Presentation */}
          <button
            onClick={() => setPresentationMode(false)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-float transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Presentation</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Camera Selector & Toggles */}
      <div className="pointer-events-auto self-center max-w-[94vw] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-border shadow-float">
          <div className="flex items-center gap-1">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isActive = activeCameraPreset === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => setCameraPreset(preset.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-white shadow-subtle'
                      : 'text-secondary hover:text-primary hover:bg-surface-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-border shrink-0" />

          {/* Roof & Tree toggles */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleRoofHidden}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isRoofHidden
                  ? 'bg-amber-500 text-white border-amber-600 shadow-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-100 border-border/80'
              }`}
            >
              {isRoofHidden ? <Home className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
              <span>{isRoofHidden ? 'Atap Terbuka' : 'Buka Atap'}</span>
            </button>

            <button
              onClick={toggleEnvironmentHidden}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isEnvironmentHidden
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-100 border-border/80'
              }`}
            >
              <Trees className="w-3.5 h-3.5" />
              <span>{isEnvironmentHidden ? 'Pohon Bersih' : 'Pohon ON'}</span>
            </button>

            <button
              onClick={toggleLookAround360}
              title={isLookAround360 ? "Nonaktifkan rotasi di satu titik" : "Aktifkan rotasi 360° di satu titik (posisi berdiri diam, putar pandangan 360°)"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isLookAround360
                  ? 'bg-amber-600 text-white border-amber-700 shadow-subtle ring-1 ring-amber-400'
                  : 'text-secondary hover:text-primary hover:bg-surface-100 border-border/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isLookAround360 ? 'Rotasi di Titik (ON)' : 'Rotasi di Titik'}</span>
            </button>

            <button
              onClick={toggleAutoRotate}
              title={isAutoRotate ? "Hentikan auto rotate" : "Aktifkan auto rotate 360°"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isAutoRotate
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-subtle ring-1 ring-indigo-400'
                  : 'text-secondary hover:text-primary hover:bg-surface-100 border-border/80'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
              <span>{isAutoRotate ? 'Auto 360° ON' : 'Auto Rotate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
