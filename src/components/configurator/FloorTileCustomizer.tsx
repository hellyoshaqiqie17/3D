'use client';

import React, { useRef } from 'react';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  Layers,
  Upload,
  Sparkles,
  Sliders,
  CheckCircle2,
  Trash2,
  Eye,
  Info,
  Maximize2,
  Grid,
  Home,
  Building2,
  RotateCcw,
} from 'lucide-react';

interface PresetTile {
  id: string;
  name: string;
  category: string;
  colorPreview: string;
  description: string;
}

const PRESET_TILES: PresetTile[] = [
  {
    id: 'floor-carrara-marble',
    name: 'Marmer Putih Carrara',
    category: 'Marble Luxury',
    colorPreview: '#F3F4F6',
    description: 'Marmer putih Italia dengan urat abu-abu halus dan pantulan mewah.',
  },
  {
    id: 'floor-nero-marble',
    name: 'Granit Nero Marquina',
    category: 'Black Granite',
    colorPreview: '#1E2024',
    description: 'Granit hitam obsidian eksklusif dengan serat kalsit putih elegan.',
  },
  {
    id: 'floor-terrazzo',
    name: 'Keramik Terrazzo Mozaik',
    category: 'Modern Terrazzo',
    colorPreview: '#E5DFD7',
    description: 'Motif teraso kontemporer dengan butiran batu agregat warna-warni.',
  },
  {
    id: 'floor-oak-natural',
    name: 'Parket Kayu Oak Alami',
    category: 'Wood Parquet',
    colorPreview: '#D8B689',
    description: 'Lantai kayu oak Eropa dengan serat alami serat hangat.',
  },
  {
    id: 'floor-herringbone',
    name: 'Herringbone Zig-Zag Oak',
    category: 'French Parquet',
    colorPreview: '#C9A779',
    description: 'Pola anyaman parket herringbone gaya apartemen Paris klasik.',
  },
  {
    id: 'floor-tile-stone',
    name: 'Keramik Granit Abu 60x60',
    category: 'Stone Tile',
    colorPreview: '#9CA3AF',
    description: 'Ubin granit batu alam abu-abu modern dengan nat presisi.',
  },
  {
    id: 'floor-tile-travertine',
    name: 'Batu Travertine Cream',
    category: 'Natural Stone',
    colorPreview: '#E8DFC9',
    description: 'Batu alam travertine warna krem pasir Mediterania.',
  },
  {
    id: 'floor-polished-concrete',
    name: 'Beton Microcement Halus',
    category: 'Industrial',
    colorPreview: '#B4B8BC',
    description: 'Finishing lantai semen cor halus microcement gaya industrial minimalis.',
  },
  {
    id: 'floor-tile-subway',
    name: 'Ubin Keramik Kotak Glossy',
    category: 'Classic Grid',
    colorPreview: '#FFFFFF',
    description: 'Ubin keramik kotak putih bersih dengan nat teratur.',
  },
];

const TINT_PALETTE = [
  { name: 'Putih Bersih', hex: '#FFFFFF' },
  { name: 'Warm Cream', hex: '#F6F3EB' },
  { name: 'Abu Modern', hex: '#D1D5DB' },
  { name: 'Charcoal Gelap', hex: '#374151' },
  { name: 'Cokelat Kayu', hex: '#8C6747' },
  { name: 'Terracotta', hex: '#B45309' },
];

