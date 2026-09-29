'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { HouseModel } from './HouseModel';
import { LightingEnvironment } from './LightingEnvironment';
import { CameraManager } from './CameraManager';
import { MaterialZone } from '@/types';
import { Loader2 } from 'lucide-react';

interface ConfiguratorCanvasProps {
  modelUrl: string;
  zones: MaterialZone[];
  onMeshClick?: (meshName: string, zone?: MaterialZone) => void;
  className?: string;
}

function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F7F5] z-10">
      <div className="flex flex-col items-center max-w-xs text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-border shadow-float">
        <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <h3 className="text-base font-medium text-primary mb-1">Loading 3D Architecture</h3>
        <p className="text-xs text-secondary mb-4">
          Compiling geometry & initializing realistic PBR material zones...
        </p>
        <div className="w-full bg-surface-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-primary h-full rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function ConfiguratorCanvas({
  modelUrl,
  zones,
  onMeshClick,
  className = 'w-full h-full',
}: ConfiguratorCanvasProps) {
  return (
    <div className={`relative ${className} overflow-hidden select-none bg-[#F7F7F5]`}>
      <Canvas
        id="configurator-3d-canvas"
        shadows
        dpr={[1, 2]}
        camera={{ position: [12, 8, 14], fov: 40, near: 0.2, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true, // Required for high-res screenshot capture
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <LightingEnvironment />
          <CameraManager />
          <HouseModel modelUrl={modelUrl} zones={zones} onMeshClick={onMeshClick} />
        </Suspense>
      </Canvas>

      {/* Fallback displayed during initial loading */}
      <Suspense fallback={<CanvasFallback />}>
        <div />
      </Suspense>
    </div>
  );
}
