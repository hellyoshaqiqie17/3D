'use client';

import React, { useEffect, useState } from 'react';
import { MaterialOption, MaterialZone } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { getMaterialThumbnail } from '@/lib/texture-generator';
import { Check, Sparkles } from 'lucide-react';

interface MaterialGridProps {
  materials: MaterialOption[];
  currentZone: MaterialZone;
}

export function MaterialGrid({ materials, currentZone }: MaterialGridProps) {
  const selectedMaterials = useConfiguratorStore((s) => s.selectedMaterials);
  const applyMaterial = useConfiguratorStore((s) => s.applyMaterial);

  const currentMaterialId = selectedMaterials[currentZone.id] || currentZone.defaultMaterialId;

  // Pre-generate thumbnails in state once mounted to prevent SSR hydration mismatch
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const thumbs: Record<string, string> = {};
    materials.forEach((mat) => {
      if (mat.type === 'texture' && mat.textureType) {
        thumbs[mat.id] = getMaterialThumbnail(mat.textureType);
      }
    });
    setThumbnails(thumbs);
  }, [materials]);

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {materials.map((mat) => {
        const isSelected = currentMaterialId === mat.id;
        const thumbnailSrc = thumbnails[mat.id];

        return (
          <button
            key={mat.id}
            onClick={() => applyMaterial(currentZone.id, mat.id)}
            className={`group relative text-left rounded-xl p-2.5 transition-all border flex flex-col justify-between ${
              isSelected
                ? 'bg-surface-50 border-primary ring-1 ring-primary shadow-subtle'
                : 'bg-white border-border hover:border-surface-400 hover:shadow-subtle'
            }`}
          >
            {/* Visual Thumbnail Area */}
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-surface-100 border border-border/50">
              {mat.type === 'texture' && (mat.previewThumbnail || mat.textureUrl || thumbnailSrc) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mat.previewThumbnail || mat.textureUrl || thumbnailSrc}
                  alt={mat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: mat.color || '#E5E7EB' }}
                />
              )}

              {/* Tag pill */}
              {mat.tag && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase bg-black/60 backdrop-blur-sm text-white rounded">
                  {mat.tag}
                </span>
              )}

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-subtle">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-semibold text-primary truncate" title={mat.name}>
                  {mat.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-medium text-secondary">
                  {mat.finish}
                </span>
                <span className="text-secondary/40 text-[10px]">•</span>
                <span className="text-[10px] text-secondary capitalize">
                  {mat.type}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
