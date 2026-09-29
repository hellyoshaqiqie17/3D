'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ConfiguratorCanvas } from '@/components/3d/ConfiguratorCanvas';
import { DEMO_PROJECTS } from '@/lib/demo-project';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { Sparkles, ArrowRight, Eye, Layers } from 'lucide-react';

export function InteractiveHeroViewer() {
  const demoProject = DEMO_PROJECTS[0];
  const applyMaterial = useConfiguratorStore((s) => s.applyMaterial);
  const setCustomColor = useConfiguratorStore((s) => s.setCustomColor);

  const [activeChip, setActiveChip] = useState('modern-scandi');

  const handleApplyPreset = (presetKey: string) => {
    setActiveChip(presetKey);

    if (presetKey === 'modern-scandi') {
      applyMaterial('wall_ext', 'wall-pure-white');
      applyMaterial('floor_living', 'floor-oak-natural');
      applyMaterial('floor_bathroom', 'tile-white-subway');
      applyMaterial('roof_main', 'roof-zinc-charcoal');
    } else if (presetKey === 'warm-luxury') {
      applyMaterial('wall_ext', 'wall-warm-cream');
      applyMaterial('floor_living', 'floor-carrara-marble');
      applyMaterial('floor_bathroom', 'tile-travertine-stone');
      applyMaterial('roof_main', 'roof-terracotta-spanish');
    } else if (presetKey === 'dark-minimal') {
      applyMaterial('wall_ext', 'wall-charcoal');
      applyMaterial('floor_living', 'floor-walnut-dark');
      applyMaterial('floor_bathroom', 'floor-nero-marble');
      applyMaterial('roof_main', 'roof-zinc-charcoal');
    }
  };

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl border border-border bg-white shadow-panel overflow-hidden">
      {/* 3D Viewport */}
      <div className="relative w-full h-[420px] md:h-[540px] bg-[#F7F7F5]">
        <ConfiguratorCanvas
          modelUrl={demoProject.modelUrl}
          zones={demoProject.zones}
        />

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-border shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-primary">Live WebGL Architecture</span>
          <span className="text-secondary/40 text-xs">•</span>
          <span className="text-[11px] text-secondary">Orbit & Zoom enabled</span>
        </div>

        {/* Floating Quick Material Toggles */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-border shadow-float">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-secondary tracking-wider pl-2 pr-1 hidden sm:inline">
              Style Presets:
            </span>
            <button
              onClick={() => handleApplyPreset('modern-scandi')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                activeChip === 'modern-scandi'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-100'
              }`}
            >
              Scandi Oak
            </button>

            <button
              onClick={() => handleApplyPreset('warm-luxury')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                activeChip === 'warm-luxury'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-100'
              }`}
            >
              Carrara Marble
            </button>

            <button
              onClick={() => handleApplyPreset('dark-minimal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                activeChip === 'dark-minimal'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-100'
              }`}
            >
              Obsidian Dark
            </button>
          </div>

          <Link
            href="/configurator/house-001"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors"
          >
            <span>Launch Full Configurator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
