'use client';

import React, { useState, useRef } from 'react';
import { MaterialOption, MaterialCategory, FinishType } from '@/types';
import { useMaterialsStore } from '@/lib/materials-store';
import {
  UploadCloud,
  X,
  Sparkles,
  Check,
  Image as ImageIcon,
  Sliders,
  Layers,
  Palette,
  Eye,
  Loader2,
} from 'lucide-react';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (material: MaterialOption) => void;
}

const CATEGORY_OPTIONS: { id: MaterialCategory; label: string }[] = [
  { id: 'wall', label: 'Dinding & Fasad (Walls)' },
  { id: 'floor', label: 'Lantai Utama (Floors)' },
  { id: 'bathroom', label: 'Keramik & Kamar Mandi (Tiles)' },
  { id: 'exterior', label: 'Eksterior & Outdoor (Exterior)' },
  { id: 'roof', label: 'Atap & Canopy (Roofing)' },
  { id: 'door', label: 'Pintu & Kusen (Doors)' },
];

export function UploadMaterialModal({ isOpen, onClose, onSuccess }: UploadMaterialModalProps) {
  const addCustomMaterial = useMaterialsStore((s) => s.addCustomMaterial);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('wall');
  const [finish, setFinish] = useState<FinishType>('gloss');
  const [roughness, setRoughness] = useState(0.25);
  const [metalness, setMetalness] = useState(0.04);
  const [bumpScale, setBumpScale] = useState(0.16);
  const [repeatCount, setRepeatCount] = useState(4);
  const [tintColor, setTintColor] = useState('#FFFFFF');
  const [description, setDescription] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (!name) {
      const cleanBase = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setName(cleanBase);
    }
  };

  const handleFinishChange = (newFinish: FinishType) => {
    setFinish(newFinish);
    if (newFinish === 'gloss') {
      setRoughness(0.18);
      setBumpScale(0.14);
    } else if (newFinish === 'satin') {
      setRoughness(0.38);
      setBumpScale(0.12);
    } else if (newFinish === 'textured') {
      setRoughness(0.65);
      setBumpScale(0.25);
    } else {
      setRoughness(0.85);
      setBumpScale(0.08);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewDataUrl) {
      setErrorMessage('Silakan pilih file gambar tekstur (JPG, PNG, atau WebP)');
      return;
    }
    if (!name.trim()) {
      setErrorMessage('Nama material wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let textureUrl = previewDataUrl || '/textures/designer-tile-mosaic.jpg';

      // 1. Upload file to server & cloud storage if file object exists
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch('/api/materials/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Gagal upload tekstur: ${errText}`);
        }

        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          textureUrl = uploadData.url;
        }
      }

      // 2. Register material
      const newMaterial: MaterialOption = {
        id: `custom_mat_${Date.now()}`,
        name: name.trim(),
        category,
        type: 'texture',
        color: tintColor,
        textureUrl,
        previewThumbnail: textureUrl,
        roughness,
        metalness,
        bumpScale,
        finish,
        repeat: [repeatCount, repeatCount],
        description: description.trim() || 'Custom user uploaded architectural PBR material.',
        tag: 'Custom PBR',
        isCustomUpload: true,
      };

      const saved = await addCustomMaterial(newMaterial);
      if (onSuccess && saved) {
        onSuccess(saved);
      }

      onClose();
    } catch (err: any) {
      console.error('[Upload Material] Failed:', err);
      setErrorMessage(err?.message || 'Gagal menyimpan material. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-border animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">Upload Custom PBR Material</h3>
              <p className="text-xs text-secondary">
                Upload tekstur keramik, batu, atau dinding untuk diterapkan di 3D Configurator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-surface-100 flex items-center justify-center text-secondary hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload & Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drop Zone */}
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">
                File Tekstur / Foto Keramik *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] ${
                  previewDataUrl
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-border hover:border-primary/50 bg-surface-50 hover:bg-surface-100/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-10 h-10 rounded-xl bg-white shadow-subtle flex items-center justify-center text-primary mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-primary block mb-0.5">
                  {selectedFile ? selectedFile.name : 'Pilih atau Drag File Foto'}
                </span>
                <span className="text-[10px] text-secondary block">
                  PNG, JPG, WebP (Rekomendasi seamless tile)
                </span>
              </div>
            </div>

            {/* Live 2D Pattern Preview */}
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5 flex items-center justify-between">
                <span>Pratinjau Pola Pengulangan (Tiling)</span>
                <span className="text-[10px] text-secondary font-mono">{repeatCount}x Repeat</span>
              </label>
              <div className="aspect-[4/3] rounded-2xl border border-border overflow-hidden relative shadow-inner bg-surface-100 flex items-center justify-center">
                {previewDataUrl ? (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${previewDataUrl})`,
                      backgroundSize: `${100 / repeatCount}% ${100 / repeatCount}%`,
                      backgroundRepeat: 'repeat',
                      backgroundColor: tintColor,
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center text-secondary text-xs p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
                    <span>Upload file tekstur untuk melihat pratinjau tiling</span>
                  </div>
                )}

                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white">
                  {finish.toUpperCase()} • R:{roughness.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Material Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">
                Nama Material *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Keramik Granit Carrara 60x60"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-primary text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">
                Kategori Penggunaan *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-primary text-primary bg-white cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Finish Type Preset */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1.5">
              Karakter Permukaan (Finish Preset)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'gloss', label: 'Keramik Glossy', desc: 'Licin & Mengkilap' },
                { id: 'satin', label: 'Semi-Gloss Satin', desc: 'Kilap Halus' },
                { id: 'textured', label: 'Batu Relief / Nat', desc: 'Tekstur Timbul' },
                { id: 'matte', label: 'Matte Dinding', desc: 'Doff Halus' },
              ].map((f) => {
                const isSelected = finish === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleFinishChange(f.id as FinishType)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-subtle'
                        : 'bg-white border-border text-primary hover:bg-surface-50'
                    }`}
                  >
                    <span className="text-xs font-bold block truncate">{f.label}</span>
                    <span
                      className={`text-[10px] block truncate ${
                        isSelected ? 'text-white/80' : 'text-secondary'
                      }`}
                    >
                      {f.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical PBR Adjusters */}
          <div className="p-4 bg-surface-50 rounded-2xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Sliders className="w-3.5 h-3.5" />
              <span>Kalibrasi Fisik PBR (Roughness & Bump Relief)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tiling repeat */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-secondary font-medium">Pengulangan (Tiling)</span>
                  <span className="font-mono text-primary font-bold">{repeatCount}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                />
              </div>

              {/* 3D Bump depth */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-secondary font-medium">Kedalaman Tekstur (Nat)</span>
                  <span className="font-mono text-primary font-bold">{bumpScale.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.4"
                  step="0.02"
                  value={bumpScale}
                  onChange={(e) => setBumpScale(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                />
              </div>

              {/* Roughness */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-secondary font-medium">Roughness (Doff)</span>
                  <span className="font-mono text-primary font-bold">{roughness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={roughness}
                  onChange={(e) => setRoughness(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Tint Color */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/60">
              <span className="text-[11px] text-secondary font-medium">Warna Dasar / Tint:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tintColor}
                  onChange={(e) => setTintColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-border cursor-pointer p-0.5 bg-white"
                />
                <span className="text-[10px] font-mono text-secondary">{tintColor.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => setTintColor('#FFFFFF')}
                  className="text-[10px] text-secondary hover:text-primary underline ml-1"
                >
                  Reset Putih
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              Catatan / Deskripsi Tekstur (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Keramik kamar mandi anti selip ukuran 60x60 motif urat marmer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-border focus:outline-none focus:border-primary text-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah Tekstur...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan ke PBR Material Library</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
