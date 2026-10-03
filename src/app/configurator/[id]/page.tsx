'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MaterialZone } from '@/types';
import { useProjectStore } from '@/lib/project-store';
import { useConfiguratorStore } from '@/lib/configurator-store';
import { ConfiguratorCanvas } from '@/components/3d/ConfiguratorCanvas';
import { ConfiguratorHeader } from '@/components/configurator/ConfiguratorHeader';
import { ConfiguratorSidebar } from '@/components/configurator/ConfiguratorSidebar';
import { CameraPresetBar } from '@/components/configurator/CameraPresetBar';
import { PresentationOverlay } from '@/components/configurator/PresentationOverlay';
import { SaveShareModal } from '@/components/configurator/SaveShareModal';
import { ChevronLeft, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ConfiguratorPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;
  const searchParams = useSearchParams();

  const getProject = useProjectStore((s) => s.getProject);
  const [serverProject, setServerProject] = useState<any>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  
  // Prefer serverProject (which reads fresh data/projects.json) with fallback to local project store
  const project = serverProject || getProject(projectId);

  const isPresentationMode = useConfiguratorStore((s) => s.isPresentationMode);
  const loadConfiguration = useConfiguratorStore((s) => s.loadConfiguration);
  const resetConfiguration = useConfiguratorStore((s) => s.resetConfiguration);
  const dynamicZones = useConfiguratorStore((s) => s.dynamicZones);

  const allZones = useMemo(() => {
    const map = new Map<string, MaterialZone>();
    (project?.zones || []).forEach((z: MaterialZone) => {
      // Exclude giant catch-all dump zones that ruin individual box customization
      if (z.id === 'zone_other' || (z.meshNames && z.meshNames.length > 25)) {
        return;
      }
      map.set(z.id, z);
    });
    dynamicZones.forEach((z: MaterialZone) => {
      map.set(z.id, z);
    });
    return Array.from(map.values());
  }, [project?.zones, dynamicZones]);

  useEffect(() => {
    // Always fetch latest project from server database
    if (!project) {
      setIsLoadingProject(true);
    }
    fetch(`/api/projects/${projectId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.id) {
          setServerProject(data);
        }
        setIsLoadingProject(false);
      })
      .catch(() => setIsLoadingProject(false));
  }, [projectId]);

  // Restore configuration from URL query parameter ?config=... if provided
  useEffect(() => {
    if (!project) return;

    const isDemo = project.id === 'house-001';

    const configParam = searchParams.get('config');
    if (configParam) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(configParam)));
        loadConfiguration(
          decoded.m || decoded.configuration,
          decoded.c || decoded.customColors || {},
          undefined,
          decoded.t || decoded.textureSettings || {}
        );
        return;
      } catch (err) {
        console.error('Failed to parse URL configuration:', err);
      }
    }

    // Default initialization (demo villa gets curated defaults; all user/custom models start 100% original)
    resetConfiguration(project.zones, isDemo);
  }, [project, searchParams, loadConfiguration, resetConfiguration]);

  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-primary">Loading 3D Project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-200 flex items-center justify-center mb-4 text-secondary">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-primary mb-2">Project Not Found</h2>
        <p className="text-sm text-secondary max-w-sm mb-6">
          The architectural project you requested could not be located or may have been removed.
        </p>
        <Link
          href="/configurator/house-001"
          className="px-5 py-2.5 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-subtle"
        >
          Open Demo Villa Configurator
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F7F7F5]">
      {/* Top Header (Hidden in presentation mode) */}
      <ConfiguratorHeader project={project} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* 3D Scene Viewport */}
        <main className="flex-1 relative w-full h-full">
          <ConfiguratorCanvas
            modelUrl={project.modelUrl}
            zones={allZones}
            modelName={project.name}
          />

          {/* Floating Camera Presets Bar (when not in presentation mode) */}
          {!isPresentationMode && <CameraPresetBar />}

          {/* Fullscreen Presentation Mode HUD */}
          <PresentationOverlay project={project} />
        </main>

        {/* Customization Sidebar (hidden in presentation mode) */}
        {!isPresentationMode && <ConfiguratorSidebar zones={allZones} />}
      </div>

      {/* Save & Share Dialog Modals */}
      <SaveShareModal project={project} />
    </div>
  );
}
