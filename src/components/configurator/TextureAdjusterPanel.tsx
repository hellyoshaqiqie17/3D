'use client';

import React, { useState } from 'react';
import { MaterialZone, MaterialOption } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  Pipette,
  RotateCw,
  RotateCcw,
  Sliders,
  Check,
  Grid,
  Layers,
} from 'lucide-react';
import {
  FLOOR_TILE_PRESETS,
  WALL_TILE_PRESETS,
  GROUT_COLOR_PRESETS,
  GROUT_WIDTH_PRESETS,
  calculateRepeatFromTileSize,
} from '@/lib/tile-constants';

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

  const isDefaultFloor = currentZone.category === 'floor' || currentZone.id.includes('lantai');

  const currentSettings = zoneTextureSettings[currentZone.id] || {
    repeat: activeMaterial.repeat || [4, 4],
    bumpScale: activeMaterial.bumpScale ?? 0.14,
    rotation: 0,
    roughness: activeMaterial.roughness ?? 0.35,
    colorTint: customColors[currentZone.id] || '#FFFFFF',
    tileSizeCm: activeMaterial.tileSizeCm || (isDefaultFloor ? [60, 60] : [30, 60]),
    surfaceType: activeMaterial.surfaceType || (isDefaultFloor ? 'floor' : 'wall'),
    showGrout: activeMaterial.showGrout ?? true,
    groutWidthMm: activeMaterial.groutWidthMm ?? 2,
    groutColor: activeMaterial.groutColor || '#8E9297',
  };

  const currentSurfaceType = currentSettings.surfaceType || (isDefaultFloor ? 'floor' : 'wall');
  const currentTileSize: [number, number] = currentSettings.tileSizeCm || (isDefaultFloor ? [60, 60] : [30, 60]);
  const currentShowGrout = currentSettings.showGrout ?? true;
  const currentGroutWidth = currentSettings.groutWidthMm ?? 2;
  const currentGroutColor = currentSettings.groutColor || '#8E9297';

  const [activeSurfaceTab, setActiveSurfaceTab] = useState<'wall' | 'floor'>(currentSurfaceType);
  const [isCustomTileSize, setIsCustomTileSize] = useState(false);
  const [customW, setCustomW] = useState(currentTileSize[0]);
  const [customH, setCustomH] = useState(currentTileSize[1]);

  const activePresets = activeSurfaceTab === 'floor' ? FLOOR_TILE_PRESETS : WALL_TILE_PRESETS;
  const activeTint = currentSettings.colorTint || customColors[currentZone.id] || '#FFFFFF';

  const handleTileSizeChange = (w: number, h: number) => {
    setIsCustomTileSize(false);
    const repeat = calculateRepeatFromTileSize([w, h]);
    setZoneTextureSettings(currentZone.id, {
      tileSizeCm: [w, h],
      surfaceType: activeSurfaceTab,
      repeat: repeat,
    });
  };

  const handleCustomSizeApply = (w: number, h: number) => {
    const nw = Math.max(5, w);
    const nh = Math.max(5, h);
    setCustomW(nw);
    setCustomH(nh);
    const repeat = calculateRepeatFromTileSize([nw, nh]);
    setZoneTextureSettings(currentZone.id, {
      tileSizeCm: [nw, nh],
      surfaceType: activeSurfaceTab,
      repeat: repeat,
    });
  };

  const handleGroutToggle = () => {
    setZoneTextureSettings(currentZone.id, {
      showGrout: !currentShowGrout,
    });
  };

  const handleGroutWidthChange = (valMm: number) => {
    setZoneTextureSettings(currentZone.id, {
      groutWidthMm: valMm,
      showGrout: valMm > 0,
    });
  };

  const handleGroutColorChange = (hex: string) => {
    setZoneTextureSettings(currentZone.id, {
      groutColor: hex,
    });
  };

  const handleTintChange = (color: string) => {
    setZoneTint(currentZone.id, color);
  };

  const handleBumpChange = (val: number) => {
    setZoneTextureSettings(currentZone.id, { bumpScale: val });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Ukuran Keramik &amp; Nat 3D
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold text-emerald-700 px-1.5 py-0.5 bg-emerald-100 rounded">
          Presisi 1:1
        </span>
      </div>

      {/* 1. Ukuran Keramik / Ubin Standar Realistis */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-secondary">
            Ukuran Keramik (Dimensi Fisik)
          </label>
          <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-white border border-border rounded">
            {currentTileSize[0]} × {currentTileSize[1]} cm
          </span>
        </div>

        {/* Tab Switcher: Ukuran Lantai vs Ukuran Dinding */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-surface-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveSurfaceTab('wall')}
            className={`flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              activeSurfaceTab === 'wall'
                ? 'bg-white text-primary shadow-subtle'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Layers className="w-3 h-3 text-primary" />
            <span>Ukuran Dinding</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSurfaceTab('floor')}
            className={`flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              activeSurfaceTab === 'floor'
                ? 'bg-white text-primary shadow-subtle'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Grid className="w-3 h-3 text-primary" />
            <span>Ukuran Lantai</span>
          </button>
        </div>

        {/* Preset Size Buttons matching attachment */}
        <div className="grid grid-cols-3 gap-1">
          {activePresets.map((preset) => {
            const isSelected =
              !isCustomTileSize &&
              currentTileSize[0] === preset.widthCm &&
              currentTileSize[1] === preset.heightCm;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleTileSizeChange(preset.widthCm, preset.heightCm)}
                className={`py-1.5 px-1 text-[11px] font-medium rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-subtle'
                    : 'bg-white text-secondary border-border hover:border-primary/50 hover:text-primary'
                }`}
              >
                {preset.widthCm}×{preset.heightCm}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCustomTileSize(true)}
            className={`py-1.5 px-1 text-[11px] font-medium rounded-lg border text-center transition-all ${
              isCustomTileSize
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-secondary border-border hover:border-primary/50 hover:text-primary'
            }`}
          >
            Kustom...
          </button>
        </div>

        {/* Custom Input */}
        {isCustomTileSize && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-border">
            <div className="flex-1">
              <label className="text-[9px] text-secondary block">Lebar (cm)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={customW}
                onChange={(e) => handleCustomSizeApply(parseInt(e.target.value) || 60, customH)}
                className="w-full px-2 py-1 text-xs border border-border rounded"
              />
            </div>
            <span className="text-secondary text-xs pt-3">×</span>
            <div className="flex-1">
              <label className="text-[9px] text-secondary block">Tinggi (cm)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={customH}
                onChange={(e) => handleCustomSizeApply(customW, parseInt(e.target.value) || 60)}
                className="w-full px-2 py-1 text-xs border border-border rounded"
              />
            </div>
          </div>
        )}

        {/* Real-world scale indicator */}
        <div className="p-2 bg-white rounded-lg border border-border text-[10px] text-secondary space-y-0.5">
          <p className="font-semibold text-primary">
            📐 Simulasi Konstruksi Realistis:
          </p>
          <p>
            Pada bidang 100 × 100 cm: memuat{' '}
            <strong className="text-primary">{(100 / currentTileSize[0]).toFixed(currentTileSize[0] === 100 ? 0 : 1)}</strong> ubin mendatar ×{' '}
            <strong className="text-primary">{(100 / currentTileSize[1]).toFixed(currentTileSize[1] === 100 ? 0 : 1)}</strong> ubin meninggi.
          </p>
        </div>
      </div>

      {/* 2. Nat Keramik (Grout Joint) Controls */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-primary block">
              Nat Keramik (Pembatas Ubin)
            </span>
            <span className="text-[9px] text-secondary block">
              Garis sambungan nat semen konstruksi
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={currentShowGrout}
            onClick={handleGroutToggle}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
              currentShowGrout ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                currentShowGrout ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {currentShowGrout && (
          <div className="p-2.5 bg-white rounded-xl border border-border space-y-2.5">
            {/* Grout Width */}
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-secondary font-medium">Lebar Nat Pembatas:</span>
                <span className="font-mono font-bold text-primary">{currentGroutWidth} mm</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {GROUT_WIDTH_PRESETS.filter((p) => p.valueMm > 0).map((gp) => (
                  <button
                    key={gp.valueMm}
                    type="button"
                    onClick={() => handleGroutWidthChange(gp.valueMm)}
                    className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                      currentGroutWidth === gp.valueMm
                        ? 'bg-primary text-white border-primary shadow-subtle'
                        : 'bg-surface-50 text-secondary border-border hover:border-primary/50'
                    }`}
                  >
                    {gp.valueMm} mm
                  </button>
                ))}
              </div>
            </div>

            {/* Grout Color */}
            <div>
              <span className="text-[10px] text-secondary font-medium block mb-1">
                Warna Nat Semen:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {GROUT_COLOR_PRESETS.map((gc) => (
                  <button
                    key={gc.hex}
                    type="button"
                    onClick={() => handleGroutColorChange(gc.hex)}
                    title={gc.name}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                      currentGroutColor.toLowerCase() === gc.hex.toLowerCase()
                        ? 'ring-2 ring-primary scale-110'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: gc.hex }}
                  >
                    {currentGroutColor.toLowerCase() === gc.hex.toLowerCase() && (
                      <Check
                        className={`w-3 h-3 stroke-[3] ${
                          ['#EAEAEA', '#D7CEB2'].includes(gc.hex) ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}

                <input
                  type="color"
                  value={currentGroutColor}
                  onChange={(e) => handleGroutColorChange(e.target.value)}
                  title="Pilih warna nat kustom"
                  className="w-6 h-6 rounded-md border border-border cursor-pointer p-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Color Tint Selector */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-secondary">
            Warna Tint Pola
          </label>
          <span className="text-[10px] font-mono text-secondary">
            {activeTint.toUpperCase()}
          </span>
        </div>

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
              Warna Tint Khusus
            </span>
            <span className="text-xs font-mono font-medium text-primary uppercase">
              {activeTint}
            </span>
          </div>
          <Pipette className="w-3.5 h-3.5 text-secondary" />
        </div>
      </div>

      {/* 4. 3D Tactile Relief Depth & Orientation */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-semibold text-secondary">Timbul 3D (Bump)</span>
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
        </div>

        <div>
          <span className="text-[10px] font-semibold text-secondary block mb-1">
            Rotasi Pola
          </span>
          <button
            type="button"
            onClick={handleToggleRotation}
            className="w-full py-1 px-2 text-[11px] font-medium rounded border bg-white border-border hover:border-primary flex items-center justify-center gap-1.5 text-primary"
          >
            <RotateCw className="w-3 h-3" />
            <span>{currentSettings.rotation === 0 ? '0° Normal' : '90° Rotasi'}</span>
          </button>
        </div>
      </div>

      {/* 5. Finish Sheen */}
      <div className="border-t border-border pt-2">
        <span className="text-[10px] font-semibold text-secondary block mb-1">
          Kilau Permukaan (Sheen)
        </span>
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => handleRoughnessChange(0.18)}
            className={`py-1 text-[11px] font-medium rounded border ${
              currentSettings.roughness < 0.25
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-secondary border-border'
            }`}
          >
            Gloss (Kilap)
          </button>
          <button
            type="button"
            onClick={() => handleRoughnessChange(0.38)}
            className={`py-1 text-[11px] font-medium rounded border ${
              currentSettings.roughness >= 0.25 && currentSettings.roughness < 0.55
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-secondary border-border'
            }`}
          >
            Satin (Halus)
          </button>
          <button
            type="button"
            onClick={() => handleRoughnessChange(0.7)}
            className={`py-1 text-[11px] font-medium rounded border ${
              currentSettings.roughness >= 0.55
                ? 'bg-primary text-white border-primary shadow-subtle'
                : 'bg-white text-secondary border-border'
            }`}
          >
            Matte (Doff)
          </button>
        </div>
      </div>

      {/* 6. Revert to original */}
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
