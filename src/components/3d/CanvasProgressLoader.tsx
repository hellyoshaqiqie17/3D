'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface CanvasProgressLoaderProps {
  modelName?: string;
}

export function CanvasProgressLoader({ modelName }: CanvasProgressLoaderProps) {
  const { active, progress, errors } = useProgress();
  const isSceneReady = useConfiguratorStore((s) => s.isSceneReady);
  const sceneLoadingStage = useConfiguratorStore((s) => s.sceneLoadingStage);

  const [displayProgress, setDisplayProgress] = useState(0);
  const [show, setShow] = useState(true);
  const [fadeState, setFadeState] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const [elapsedSec, setElapsedSec] = useState(0);

  // Track elapsed loading seconds
  useEffect(() => {
    if (isSceneReady) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSceneReady]);

  // Reset state when a new model starts loading
  useEffect(() => {
    if (!isSceneReady) {
      setShow(true);
      setFadeState('visible');
      setElapsedSec(0);
    }
  }, [isSceneReady, modelName]);

  // Accurate multi-stage progress calculation
  // NEVER jumps to 100% until isSceneReady is TRUE
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (isSceneReady) {
          return 100;
        }

        // Phase 1: Network download (0% -> max 70%)
        if (active || progress < 100) {
          const downloadTarget = Math.max(12, Math.min(70, Math.round(progress * 0.7)));
          if (prev < downloadTarget) {
            return Math.min(downloadTarget, prev + Math.max(1, (downloadTarget - prev) * 0.25));
          }
          // Smooth increment while waiting for download chunks
          if (prev < 25) return prev + 2;
          if (prev < 50) return prev + 0.8;
          if (prev < 68) return prev + 0.3;
          return prev;
        }

        // Phase 2: Download complete, parsing & building 3D scene (70% -> max 96%)
        // If not ready yet, NEVER exceed 96%
        let phaseTarget = 78;
        if (sceneLoadingStage === 'preparing') {
          phaseTarget = 88;
        } else if (sceneLoadingStage === 'rendering') {
          phaseTarget = 94;
        }

        if (prev < phaseTarget) {
          return Math.min(phaseTarget, prev + 1.2);
        } else if (prev < 96) {
          // Slow crawl up to 96% while waiting for first GPU frame
          return prev + 0.1;
        }

        return Math.min(96, prev);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [active, progress, isSceneReady, sceneLoadingStage]);

  // Handle true completion and fade out
  useEffect(() => {
    if (isSceneReady) {
      setDisplayProgress(100);
      // Wait 400ms so the user sees the 100% Ready state, then fade out smoothly
      const fadeTimer = setTimeout(() => {
        setFadeState('fading');
      }, 400);

      const hideTimer = setTimeout(() => {
        setShow(false);
        setFadeState('hidden');
      }, 950);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShow(true);
      setFadeState('visible');
    }
  }, [isSceneReady]);

  if (!show) return null;

  // While not ready, clamp strictly below 96%
  const roundedProgress = isSceneReady
    ? 100
    : Math.min(96, Math.max(5, Math.round(displayProgress)));

  // Dynamic honest status text corresponding to exact loading phase
  let statusText = 'Mengunduh geometri 3D...';
  if (!isSceneReady) {
    if (elapsedSec >= 15) {
      statusText = `Memproses model CAD besar (${elapsedSec}d), mohon tunggu...`;
    } else if (sceneLoadingStage === 'rendering') {
      statusText = 'Mengompilasi shader GPU & render scene...';
    } else if (sceneLoadingStage === 'preparing') {
      statusText = 'Menyiapkan komponen & material arsitektur...';
    } else if (!active && progress >= 100) {
      statusText = 'Mengekstrak buffer geometri & koordinat...';
    } else if (roundedProgress > 30) {
      statusText = `Mengunduh berkas 3D CAD (${roundedProgress}%)...`;
    }
  } else {
    statusText = 'Siap!';
  }

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F7F7F5]/85 backdrop-blur-md transition-opacity duration-500 select-none ${
        fadeState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative max-w-sm w-full mx-4 p-7 bg-white/95 rounded-2xl border border-border shadow-float flex flex-col items-center text-center">
        {/* Title & Model Info */}
        <h3 className="text-base font-semibold text-primary mb-1 tracking-tight flex items-center gap-2">
          {isSceneReady ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Model 3D Siap Digunakan</span>
            </>
          ) : (
            <span>Memuat Model 3D</span>
          )}
        </h3>

        {modelName && (
          <p className="text-xs font-medium text-secondary truncate max-w-[260px] mb-3">
            {modelName}
          </p>
        )}

        {/* Status Phase Label with spinner or ready check */}
        <div className="h-6 mb-3 flex items-center justify-center gap-2 px-3 py-1 bg-surface-100/80 rounded-full border border-border/50 max-w-full">
          {!isSceneReady ? (
            <Loader2 className="w-3 h-3 text-amber-600 animate-spin shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          )}
          <span className="text-[11px] text-secondary font-medium truncate">
            {statusText}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden p-0.5 border border-border/60 mb-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out shadow-sm ${
              isSceneReady
                ? 'bg-emerald-600'
                : 'bg-gradient-to-r from-amber-600 via-primary to-amber-700'
            }`}
            style={{ width: `${roundedProgress}%` }}
          />
        </div>

        {/* Percentage Counter and State indicator */}
        <div className="w-full flex items-center justify-between text-xs px-1 font-mono">
          <span className="text-[10px] text-muted-foreground font-sans">
            {isSceneReady ? 'Selesai' : (elapsedSec > 0 ? `${elapsedSec}s` : 'Memproses...')}
          </span>
          <span className={`font-semibold ${isSceneReady ? 'text-emerald-700' : 'text-primary'}`}>
            {roundedProgress}%
          </span>
        </div>
      </div>
    </div>
  );
}
