'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/project-store';
import { Project, MaterialZone } from '@/types';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import {
  UploadCloud,
  ChevronLeft,
  FileCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

type UploadStage =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'geometry'
  | 'detecting'
  | 'ready';

export default function NewProjectPage() {
  const router = useRouter();
  const addProject = useProjectStore((s) => s.addProject);

  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<UploadStage>('idle');
  const [detectedZonesCount, setDetectedZonesCount] = useState(0);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        setSelectedFile(file);
        if (!projectName) {
          setProjectName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!projectName) {
        setProjectName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleUseDemoTemplate = () => {
    setSelectedFile(new File([''], 'modern-villa.glb', { type: 'model/gltf-binary' }));
    setProjectName('Highland Hillside Villa');
    setClientName('Serenity Estates');
    setDescription('Modern 2-bedroom residential villa featuring floor-to-ceiling panoramic glass, natural timber deck, and minimalist architectural concrete envelope.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setStage('uploading');
    setUploadProgress(25);

    await new Promise((r) => setTimeout(r, 600));
    setStage('processing');
    setUploadProgress(50);

    await new Promise((r) => setTimeout(r, 600));
    setStage('geometry');
    setUploadProgress(75);

    // Parse model to extract meshes and generate initial candidate material zones
    let modelUrl = '/models/modern-villa.glb';
    const candidateZones: MaterialZone[] = [];

    try {
      if (selectedFile.size > 0) {
        // Upload CAD file directly to backend storage
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              modelUrl = uploadData.url;
            }
          }
        } catch (uploadErr) {
          console.warn('Backend file upload fallback:', uploadErr);
          modelUrl = URL.createObjectURL(selectedFile);
        }

        const arrayBuf = await selectedFile.arrayBuffer();
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.parse(arrayBuf, '', resolve, reject);
        });

        // Traverse scene and intelligently detect material zones from mesh names
        const discoveredMeshes: string[] = [];
        gltf.scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh) {
            discoveredMeshes.push(obj.name || `Mesh_${obj.id}`);
          }
        });

        // Categorize meshes
        const wallMeshes = discoveredMeshes.filter((m) => /wall|facade|exterior|pillar|column/i.test(m));
        const floorMeshes = discoveredMeshes.filter((m) => /floor|ground|parquet|wood/i.test(m));
        const bathMeshes = discoveredMeshes.filter((m) => /bath|tile|ceramic|shower|toilet/i.test(m));
        const roofMeshes = discoveredMeshes.filter((m) => /roof|ceiling|canopy/i.test(m));
        const doorMeshes = discoveredMeshes.filter((m) => /door|entry|pivot|frame/i.test(m));

        if (wallMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_wall',
            name: 'Exterior & Interior Walls',
            category: 'wall',
            meshNames: wallMeshes,
            defaultMaterialId: 'wall-pure-white',
          });
        }
        if (floorMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_floor',
            name: 'Main Flooring',
            category: 'floor',
            meshNames: floorMeshes,
            defaultMaterialId: 'floor-oak-natural',
          });
        }
        if (bathMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_bath',
            name: 'Bathroom & Wet Surfaces',
            category: 'bathroom',
            meshNames: bathMeshes,
            defaultMaterialId: 'tile-white-subway',
          });
        }
        if (roofMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_roof',
            name: 'Roof Canopy',
            category: 'roof',
            meshNames: roofMeshes,
            defaultMaterialId: 'roof-zinc-charcoal',
          });
        }
        if (doorMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_door',
            name: 'Doors & Frames',
            category: 'door',
            meshNames: doorMeshes,
            defaultMaterialId: 'door-teak-wood',
          });
        }

        // If none matched, group all into a general zone
        if (candidateZones.length === 0 && discoveredMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_general',
            name: 'Primary Structure',
            category: 'wall',
            meshNames: discoveredMeshes,
            defaultMaterialId: 'wall-pure-white',
          });
        }
      } else {
        // Template demo zones
        candidateZones.push(
          {
            id: 'wall_ext',
            name: 'Exterior Walls',
            category: 'wall',
            meshNames: ['Wall_Exterior_Main', 'Wall_Exterior_Accent'],
            defaultMaterialId: 'wall-pure-white',
          },
          {
            id: 'floor_living',
            name: 'Living Room Flooring',
            category: 'floor',
            meshNames: ['Floor_Living'],
            defaultMaterialId: 'floor-oak-natural',
          },
          {
            id: 'floor_bathroom',
            name: 'Bathroom Surfaces',
            category: 'bathroom',
            meshNames: ['Floor_Bathroom', 'Wall_Bathroom'],
            defaultMaterialId: 'tile-white-subway',
          },
          {
            id: 'roof_main',
            name: 'Roof Canopy',
            category: 'roof',
            meshNames: ['Roof_Main'],
            defaultMaterialId: 'roof-zinc-charcoal',
          }
        );
      }
    } catch (err) {
      console.warn('Parsing custom model, falling back to default structure:', err);
    }

    setStage('detecting');
    setUploadProgress(90);
    setDetectedZonesCount(candidateZones.length);

    await new Promise((r) => setTimeout(r, 600));
    setStage('ready');
    setUploadProgress(100);

    const newId = `project_${Date.now()}`;
    const newProject: Project = {
      id: newId,
      name: projectName.trim(),
      clientName: clientName.trim() || 'Private Client',
      description: description.trim() || 'Interactive architectural visualization.',
      modelUrl,
      thumbnailUrl: '/models/villa-thumb.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'published',
      viewsCount: 1,
      savedConfigsCount: 0,
      zones: candidateZones,
    };

    addProject(newProject);
    setCreatedProjectId(newId);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Top Bar */}
      <header className="h-16 px-6 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-100"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold text-primary">New 3D Project Setup</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-primary mb-2">
            Upload & Ingest 3D Model
          </h2>
          <p className="text-sm text-secondary leading-relaxed">
            Upload a prepared GLB or GLTF architectural export. Our system will extract the mesh
            hierarchy, detect material zones, and generate an interactive web presentation.
          </p>
        </div>

        {stage === 'ready' && createdProjectId ? (
          /* Ready Screen */
          <div className="bg-white p-8 rounded-2xl border border-border shadow-panel text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-1">Model Ready for Presentation</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto mb-6">
              Extracted geometry and created {detectedZonesCount} configurable material zones.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/projects/${createdProjectId}/editor`}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-medium text-primary bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors border border-border"
              >
                Refine Zones in Editor
              </Link>
              <Link
                href={`/configurator/${createdProjectId}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors"
              >
                <span>Launch 3D Configurator</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Creation Form */
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-border shadow-panel space-y-6">
            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-primary block mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Hillside Villa"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-primary text-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-primary block mb-1.5">
                  Client / Development Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aura Living Developments"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border focus:outline-none focus:border-primary text-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-primary block mb-1.5">
                Project Description
              </label>
              <textarea
                rows={3}
                placeholder="Architectural summary, site location, design intent..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-border focus:outline-none focus:border-primary text-primary resize-none"
              />
            </div>

            {/* Drag & Drop Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-primary block">
                  3D House Model (.glb or .gltf) *
                </label>
                <button
                  type="button"
                  onClick={handleUseDemoTemplate}
                  className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Use Sample Architecture GLB</span>
                </button>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-primary bg-surface-50/60'
                    : 'border-border hover:border-surface-400 bg-surface-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-3 shadow-subtle">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-primary">{selectedFile.name}</span>
                    <span className="text-[11px] text-secondary mt-1">
                      {selectedFile.size > 0
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : 'Bundled Architecture Model'}
                    </span>
                    <span className="text-[10px] text-accent mt-2 underline">Click to change file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center mb-3 text-secondary">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-primary mb-1">
                      Drag & drop your GLB / GLTF here
                    </p>
                    <p className="text-[11px] text-secondary mb-4">
                      or click to browse local files from your CAD software
                    </p>
                    <span className="px-3 py-1.5 text-xs font-medium text-primary bg-white border border-border rounded-lg shadow-subtle hover:bg-surface-50">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar (during processing) */}
            {stage !== 'idle' && (
              <div className="p-4 bg-surface-50 rounded-xl border border-border">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="font-medium text-primary capitalize">
                      {stage === 'uploading' && 'Uploading 3D Model...'}
                      {stage === 'processing' && 'Processing scene hierarchy...'}
                      {stage === 'geometry' && 'Loading geometry & UV buffers...'}
                      {stage === 'detecting' && 'Detecting configurable material zones...'}
                    </span>
                  </div>
                  <span className="font-mono text-secondary">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!selectedFile || stage !== 'idle'}
                className="px-6 py-2.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors disabled:opacity-50"
              >
                Process & Create Project
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
