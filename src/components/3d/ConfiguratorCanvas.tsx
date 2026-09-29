'use client';

import React, { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { HouseModel } from './HouseModel';
import { LightingEnvironment } from './LightingEnvironment';
import { CameraManager } from './CameraManager';
import { MaterialZone } from '@/types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ConfiguratorCanvasProps {
  modelUrl: string;
  zones: MaterialZone[];
  onMeshClick?: (meshName: string, zone?: MaterialZone) => void;
  className?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('3D Canvas loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F7F5] z-20 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-primary mb-1">
            Unable to Load 3D Model
          </h3>
          <p className="text-xs text-secondary max-w-sm mb-6 leading-relaxed">
            The 3D model geometry could not be parsed or rendered. Please ensure the file is a valid .glb or .gltf binary.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Reloading Model</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F7F5] z-10 pointer-events-none">
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
      <CanvasErrorBoundary>
        <Canvas
          id="configurator-3d-canvas"
          shadows
          dpr={[1, 2]}
          camera={{ position: [12, 8, 14], fov: 40, near: 0.1, far: 2000 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
          }}
        >
          <Suspense fallback={null}>
            <LightingEnvironment />
            <CameraManager />
            <HouseModel modelUrl={modelUrl} zones={zones} onMeshClick={onMeshClick} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>

      {/* Fallback displayed during initial loading */}
      <Suspense fallback={<CanvasFallback />}>
        <div />
      </Suspense>
    </div>
  );
}
