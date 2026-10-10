'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ConfiguratorCanvas } from '@/components/3d/ConfiguratorCanvas';
import { DEMO_PROJECTS } from '@/lib/demo-project';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  Sparkles,
  ArrowRight,
  Eye,
  Layers,
  Compass,
  Sun,
  Maximize2,
  Box,
  RotateCw,
} from 'lucide-react';

export function InteractiveHeroViewer() {
  const demoProject = DEMO_PROJECTS[0];
  const applyMaterial = useConfiguratorStore((s) => s.applyMaterial);
  const [activeChip, setActiveChip] = useState('modern-scandi');
  const [activeMood, setActiveMood] = useState<'day' | 'golden' | 'dusk'>('day');

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
    } else if (presetKey === 'nordic-stone') {
      applyMaterial('wall_ext', 'wall-nordic-beige');
      applyMaterial('floor_living', 'floor-polished-concrete');
      applyMaterial('floor_bathroom', 'tile-travertine-stone');
      applyMaterial('roof_main', 'roof-slate-black');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full rounded-2xl md:rounded-3xl border border-[#DCDCD7] bg-white shadow-panel overflow-hidden group"
    >
      {/* Architectural Corner Crosshairs */}
      <div className="absolute top-3 left-3 z-20 text-[#A3A39E] font-mono text-[10px] select-none pointer-events-none">
        +
      </div>
      <div className="absolute top-3 right-3 z-20 text-[#A3A39E] font-mono text-[10px] select-none pointer-events-none">
        +
      </div>
      <div className="absolute bottom-3 left-3 z-20 text-[#A3A39E] font-mono text-[10px] select-none pointer-events-none">
        +
      </div>
      <div className="absolute bottom-3 right-3 z-20 text-[#A3A39E] font-mono text-[10px] select-none pointer-events-none">
        +
      </div>

      {/* Top Floating HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Badge: Live Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl border border-[#E8E8E5] shadow-subtle pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-[#171717] tracking-tight">
            INTERACTIVE SPATIAL CAD
          </span>
          <span className="text-[#A3A39E] text-xs">•</span>
          <span className="text-[11px] text-[#6B6B6B] font-mono">Pavilion Villa #01</span>
        </div>

        {/* Right Telemetry Readout (Desktop) */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-[#171717]/85 backdrop-blur-md rounded-xl border border-white/10 text-white shadow-subtle text-[10px] font-mono pointer-events-auto">
          <span className="text-white/40">GEO:</span>
          <span>LAT 35.68° N</span>
          <span className="text-white/20">|</span>
          <span className="text-white/40">CAM:</span>
          <span>FOV 45°</span>
          <span className="text-white/20">|</span>
          <span className="text-emerald-400 font-bold">60 FPS</span>
        </div>
      </div>

      {/* 3D Viewport Canvas */}
      <div className="relative w-full h-[450px] md:h-[580px] bg-[#F7F7F5]">
        <ConfiguratorCanvas
          modelUrl={demoProject.modelUrl}
          zones={demoProject.zones}
        />

        {/* Subtle Orbit Hint Center Overlay */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
          <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Click & Drag to Orbit • Scroll to Zoom</span>
        </div>

        {/* Bottom Floating Architectural Preset Switcher Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-[#DCDCD7] shadow-float">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider pl-2 pr-1 shrink-0 font-mono hidden md:inline">
              Material Palette:
            </span>

            <button
              onClick={() => handleApplyPreset('modern-scandi')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all shrink-0 ${
                activeChip === 'modern-scandi'
                  ? 'bg-[#171717] text-white shadow-subtle'
                  : 'text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F5F5F3]'
              }`}
            >
              Scandi White Oak
            </button>

            <button
              onClick={() => handleApplyPreset('warm-luxury')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all shrink-0 ${
                activeChip === 'warm-luxury'
                  ? 'bg-[#171717] text-white shadow-subtle'
                  : 'text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F5F5F3]'
              }`}
            >
              Carrara Marble
            </button>

            <button
              onClick={() => handleApplyPreset('dark-minimal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all shrink-0 ${
                activeChip === 'dark-minimal'
                  ? 'bg-[#171717] text-white shadow-subtle'
                  : 'text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F5F5F3]'
              }`}
            >
              Obsidian Charcoal
            </button>

            <button
              onClick={() => handleApplyPreset('nordic-stone')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all shrink-0 hidden lg:inline-block ${
                activeChip === 'nordic-stone'
                  ? 'bg-[#171717] text-white shadow-subtle'
                  : 'text-[#6B6B6B] hover:text-[#171717] hover:bg-[#F5F5F3]'
              }`}
            >
              Travertine & Slate
            </button>
          </div>

          {/* Action Link to Full Configurator */}
          <Link
            href="/configurator/house-001"
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#171717] hover:bg-[#262626] rounded-xl shadow-subtle transition-all shrink-0 group/btn"
          >
            <span>Launch Full Studio Configurator</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
