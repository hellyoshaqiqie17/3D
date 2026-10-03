'use client';

import React, { useEffect, useState } from 'react';
import { useConfiguratorStore } from '@/lib/configurator-store';
import {
  Eye,
  Sofa,
  Layers,
  Sun,
  Grid,
  Bed,
  Orbit,
  Compass,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  X,
  MousePointerClick,
  Move,
  ZoomIn,
  Keyboard,
  Hand,
  SlidersHorizontal,
} from 'lucide-react';

const PRESETS = [
  { id: 'exterior', name: 'Tampak Luar', icon: Eye, description: 'Lihat seluruh rumah dari luar' },
  { id: 'facade', name: 'Depan', icon: Sun, description: 'Lihat fasad, teras & carport dari depan' },
  { id: 'interior', name: 'Ruang Tamu', icon: Sofa, description: 'Masuk ke dalam ruang tamu' },
  { id: 'bedroom', name: 'Kamar', icon: Bed, description: 'Masuk ke dalam kamar tidur' },
  { id: 'dollhouse', name: 'Dari Atas', icon: Layers, description: 'Lihat isi semua ruangan dari atas (atap dibuka)' },
  { id: 'top', name: 'Denah', icon: Grid, description: 'Tampilan denah lurus dari atas' },
];

const HINT_STORAGE_KEY = 'homecraft-hide-nav-hint';

/** Simple accessible on/off switch row */
function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      title={description}
      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-100 transition-colors text-left"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-primary leading-tight">{label}</span>
        <span className="block text-[10px] text-secondary leading-tight truncate">{description}</span>
      </span>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-surface-300 bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}

