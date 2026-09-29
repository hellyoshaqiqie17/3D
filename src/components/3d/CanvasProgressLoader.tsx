'use client';

import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { Box, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

interface CanvasProgressLoaderProps {
  modelName?: string;
}

export function CanvasProgressLoader({ modelName }: CanvasProgressLoaderProps) {
  const { active, progress, loaded, total } = useProgress();
  const [show, setShow] = useState(true);
  const [fadeState, setFadeState] = useState<'visible' | 'fading' | 'hidden'>('visible');

  // Smoothly hide loader after model fully compiles
  useEffect(() => {
    if (!active && progress >= 100) {
      setFadeState('fading');
      const timer = setTimeout(() => {
        setShow(false);
        setFadeState('hidden');
      }, 700);
      return () => clearTimeout(timer);
    } else if (active || progress < 100) {
      setShow(true);
      setFadeState('visible');
    }
  }, [active, progress]);

  if (!show) return null;

  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Dynamic status text corresponding to loading phase
  let statusText = 'Downloading 3D CAD Geometry...';
  if (roundedProgress > 30 && roundedProgress <= 65) {
    statusText = 'Streaming Binary Mesh Buffers & Coordinates...';
  } else if (roundedProgress > 65 && roundedProgress <= 90) {
    statusText = 'Parsing Architectural Zones & Materials...';
  } else if (roundedProgress > 90 && roundedProgress < 100) {
    statusText = 'Compiling PBR Shaders on GPU...';
  } else if (roundedProgress >= 100) {
    statusText = 'Scene Initialized & Ready!';
  }

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F7F7F5]/90 backdrop-blur-md transition-opacity duration-700 select-none ${
        fadeState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative max-w-sm w-full mx-4 p-8 bg-white/95 rounded-3xl border border-border shadow-float flex flex-col items-center text-center">
        {/* Animated Icon with Outer Glow Rings */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 rounded-full bg-primary/10 animate-ping opacity-60" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-neutral-700 flex items-center justify-center text-white shadow-md">
            {roundedProgress >= 100 ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-in zoom-in-75 duration-300" />
            ) : (
              <Box className="w-8 h-8 animate-bounce duration-1000" />
            )}
          </div>
        </div>

        {/* Title & Model Info */}
        <h3 className="text-base font-semibold text-primary mb-1 tracking-tight">
          {roundedProgress >= 100 ? '3D Architecture Ready' : 'Loading 3D CAD Scene'}
        </h3>
        {modelName && (
          <p className="text-xs font-medium text-secondary truncate max-w-[260px] mb-4">
            {modelName}
          </p>
        )}

        {/* Status Phase Label */}
        <div className="h-5 mb-4 flex items-center justify-center">
          <span className="text-[11px] text-secondary font-medium animate-pulse">
            {statusText}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-surface-200 h-2.5 rounded-full overflow-hidden p-0.5 border border-border/60 mb-3">
          <div
            className="h-full bg-gradient-to-r from-primary via-neutral-700 to-primary bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${roundedProgress}%` }}
          />
        </div>

        {/* Percentage Counter & File Stats */}
        <div className="w-full flex items-center justify-between text-xs font-mono text-secondary px-1">
          <span>{loaded > 0 && total > 0 ? `Assets ${loaded}/${total}` : 'WebGL 3D'}</span>
          <span className="font-semibold text-primary text-sm">{roundedProgress}%</span>
        </div>
      </div>
    </div>
  );
}
