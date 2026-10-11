'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MaterialZone, MaterialOption } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { useMaterialsStore } from '@/lib/materials-store';
import {
  UploadCloud,
  Sparkles,
  Check,
  Image as ImageIcon,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Grid,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  FLOOR_TILE_PRESETS,
  WALL_TILE_PRESETS,
  GROUT_COLOR_PRESETS,
  GROUT_WIDTH_PRESETS,
  calculateRepeatFromTileSize,
} from '@/lib/tile-constants';
import { optimizeTextureImage } from '@/lib/image-optimizer';
import {
  extractSizeFromFilename,
  inferSuggestedTilePreset,
  detectTileBounds,
} from '@/lib/tile-autotrim';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bumpDepth, setBumpDepth] = useState(0.16);
  const [surfaceFinish, setSurfaceFinish] = useState<'gloss' | 'satin' | 'textured'>('gloss');

  // Surface Type: Wall (Dinding) vs Floor (Lantai)
  const isDefaultFloor = currentZone.category === 'floor' || currentZone.id.includes('lantai');
  const [surfaceType, setSurfaceType] = useState<'wall' | 'floor'>(isDefaultFloor ? 'floor' : 'wall');

  // Tile dimensions in cm
  const [selectedTileSize, setSelectedTileSize] = useState<[number, number]>(
    isDefaultFloor ? [60, 60] : [30, 60]
  );
  const [isCustomTileSize, setIsCustomTileSize] = useState(false);
  const [customWidthCm, setCustomWidthCm] = useState(60);
  const [customHeightCm, setCustomHeightCm] = useState(60);

  // Nat Keramik (Grout Joint) Controls
  const [showGrout, setShowGrout] = useState(true);
  const [groutWidthMm, setGroutWidthMm] = useState(2);
  const [groutColor, setGroutColor] = useState('#8E9297');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default surface type when currentZone changes
  useEffect(() => {
    const isFloor = currentZone.category === 'floor' || currentZone.id.includes('lantai');
    setSurfaceType(isFloor ? 'floor' : 'wall');
    setSelectedTileSize(isFloor ? [60, 60] : [30, 60]);
  }, [currentZone.id, currentZone.category]);

  const activePresets = surfaceType === 'floor' ? FLOOR_TILE_PRESETS : WALL_TILE_PRESETS;
  const effectiveTileSize: [number, number] = isCustomTileSize
    ? [customWidthCm, customHeightCm]
    : selectedTileSize;

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadError(null);

    // Format clean pattern name from file name
    const clean = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    setPatternName(clean);

    // Auto-detect tile dimensions from filename (e.g. CV90180 -> 90x180)
    const filenameSize = extractSizeFromFilename(file.name);
    if (filenameSize) {
      const [w, h] = filenameSize;
      const isWallMatch = WALL_TILE_PRESETS.some((p) => p.widthCm === w && p.heightCm === h);
      const isFloorMatch = FLOOR_TILE_PRESETS.some((p) => p.widthCm === w && p.heightCm === h);

      if (isWallMatch && surfaceType === 'wall') {
        setSelectedTileSize([w, h]);
        setIsCustomTileSize(false);
      } else if (isFloorMatch && surfaceType === 'floor') {
        setSelectedTileSize([w, h]);
        setIsCustomTileSize(false);
      } else if (isWallMatch) {
        setSurfaceType('wall');
        setSelectedTileSize([w, h]);
        setIsCustomTileSize(false);
      } else if (isFloorMatch) {
        setSurfaceType('floor');
        setSelectedTileSize([w, h]);
        setIsCustomTileSize(false);
      } else {
        setIsCustomTileSize(true);
        setCustomWidthCm(w);
        setCustomHeightCm(h);
      }
    } else {
      // If filename has no dimensions, inspect image content aspect ratio
      const img = new Image();
      img.onload = () => {
        const bounds = detectTileBounds(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        const suggested = inferSuggestedTilePreset(bounds.aspectRatio, surfaceType);
        const isPreset = (surfaceType === 'wall' ? WALL_TILE_PRESETS : FLOOR_TILE_PRESETS).some(
          (p) => p.widthCm === suggested[0] && p.heightCm === suggested[1]
        );
        if (isPreset) {
          setSelectedTileSize(suggested);
          setIsCustomTileSize(false);
        }
      };
      img.src = url;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      let permanentUrl = previewUrl;

      // 1. Upload to CDN via /api/materials/upload with optimization & direct signed upload fallback
      if (selectedFile) {
        let cdnUrl: string | undefined;
        const optimizedFile = await optimizeTextureImage(selectedFile);

        try {
          const formData = new FormData();
          formData.append('file', optimizedFile);

          const uploadRes = await fetch('/api/materials/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            cdnUrl = uploadData.url || uploadData.uploaded?.[0]?.url;
          } else {
            console.warn('[CustomTextureUploader] Standard upload status:', uploadRes.status);
          }
        } catch (apiErr) {
          console.warn('[CustomTextureUploader] API upload failed, attempting fallback direct sign upload:', apiErr);
        }

        // Direct Signed Upload Fallback to Bunny Storage if API returned error or payload exceeded
        if (!cdnUrl) {
          try {
            const signRes = await fetch('/api/upload/direct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: optimizedFile.name,
                targetFolder: 'textures',
              }),
            });

            if (signRes.ok) {
              const signData = await signRes.json();
              const directUploadRes = await fetch(signData.uploadUrl, {
                method: 'PUT',
                headers: {
                  AccessKey: signData.accessKey,
                  'Content-Type': optimizedFile.type || 'image/jpeg',
                },
                body: optimizedFile,
              });

              if (directUploadRes.ok) {
                cdnUrl = signData.publicUrl;
              }
            }
          } catch (directErr) {
            console.warn('[CustomTextureUploader] Direct upload fallback failed:', directErr);
          }
        }

        if (cdnUrl) {
          permanentUrl = cdnUrl;
        } else {
          // If offline or storage unreachable, fallback to auto-cropped optimized file URL
          console.info('[CustomTextureUploader] Using local auto-cropped URL as material texture fallback');
          permanentUrl = URL.createObjectURL(optimizedFile);
        }
      }

      const repeat = calculateRepeatFromTileSize(effectiveTileSize);
      const newId = `custom-texture-${Date.now()}`;

      const newMaterial: MaterialOption = {
        id: newId,
        name:
          patternName.trim() ||
          `Keramik ${surfaceType === 'floor' ? 'Lantai' : 'Dinding'} ${effectiveTileSize[0]}x${effectiveTileSize[1]}`,
        category: surfaceType === 'floor' ? 'floor' : 'wall',
        type: 'texture',
        textureUrl: permanentUrl,
        previewThumbnail: permanentUrl,
        roughness: surfaceFinish === 'gloss' ? 0.2 : surfaceFinish === 'satin' ? 0.38 : 0.65,
        metalness: 0.05,
        bumpScale: bumpDepth,
        finish: surfaceFinish,
        repeat: repeat,
        tileSizeCm: effectiveTileSize,
        surfaceType: surfaceType,
        showGrout: showGrout,
        groutWidthMm: showGrout ? groutWidthMm : 0,
        groutColor: groutColor,
        description: `Pola ubin ${surfaceType === 'floor' ? 'lantai' : 'dinding'} ${effectiveTileSize[0]}x${effectiveTileSize[1]} cm dengan nat ${showGrout ? `${groutWidthMm} mm` : 'tanpa nat'}.`,
        tag: surfaceType === 'floor' ? 'Keramik Lantai' : 'Keramik Dinding',
        isCustomUpload: true,
      };

      // 2. Persist to server database & localStorage
      try {
        await useMaterialsStore.getState().addCustomMaterial(newMaterial);
      } catch (storeErr) {
        console.warn('[CustomTextureUploader] Could not save material to server database:', storeErr);
      }

      // 3. Register in in-memory configuratorStore and immediately apply to active 3D zone
      addUploadedMaterial(newMaterial);
      applyMaterial(currentZone.id, newId);
      setZoneTextureSettings(currentZone.id, {
        repeat: repeat,
        bumpScale: bumpDepth,
        roughness: newMaterial.roughness,
        rotation: 0,
        colorTint: '#FFFFFF',
        tileSizeCm: effectiveTileSize,
        surfaceType: surfaceType,
        showGrout: showGrout,
        groutWidthMm: showGrout ? groutWidthMm : 0,
        groutColor: groutColor,
      });

      setIsOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);
      setPatternName('');
    } catch (err: any) {
      console.error('[Apply Custom Texture] Error:', err);
      setUploadError(err?.message || 'Gagal menyimpan pola keramik');
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="border-b border-border bg-white">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center">
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-primary block">
              Upload Pola Keramik &amp; Nat (Design Pattern)
            </span>
            <span className="text-[10px] text-secondary">
              Pilih ukuran dinding/lantai presisi &amp; nat pembatas konstruksi
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


          {/* Form */}
          <form onSubmit={handleApplyCustom} className="space-y-3.5">
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
                      {patternName || 'Pola Gambar Siap'}
                    </span>
                    <span className="text-[10px] text-secondary block">
                      Klik untuk ganti gambar lain
                    </span>
                    <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200/50">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                      <span>Auto-Crop: Margin transparan/hitam dipotong presisi</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <ImageIcon className="w-5 h-5 text-secondary mb-1" />
                  <span className="text-xs font-medium text-primary">
                    Pilih atau seret gambar pola (PNG / JPG / WebP)
                  </span>
                  <span className="text-[10px] text-secondary mt-0.5">
                    Mendukung foto keramik, marmer, granit &amp; ubin
                  </span>
                </div>
              )}
            </div>

            {previewUrl && (
              <>
                {/* 1. Nama Desain Pola */}
                <div>
                  <label className="text-[11px] font-medium text-secondary block mb-1">
                    Nama Pola / Material
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Keramik Granit Calacatta Gold"
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-white text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 2. Pilihan Target Permukaan: Dinding vs Lantai */}
                <div>
                  <span className="text-[11px] font-semibold text-secondary block mb-1">
                    1. Tipe Bidang Permukaan
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setSurfaceType('wall');
                        setIsCustomTileSize(false);
                        setSelectedTileSize([30, 60]);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        surfaceType === 'wall'
                          ? 'bg-white text-primary shadow-subtle'
                          : 'text-secondary hover:text-primary'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>Dinding (Wall)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSurfaceType('floor');
                        setIsCustomTileSize(false);
                        setSelectedTileSize([60, 60]);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        surfaceType === 'floor'
                          ? 'bg-white text-primary shadow-subtle'
                          : 'text-secondary hover:text-primary'
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5 text-primary" />
                      <span>Lantai (Floor)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Pilihan Ukuran Keramik / Ubin Standar sesuai Lampiran */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-secondary">
                      2. Ukuran Keramik ({surfaceType === 'floor' ? 'Ukuran Lantai' : 'Ukuran Dinding'})
                    </span>
                    <span className="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                      {effectiveTileSize[0]} × {effectiveTileSize[1]} cm
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 mb-1.5">
                    {activePresets.map((preset) => {
                      const isSelected =
                        !isCustomTileSize &&
                        selectedTileSize[0] === preset.widthCm &&
                        selectedTileSize[1] === preset.heightCm;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedTileSize([preset.widthCm, preset.heightCm]);
                            setIsCustomTileSize(false);
                          }}
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

                  {/* Custom Size Input */}
                  {isCustomTileSize && (
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-border">
                      <div className="flex-1">
                        <label className="text-[9px] text-secondary block">Lebar (cm)</label>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={customWidthCm}
                          onChange={(e) => setCustomWidthCm(Math.max(5, parseInt(e.target.value) || 60))}
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
                          value={customHeightCm}
                          onChange={(e) => setCustomHeightCm(Math.max(5, parseInt(e.target.value) || 60))}
                          className="w-full px-2 py-1 text-xs border border-border rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Real-world scale indicator */}
                  <div className="p-2 bg-emerald-50 border border-emerald-200/60 rounded-lg text-[10px] text-emerald-800 leading-tight space-y-0.5 mt-1">
                    <p className="font-semibold">
                      📐 Skala Realistis 1:1:
                    </p>
                    <p>
                      Pada dinding/lantai 100×100 cm: akan tampil{' '}
                      <strong>{(100 / effectiveTileSize[0]).toFixed(effectiveTileSize[0] === 100 ? 0 : 1)}</strong> ubin mendatar ×{' '}
                      <strong>{(100 / effectiveTileSize[1]).toFixed(effectiveTileSize[1] === 100 ? 0 : 1)}</strong> ubin meninggi.
                    </p>
                  </div>
                </div>

                {/* 4. Nat Keramik (Grout Joint) Controls */}
                <div className="border-t border-border pt-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-primary block">
                        3. Nat Keramik (Pembatas Ubin)
                      </span>
                      <span className="text-[9px] text-secondary block">
                        Garis pembatas nat semen antar ubin keramik
                      </span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={showGrout}
                      onClick={() => setShowGrout(!showGrout)}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                        showGrout ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          showGrout ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {showGrout && (
                    <div className="p-2.5 bg-white rounded-xl border border-border space-y-2">
                      {/* Grout Width */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-secondary font-medium">Lebar Nat:</span>
                          <span className="font-mono font-bold text-primary">{groutWidthMm} mm</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {GROUT_WIDTH_PRESETS.filter((p) => p.valueMm > 0).map((gp) => (
                            <button
                              key={gp.valueMm}
                              type="button"
                              onClick={() => setGroutWidthMm(gp.valueMm)}
                              className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                                groutWidthMm === gp.valueMm
                                  ? 'bg-primary text-white border-primary'
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
                              onClick={() => setGroutColor(gc.hex)}
                              title={gc.name}
                              className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                groutColor.toLowerCase() === gc.hex.toLowerCase()
                                  ? 'ring-2 ring-primary scale-110'
                                  : 'border-border'
                              }`}
                              style={{ backgroundColor: gc.hex }}
                            >
                              {groutColor.toLowerCase() === gc.hex.toLowerCase() && (
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
                            value={groutColor}
                            onChange={(e) => setGroutColor(e.target.value)}
                            title="Pilih warna nat kustom"
                            className="w-6 h-6 rounded-md border border-border cursor-pointer p-0 bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. 3D Tactile Relief Depth & Surface Sheen */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                  <div>
                    <span className="text-[10px] font-semibold text-secondary block mb-1">
                      Kedalaman 3D
                    </span>
                    <input
                      type="range"
                      min="0.0"
                      max="0.30"
                      step="0.02"
                      value={bumpDepth}
                      onChange={(e) => setBumpDepth(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-[9px] text-secondary font-mono">
                      {(bumpDepth * 100).toFixed(0)}% Timbul
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-secondary block mb-1">
                      Kilau Permukaan
                    </span>
                    <div className="grid grid-cols-3 gap-0.5 text-[10px]">
                      {(['gloss', 'satin', 'textured'] as const).map((finish) => (
                        <button
                          key={finish}
                          type="button"
                          onClick={() => setSurfaceFinish(finish)}
                          className={`py-1 capitalize font-medium rounded border transition-colors ${
                            surfaceFinish === finish
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-secondary border-border'
                          }`}
                        >
                          {finish === 'gloss' ? 'Kilap' : finish === 'satin' ? 'Satin' : 'Kasar'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {uploadError && (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Submit Apply Button */}
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah & Menyimpan Pola...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        Terapkan Keramik {effectiveTileSize[0]}×{effectiveTileSize[1]} cm ke 3D {currentZone.name}
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
