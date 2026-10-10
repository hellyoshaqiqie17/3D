'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MaterialOption, MaterialCategory } from '@/types';
import { useMaterialsStore } from '@/lib/materials-store';
import {
  UploadCloud,
  X,
  Sparkles,
  Check,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Plus,
  Layers,
  Info,
} from 'lucide-react';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (materials: MaterialOption[] | MaterialOption) => void;
}

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  category: MaterialCategory;
  sizeFormatted: string;
}

const CATEGORY_OPTIONS: { id: MaterialCategory; label: string }[] = [
  { id: 'wall', label: 'Dinding & Fasad (Walls)' },
  { id: 'floor', label: 'Lantai Utama (Floors)' },
  { id: 'bathroom', label: 'Keramik & Kamar Mandi (Tiles)' },
  { id: 'exterior', label: 'Eksterior & Outdoor (Exterior)' },
  { id: 'roof', label: 'Atap & Canopy (Roofing)' },
  { id: 'door', label: 'Pintu & Kusen (Doors)' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function cleanMaterialName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[-_]/g, ' ') // replace dashes and underscores with space
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words
}

export function UploadMaterialModal({ isOpen, onClose, onSuccess }: UploadMaterialModalProps) {
  const addCustomMaterials = useMaterialsStore((s) => s.addCustomMaterials);

  const [defaultCategory, setDefaultCategory] = useState<MaterialCategory>('wall');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount / clear
  useEffect(() => {
    return () => {
      stagedFiles.forEach((item) => {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [stagedFiles]);

  if (!isOpen) return null;

  const handleProcessFiles = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const newStaged: StagedFile[] = [];

    Array.from(incomingFiles).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const previewUrl = URL.createObjectURL(file);
      const name = cleanMaterialName(file.name);

      newStaged.push({
        id: `${file.name}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl,
        name,
        category: defaultCategory,
        sizeFormatted: formatBytes(file.size),
      });
    });

    if (newStaged.length === 0) {
      setErrorMessage('Pilih setidaknya satu file gambar yang valid (JPG, PNG, WebP).');
      return;
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearAll = () => {
    stagedFiles.forEach((item) => {
      if (item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setStagedFiles([]);
    setErrorMessage(null);
  };

  const handleDefaultCategoryChange = (cat: MaterialCategory) => {
    setDefaultCategory(cat);
    // Optionally also update existing staged files that haven't been manually assigned
    setStagedFiles((prev) =>
      prev.map((item) => ({
        ...item,
        category: cat,
      }))
    );
  };

  const handleUpdateItemName = (id: string, newName: string) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleUpdateItemCategory = (id: string, newCat: MaterialCategory) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: newCat } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedFiles.length === 0) {
      setErrorMessage('Silakan pilih atau seret minimal 1 file gambar tekstur terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgressText(`Mengunggah ${stagedFiles.length} file gambar ke CDN Cloud Storage...`);

    try {
      // 1. Pack files into FormData
      const formData = new FormData();
      stagedFiles.forEach((item) => {
        formData.append('files', item.file);
      });

      const uploadRes = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Gagal mengunggah file ke server: ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const uploadedList: Array<{
        url: string;
        filename: string;
        originalName: string;
        cleanName: string;
      }> = uploadData.uploaded || [];

      if (uploadedList.length === 0 && uploadData.url) {
        uploadedList.push({
          url: uploadData.url,
          filename: uploadData.filename,
          originalName: uploadData.originalName,
          cleanName: stagedFiles[0]?.name || 'Custom Texture',
        });
      }

      setUploadProgressText(`Menyimpan ${uploadedList.length} material ke pustaka PBR...`);

      // 2. Build MaterialOption records
      const newMaterialsToSave: MaterialOption[] = uploadedList.map((uploaded, index) => {
        const userStaged = stagedFiles[index];
        const assignedName = (userStaged?.name || uploaded.cleanName || `Material Tekstur ${index + 1}`).trim();
        const assignedCategory = userStaged?.category || defaultCategory;

        return {
          id: `custom_mat_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
          name: assignedName,
          category: assignedCategory,
          type: 'texture',
          color: '#FFFFFF',
          textureUrl: uploaded.url,
          previewThumbnail: uploaded.url,
          roughness: 0.32,
          metalness: 0.04,
          bumpScale: 0.16,
          rotation: 0,
          repeat: [4, 4],
          finish: 'gloss',
          description: `Tekstur PBR kustom: ${assignedName}`,
          tag: 'Custom PBR',
          isCustomUpload: true,
        };
      });

      // 3. Save batch to database and store
      const saved = await addCustomMaterials(newMaterialsToSave);

      // Clean object URLs
      handleClearAll();

      if (onSuccess) {
        onSuccess(saved);
      }
      onClose();
    } catch (err: any) {
      console.error('[Upload Material Batch] Error:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat mengunggah file. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                Upload Tekstur Material (Bulk / Sekaligus)
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Pilih atau seret banyak foto keramik, batu, atau dinding sekaligus. Konfigurasi tiling & kilap diatur langsung di 3D Configurator.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Global Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" />
                Kategori Utama untuk File yang Diunggah
              </span>
              <span className="text-[11px] font-normal text-secondary">
                (Dapat diubah per item di bawah)
              </span>
            </label>
            <select
              value={defaultCategory}
              onChange={(e) => handleDefaultCategoryChange(e.target.value as MaterialCategory)}
              disabled={isUploading}
              className="w-full text-xs bg-surface/50 border border-border rounded-xl px-3 py-2.5 text-primary font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-accent bg-accent/5 scale-[0.99]'
                : 'border-border/80 hover:border-accent/60 bg-surface/30 hover:bg-surface/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessFiles(e.target.files);
                  // Reset input so re-selecting same files triggers change
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary">
                Klik untuk memilih banyak file atau seret file gambar ke sini
              </p>
              <p className="text-[11px] text-secondary mt-0.5">
                Mendukung banyak file sekaligus (PNG, JPG, WebP)
              </p>
            </div>
          </div>

          {/* Staged Files Preview List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-accent" />
                  Daftar File Terpilih ({stagedFiles.length} item)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" /> Tambah File Lagi
                  </button>
                  <span className="text-border">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={isUploading}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3 h-3" /> Bersihkan
                  </button>
                </div>
              </div>

              {/* Scrollable list of staged items */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-border/40">
                {stagedFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="pt-2 first:pt-0 flex items-center gap-3 p-2 rounded-xl bg-surface/40 border border-border/60 hover:bg-surface transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-border/80 bg-stone-100 shrink-0 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded-tl font-mono">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                          placeholder="Nama Material"
                          disabled={isUploading}
                          className="flex-1 text-xs font-semibold text-primary bg-white border border-border rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <span className="text-[10px] text-secondary font-mono shrink-0">
                          {item.sizeFormatted}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleUpdateItemCategory(item.id, e.target.value as MaterialCategory)
                          }
                          disabled={isUploading}
                          className="text-[11px] bg-white border border-border rounded-lg px-2 py-0.5 text-secondary font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          PBR Siap
                        </span>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveStaged(item.id)}
                      disabled={isUploading}
                      title="Hapus dari daftar"
                      className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-40"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Tip */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-amber-900 text-[11px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Pengaturan Mudah & Cepat:</strong> Semua tekstur yang diupload di sini akan otomatis langsung muncul di <strong>3D Configurator</strong>. Parameter seperti ukuran nat keramik, pengulangan (tiling), dan kilap dapat langsung disesuaikan secara interaktif di sidebar saat mendesain.
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface/30 flex items-center justify-between gap-3">
          <div className="text-xs text-secondary">
            {stagedFiles.length > 0 ? (
              <span className="font-medium text-primary">
                {stagedFiles.length} material siap diupload
              </span>
            ) : (
              <span>Pilih file untuk memulai</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-primary rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || stagedFiles.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-black rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span>{uploadProgressText || 'Mengunggah...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-accent" />
                  <span>
                    Upload {stagedFiles.length > 0 ? `${stagedFiles.length} Material` : 'Material'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