export function CameraPresetBar() {
  const activeCameraPreset = useConfiguratorStore((s) => s.activeCameraPreset);
  const setCameraPreset = useConfiguratorStore((s) => s.setCameraPreset);
  const isRoofHidden = useConfiguratorStore((s) => s.isRoofHidden);
  const toggleRoofHidden = useConfiguratorStore((s) => s.toggleRoofHidden);
  const isEnvironmentHidden = useConfiguratorStore((s) => s.isEnvironmentHidden);
  const toggleEnvironmentHidden = useConfiguratorStore((s) => s.toggleEnvironmentHidden);
  const cameraFov = useConfiguratorStore((s) => s.cameraFov);
  const setCameraFov = useConfiguratorStore((s) => s.setCameraFov);
  const isAutoRotate = useConfiguratorStore((s) => s.isAutoRotate);
  const toggleAutoRotate = useConfiguratorStore((s) => s.toggleAutoRotate);
  const isLookAround360 = useConfiguratorStore((s) => s.isLookAround360);
  const setLookAround360 = useConfiguratorStore((s) => s.setLookAround360);

  const [isPanelOpen, setPanelOpen] = useState(true);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [isHintHidden, setHintHidden] = useState(false);

  useEffect(() => {
    try {
      setHintHidden(localStorage.getItem(HINT_STORAGE_KEY) === '1');
      // Collapse the panel by default on small screens so it doesn't cover the model
      if (window.innerWidth < 900) setPanelOpen(false);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const hideHint = () => {
    setHintHidden(true);
    try {
      localStorage.setItem(HINT_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const isWideLens = cameraFov >= 60;

  return (
    <>
      {/* ───────────── Top-left: Alat Tampilan panel ───────────── */}
      <div className="absolute top-3 left-3 z-10 w-[240px] max-w-[calc(100%-1.5rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-float overflow-hidden">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-50 transition-colors"
          aria-expanded={isPanelOpen}
        >
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="flex-1 text-left text-xs font-semibold text-primary">Alat Tampilan</span>
          {isPanelOpen ? (
            <ChevronUp className="w-4 h-4 text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary" />
          )}
        </button>

        {isPanelOpen && (
          <div className="px-2 pb-2 space-y-2">
            {/* Navigation mode */}
            <div>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Cara Melihat
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLookAround360(false)}
                  title="Seret mouse untuk memutar kamera mengelilingi rumah"
                  className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl border text-center transition-all ${
                    !isLookAround360
                      ? 'bg-primary text-white border-primary shadow-subtle'
                      : 'bg-white text-secondary border-border hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  <Orbit className="w-4 h-4" />
                  <span className="text-[11px] font-semibold leading-tight">Putar Keliling</span>
                  <span className={`text-[9px] leading-tight ${!isLookAround360 ? 'text-white/80' : 'text-secondary'}`}>
                    Lihat dari luar
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLookAround360(true)}
                  title="Kamera diam di satu titik, seret mouse untuk menoleh 360° (cocok di dalam ruangan)"
                  className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl border text-center transition-all ${
                    isLookAround360
                      ? 'bg-amber-500 text-white border-amber-600 shadow-subtle'
                      : 'bg-white text-secondary border-border hover:border-amber-400 hover:text-primary'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span className="text-[11px] font-semibold leading-tight">Menoleh 360°</span>
                  <span className={`text-[9px] leading-tight ${isLookAround360 ? 'text-white/85' : 'text-secondary'}`}>
                    Diam di 1 titik
                  </span>
                </button>
              </div>
            </div>

            {/* Visibility toggles */}
            <div className="border-t border-border/70 pt-1.5">
              <p className="px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Tampilkan
              </p>
              <SwitchRow
                label="Atap & plafon"
                description={isRoofHidden ? 'Atap dibuka – isi rumah terlihat' : 'Matikan untuk melihat isi rumah'}
                checked={!isRoofHidden}
                onChange={toggleRoofHidden}
              />
              <SwitchRow
                label="Pohon & lingkungan"
                description={isEnvironmentHidden ? 'Disembunyikan agar rumah bersih' : 'Matikan jika menghalangi'}
                checked={!isEnvironmentHidden}
                onChange={toggleEnvironmentHidden}
              />
              <SwitchRow
                label="Lensa lebar"
                description="Pandangan lebih luas di ruangan sempit"
                checked={isWideLens}
                onChange={() => setCameraFov(isWideLens ? 52 : 62)}
              />
              <SwitchRow
                label="Putar otomatis"
                description="Kamera berputar sendiri (presentasi)"
                checked={isAutoRotate}
                onChange={toggleAutoRotate}
              />
            </div>
          </div>
        )}
      </div>

      {/* ───────────── Bottom: hint + view presets ───────────── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-max max-w-[calc(100%-1.5rem)] flex flex-col items-center gap-2 pointer-events-none">
        {/* Contextual hint */}
        {(!isHintHidden || isLookAround360) && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 pl-3 pr-1.5 py-1 bg-black/75 backdrop-blur-md text-white rounded-full text-[11px] shadow-md border border-white/10 max-w-full">
            {isLookAround360 ? (
              <span className="truncate">
                <strong className="text-amber-300">Menoleh 360°:</strong> seret mouse untuk menoleh • <strong>W A S D</strong> melangkah • klik 2× lantai untuk pindah titik
              </span>
            ) : (
              <span className="truncate">
                <strong>Klik</strong> bagian rumah untuk ganti material • <strong>Seret</strong> untuk memutar • <strong>Scroll</strong> untuk zoom
              </span>
            )}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              title="Panduan lengkap cara menggunakan"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bantuan</span>
            </button>
            {!isLookAround360 && (
              <button
                type="button"
                onClick={hideHint}
                className="shrink-0 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                title="Sembunyikan petunjuk"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* View presets */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-float overflow-x-auto scrollbar-none max-w-full">
          <span className="hidden md:inline pl-2 pr-1 text-[10px] font-semibold uppercase tracking-wider text-secondary shrink-0">
            Pindah ke
          </span>
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = activeCameraPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCameraPreset(preset.id)}
                title={preset.description}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive ? 'bg-primary text-white shadow-subtle' : 'text-secondary hover:text-primary hover:bg-surface-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{preset.name}</span>
              </button>
            );
          })}
          {isHintHidden && !isLookAround360 && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              title="Bantuan cara menggunakan"
              className="flex items-center justify-center h-8 w-8 rounded-xl text-secondary hover:text-primary hover:bg-surface-100 shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ───────────── Help card ───────────── */}
      {isHelpOpen && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-float border border-border p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">Cara Menggunakan</h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-100 text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-primary">
              <li className="flex gap-2.5">
                <MousePointerClick className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Ganti material:</strong> klik dinding/lantai pada model, lalu pilih warna atau motif keramik di panel kanan.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Hand className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Memutar:</strong> tahan klik kiri lalu seret mouse. <strong>Geser:</strong> tahan klik kanan lalu seret.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ZoomIn className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Zoom:</strong> putar scroll mouse.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Compass className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Di dalam ruangan:</strong> pilih <em>Menoleh 360°</em> di panel kiri atas. Kamera diam di tempat dan Anda bisa menoleh ke segala arah tanpa menembus dinding.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Move className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Pindah tempat:</strong> klik 2× pada lantai tujuan, atau pakai tombol <em>Pindah ke</em> di bawah.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Keyboard className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Keyboard:</strong> W A S D / panah untuk berjalan, Q / E turun–naik, tahan Shift agar lebih cepat.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-4 w-full h-9 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
