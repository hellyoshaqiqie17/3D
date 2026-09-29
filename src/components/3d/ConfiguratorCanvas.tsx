'use client';

import React, { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { HouseModel } from './HouseModel';
import { LightingEnvironment } from './LightingEnvironment';
import { CameraManager } from './CameraManager';
import { MaterialZone } from '@/types';
import { Loader2, AlertCircle, RefreshCw, Eye, ArrowRight } from 'lucide-react';
import { CanvasProgressLoader } from './CanvasProgressLoader';
import { ProceduralFloor } from './ProceduralFloor';
import { useConfiguratorStore } from '@/lib/configurator-store';

interface ConfiguratorCanvasProps {
  modelUrl: string;
  zones: MaterialZone[];
  onMeshClick?: (meshName: string, zone?: MaterialZone) => void;
  className?: string;
  modelName?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
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

export function ConfiguratorCanvas({
  modelUrl,
  zones,
  onMeshClick,
  className = 'w-full h-full',
  modelName,
}: ConfiguratorCanvasProps) {
  const isOriginalMode = useConfiguratorStore((s) => s.isOriginalMode);
  const toggleOriginalMode = useConfiguratorStore((s) => s.toggleOriginalMode);

  return (
    <div className={`relative ${className} overflow-hidden select-none bg-[#F7F7F5]`}>
      {/* Dynamic 3D Progress Loader with real-time percentage */}
      <CanvasProgressLoader modelName={modelName} />

      {/* Floating Banner when viewing Original Design */}
      {isOriginalMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-amber-600 text-white rounded-full shadow-lg border border-amber-500 animate-in fade-in slide-in-from-top-3 duration-300">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">Mode: Melihat Desain Asli CAD</span>
          <button
            onClick={toggleOriginalMode}
            className="ml-1 px-3 py-1 bg-white text-amber-900 rounded-full text-xs font-semibold hover:bg-amber-50 transition-colors shadow-subtle flex items-center gap-1"
          >
            <span>Kembali ke Desain Kustom</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

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
            <ProceduralFloor />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
