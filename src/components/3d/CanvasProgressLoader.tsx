'use client';

import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';

interface CanvasProgressLoaderProps {
  modelName?: string;
}

export function CanvasProgressLoader({ modelName }: CanvasProgressLoaderProps) {
  const { active, progress } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [show, setShow] = useState(true);
  const [fadeState, setFadeState] = useState<'visible' | 'fading' | 'hidden'>('visible');

  // Smooth simulated progress so large 140MB GLB models don't sit frozen at 0%
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (!active && progress >= 100) {
          return 100;
        }
        if (progress > prev) {
          return Math.round(progress);
        }
        // Smoothly increment while downloading binary
        if (prev < 30) {
          return prev + 3;
        } else if (prev < 65) {
          return prev + 1.2;
        } else if (prev < 88) {
          return prev + 0.5;
        } else if (prev < 94) {
          return prev + 0.15;
        }
        return prev;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [active, progress]);

  // Handle completion and fade out
  useEffect(() => {
    if (!active && progress >= 100) {
      setDisplayProgress(100);
      setFadeState('fading');
      const timer = setTimeout(() => {
        setShow(false);
        setFadeState('hidden');
      }, 600);
      return () => clearTimeout(timer);
    } else if (active || progress < 100) {
      setShow(true);
      setFadeState('visible');
    }
  }, [active, progress]);

  if (!show) return null;

  const roundedProgress = Math.min(100, Math.max(0, Math.round(displayProgress)));

  // Dynamic status text corresponding to loading phase
  let statusText = 'Downloading 3D CAD Geometry...';
  if (roundedProgress > 30 && roundedProgress <= 65) {
    statusText = 'Streaming Mesh Buffers & Coordinates...';
  } else if (roundedProgress > 65 && roundedProgress <= 90) {
    statusText = 'Parsing Architectural Zones & Materials...';
  } else if (roundedProgress > 90 && roundedProgress < 100) {
    statusText = 'Compiling PBR Shaders on GPU...';
  } else if (roundedProgress >= 100) {
    statusText = 'Ready!';
  }

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F7F7F5]/85 backdrop-blur-md transition-opacity duration-500 select-none ${
        fadeState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative max-w-sm w-full mx-4 p-7 bg-white/95 rounded-2xl border border-border shadow-float flex flex-col items-center text-center">
        {/* Title & Model Info (No icon above) */}
        <h3 className="text-base font-semibold text-primary mb-1 tracking-tight">
          {roundedProgress >= 100 ? '3D Architecture Ready' : 'Loading 3D CAD Scene'}
        </h3>
        {modelName && (
          <p className="text-xs font-medium text-secondary truncate max-w-[260px] mb-3">
            {modelName}
          </p>
        )}

        {/* Status Phase Label */}
        <div className="h-5 mb-4 flex items-center justify-center">
          <span className="text-[11px] text-secondary font-medium">
            {statusText}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden p-0.5 border border-border/60 mb-2">
          <div
            className="h-full bg-gradient-to-r from-primary via-neutral-700 to-primary rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${roundedProgress}%` }}
          />
        </div>

        {/* Percentage Counter only - No "WebGL 3D" or extra badges */}
        <div className="w-full flex items-center justify-end text-xs font-mono text-primary font-semibold px-1">
          <span>{roundedProgress}%</span>
        </div>
      </div>
    </div>
  );
}
