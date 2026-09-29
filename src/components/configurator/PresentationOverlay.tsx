'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { CAMERA_PRESETS } from '@/lib/demo-project';
import {
  Minimize2,
  Camera,
  Check,
  Eye,
  Sofa,
  Bath,
  Bed,
  Sun,
  Grid,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Eye,
  Sofa,
  Bath,
  Bed,
  Sun,
  Grid,
};

interface PresentationOverlayProps {
  project: Project;
}

export function PresentationOverlay({ project }: PresentationOverlayProps) {
  const isPresentationMode = useConfiguratorStore((s) => s.isPresentationMode);
  const setPresentationMode = useConfiguratorStore((s) => s.setPresentationMode);
  const activeCameraPreset = useConfiguratorStore((s) => s.activeCameraPreset);
  const setCameraPreset = useConfiguratorStore((s) => s.setCameraPreset);

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

      {/* Bottom Floating Camera Selector */}
      <div className="pointer-events-auto self-center max-w-[92vw] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-border shadow-float">
          {CAMERA_PRESETS.map((preset) => {
            const Icon = (ICON_MAP[preset.iconName] || Eye) as React.ComponentType<{ className?: string }>;
            const isActive = activeCameraPreset === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => setCameraPreset(preset.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
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
      </div>
    </div>
  );
}
