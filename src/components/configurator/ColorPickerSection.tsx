'use client';

import React, { useState, useEffect } from 'react';
import { MaterialZone } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { Pipette, Check, Sparkles } from 'lucide-react';

interface ColorPickerSectionProps {
  currentZone: MaterialZone;
}

const PRESET_COLORS = [
  { name: 'Pure White', hex: '#F8F9FA' },
  { name: 'Warm Cream', hex: '#EDE8DD' },
  { name: 'Nordic Beige', hex: '#D8CAB8' },
  { name: 'Mist Grey', hex: '#B0B2B5' },
  { name: 'Charcoal Grey', hex: '#2B2D31' },
  { name: 'Sage Mist', hex: '#8A9A86' },
  { name: 'Tuscan Clay', hex: '#A95D44' },
  { name: 'Architectural Navy', hex: '#1E293B' },
];

export function ColorPickerSection({ currentZone }: ColorPickerSectionProps) {
  const customColors = useConfiguratorStore((s) => s.customColors);
  const setCustomColor = useConfiguratorStore((s) => s.setCustomColor);
  const selectedMaterials = useConfiguratorStore((s) => s.selectedMaterials);
  const applyMaterial = useConfiguratorStore((s) => s.applyMaterial);
  const setZoneOriginal = useConfiguratorStore((s) => s.setZoneOriginal);

  const activeCustomColor = customColors[currentZone.id];
  const selectedMatId = selectedMaterials[currentZone.id] || currentZone.defaultMaterialId;

  // The zone is in its original native 3D state if no custom hex color is set AND (material is 'original' or unset)
  const isOriginal = !activeCustomColor && (!selectedMatId || selectedMatId === 'original');
  const activeColor = isOriginal ? '' : (activeCustomColor || (selectedMatId?.startsWith('wall-') ? '#F8F9FA' : ''));
  const [hexInput, setHexInput] = useState(activeColor || '');

  useEffect(() => {
    setHexInput(activeColor || '');
  }, [activeColor]);

  const handleSelectOriginal = () => {
    setHexInput('');
    setZoneOriginal(currentZone.id);
  };

  const handleSelectPreset = (hex: string) => {
    setHexInput(hex);
    setCustomColor(currentZone.id, hex);
    applyMaterial(currentZone.id, 'wall-pure-white');
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    setCustomColor(currentZone.id, val);
    applyMaterial(currentZone.id, 'wall-pure-white');
  };

  const handleHexBlur = () => {
    if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
      setCustomColor(currentZone.id, hexInput);
      applyMaterial(currentZone.id, 'wall-pure-white');
    }
  };

  return (
    <div className="p-4 border-b border-border bg-surface-50/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
          Architectural Colors
        </span>
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded ${
            isOriginal
              ? 'bg-primary/10 text-primary font-bold tracking-wide'
              : 'text-secondary'
          }`}
        >
          {isOriginal ? 'ORIGINAL 3D' : (hexInput ? hexInput.toUpperCase() : 'CUSTOM')}
        </span>
      </div>

      {/* Preset Swatches (3x3 grid including Original 3D) */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* 1. Original Native 3D Option */}
        <button
          type="button"
          onClick={handleSelectOriginal}
          title="Material & Warna Asli Bawaan Model 3D"
          className={`group flex flex-col items-center p-1.5 rounded-lg border transition-all ${
            isOriginal
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-subtle'
              : 'border-border bg-white hover:border-surface-400'
          }`}
        >
          <div className="relative w-full h-7 rounded border border-black/10 overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-100 via-neutral-200 to-slate-300">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:5px_5px]" />
            {isOriginal ? (
              <Check className="w-3.5 h-3.5 stroke-[3] text-primary relative z-10" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-slate-500 relative z-10 opacity-70 group-hover:opacity-100" />
            )}
          </div>
          <span
            className={`text-[10px] truncate max-w-full mt-1 ${
              isOriginal ? 'font-bold text-primary' : 'font-medium text-secondary'
            }`}
          >
            Original 3D
          </span>
        </button>

        {/* 2 - 9. Curated Architectural Tone Swatches */}
        {PRESET_COLORS.map((col) => {
          const isSelected = !isOriginal && activeColor.toLowerCase() === col.hex.toLowerCase();
          return (
            <button
              key={col.hex}
              type="button"
              onClick={() => handleSelectPreset(col.hex)}
              title={`${col.name} (${col.hex})`}
              className={`group flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-subtle'
                  : 'border-border bg-white hover:border-surface-400'
              }`}
            >
              <div
                className="w-full h-7 rounded border border-black/10 flex items-center justify-center transition-transform group-hover:scale-95"
                style={{ backgroundColor: col.hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 stroke-[3] ${
                      ['#F8F9FA', '#EDE8DD', '#D8CAB8'].includes(col.hex) ? 'text-black' : 'text-white'
                    }`}
                  />
                )}
              </div>
              <span className="text-[10px] text-primary truncate max-w-full mt-1 font-medium">
                {col.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-border">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border shadow-subtle flex-shrink-0 cursor-pointer">
          <input
            type="color"
            value={activeColor || '#FFFFFF'}
            onChange={handleCustomColorChange}
            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer border-0 p-0"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <label className="text-[10px] font-medium uppercase tracking-wider text-secondary">
            Custom Shade
          </label>
          <input
            type="text"
            value={isOriginal ? 'Original (Bawaan 3D)' : hexInput}
            onChange={(e) => {
              const val = e.target.value;
              setHexInput(val);
              if (/^#[0-9A-F]{6}$/i.test(val)) {
                setCustomColor(currentZone.id, val);
                applyMaterial(currentZone.id, 'wall-pure-white');
              }
            }}
            onBlur={handleHexBlur}
            placeholder="#E8E2D6"
            className="text-xs font-mono text-primary font-medium focus:outline-none uppercase bg-transparent"
          />
        </div>

        <Pipette className="w-4 h-4 text-secondary" />
      </div>
    </div>
  );
}
