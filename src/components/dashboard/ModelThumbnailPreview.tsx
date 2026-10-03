'use client';

import React, { useEffect, useState } from 'react';
import { Project } from '@/types';
import { useProjectStore } from '@/lib/project-store';
import { generateModelThumbnail } from '@/lib/thumbnail-generator';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Building2, Camera, Loader2, Sparkles } from 'lucide-react';

interface ModelThumbnailPreviewProps {
  project: Project;
  className?: string;
}

export function ModelThumbnailPreview({ project, className = '' }: ModelThumbnailPreviewProps) {
  const updateProjectThumbnail = useProjectStore((s) => s.updateProjectThumbnail);

  // Check if project already has a captured PNG data URL or valid image
  const hasValidThumbnail =
    Boolean(project.thumbnailUrl) &&
    (project.thumbnailUrl.startsWith('data:image/') ||
      project.thumbnailUrl.endsWith('.png') ||
      project.thumbnailUrl.endsWith('.jpg') ||
      project.thumbnailUrl.endsWith('.webp'));

  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(
    hasValidThumbnail ? project.thumbnailUrl : null
  );
  const [isCapturing, setIsCapturing] = useState<boolean>(!hasValidThumbnail);

  const triggerCapture = React.useCallback(() => {
    setIsCapturing(true);
    const loader = new GLTFLoader();
    loader.load(
      project.modelUrl,
      (gltf) => {
        try {
          const capturedPng = generateModelThumbnail(gltf.scene, 640, 360);
          if (capturedPng) {
            setThumbnailSrc(capturedPng);
            setIsCapturing(false);
            updateProjectThumbnail(project.id, capturedPng);
          }
        } catch (err) {
          console.error('Error generating model snapshot:', err);
          setIsCapturing(false);
        }
      },
      undefined,
      (err) => {
        console.warn('Could not auto-generate thumbnail from model URL:', project.modelUrl, err);
        setIsCapturing(false);
      }
    );
  }, [project.id, project.modelUrl, updateProjectThumbnail]);

  useEffect(() => {
    // If already valid, use it
    if (hasValidThumbnail) {
      setThumbnailSrc(project.thumbnailUrl);
      setIsCapturing(false);
      return;
    }

    // Otherwise, generate 3D snapshot automatically from the model
    triggerCapture();
  }, [project.id, project.thumbnailUrl, hasValidThumbnail, triggerCapture]);

  return (
    <div
      className={`relative w-full aspect-[16/9] rounded-xl bg-[#F7F7F5] border border-border/80 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/40 ${className}`}
    >
      {thumbnailSrc ? (
        <>
          {/* Static High-Resolution Captured 3D PNG Render */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailSrc}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => {
              // If image URL fails (e.g. 404), seamlessly regenerate snapshot from 3D model
              setThumbnailSrc(null);
              triggerCapture();
            }}
          />

          {/* Sleek Corner Badge */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[9px] uppercase font-mono font-medium bg-black/60 backdrop-blur-md text-white rounded-md flex items-center gap-1 shadow-subtle">
            <Camera className="w-2.5 h-2.5" />
            <span>3D Render</span>
          </div>

          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-[9px] uppercase font-mono font-semibold bg-white/90 backdrop-blur-md text-primary rounded-md shadow-subtle border border-border/60">
            Preview PNG
          </div>
        </>
      ) : isCapturing ? (
        /* Capturing Loading State */
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-xl bg-white shadow-subtle border border-border flex items-center justify-center text-primary mb-2 animate-pulse">
            <Camera className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xs font-medium text-primary">Mengambil Snapshot 3D...</span>
          <span className="text-[10px] text-secondary mt-0.5">Merender tampilan rumah ke format PNG</span>
        </div>
      ) : (
        /* Fallback Placeholder */
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="w-10 h-10 rounded-xl bg-white shadow-subtle flex items-center justify-center text-primary mb-2">
            <Building2 className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[11px] font-semibold text-primary">{project.name}</span>
          <span className="text-[10px] font-mono text-secondary mt-0.5">3D Model</span>
        </div>
      )}
    </div>
  );
}
