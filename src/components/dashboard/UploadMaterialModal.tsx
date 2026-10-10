'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MaterialOption } from '@/types';
import { useMaterialsStore } from '@/lib/materials-store';
import {
  UploadCloud,
  X,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
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
  sizeFormatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function cleanMaterialName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, '') // hapus ekstensi file
    .replace(/[-_]/g, ' ') // ganti strip dan underscore dengan spasi
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Huruf kapital tiap kata
}

/**
 * Optimizes huge client images (e.g. 10MB+ raw PNGs from cameras/catalogs)
 * down to ~400-800KB high-res 2048px textures for instant cloud upload & fast WebGL rendering.
 */
async function optimizeTextureFile(file: File): Promise<File> {
  // If already under 1.5MB and is JPEG/WebP, upload as is
  if (file.size < 1.5 * 1024 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 2048;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const newFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(newFile);
        },
        'image/jpeg',
        0.88
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback to original on error
    };

    img.src = objectUrl;
  });
}

export function UploadMaterialModal({ isOpen, onClose, onSuccess }: UploadMaterialModalProps) {
  const addCustomMaterials = useMaterialsStore((s) => s.addCustomMaterials);

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
        sizeFormatted: formatBytes(file.size),
      });
    });

    if (newStaged.length === 0) {
      setErrorMessage('Pilih file gambar yang valid (JPG, PNG, atau WebP).');
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

  const handleUpdateItemName = (id: string, newName: string) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
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

    try {
      const uploadedResults: Array<{
        url: string;
        filename: string;
        cleanName: string;
      }> = [];

      // 1. Process and upload files individually to guarantee no 4.5MB Vercel payload limit issues
      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        setUploadProgressText(
          `Mengunggah (${i + 1}/${stagedFiles.length}): ${item.name}...`
        );

        // Client-side image optimization
        const optimizedFile = await optimizeTextureFile(item.file);

        const formData = new FormData();
        formData.append('file', optimizedFile);

        const uploadRes = await fetch('/api/materials/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Gagal mengunggah "${item.name}": ${errText || uploadRes.statusText}`);
        }

        const uploadData = await uploadRes.json();
        const textureUrl = uploadData.url || uploadData.uploaded?.[0]?.url;

        if (!textureUrl) {
          throw new Error(`URL tekstur tidak valid untuk "${item.name}"`);
        }

        uploadedResults.push({
          url: textureUrl,
          filename: uploadData.filename || uploadData.uploaded?.[0]?.filename || '',
          cleanName: item.name || uploadData.cleanName,
        });
      }

      setUploadProgressText(`Menyimpan ${uploadedResults.length} material ke pustaka...`);

      // 2. Build MaterialOption records (Universal - bebas diaplikasikan di mana saja)
      const newMaterialsToSave: MaterialOption[] = uploadedResults.map((uploaded, index) => {
        const assignedName = uploaded.cleanName.trim() || `Material Tekstur ${index + 1}`;

        return {
          id: `custom_mat_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
          name: assignedName,
          category: 'wall', // Base fallback, universally accessible in 3D Configurator sidebar
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

      // 3. Save batch to database and global store
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
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-surface/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                Upload Tekstur Material
              </h2>
              <p className="text-xs text-secondary mt-0.5">
                Pilih atau seret banyak foto tekstur sekaligus. Material bebas diaplikasikan ke dinding, lantai, atau elemen apa saja di 3D Configurator.
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
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Gagal Upload:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
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
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-border flex items-center justify-center text-primary transition-transform">
              <UploadCloud className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary">
                Klik untuk memilih banyak file atau seret file gambar ke sini
              </p>
              <p className="text-[11px] text-secondary mt-0.5">
                Bisa upload sekaligus banyak file gambar (PNG, JPG, WebP)
              </p>
            </div>
          </div>

          {/* Staged Files Preview List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-accent" />
                  Daftar File ({stagedFiles.length} file dipilih)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" /> Tambah File Lain
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
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {stagedFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-surface/40 border border-border/70 hover:bg-surface transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-border bg-stone-100 shrink-0 relative shadow-sm">
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

                    {/* Clean Name Input & Universal Badge */}
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
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Bebas diaplikasikan ke dinding, lantai, atau elemen apa pun
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
              <strong>Langsung Siap Pakai:</strong> Seluruh file yang diupload akan otomatis muncul di panel material sidebar 3D. Di sidebar, Anda bebas memilih dinding, lantai, atau bagian mana pun yang ingin diganti, serta mengatur ukuran nat (tiling), rotasi, dan kilap secara real-time.
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface/30 flex items-center justify-between gap-3">
          <div className="text-xs text-secondary">
            {stagedFiles.length > 0 ? (
              <span className="font-semibold text-primary">
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
