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
  Footprints,
  DoorOpen,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Scissors,
} from 'lucide-react';

const PRESETS = [
  { id: 'interior', name: 'Ruang Tamu', icon: Sofa, description: 'Masuk ke dalam tengah ruang tamu (eye-level)' },
  { id: 'bedroom', name: 'Kamar', icon: Bed, description: 'Masuk ke dalam kamar tidur' },
  { id: 'exterior', name: 'Tampak Luar', icon: Eye, description: 'Lihat seluruh rumah dari luar' },
  { id: 'facade', name: 'Depan', icon: Sun, description: 'Lihat fasad & teras dari depan' },
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
  const setRoofHidden = useConfiguratorStore((s) => s.setRoofHidden);
  const toggleRoofHidden = useConfiguratorStore((s) => s.toggleRoofHidden);
  const isFurnitureHidden = useConfiguratorStore((s) => s.isFurnitureHidden);
  const toggleFurnitureHidden = useConfiguratorStore((s) => s.toggleFurnitureHidden);
  const isCeilingCut = useConfiguratorStore((s) => s.isCeilingCut);
  const setCeilingCut = useConfiguratorStore((s) => s.setCeilingCut);
  const toggleCeilingCut = useConfiguratorStore((s) => s.toggleCeilingCut);
  const detectedFloors = useConfiguratorStore((s) => s.detectedFloors);
  const hiddenFloors = useConfiguratorStore((s) => s.hiddenFloors);
  const toggleFloorHidden = useConfiguratorStore((s) => s.toggleFloorHidden);
  const isEnvironmentHidden = useConfiguratorStore((s) => s.isEnvironmentHidden);
  const toggleEnvironmentHidden = useConfiguratorStore((s) => s.toggleEnvironmentHidden);
  const cameraFov = useConfiguratorStore((s) => s.cameraFov);
  const setCameraFov = useConfiguratorStore((s) => s.setCameraFov);
  const isAutoRotate = useConfiguratorStore((s) => s.isAutoRotate);
  const toggleAutoRotate = useConfiguratorStore((s) => s.toggleAutoRotate);
  const isLookAround360 = useConfiguratorStore((s) => s.isLookAround360);
  const setLookAround360 = useConfiguratorStore((s) => s.setLookAround360);
  const isWalkMode = useConfiguratorStore((s) => s.isWalkMode);
  const setWalkMode = useConfiguratorStore((s) => s.setWalkMode);
  const toggleWalkMode = useConfiguratorStore((s) => s.toggleWalkMode);
  const enterRoom = useConfiguratorStore((s) => s.enterRoom);

  const [isPanelOpen, setPanelOpen] = useState(true);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [isHintHidden, setHintHidden] = useState(false);

  useEffect(() => {
    try {
      setHintHidden(localStorage.getItem(HINT_STORAGE_KEY) === '1');
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

  // Dispatch virtual key events for on-screen D-Pad buttons
  const triggerVirtualKey = (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code: key }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key, code: key }));
    }, 150);
  };

  const isWideLens = cameraFov >= 65;

  return (
    <>
      {/* ───────────── Top-left: Alat Tampilan panel ───────────── */}
      <div className="absolute top-3 left-3 z-10 w-[260px] max-w-[calc(100%-1.5rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-float overflow-hidden">
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-50 transition-colors"
          aria-expanded={isPanelOpen}
        >
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="flex-1 text-left text-xs font-semibold text-primary">Alat Tampilan & Kamera</span>
          {isPanelOpen ? (
            <ChevronUp className="w-4 h-4 text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary" />
          )}
        </button>

        {isPanelOpen && (
          <div className="px-2 pb-2 space-y-2">
            {/* Quick 1-Click Enter Room Button */}
            <button
              type="button"
              onClick={enterRoom}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-subtle transition-all active:scale-[0.98]"
            >
              <DoorOpen className="w-4 h-4" />
              <span>Masuk ke Ruangan (1-Click)</span>
            </button>

            {/* Navigation mode selector */}
            <div>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Mode Kontrol 3D
              </p>
              <div className="grid grid-cols-3 gap-1">
                {/* 1. Orbit / Turntable */}
                <button
                  type="button"
                  onClick={() => {
                    setWalkMode(false);
                    setLookAround360(false);
                  }}
                  title="AutoCAD Orbit: Seret untuk memutar objek, scroll untuk zoom tembus dinding"
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all ${
                    !isLookAround360 && !isWalkMode
                      ? 'bg-primary text-white border-primary shadow-subtle'
                      : 'bg-white text-secondary border-border hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  <Orbit className="w-4 h-4" />
                  <span className="text-[10px] font-semibold leading-tight">CAD Orbit</span>
                  <span className={`text-[8px] leading-tight ${!isLookAround360 && !isWalkMode ? 'text-white/80' : 'text-secondary'}`}>
                    Putar objek
                  </span>
                </button>

                {/* 2. Look Around 360 */}
                <button
                  type="button"
                  onClick={() => {
                    setWalkMode(false);
                    setLookAround360(true);
                  }}
                  title="Kamera diam di 1 titik, seret mouse menoleh 360°"
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all ${
                    isLookAround360
                      ? 'bg-amber-500 text-white border-amber-600 shadow-subtle'
                      : 'bg-white text-secondary border-border hover:border-amber-400 hover:text-primary'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span className="text-[10px] font-semibold leading-tight">Menoleh 360°</span>
                  <span className={`text-[8px] leading-tight ${isLookAround360 ? 'text-white/85' : 'text-secondary'}`}>
                    Diam di titik
                  </span>
                </button>

                {/* 3. Blender Walk Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setLookAround360(false);
                    toggleWalkMode();
                  }}
                  title="Blender Walk Mode: Jalan di dalam ruangan dengan W A S D dan mouse look"
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border text-center transition-all ${
                    isWalkMode
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-subtle'
                      : 'bg-white text-secondary border-border hover:border-indigo-400 hover:text-primary'
                  }`}
                >
                  <Footprints className="w-4 h-4" />
                  <span className="text-[10px] font-semibold leading-tight">Jalan (Blender)</span>
                  <span className={`text-[8px] leading-tight ${isWalkMode ? 'text-white/85' : 'text-secondary'}`}>
                    WASD Walk
                  </span>
                </button>
              </div>
            </div>

            {/* Visibility toggles */}
            <div className="border-t border-border/70 pt-1.5">
              <p className="px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Tampilan Arsitektur
              </p>
              <SwitchRow
                label="Buka atap & plafon"
                description={
                  isRoofHidden || isCeilingCut
                    ? 'Atap dibuka – isi ruangan terlihat'
                    : 'Buka atap agar isi ruangan terlihat dari atas'
                }
                checked={isRoofHidden || isCeilingCut}
                onChange={() => {
                  const currentlyOpen = isRoofHidden || isCeilingCut;
                  const next = !currentlyOpen;
                  setRoofHidden(next);
                  setCeilingCut(next);
                }}
              />
              <SwitchRow
                label="Sembunyikan Perabot & Furnitur"
                description={
                  isFurnitureHidden
                    ? 'Mode Kosong aktif – hanya dinding, lantai & plafon'
                    : 'Sembunyikan perabot, elektronik, pohon & dekorasi'
                }
                checked={isFurnitureHidden}
                onChange={toggleFurnitureHidden}
              />
              {detectedFloors
                .filter((f) => f.levelNumber > 1)
                .slice()
                .reverse()
                .map((floor) => {
                  const isHidden = hiddenFloors.includes(floor.levelNumber);
                  return (
                    <SwitchRow
                      key={floor.levelNumber}
                      label={`Tingkat ${floor.name}`}
                      description={
                        isHidden
                          ? `${floor.name} dibuka – lantai bawah terlihat`
                          : `Matikan untuk membuka ${floor.name}`
                      }
                      checked={!isHidden}
                      onChange={() => toggleFloorHidden(floor.levelNumber)}
                    />
                  );
                })}
              <SwitchRow
                label="Lensa lebar (Interior FOV 70°)"
                description="Pandangan luas natural di dalam ruangan"
                checked={isWideLens}
                onChange={() => setCameraFov(isWideLens ? 52 : 70)}
              />
              <SwitchRow
                label="Putar otomatis 360°"
                description="Kamera berputar perlahan (presentasi)"
                checked={isAutoRotate}
                onChange={toggleAutoRotate}
              />
            </div>
          </div>
        )}
      </div>

      {/* ───────────── Blender Walk Mode Floating HUD ───────────── */}
      {isWalkMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 bg-black/85 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs">
            <Footprints className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold text-indigo-200">Mode Jalan (Blender Walkthrough):</span>
            <span className="text-[11px] text-white/90">
              Gunakan <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">W</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">A</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">S</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-white/20 rounded font-mono">D</kbd> untuk berjalan • Tahan klik kiri geser mouse untuk menoleh
            </span>
            <button
              type="button"
              onClick={() => setWalkMode(false)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition-colors"
            >
              Keluar
            </button>
          </div>

          {/* On-screen touch / click D-pad controls for mobile or trackpad */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => triggerVirtualKey('a')}
              title="Geser Kiri (A)"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/40 text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => triggerVirtualKey('w')}
              title="Maju (W)"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/40 text-white"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => triggerVirtualKey('s')}
              title="Mundur (S)"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/40 text-white"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => triggerVirtualKey('d')}
              title="Geser Kanan (D)"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/40 text-white"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-white/60 ml-2">Tahan Shift: Lari</span>
          </div>
        </div>
      )}

      {/* ───────────── Bottom: hint + view presets ───────────── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-max max-w-[calc(100%-1.5rem)] flex flex-col items-center gap-2 pointer-events-none">
        {/* Contextual hint */}
        {!isHintHidden && !isWalkMode && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 pl-3 pr-1.5 py-1 bg-black/75 backdrop-blur-md text-white rounded-full text-[11px] shadow-md border border-white/10 max-w-full">
            {isLookAround360 ? (
              <span className="truncate">
                <strong className="text-amber-300">Menoleh 360°:</strong> seret mouse untuk menoleh • <strong>klik 2×</strong> lantai untuk berpindah titik
              </span>
            ) : (
              <span className="truncate">
                <strong>Klik 2×</strong> di lantai untuk langsung masuk • <strong>Scroll</strong> maju untuk tembus dinding • <strong>Seret</strong> untuk memutar
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
            <button
              type="button"
              onClick={hideHint}
              className="shrink-0 p-0.5 rounded-full hover:bg-white/20 transition-colors"
              title="Sembunyikan petunjuk"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View presets bar with prominent Quick Enter Room button */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-float overflow-x-auto scrollbar-none max-w-full">
          {/* Quick Enter Room Action */}
          <button
            type="button"
            onClick={enterRoom}
            title="Langsung masuk ke dalam tengah ruangan pada ketinggian mata"
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-subtle transition-all whitespace-nowrap shrink-0 hover:scale-[1.02]"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Masuk Ruangan</span>
          </button>

          {/* Quick Bare Room Toggle */}
          <button
            type="button"
            onClick={toggleFurnitureHidden}
            title={
              isFurnitureHidden
                ? 'Tampilkan kembali seluruh perabot & kulkas'
                : 'Sembunyikan seluruh perabot & kulkas (Mode Ruang Kosong: Hanya dinding, lantai & plafon)'
            }
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold shadow-subtle transition-all whitespace-nowrap shrink-0 hover:scale-[1.02] ${
              isFurnitureHidden
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-white hover:bg-surface-100 text-secondary hover:text-primary border border-border/80'
            }`}
          >
            <Sofa className="w-3.5 h-3.5" />
            <span>{isFurnitureHidden ? 'Ruang Kosong' : 'Hide Perabot'}</span>
          </button>

          <div className="h-4 w-px bg-border/80 mx-1 shrink-0" />

          <span className="hidden md:inline pl-1 pr-1 text-[10px] font-semibold uppercase tracking-wider text-secondary shrink-0">
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

          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            title="Panduan navigasi Blender & AutoCAD"
            className="flex items-center justify-center h-8 w-8 rounded-xl text-secondary hover:text-primary hover:bg-surface-100 shrink-0 ml-1"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ───────────── Help card (Blender & AutoCAD UX Guide) ───────────── */}
      {isHelpOpen && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-float border border-border p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-semibold text-primary">Navigasi 3D ala Blender & AutoCAD</h3>
              </div>
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
                <DoorOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Masuk ke Ruangan:</strong> Klik tombol hijau <em>Masuk Ruangan</em> di bawah untuk langsung berdiri di dalam ruangan dengan lensa lebar interior.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Footprints className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mode Jalan (Blender Walk):</strong> Aktifkan di panel kiri atas. Berjalan bebas menggunakan tombol <strong>W A S D</strong> dan geser mouse untuk menoleh. Tahan Shift untuk lari.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Move className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Teleport Klik 2×:</strong> Klik 2× pada titik lantai atau perabot mana saja untuk langsung meluncur ke titik tersebut.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ZoomIn className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Continuous Zoom:</strong> Scroll mouse maju terus menerus akan menembus dinding masuk ke dalam ruangan tanpa macet.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Grid className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>AutoCAD ViewCube:</strong> Gunakan kubus di pojok kanan atas untuk langsung melihat tampak Atas, Depan, Kanan, atau Isometrik.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Layers className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Buka Atap (Dollhouse View):</strong> Pilih <em>Dari Atas</em> untuk memotong plafon dan melihat tata letak seluruh perabot dari atas.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-4 w-full h-9 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors"
            >
              Mengerti & Siap Mencoba
            </button>
          </div>
        </div>
      )}
    </>
  );
}