export function FloorTileCustomizer() {
  const floorEnabled = useConfiguratorStore((s) => s.floorEnabled);
  const floorTextureUrl = useConfiguratorStore((s) => s.floorTextureUrl);
  const floorPresetId = useConfiguratorStore((s) => s.floorPresetId);
  const floorTileRepeat = useConfiguratorStore((s) => s.floorTileRepeat);
  const floorRoughness = useConfiguratorStore((s) => s.floorRoughness);
  const floorColor = useConfiguratorStore((s) => s.floorColor);
  const floorSizeScale = useConfiguratorStore((s) => s.floorSizeScale);
  const floorElevation = useConfiguratorStore((s) => s.floorElevation);

  const detectedFootprint = useConfiguratorStore((s) => s.detectedFootprint);
  const floorFitMode = useConfiguratorStore((s) => s.floorFitMode);
  const floorCustomWidth = useConfiguratorStore((s) => s.floorCustomWidth);
  const floorCustomDepth = useConfiguratorStore((s) => s.floorCustomDepth);
  const floorOffsetX = useConfiguratorStore((s) => s.floorOffsetX);
  const floorOffsetZ = useConfiguratorStore((s) => s.floorOffsetZ);

  const setFloorEnabled = useConfiguratorStore((s) => s.setFloorEnabled);
  const setFloorTextureUrl = useConfiguratorStore((s) => s.setFloorTextureUrl);
  const setFloorPresetId = useConfiguratorStore((s) => s.setFloorPresetId);
  const setFloorTileRepeat = useConfiguratorStore((s) => s.setFloorTileRepeat);
  const setFloorRoughness = useConfiguratorStore((s) => s.setFloorRoughness);
  const setFloorColor = useConfiguratorStore((s) => s.setFloorColor);
  const setFloorSizeScale = useConfiguratorStore((s) => s.setFloorSizeScale);
  const setFloorElevation = useConfiguratorStore((s) => s.setFloorElevation);

  const setFloorFitMode = useConfiguratorStore((s) => s.setFloorFitMode);
  const setFloorCustomWidth = useConfiguratorStore((s) => s.setFloorCustomWidth);
  const setFloorCustomDepth = useConfiguratorStore((s) => s.setFloorCustomDepth);
  const setFloorOffsetX = useConfiguratorStore((s) => s.setFloorOffsetX);
  const setFloorOffsetZ = useConfiguratorStore((s) => s.setFloorOffsetZ);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file upload (PNG/JPG/WEBP)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (.png, .jpg, .jpeg, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFloorTextureUrl(result);
        if (!floorEnabled) setFloorEnabled(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetTexture = () => {
    setFloorTextureUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Label calculation for tile repeat scale
  let tileSizeLabel = 'Slab Besar (~120x120 cm)';
  if (floorTileRepeat >= 5 && floorTileRepeat < 10) {
    tileSizeLabel = 'Standar (~60x60 cm)';
  } else if (floorTileRepeat >= 10 && floorTileRepeat < 18) {
    tileSizeLabel = 'Sedang (~40x40 cm)';
  } else if (floorTileRepeat >= 18) {
    tileSizeLabel = 'Mozaik / Kecil (~20x20 cm)';
  }

  // Label for surface finish
  let finishLabel = 'Mengkilap Mewah (High Gloss)';
  if (floorRoughness > 0.3 && floorRoughness <= 0.6) {
    finishLabel = 'Semi-Gloss / Satin';
  } else if (floorRoughness > 0.6) {
    finishLabel = 'Doff / Matte (Anti-Slip)';
  }

  return (
    <div className="p-4 space-y-6">
      {/* 1. Toggle Floor Plane Visibility */}
      <div className="p-3.5 bg-surface-50 rounded-2xl border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-primary">Tampilkan Bidang Lantai</h4>
              <p className="text-[11px] text-secondary">
                {floorEnabled ? 'Lantai aktif di dasar bangunan' : 'Lantai dinonaktifkan'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={floorEnabled}
              onChange={(e) => setFloorEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
        <p className="mt-2.5 text-[11px] text-secondary leading-relaxed border-t border-border/60 pt-2">
          Gunakan opsi ini jika file 3D CAD Anda belum memiliki bidang lantai dasar, atau Anda ingin mengganti motif ubin lantai secara menyeluruh.
        </p>
      </div>

      {/* 2. Floor Coverage & House Footprint Auto-Detection */}
      <div className="p-3.5 bg-surface-50 rounded-2xl border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-primary">Cakupan Area Lantai</h4>
          </div>
          {detectedFootprint && (
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Dimensi Terdeteksi</span>
            </span>
          )}
        </div>

        {/* Segmented Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-200/70 rounded-xl text-[11px] font-medium">
          <button
            onClick={() => setFloorFitMode('interior')}
            className={`py-1.5 px-2 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
              floorFitMode === 'interior'
                ? 'bg-white text-primary shadow-subtle font-semibold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Hanya Dalam</span>
            <span className="text-[9px] opacity-75">Interior</span>
          </button>
          <button
            onClick={() => setFloorFitMode('full')}
            className={`py-1.5 px-2 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
              floorFitMode === 'full'
                ? 'bg-white text-primary shadow-subtle font-semibold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>+ Kanopi Teras</span>
            <span className="text-[9px] opacity-75">Full Exterior</span>
          </button>
          <button
            onClick={() => setFloorFitMode('custom')}
            className={`py-1.5 px-2 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 ${
              floorFitMode === 'custom'
                ? 'bg-white text-primary shadow-subtle font-semibold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <span>Kustom</span>
            <span className="text-[9px] opacity-75">Manual</span>
          </button>
        </div>

        {/* Dynamic Context Feedback */}
        {floorFitMode === 'interior' && (
          <div className="p-2.5 bg-white rounded-xl border border-border text-[11px] text-secondary space-y-1">
            <div className="flex items-center justify-between text-primary font-medium">
              <span>Dimensi Lantai Dalam Rumah:</span>
              <span className="font-mono text-xs font-semibold">
                {detectedFootprint ? (detectedFootprint.mainWidth * 0.975).toFixed(1) : '12.8'} m ×{' '}
                {detectedFootprint ? (detectedFootprint.mainDepth * 0.975).toFixed(1) : '25.2'} m
              </span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Lantai dipotong presisi tepat di perimeter dinding dalam rumah saja, tidak tumpah ke halaman luar.
            </p>
          </div>
        )}

        {floorFitMode === 'full' && (
          <div className="p-2.5 bg-white rounded-xl border border-border text-[11px] text-secondary space-y-1">
            <div className="flex items-center justify-between text-primary font-medium">
              <span>Dimensi Bangunan + Teras:</span>
              <span className="font-mono text-xs font-semibold">
                {detectedFootprint ? detectedFootprint.totalWidth.toFixed(1) : '17.3'} m ×{' '}
                {detectedFootprint ? detectedFootprint.totalDepth.toFixed(1) : '25.9'} m
              </span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Lantai menutupi ruang dalam sekaligus selasar samping dan kanopi teras depan.
            </p>
          </div>
        )}

        {floorFitMode === 'custom' && (
          <div className="p-2.5 bg-white rounded-xl border border-border space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary font-medium">Lebar Lantai (X):</span>
                <span className="font-mono font-semibold text-primary">{floorCustomWidth.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min={3}
                max={40}
                step={0.5}
                value={floorCustomWidth}
                onChange={(e) => setFloorCustomWidth(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary font-medium">Panjang Lantai (Z):</span>
                <span className="font-mono font-semibold text-primary">{floorCustomDepth.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min={3}
                max={50}
                step={0.5}
                value={floorCustomDepth}
                onChange={(e) => setFloorCustomDepth(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
              <div>
                <span className="text-[10px] text-secondary block mb-1">Geser Kiri/Kanan:</span>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  step={0.2}
                  value={floorOffsetX}
                  onChange={(e) => setFloorOffsetX(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
                />
              </div>
              <div>
                <span className="text-[10px] text-secondary block mb-1">Geser Depan/Belakang:</span>
                <input
                  type="range"
                  min={-10}
                  max={10}
                  step={0.2}
                  value={floorOffsetZ}
                  onChange={(e) => setFloorOffsetZ(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Import Custom Tile Texture */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>Import Desain Ubin / Keramik</span>
          </h4>
          {floorTextureUrl && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Motif Custom Aktif</span>
            </span>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          id="tile-image-input"
        />

        {floorTextureUrl ? (
          <div className="p-3 bg-surface-50 rounded-2xl border border-border flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0 bg-surface-100 relative group">
              <img
                src={floorTextureUrl}
                alt="Custom Tile Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary truncate">Motif Ubin Kustom</p>
              <p className="text-[10px] text-secondary mt-0.5">Tekstur diulang di seluruh lantai</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-surface-100 text-primary border border-border rounded-lg transition-colors shadow-subtle"
                >
                  Ganti Foto
                </button>
                <button
                  onClick={handleResetTexture}
                  className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 border-2 border-dashed border-border hover:border-primary/60 rounded-2xl bg-surface-50 hover:bg-surface-100/80 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-subtle border border-border flex items-center justify-center mb-2 group-hover:scale-105 transition-transform text-primary">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-primary">
              Klik atau Drag & Drop Foto Ubin
            </span>
            <span className="text-[10px] text-secondary mt-0.5">
              Format PNG, JPG, atau WEBP dari katalog toko keramik / internet
            </span>
          </button>
        )}
      </div>

      {/* 3. Preset Tile Library */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-warm" />
          <span>Koleksi Motif Ubin & Marmer Populer</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_TILES.map((tile) => {
            const isSelected = !floorTextureUrl && floorPresetId === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => {
                  setFloorPresetId(tile.id);
                  if (!floorEnabled) setFloorEnabled(true);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-subtle'
                    : 'border-border hover:border-border-hover bg-white hover:bg-surface-50'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg shrink-0 border border-border shadow-inner"
                  style={{ backgroundColor: tile.colorPreview }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary truncate">
                      {tile.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
                    )}
                  </div>
                  <span className="text-[10px] text-secondary block truncate mt-0.5">
                    {tile.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Fine-Tuning Sliders: Scale, Glossiness, Elevation */}
      <div className="space-y-4 p-3.5 bg-surface-50 rounded-2xl border border-border">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>Pengaturan Presisi Ubin</span>
        </h4>

        {/* Tile Scale / Repeat */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-secondary">Ukuran & Kerapatan Ubin</span>
            <span className="font-semibold text-primary text-[11px]">{tileSizeLabel}</span>
          </div>
          <input
            type="range"
            min={2}
            max={26}
            step={1}
            value={floorTileRepeat}
            onChange={(e) => setFloorTileRepeat(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-secondary mt-1 font-mono">
            <span>Slab Besar</span>
            <span>60x60</span>
            <span>Mozaik Kecil</span>
          </div>
        </div>

        {/* Surface Finish / Roughness */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-secondary">Tingkat Kilap (Finishing)</span>
            <span className="font-semibold text-primary text-[11px]">{finishLabel}</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.9}
            step={0.05}
            value={floorRoughness}
            onChange={(e) => setFloorRoughness(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-secondary mt-1 font-mono">
            <span>Glossy Polished</span>
            <span>Satin</span>
            <span>Matte Doff</span>
          </div>
        </div>

        {/* Floor Elevation */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-secondary">Ketinggian Lantai (Y-Offset)</span>
            <span className="font-semibold text-primary text-[11px] font-mono">
              {(floorElevation * 100).toFixed(0)} cm
            </span>
          </div>
          <input
            type="range"
            min={-0.1}
            max={0.2}
            step={0.01}
            value={floorElevation}
            onChange={(e) => setFloorElevation(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
          />
          <span className="text-[10px] text-secondary mt-1 block">
            Geser naik/turun agar permukaan lantai pas menempel pada dasar dinding.
          </span>
        </div>

        {/* Floor Size Scale */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-secondary">Skala Luas Lantai</span>
            <span className="font-semibold text-primary text-[11px] font-mono">
              {Math.round(floorSizeScale * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.02}
            value={floorSizeScale}
            onChange={(e) => setFloorSizeScale(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer h-1.5 bg-surface-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-secondary mt-1 font-mono">
            <span>Ketat Dalam Dinding (95%)</span>
            <span>Pas (100%)</span>
            <span>Melebar (110%)</span>
          </div>
        </div>

        {/* Color Tinting */}
        <div>
          <span className="font-medium text-secondary text-xs block mb-2">
            Warna Tint Dasar
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {TINT_PALETTE.map((c) => (
              <button
                key={c.hex}
                onClick={() => setFloorColor(c.hex)}
                title={c.name}
                className={`w-7 h-7 rounded-lg border transition-transform ${
                  floorColor === c.hex
                    ? 'scale-110 border-primary ring-2 ring-primary/30 shadow-sm'
                    : 'border-border hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <input
              type="color"
              value={floorColor || '#FFFFFF'}
              onChange={(e) => setFloorColor(e.target.value)}
              title="Custom Tint Color"
              className="w-7 h-7 rounded-lg border border-border cursor-pointer bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
