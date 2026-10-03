'use client';

import React, { useState, useRef } from 'react';
import { MaterialZone, MaterialOption } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  UploadCloud,
  Sparkles,
  Check,
  Image as ImageIcon,
  Plus,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CustomTextureUploaderProps {
  currentZone: MaterialZone;
}

export function CustomTextureUploader({ currentZone }: CustomTextureUploaderProps) {
  const addUploadedMaterial = useConfiguratorStore((s) => s.addUploadedMaterial);
  const applyMaterial = useConfiguratorStore((s) => s.applyMaterial);
  const setZoneTextureSettings = useConfiguratorStore((s) => s.setZoneTextureSettings);
  const uploadedMaterials = useConfiguratorStore((s) => s.uploadedMaterials);

  const [isOpen, setIsOpen] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bumpDepth, setBumpDepth] = useState(0.16);
  const [tileRepeat, setTileRepeat] = useState(4);
  const [surfaceFinish, setSurfaceFinish] = useState<'gloss' | 'satin' | 'textured'>('gloss');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      if (!patternName) {
        setPatternName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      if (!patternName) {
        setPatternName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    const newId = `custom-texture-${Date.now()}`;
    const newMaterial: MaterialOption = {
      id: newId,
      name: patternName.trim() || 'Custom Client Design',
      category: currentZone.category,
      type: 'texture',
      textureUrl: previewUrl,
      previewThumbnail: previewUrl,
      roughness: surfaceFinish === 'gloss' ? 0.2 : surfaceFinish === 'satin' ? 0.38 : 0.65,
      metalness: 0.05,
      bumpScale: bumpDepth,
      finish: surfaceFinish,
      repeat: [tileRepeat, tileRepeat],
      description: 'Client designer custom imported pattern with 3D tactile relief.',
      tag: 'Imported',
      isCustomUpload: true,
    };

    addUploadedMaterial(newMaterial);
    applyMaterial(currentZone.id, newId);
    setZoneTextureSettings(currentZone.id, {
      repeat: [tileRepeat, tileRepeat],
      bumpScale: bumpDepth,
      roughness: newMaterial.roughness,
      rotation: 0,
      colorTint: '#FFFFFF',
    });

    setIsOpen(false);
    setPreviewUrl(null);
    setPatternName('');
  };

  const handleQuickLoadPreset = (
    url: string,
    name: string,
    bump: number,
    repeat: number,
    finish: 'gloss' | 'textured'
  ) => {
    const targetMat = uploadedMaterials.find((m) => m.textureUrl === url);
    const targetId = targetMat?.id || `designer-${Date.now()}`;

    if (!targetMat) {
      const newMat: MaterialOption = {
        id: targetId,
        name: name,
        category: currentZone.category,
        type: 'texture',
        textureUrl: url,
        previewThumbnail: url,
        roughness: finish === 'gloss' ? 0.2 : 0.6,
        metalness: 0.06,
        bumpScale: bump,
        finish: finish,
        repeat: [repeat, repeat],
        description: 'Client designer pattern with 3D tactile relief.',
        tag: 'Client Design',
        isCustomUpload: true,
      };
      addUploadedMaterial(newMat);
    }

    applyMaterial(currentZone.id, targetId);
    setZoneTextureSettings(currentZone.id, {
      repeat: [repeat, repeat],
      bumpScale: bump,
      roughness: finish === 'gloss' ? 0.2 : 0.6,
      rotation: 0,
      colorTint: '#FFFFFF',
    });
  };

  return (
    <div className="border-b border-border bg-white">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center">
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-primary block">
              Import Designer Pattern (PNG/JPG)
            </span>
            <span className="text-[10px] text-secondary">
              Turn client image into 3D tactile tiles or wall finish
            </span>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-secondary" />
        )}
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-border/60 bg-surface-50/40 space-y-4">
          {/* Quick Client Samples Provided by User */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block mb-1.5">
              Quick Client Samples:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickLoadPreset(
                    '/textures/designer-tile-mosaic.jpg',
                    'Designer Checker Mosaic',
                    0.16,
                    4,
                    'gloss'
                  )
                }
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-border hover:border-primary transition-all text-left shadow-subtle group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/textures/designer-tile-mosaic.jpg"
                  alt="Checker Mosaic"
                  className="w-8 h-8 rounded object-cover border border-border shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-primary block truncate group-hover:text-accent">
                    Checker Mosaic
                  </span>
                  <span className="text-[9px] text-secondary block">Sample 1</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLoadPreset(
                    '/textures/designer-tile-slate.jpg',
                    'Tactile Relief Slate',
                    0.22,
                    4,
                    'textured'
                  )
                }
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-border hover:border-primary transition-all text-left shadow-subtle group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/textures/designer-tile-slate.jpg"
                  alt="Relief Slate"
                  className="w-8 h-8 rounded object-cover border border-border shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-primary block truncate group-hover:text-accent">
                    Relief Slate Grid
                  </span>
                  <span className="text-[9px] text-secondary block">Sample 2</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-2 text-[10px] text-secondary uppercase font-medium">
              or upload custom file
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleApplyCustom} className="space-y-3">
            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-3.5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                previewUrl
                  ? 'border-primary bg-white'
                  : 'border-border hover:border-surface-400 bg-white/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                  />
                  <div className="text-left min-w-0">
                    <span className="text-xs font-semibold text-primary block truncate">
                      {patternName || 'Texture Ready'}
                    </span>
                    <span className="text-[10px] text-secondary block">
                      Click to choose different image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <ImageIcon className="w-5 h-5 text-secondary mb-1" />
                  <span className="text-xs font-medium text-primary">
                    Drop PNG or JPG client tile pattern
                  </span>
                  <span className="text-[10px] text-secondary mt-0.5">
                    Supports high-res seamless tile textures
                  </span>
                </div>
              )}
            </div>

            {previewUrl && (
              <>
                <div>
                  <label className="text-[11px] font-medium text-secondary block mb-1">
                    Design Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Suite Artisan Mosaic"
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-white text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 3D Depth / Relief Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium text-secondary">3D Tactile Relief Depth</span>
                    <span className="font-mono text-primary font-semibold">
                      {(bumpDepth * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.35"
                    step="0.01"
                    value={bumpDepth}
                    onChange={(e) => setBumpDepth(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[9px] text-secondary mt-0.5">
                    <span>Flat (0%)</span>
                    <span>Standard Relief (15%)</span>
                    <span>Deep 3D (35%)</span>
                  </div>
                </div>

                {/* Tile Scale / Repeat */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium text-secondary">Pattern Repeat / Scale</span>
                    <span className="font-mono text-primary font-semibold">
                      {tileRepeat}x{tileRepeat}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 4, 8].map((rep) => (
                      <button
                        key={rep}
                        type="button"
                        onClick={() => setTileRepeat(rep)}
                        className={`py-1 text-xs font-mono font-medium rounded border transition-colors ${
                          tileRepeat === rep
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-secondary border-border hover:border-surface-400'
                        }`}
                      >
                        {rep}x{rep}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Surface Finish */}
                <div>
                  <span className="text-[11px] font-medium text-secondary block mb-1">
                    Surface Finish
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {(['gloss', 'satin', 'textured'] as const).map((finish) => (
                      <button
                        key={finish}
                        type="button"
                        onClick={() => setSurfaceFinish(finish)}
                        className={`py-1 capitalize font-medium rounded border transition-colors ${
                          surfaceFinish === finish
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-secondary border-border hover:border-surface-400'
                        }`}
                      >
                        {finish}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Pattern to 3D {currentZone.name}</span>
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
