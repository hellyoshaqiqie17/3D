'use client';

import React from 'react';
import { CAMERA_PRESETS } from '@/lib/demo-project';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
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

export function CameraPresetBar() {
  const activeCameraPreset = useConfiguratorStore((s) => s.activeCameraPreset);
  const setCameraPreset = useConfiguratorStore((s) => s.setCameraPreset);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 max-w-[92vw] overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-border/80 shadow-float">
        {CAMERA_PRESETS.map((preset) => {
          const Icon = (ICON_MAP[preset.iconName] || Eye) as React.ComponentType<{ className?: string }>;
          const isActive = activeCameraPreset === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => setCameraPreset(preset.id)}
              title={preset.description}
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
  );
}
