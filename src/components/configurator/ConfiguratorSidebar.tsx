'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MaterialZone, MaterialOption } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { getMaterialsByCategory, getMaterialById } from '@/lib/materials';
import { CategorySelector } from './CategorySelector';
import { MaterialGrid } from './MaterialGrid';
import { ColorPickerSection } from './ColorPickerSection';
import { FloorTileCustomizer } from './FloorTileCustomizer';
import { CustomTextureUploader } from './CustomTextureUploader';
import { TextureAdjusterPanel } from './TextureAdjusterPanel';
import { Info, Sparkles, CheckCircle2, Layers, ChevronDown, ChevronUp } from 'lucide-react';

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
  const uploadedMaterials = useConfiguratorStore((s) => s.uploadedMaterials);
  const setSelectedMesh = useConfiguratorStore((s) => s.setSelectedMesh);
  const floorEnabled = useConfiguratorStore((s) => s.floorEnabled);

  const [showGroundOverlay, setShowGroundOverlay] = useState(false);

  // Available categories based on the current project's zones, plus 'floor'
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

  // Automatically keep selectedZoneId in sync with current active category
  useEffect(() => {
    if (currentZone && currentZone.id !== selectedZoneId) {
      selectZone(currentZone.id);
    }
  }, [currentZone, selectedZoneId, selectZone]);

  // Materials available for this category including user-uploaded client designs
  const combinedMaterials = useMemo(() => {
    const fromLibrary = getMaterialsByCategory(activeCategory);
    const fromUploaded = uploadedMaterials.filter(
      (m) => m.category === activeCategory || m.isCustomUpload
    );
    const seen = new Set<string>();
    const result: MaterialOption[] = [];
    for (const m of [...fromUploaded, ...fromLibrary]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        result.push(m);
      }
    }
    return result;
  }, [activeCategory, uploadedMaterials]);

  // Currently applied material info
  const appliedMaterialId = currentZone
    ? selectedMaterials[currentZone.id] || currentZone.defaultMaterialId || 'original'
    : null;

  const appliedMaterial = appliedMaterialId
    ? uploadedMaterials.find((m) => m.id === appliedMaterialId) || getMaterialById(appliedMaterialId)
    : null;

  const hasCustomColor = currentZone && Boolean(customColors[currentZone.id]);
  const isOriginal = !hasCustomColor && (!appliedMaterialId || appliedMaterialId === 'original');

  return (
    <aside className="w-full lg:w-96 bg-white border-l border-border flex flex-col h-[400px] lg:h-full z-10 shrink-0 shadow-subtle overflow-hidden">
      {/* Category Tabs */}
      <CategorySelector availableCategories={availableCategories} />

      {/* Zone Switcher (if multiple zones exist in this category) */}
      {categoryZones.length > 1 && (
        <div className="px-4 py-2.5 bg-surface-50 border-b border-border flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-secondary tracking-wider mr-1">
            Zone:
          </span>
          {categoryZones.map((z) => {
            const isSelected = currentZone?.id === z.id;
            return (
              <button
                key={z.id}
                onClick={() => {
                  selectZone(z.id);
                  if (z.meshNames.length > 0) {
                    setSelectedMesh(z.meshNames[0]);
                  }
                }}
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
        {currentZone ? (
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

            {/* Custom Texture Uploader (PNG/JPG client designer patterns) */}
            <CustomTextureUploader currentZone={currentZone} />

            {/* 3D Texture & Surface Fine-Tuning (Color Tint, Bump Depth, Tile Repeat) */}
            {appliedMaterial && appliedMaterial.type === 'texture' ? (
              <TextureAdjusterPanel
                currentZone={currentZone}
                activeMaterial={appliedMaterial}
              />
            ) : (
              /* Color Swatch & Custom Hex Color Picker for solid materials */
              <ColorPickerSection currentZone={currentZone} />
            )}

            {/* Material Grid Header */}
            <div className="px-4 pt-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Material Library ({combinedMaterials.length})
              </span>
              <span className="text-[10px] text-secondary">PBR Textures & Samples</span>
            </div>

            {/* Material Grid */}
            <MaterialGrid
              materials={combinedMaterials}
              currentZone={currentZone}
            />

            {/* Active Material Spec Card */}
            {appliedMaterial && (
              <div className="m-4 p-3.5 bg-surface-50 rounded-xl border border-border">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-accent-warm mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-primary">
                      {isOriginal
                        ? 'Material Bawaan 3D (Original)'
                        : hasCustomColor
                        ? `Custom Tone (${customColors[currentZone.id]})`
                        : appliedMaterial.name}
                    </h4>
                    <p className="text-[11px] text-secondary mt-0.5 leading-normal">
                      {isOriginal
                        ? 'Tekstur dan material bawaan asli dari file 3D CAD / SketchUp.'
                        : appliedMaterial.description || 'Architectural grade surface treatment.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-[10px]">
                  <div>
                    <span className="text-secondary block">Finish</span>
                    <span className="font-medium text-primary capitalize">
                      {isOriginal ? 'Original' : appliedMaterial.finish}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary block">Roughness</span>
                    <span className="font-medium text-primary">
                      {isOriginal ? 'Native' : `${Math.round(appliedMaterial.roughness * 100)}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary block">Reflectance</span>
                    <span className="font-medium text-primary">
                      {isOriginal ? 'Native' : appliedMaterial.metalness > 0.3 ? 'Metallic' : 'Dielectric'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Procedural Floor Overlay Accordion (only in floor category) */}
            {activeCategory === 'floor' && (
              <div className="m-4 border border-border rounded-xl bg-surface-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowGroundOverlay(!showGroundOverlay)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-medium text-secondary hover:text-primary transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-accent" />
                    Lantai Tambahan Prosedural (Ground Overlay)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-secondary">
                    {floorEnabled ? (
                      <span className="text-green-600 font-medium">Aktif</span>
                    ) : (
                      <span className="text-muted-foreground">Nonaktif</span>
                    )}
                    {showGroundOverlay ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {showGroundOverlay && (
                  <div className="p-3 border-t border-border bg-white">
                    <FloorTileCustomizer />
                  </div>
                )}
              </div>
            )}
          </>
        ) : activeCategory === 'floor' ? (
          <FloorTileCustomizer />
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
          <span className="truncate max-w-[200px]">
            {hoveredMeshName ? `Hover: ${hoveredMeshName}` : 'Click any 3D surface to select'}
          </span>
        </div>
        <span className="font-mono text-[10px]">PBR 60FPS</span>
      </div>
    </aside>
  );
}
