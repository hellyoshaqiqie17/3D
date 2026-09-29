'use client';

import React, { useMemo } from 'react';
import { MaterialZone } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { getMaterialsByCategory, getMaterialById } from '@/lib/materials';
import { CategorySelector } from './CategorySelector';
import { MaterialGrid } from './MaterialGrid';
import { ColorPickerSection } from './ColorPickerSection';
import { FloorTileCustomizer } from './FloorTileCustomizer';
import { Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface ConfiguratorSidebarProps {
  zones: MaterialZone[];
}

export function ConfiguratorSidebar({ zones }: ConfiguratorSidebarProps) {
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);
  const selectedZoneId = useConfiguratorStore((s) => s.selectedZoneId);
  const selectZone = useConfiguratorStore((s) => s.selectZone);
  const selectedMaterials = useConfiguratorStore((s) => s.selectedMaterials);
  const customColors = useConfiguratorStore((s) => s.customColors);
  const hoveredMeshName = useConfiguratorStore((s) => s.hoveredMeshName);

  // Available categories based on the current project's zones, plus 'floor' so user can always customize/import tiles!
  const availableCategories = useMemo(() => {
    const set = new Set(zones.map((z) => z.category));
    set.add('floor');
    return Array.from(set);
  }, [zones]);

  // Zones in current active category
  const categoryZones = useMemo(() => {
    return zones.filter((z) => z.category === activeCategory);
  }, [zones, activeCategory]);

  // Current active zone (fallback to first zone in category if none or invalid)
  const currentZone = useMemo(() => {
    const found = categoryZones.find((z) => z.id === selectedZoneId);
    if (found) return found;
    return categoryZones[0] || zones[0];
  }, [categoryZones, selectedZoneId, zones]);

  // Materials available for this category
  const availableMaterials = useMemo(() => {
    return getMaterialsByCategory(activeCategory);
  }, [activeCategory]);

  // Currently applied material info
  const appliedMaterialId = currentZone ? (selectedMaterials[currentZone.id] || currentZone.defaultMaterialId) : null;
  const appliedMaterial = appliedMaterialId ? getMaterialById(appliedMaterialId) : null;
  const hasCustomColor = currentZone && Boolean(customColors[currentZone.id]);

  return (
    <aside className="w-full lg:w-96 bg-white border-l border-border flex flex-col h-[400px] lg:h-full z-10 shrink-0 shadow-subtle overflow-hidden">
      {/* Category Tabs */}
      <CategorySelector availableCategories={availableCategories} />

      {/* Zone Switcher (if multiple zones exist in this category) */}
      {activeCategory !== 'floor' && categoryZones.length > 1 && (
        <div className="px-4 py-2.5 bg-surface-50 border-b border-border flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-secondary tracking-wider mr-1">
            Zone:
          </span>
          {categoryZones.map((z) => {
            const isSelected = currentZone?.id === z.id;
            return (
              <button
                key={z.id}
                onClick={() => selectZone(z.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white text-primary border border-border shadow-subtle'
                    : 'text-secondary hover:text-primary hover:bg-surface-200'
                }`}
              >
                {z.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Material Selection Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {activeCategory === 'floor' ? (
          <FloorTileCustomizer />
        ) : currentZone ? (
          <>
            {/* Zone Header Banner */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-primary">{currentZone.name}</h3>
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-surface-100 text-secondary rounded">
                  {currentZone.category}
                </span>
              </div>
              {currentZone.description && (
                <p className="text-xs text-secondary leading-relaxed">
                  {currentZone.description}
                </p>
              )}
            </div>

            {/* Color Swatch & Custom Hex Color Picker for current active zone */}
            <ColorPickerSection currentZone={currentZone} />

            {/* Material Grid Header */}
            <div className="px-4 pt-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Material Library ({availableMaterials.length})
              </span>
              <span className="text-[10px] text-secondary">PBR Textures</span>
            </div>

            {/* Material Grid */}
            <MaterialGrid
              materials={availableMaterials}
              currentZone={currentZone}
            />

            {/* Active Material Spec Card */}
            {appliedMaterial && (
              <div className="m-4 p-3.5 bg-surface-50 rounded-xl border border-border">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent-warm mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-primary">
                      {hasCustomColor ? `Custom Tone (${customColors[currentZone.id]})` : appliedMaterial.name}
                    </h4>
                    <p className="text-[11px] text-secondary mt-0.5 leading-normal">
                      {appliedMaterial.description || 'Architectural grade surface treatment.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-[10px]">
                  <div>
                    <span className="text-secondary block">Finish</span>
                    <span className="font-medium text-primary capitalize">{appliedMaterial.finish}</span>
                  </div>
                  <div>
                    <span className="text-secondary block">Roughness</span>
                    <span className="font-medium text-primary">{appliedMaterial.roughness * 100}%</span>
                  </div>
                  <div>
                    <span className="text-secondary block">Reflectance</span>
                    <span className="font-medium text-primary">{appliedMaterial.metalness > 0.3 ? 'Metallic' : 'Dielectric'}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-secondary text-xs">
            Select a material category or click on the 3D model surface to customize.
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="p-3 bg-surface-50 border-t border-border flex items-center justify-between text-[11px] text-secondary">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-secondary" />
          <span className="truncate max-w-[220px]">
            {hoveredMeshName ? `Target: ${hoveredMeshName}` : 'Click any 3D surface to select'}
          </span>
        </div>
        <span className="font-mono text-[10px]">PBR 60FPS</span>
      </div>
    </aside>
  );
}
