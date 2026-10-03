'use client';

import React from 'react';
import { MaterialZone, MaterialOption } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  Pipette,
  RotateCw,
  RotateCcw,
  Sparkles,
  Layers,
  Sliders,
  Check,
} from 'lucide-react';

interface TextureAdjusterPanelProps {
  currentZone: MaterialZone;
  activeMaterial: MaterialOption;
}

const TINT_PRESETS = [
  { name: 'Original', hex: '#FFFFFF' },
  { name: 'Warm Cream', hex: '#F5EFE6' },
  { name: 'Nordic Sand', hex: '#D8CAB8' },
  { name: 'Mist Grey', hex: '#B4B7BA' },
  { name: 'Anthracite', hex: '#484A4D' },
  { name: 'Tuscan Clay', hex: '#B86A50' },
  { name: 'Sage Olive', hex: '#7D8C79' },
  { name: 'Nordic Navy', hex: '#2A3644' },
];

export function TextureAdjusterPanel({ currentZone, activeMaterial }: TextureAdjusterPanelProps) {
  const zoneTextureSettings = useConfiguratorStore((s) => s.zoneTextureSettings);
  const setZoneTextureSettings = useConfiguratorStore((s) => s.setZoneTextureSettings);
  const setZoneTint = useConfiguratorStore((s) => s.setZoneTint);
  const setZoneOriginal = useConfiguratorStore((s) => s.setZoneOriginal);
  const customColors = useConfiguratorStore((s) => s.customColors);

  const currentSettings = zoneTextureSettings[currentZone.id] || {
    repeat: activeMaterial.repeat || [4, 4],
    bumpScale: activeMaterial.bumpScale ?? 0.14,
    rotation: 0,
    roughness: activeMaterial.roughness ?? 0.35,
    colorTint: customColors[currentZone.id] || '#FFFFFF',
  };

  const activeTint = currentSettings.colorTint || customColors[currentZone.id] || '#FFFFFF';

  const handleTintChange = (color: string) => {
    setZoneTint(currentZone.id, color);
  };

  const handleBumpChange = (val: number) => {
    setZoneTextureSettings(currentZone.id, { bumpScale: val });
  };

  const handleRepeatChange = (rep: number) => {
    setZoneTextureSettings(currentZone.id, { repeat: [rep, rep] });
  };

  const handleRoughnessChange = (rough: number) => {
    setZoneTextureSettings(currentZone.id, { roughness: rough });
  };

  const handleToggleRotation = () => {
    const nextRot = currentSettings.rotation === 0 ? Math.PI / 2 : 0;
    setZoneTextureSettings(currentZone.id, { rotation: nextRot });
  };

  return (
    <div className="p-4 border-b border-border bg-surface-50/60 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            3D Surface & Texture Controls
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold text-accent px-1.5 py-0.5 bg-accent/10 rounded">
          Interactive
        </span>
      </div>

      {/* 1. Color Tint Selector (Changes color of imported texture in real time) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-secondary">
            Pattern Color Tint
          </label>
          <span className="text-[10px] font-mono text-secondary">
            {activeTint.toUpperCase()}
          </span>
        </div>

        {/* Preset Tint Swatches */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {TINT_PRESETS.map((p) => {
            const isSelected = activeTint.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => handleTintChange(p.hex)}
                title={p.name}
                className={`flex items-center gap-1.5 p-1 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary bg-white'
                    : 'border-border bg-white hover:border-surface-400'
                }`}
              >
                <div
                  className="w-4 h-4 rounded border border-black/10 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.hex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-2.5 h-2.5 stroke-[3] ${
                        ['#FFFFFF', '#F5EFE6', '#D8CAB8'].includes(p.hex)
                          ? 'text-black'
                          : 'text-white'
                      }`}
                    />
                  )}
                </div>
                <span className="text-[9px] font-medium text-primary truncate">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-border">
          <div className="relative w-6 h-6 rounded-md overflow-hidden border border-border shrink-0 cursor-pointer shadow-subtle">
            <input
              type="color"
              value={activeTint}
              onChange={(e) => handleTintChange(e.target.value)}
              className="absolute -top-3 -left-3 w-12 h-12 cursor-pointer border-0 p-0"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-[9px] font-medium uppercase tracking-wider text-secondary">
              Custom Tint Shade
            </span>
            <span className="text-xs font-mono font-medium text-primary uppercase">
              {activeTint}
            </span>
          </div>
          <Pipette className="w-3.5 h-3.5 text-secondary" />
        </div>
      </div>

      {/* 2. 3D Tactile Relief / Bump Depth Slider */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-semibold text-secondary">3D Tactile Relief (Bump)</span>
          <span className="font-mono text-primary font-semibold">
            {(currentSettings.bumpScale * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="0.35"
          step="0.01"
          value={currentSettings.bumpScale}
          onChange={(e) => handleBumpChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[9px] text-secondary mt-0.5">
          <span>Flat (0%)</span>
          <span>Medium (15%)</span>
          <span>Deep Relief (35%)</span>
        </div>
      </div>

      {/* 3. Tile Scale / Repeat */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-semibold text-secondary">Ukuran Motif (1 gambar)</span>
          <span className="font-mono text-primary font-semibold">
            ±{Math.round(200 / currentSettings.repeat[0])} cm
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 4, 8, 12].map((rep) => (
            <button
              key={rep}
              type="button"
              onClick={() => handleRepeatChange(rep)}
              title={`Satu gambar motif ≈ ${Math.round(200 / rep)} cm di dinding/lantai`}
              className={`py-1 text-[10px] font-mono font-medium rounded-lg border transition-colors ${
                currentSettings.repeat[0] === rep
                  ? 'bg-primary text-white border-primary shadow-subtle'
                  : 'bg-white text-secondary border-border hover:border-surface-400'
              }`}
            >
              {Math.round(200 / rep)}cm
            </button>
          ))}
        </div>
        <p className="text-[9px] text-secondary mt-1">Makin kecil angkanya, makin kecil &amp; rapat motif keramiknya.</p>
      </div>

      {/* 4. Surface Finish & Rotation */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Finish */}
        <div>
          <span className="text-[10px] font-semibold text-secondary block mb-1">
            Finish Sheen
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleRoughnessChange(0.18)}
              className={`flex-1 py-1 text-[11px] font-medium rounded border ${
                currentSettings.roughness < 0.25
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-secondary border-border'
              }`}
            >
              Gloss
            </button>
            <button
              type="button"
              onClick={() => handleRoughnessChange(0.38)}
              className={`flex-1 py-1 text-[11px] font-medium rounded border ${
                currentSettings.roughness >= 0.25 && currentSettings.roughness < 0.55
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-secondary border-border'
              }`}
            >
              Satin
            </button>
            <button
              type="button"
              onClick={() => handleRoughnessChange(0.7)}
              className={`flex-1 py-1 text-[11px] font-medium rounded border ${
                currentSettings.roughness >= 0.55
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-secondary border-border'
              }`}
            >
              Matte
            </button>
          </div>
        </div>

        {/* Orientation */}
        <div>
          <span className="text-[10px] font-semibold text-secondary block mb-1">
            Orientation
          </span>
          <button
            type="button"
            onClick={handleToggleRotation}
            className="w-full py-1 px-2 text-[11px] font-medium rounded border bg-white border-border hover:border-primary flex items-center justify-center gap-1.5 text-primary"
          >
            <RotateCw className="w-3 h-3" />
            <span>{currentSettings.rotation === 0 ? '0° Standard' : '90° Rotated'}</span>
          </button>
        </div>
      </div>

      {/* 5. Revert to original CAD design button */}
      <button
        type="button"
        onClick={() => {
          setZoneOriginal(currentZone.id);
        }}
        className="w-full py-2 px-3 rounded-lg border border-border bg-white hover:bg-surface-100 hover:border-surface-400 text-xs font-semibold text-secondary hover:text-primary flex items-center justify-center gap-1.5 transition-colors shadow-subtle"
      >
        <RotateCcw className="w-3.5 h-3.5 text-accent" />
        <span>Kembalikan ke Desain Bawaan 3D (Original)</span>
      </button>
    </div>
  );
}
