'use client';

import React, { useState } from 'react';
import { MaterialZone } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { Pipette, Check } from 'lucide-react';

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

  const activeColor = customColors[currentZone.id] || '#F8F9FA';
  const [hexInput, setHexInput] = useState(activeColor);

  const handleSelectPreset = (hex: string) => {
    setHexInput(hex);
    setCustomColor(currentZone.id, hex);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    setCustomColor(currentZone.id, val);
  };

  const handleHexBlur = () => {
    if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
      setCustomColor(currentZone.id, hexInput);
    }
  };

  return (
    <div className="p-4 border-b border-border bg-surface-50/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
          Architectural Colors
        </span>
        <span className="text-[11px] font-mono text-secondary">{hexInput.toUpperCase()}</span>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PRESET_COLORS.map((col) => {
          const isSelected = activeColor.toLowerCase() === col.hex.toLowerCase();
          return (
            <button
              key={col.hex}
              onClick={() => handleSelectPreset(col.hex)}
              title={`${col.name} (${col.hex})`}
              className={`group flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-white'
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
            value={activeColor}
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
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
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
