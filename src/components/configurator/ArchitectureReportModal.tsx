'use client';

import React, { useState, useEffect } from 'react';
import { Project, MaterialZone } from '@/types';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  captureArchitectureViews,
  buildArchitectureReportPdf,
  CapturedView,
} from '@/lib/architecture-report-generator';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  X,
  Compass,
  Layers,
  Eye,
  Maximize2,
  Loader2,
  RefreshCw,
  SunMedium,
} from 'lucide-react';

interface ArchitectureReportModalProps {
  project: Project;
  zones: MaterialZone[];
}

export function ArchitectureReportModal({ project, zones }: ArchitectureReportModalProps) {
  const isReportModalOpen = useConfiguratorStore((s) => s.isReportModalOpen);
  const setReportModalOpen = useConfiguratorStore((s) => s.setReportModalOpen);
  const houseSize = useConfiguratorStore((s) => s.houseSize);
  const houseCenter = useConfiguratorStore((s) => s.houseCenter);
  const interiorCenter = useConfiguratorStore((s) => s.interiorCenter);
  const interiorTarget = useConfiguratorStore((s) => s.interiorTarget);
  const setRoofHidden = useConfiguratorStore((s) => s.setRoofHidden);
  const isRoofHidden = useConfiguratorStore((s) => s.isRoofHidden);
  const selectedMaterials = useConfiguratorStore((s) => s.selectedMaterials);
  const customColors = useConfiguratorStore((s) => s.customColors);
  const uploadedMaterials = useConfiguratorStore((s) => s.uploadedMaterials);
  const setSelectionHighlightVisible = useConfiguratorStore((s) => s.setSelectionHighlightVisible);
  const setHoveredMesh = useConfiguratorStore((s) => s.setHoveredMesh);
  const disableShadows = useConfiguratorStore((s) => s.disableShadows);
  const toggleDisableShadows = useConfiguratorStore((s) => s.toggleDisableShadows);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(5);
  const [statusMessage, setStatusMessage] = useState('');
  const [capturedViews, setCapturedViews] = useState<CapturedView[]>([]);
  const [activePreviewImg, setActivePreviewImg] = useState<CapturedView | null>(null);

  // Automatically ensure all selection highlights and hover outlines are hidden when modal is open
  useEffect(() => {
    if (isReportModalOpen) {
      setSelectionHighlightVisible(false);
      setHoveredMesh(null);
    }
  }, [isReportModalOpen, setSelectionHighlightVisible, setHoveredMesh]);

  if (!isReportModalOpen) return null;

  const w = (houseSize[0] || 4.7).toFixed(2);
  const h = (houseSize[1] || 3.2).toFixed(2);
  const d = (houseSize[2] || 7.9).toFixed(2);
  const floorArea = (parseFloat(w) * parseFloat(d)).toFixed(1);

  const handleStartCapture = async () => {
    setIsGenerating(true);
    setProgressStep(0);
    setStatusMessage('Memulai sinkronisasi kamera 3D...');

    try {
      const views = await captureArchitectureViews(
        houseSize,
        houseCenter,
        setRoofHidden,
        isRoofHidden,
        (step, total, msg) => {
          setProgressStep(step);
          setTotalSteps(total);
          setStatusMessage(msg);
        },
        interiorCenter,
        interiorTarget
      );

      setCapturedViews(views);
      setStatusMessage('Mengompilasi dokumen PDF arsitektur...');

      // Build PDF in memory
      const doc = buildArchitectureReportPdf(
        project,
        houseSize,
        views,
        zones,
        selectedMaterials,
        customColors,
        uploadedMaterials
      );

      // Auto trigger download
      const filename = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Architecture_Report.pdf`;
      doc.save(filename);
      setStatusMessage('Laporan PDF berhasil diunduh!');
    } catch (err: any) {
      console.error('Failed to generate architectural report:', err);
      alert(err?.message || 'Gagal menghasilkan laporan PDF. Silakan coba kembali.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadOnly = () => {
    if (capturedViews.length === 0) return;
    const doc = buildArchitectureReportPdf(
      project,
      houseSize,
      capturedViews,
      zones,
      selectedMaterials,
      customColors,
      uploadedMaterials
    );
    const filename = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Architecture_Report.pdf`;
    doc.save(filename);
  };

  const handlePrint = () => {
    if (capturedViews.length === 0) return;
    const doc = buildArchitectureReportPdf(
      project,
      houseSize,
      capturedViews,
      zones,
      selectedMaterials,
      customColors,
      uploadedMaterials
    );
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-subtle">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-primary">Export Laporan Arsitektur (PDF)</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                  Landscape A4
                </span>
              </div>
              <p className="text-xs text-secondary">
                Mockup arsitektural multi-sudut pandang dengan kalkulasi koordinat universal untuk segala tipe desain.
              </p>
            </div>
          </div>
          <button
            onClick={() => setReportModalOpen(false)}
            disabled={isGenerating}
            className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-surface-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Architectural Metrics Summary Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-50 border border-border rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">Nama Proyek</span>
              <span className="text-xs font-semibold text-primary truncate block">{project.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">Dimensi (P × L × T)</span>
              <span className="text-xs font-semibold text-primary">{w} m × {d} m × {h} m</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">Estimasi Luas</span>
              <span className="text-xs font-semibold text-emerald-600 font-mono">{floorArea} m²</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">Komponen Material</span>
              <span className="text-xs font-semibold text-primary">{zones.length} Zona Terdeteksi</span>
            </div>
          </div>

          {/* Enable Button: Nonaktifkan Efek Bayangan (Shadowless Mode) */}
          <div className="flex items-center justify-between p-4 bg-surface-50 border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  disableShadows ? 'bg-amber-100 text-amber-700' : 'bg-surface-200 text-secondary'
                }`}
              >
                <SunMedium className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">
                    Nonaktifkan Efek Bayangan (Shadowless)
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${
                      disableShadows
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-surface-200 text-secondary border-border'
                    }`}
                  >
                    {disableShadows ? 'Enable (Bayangan Nonaktif)' : 'Disable (Bayangan Aktif)'}
                  </span>
                </div>
                <p className="text-[11px] text-secondary mt-0.5 leading-snug">
                  Ketika di-enable, efek bayangan dinonaktifkan sehingga semua keramik lantai, dinding, dan sudut ruangan terlihat terang dan jelas merata.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={disableShadows}
              onClick={toggleDisableShadows}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                disableShadows ? 'bg-amber-600' : 'bg-surface-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  disableShadows ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Explanation of the 5 Architectural Mockup Angles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-secondary" />
                <span>5 Sudut Pandang Mockup yang Dihasilkan:</span>
              </h3>
              <span className="text-[11px] text-secondary">Kamera Eye-Level 1.45m & FOV Adaptif</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { title: 'Tampak Atas / Denah', desc: 'Denah tata letak interior potongan atap terbuka', badge: 'Plan View' },
                { title: 'Bagian Dalam - Depan', desc: 'Perspektif mata manusia menghadap area depan', badge: 'Front Int' },
                { title: 'Bagian Dalam - Belakang', desc: 'Perspektif mata manusia menghadap area belakang', badge: 'Rear Int' },
                { title: 'Bagian Dalam - Kiri', desc: 'Perspektif mata manusia menghadap dinding kiri', badge: 'Left Wall' },
                { title: 'Bagian Dalam - Kanan', desc: 'Perspektif mata manusia menghadap dinding kanan', badge: 'Right Wall' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-white border border-border rounded-xl shadow-xs flex items-start gap-2.5"
                >
                  <div className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-primary">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-secondary leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress / Status Display during generation */}
          {isGenerating && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>{statusMessage}</span>
                </span>
                <span className="font-mono text-amber-700 font-bold">
                  {progressStep} / {totalSteps}
                </span>
              </div>
              <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.round((progressStep / totalSteps) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Captured Gallery Preview (when generation finishes) */}
          {capturedViews.length > 0 && !isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Preview 5 Mockup View yang Telah Siap:</span>
                </h3>
                <span className="text-[11px] text-secondary">Klik gambar untuk memperbesar</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {capturedViews.map((cv) => (
                  <div
                    key={cv.id}
                    onClick={() => setActivePreviewImg(cv)}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-surface-50 hover:border-primary transition-all shadow-subtle"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-black/5">
                      <img
                        src={cv.dataUrl}
                        alt={cv.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="p-2.5 bg-white">
                      <span className="text-[11px] font-semibold text-primary block truncate">{cv.title}</span>
                      <span className="text-[10px] text-secondary block truncate">{cv.subtitle}</span>
                    </div>
                    <div className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-50">
          <div className="flex items-center gap-2">
            {capturedViews.length > 0 && (
              <button
                type="button"
                onClick={handleStartCapture}
                disabled={isGenerating}
                className="flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-secondary hover:text-primary rounded-lg border border-border hover:bg-surface-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Ulang</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {capturedViews.length === 0 ? (
              <button
                type="button"
                onClick={handleStartCapture}
                disabled={isGenerating}
                className="flex items-center gap-2 h-10 px-5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Mengambil 3D View...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Laporan Arsitektur (PDF)</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 h-10 px-4 text-xs font-medium text-primary bg-white border border-border hover:bg-surface-100 rounded-xl transition-colors shadow-subtle"
                >
                  <Printer className="w-4 h-4 text-secondary" />
                  <span>Cetak Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadOnly}
                  className="flex items-center gap-2 h-10 px-5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-subtle transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File PDF Laporan</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {activePreviewImg && (
        <div
          onClick={() => setActivePreviewImg(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-4 bg-surface-900 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{activePreviewImg.title}</h4>
                <p className="text-xs text-white/70">{activePreviewImg.subtitle}</p>
              </div>
              <button
                onClick={() => setActivePreviewImg(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center">
              <img
                src={activePreviewImg.dataUrl}
                alt={activePreviewImg.title}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
