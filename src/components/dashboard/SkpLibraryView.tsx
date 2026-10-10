'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileBox,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  Download,
  RefreshCw,
  HardDrive,
  FileCheck,
  Plus,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { SkpFileRecord } from '@/app/api/skp-files/route';

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  storagePath?: string;
}

export function SkpLibraryView() {
  const router = useRouter();
  const [files, setFiles] = useState<SkpFileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'skp' | 'converted'>('all');
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Batch upload state
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/skp-files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch SKP library files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle files selected for batch upload
  const handleFilesChosen = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newItems: UploadQueueItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.skp') || lower.endsWith('.glb') || lower.endsWith('.gltf')) {
        newItems.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: 'pending',
        });
      }
    }

    if (newItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...newItems]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  // Upload queue items directly to Bunny Storage
  const startBatchUpload = async () => {
    if (isUploadingBatch || uploadQueue.length === 0) return;

    setIsUploadingBatch(true);
    const pendingItems = uploadQueue.filter((item) => item.status === 'pending');

    for (const item of pendingItems) {
      // Set uploading status
      setUploadQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading', progress: 5 } : it))
      );

      try {
        // 1. Get signed direct upload parameters
        const prepRes = await fetch('/api/upload/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: item.file.name,
            fileSize: item.file.size,
            targetFolder: 'skp_library',
          }),
        });

        if (!prepRes.ok) {
          throw new Error('Gagal menginisialisasi slot penyimpanan cloud');
        }

        const { uploadUrl, accessKey, storagePath } = await prepRes.json();

        // 2. Upload file directly with progress
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', uploadUrl, true);
          xhr.setRequestHeader('AccessKey', accessKey);
          xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream');

          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = Math.round((evt.loaded / evt.total) * 95) + 5;
              setUploadQueue((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, progress: pct } : it))
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Gagal upload (${xhr.status})`));
            }
          };

          xhr.onerror = () => reject(new Error('Koneksi terputus'));
          xhr.ontimeout = () => reject(new Error('Waktu habis (timeout)'));
          xhr.send(item.file);
        });

        // 3. Mark success
        setUploadQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'success', progress: 100, storagePath } : it
          )
        );
      } catch (err: any) {
        console.error(`Upload error for ${item.file.name}:`, err);
        setUploadQueue((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'error', error: err?.message || 'Gagal' } : it
          )
        );
      }
    }

    setIsUploadingBatch(false);
    fetchFiles();
    setFeedbackNotice('Batch upload selesai! Semua file SKP telah tersimpan di cloud storage.');
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const clearCompletedQueue = () => {
    setUploadQueue((prev) => prev.filter((it) => it.status !== 'success'));
  };

  const handleDelete = async (storagePath: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/skp-files?storagePath=${encodeURIComponent(storagePath)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.storagePath !== storagePath));
        setFeedbackNotice('File berhasil dihapus dari cloud storage.');
        setTimeout(() => setFeedbackNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmPath(null);
    }
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.filename.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'skp') return f.filename.toLowerCase().endsWith('.skp');
    if (filterType === 'converted') return f.isConverted;
    return true;
  });

  const totalStorageMB = files.reduce((acc, f) => acc + f.size / (1024 * 1024), 0).toFixed(1);
  const convertedCount = files.filter((f) => f.isConverted).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Feedback */}
      {feedbackNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs px-2"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>SKP File Library & Batch Upload</span>
          </h2>
          <p className="text-xs text-secondary mt-0.5">
            Unggah banyak file SketchUp (.skp) sekaligus ke cloud storage dan gunakan langsung pada 3D Configurator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFiles}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-secondary hover:text-primary bg-white hover:bg-surface-50 border border-border rounded-xl transition-colors shadow-subtle"
            title="Muat ulang daftar file"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Project 3D</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-100 text-primary flex items-center justify-center">
              <FileBox className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-secondary font-medium block">Total File di Cloud</span>
              <span className="text-lg font-bold text-primary block leading-tight">{files.length} File</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-secondary font-medium block">Kapasitas Tersimpan</span>
              <span className="text-lg font-bold text-primary block leading-tight">{totalStorageMB} MB</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-secondary font-medium block">Siap Render 3D (GLB)</span>
              <span className="text-lg font-bold text-primary block leading-tight">{convertedCount} Model</span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Upload Zone */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
              Batch Upload File SketchUp (.skp)
            </h3>
          </div>
          <span className="text-[11px] text-secondary font-mono">
            Direct Cloud Upload • Unlimited File Size
          </span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 bg-surface-50 hover:bg-surface-100/60 rounded-2xl p-8 text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".skp,.glb,.gltf"
            onChange={(e) => handleFilesChosen(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-white border border-border shadow-subtle text-primary mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>

          <p className="text-xs font-semibold text-primary mb-1">
            Klik untuk memilih atau drag & drop banyak file sekaligus
          </p>
          <p className="text-[11px] text-secondary max-w-md mx-auto">
            Mendukung format <span className="font-mono font-medium text-primary">.skp</span> (SketchUp modern & interior), <span className="font-mono font-medium text-primary">.glb</span>, dan <span className="font-mono font-medium text-primary">.gltf</span> tanpa batasan ukuran file.
          </p>
        </div>

        {/* Upload Queue List */}
        {uploadQueue.length > 0 && (
          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">
                Antrean Upload ({uploadQueue.length} file)
              </span>

              <div className="flex items-center gap-2">
                {uploadQueue.some((q) => q.status === 'success') && (
                  <button
                    onClick={clearCompletedQueue}
                    className="text-[11px] text-secondary hover:text-primary transition-colors"
                  >
                    Bersihkan yang selesai
                  </button>
                )}

                <button
                  onClick={startBatchUpload}
                  disabled={isUploadingBatch || !uploadQueue.some((q) => q.status === 'pending')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-subtle flex items-center gap-1.5"
                >
                  {isUploadingBatch ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Mulai Upload Semua</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-surface-50 border border-border rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center font-bold text-[10px] text-primary shrink-0 uppercase">
                      {item.file.name.split('.').pop() || 'FILE'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-primary truncate block">
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-secondary font-mono shrink-0">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-surface-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.status === 'success'
                              ? 'bg-emerald-500'
                              : item.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === 'pending' && (
                      <span className="text-[10px] text-secondary font-mono">Siap</span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-[10px] text-primary font-mono font-semibold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'success' && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tersimpan
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1" title={item.error}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        Gagal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SKP File Library Explorer */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-primary">Daftar File SKP di Cloud Storage</h3>
            <p className="text-xs text-secondary">
              File yang tersimpan dapat langsung dipilih saat membuat project 3D baru tanpa upload ulang.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                placeholder="Cari file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-50 rounded-xl border border-border focus:outline-none focus:border-primary text-primary"
              />
            </div>

            <div className="flex bg-surface-100 p-0.5 rounded-xl border border-border">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  filterType === 'all' ? 'bg-white text-primary shadow-subtle' : 'text-secondary hover:text-primary'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('skp')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  filterType === 'skp' ? 'bg-white text-primary shadow-subtle' : 'text-secondary hover:text-primary'
                }`}
              >
                .SKP
              </button>
              <button
                onClick={() => setFilterType('converted')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  filterType === 'converted' ? 'bg-white text-primary shadow-subtle' : 'text-secondary hover:text-primary'
                }`}
              >
                Siap 3D
              </button>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-secondary">Memuat daftar file dari cloud storage...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
            <FileBox className="w-8 h-8 text-secondary/50 mx-auto mb-2" />
            <p className="text-xs font-semibold text-primary">Belum ada file SKP di library</p>
            <p className="text-[11px] text-secondary mt-0.5">
              Gunakan kotak upload di atas untuk mengunggah file SketchUp Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const isSkp = file.filename.toLowerCase().endsWith('.skp');

              return (
                <div
                  key={file.id}
                  className="bg-surface-50 hover:bg-surface-100/70 border border-border hover:border-primary/30 rounded-2xl p-4 transition-all flex flex-col justify-between group shadow-subtle"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-border flex items-center justify-center font-bold text-xs text-primary shadow-subtle shrink-0 uppercase">
                          {isSkp ? 'SKP' : 'GLB'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-primary truncate block leading-tight" title={file.name}>
                            {file.name}
                          </h4>
                          <span className="text-[10px] text-secondary font-mono truncate block" title={file.filename}>
                            {file.filename}
                          </span>
                        </div>
                      </div>

                      {/* Status badge */}
                      {file.isConverted ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-semibold shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Siap 3D
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-[10px] font-semibold shrink-0">
                          SKP Cloud
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-secondary font-mono my-2 pb-2 border-b border-border/60">
                      <span>Ukuran: <strong className="text-primary">{file.sizeMB} MB</strong></span>
                      <span>•</span>
                      <span>
                        {new Date(file.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 mt-2">
                    <button
                      onClick={() => setDeleteConfirmPath(file.storagePath)}
                      className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus file dari storage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={file.publicUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-secondary hover:text-primary hover:bg-white rounded-lg transition-colors border border-transparent hover:border-border"
                        title="Download file asli"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <Link
                        href={`/projects/new?fromLibrary=${encodeURIComponent(file.storagePath)}&fileName=${encodeURIComponent(file.filename)}&fileSize=${file.size}&cleanName=${encodeURIComponent(file.name)}`}
                        className="px-2.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold rounded-xl flex items-center gap-1 transition-all shadow-subtle"
                      >
                        <span>Buat Project 3D</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmPath && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border p-5 max-w-sm w-full shadow-float">
            <h4 className="text-sm font-bold text-primary mb-1">Hapus File dari Cloud?</h4>
            <p className="text-xs text-secondary mb-4">
              File <code className="bg-surface-100 px-1 py-0.5 rounded text-[11px]">{deleteConfirmPath.split('/').pop()}</code> akan dihapus secara permanen dari Bunny Storage.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmPath(null)}
                className="px-3 py-1.5 text-xs text-secondary hover:text-primary rounded-xl"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmPath)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-1.5 shadow-subtle disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
