'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/project-store';
import { Project, MaterialZone } from '@/types';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { generateModelThumbnail } from '@/lib/thumbnail-generator';
import {
  UploadCloud,
  ChevronLeft,
  FileCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Camera,
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
  const [capturedThumbnailUrl, setCapturedThumbnailUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.skp')) {
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
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.glb') || lower.endsWith('.gltf') || lower.endsWith('.skp')) {
        setSelectedFile(file);
        if (!projectName) {
          setProjectName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
      }
    }
  };

  const handleUseDemoTemplate = () => {
    setSelectedFile(new File([''], 'modern-villa.glb', { type: 'model/gltf-binary' }));
    setProjectName('Highland Hillside Villa');
    setClientName('Serenity Estates');
    setDescription('Modern 2-bedroom residential villa featuring floor-to-ceiling panoramic glass, natural timber deck, and minimalist architectural concrete envelope.');

    const loader = new GLTFLoader();
    loader.load('/models/modern-villa.glb', (gltf) => {
      try {
        const thumb = generateModelThumbnail(gltf.scene, 640, 360);
        if (thumb) setCapturedThumbnailUrl(thumb);
      } catch (e) {
        console.warn('Could not generate sample thumbnail:', e);
      }
    });
  };

  const handleUseSkpTemplate = () => {
    setSelectedFile(new File([''], 'sample-sketchup-house.skp', { type: 'application/octet-stream' }));
    setProjectName('SketchUp Modern House Concept');
    setClientName('Krona Architectural Studio');
    setDescription('Clean single-storey pavilion designed in Trimble SketchUp (.skp), converted to real-time Web 3D with customizable facade, timber floor, and slate canopy.');
    setCapturedThumbnailUrl('/models/sample-sketchup-thumb.png');
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
    let generatedThumbnail = '';
    const candidateZones: MaterialZone[] = [];

    try {
      if (selectedFile.size > 0) {
        // Upload CAD or SketchUp file directly to backend storage (backend auto-converts .skp to .glb)
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
            if (uploadData.thumbnailUrl) {
              generatedThumbnail = uploadData.thumbnailUrl;
            }
          } else {
            const errData = await uploadRes.json();
            throw new Error(errData.error || 'Gagal memproses file 3D');
          }
        } catch (uploadErr: any) {
          console.warn('Backend file upload fallback:', uploadErr);
          if (selectedFile.name.toLowerCase().endsWith('.skp')) {
            alert(uploadErr.message || 'Gagal mengonversi file SketchUp (.skp)');
            setStage('idle');
            return;
          }
          modelUrl = URL.createObjectURL(selectedFile);
        }

        // Fetch converted GLB from modelUrl to parse geometry and detect zones
        const glbRes = await fetch(modelUrl);
        const arrayBuf = await glbRes.arrayBuffer();
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.parse(arrayBuf, '', resolve, reject);
        });

        // Automatically capture a realistic 3D PNG snapshot of the uploaded house!
        try {
          const thumb = generateModelThumbnail(gltf.scene, 640, 360);
          if (thumb) {
            generatedThumbnail = thumb;
            setCapturedThumbnailUrl(thumb);
          }
        } catch (thumbErr) {
          console.warn('Could not generate 3D thumbnail during GLB parsing:', thumbErr);
        }

        // Traverse scene and intelligently detect material zones from mesh names
        const discoveredMeshes: string[] = [];
        gltf.scene.traverse((obj: THREE.Object3D) => {
          if (obj instanceof THREE.Mesh) {
            discoveredMeshes.push(obj.name || `Mesh_${obj.id}`);
          }
        });

        // Categorize meshes with comprehensive architectural & CAD patterns
        const assignedSet = new Set<string>();

        const roofMeshes = discoveredMeshes.filter((m) => /roof|ceiling|canopy|cover|slab|shingle|top/i.test(m));
        roofMeshes.forEach((m) => assignedSet.add(m));

        const wallMeshes = discoveredMeshes.filter((m) => !assignedSet.has(m) && /wall|facade|exterior|building|siding|panel|body|ib10/i.test(m));
        wallMeshes.forEach((m) => assignedSet.add(m));

        const doorMeshes = discoveredMeshes.filter((m) => !assignedSet.has(m) && /door|entry|pivot|frame|gate|hinge|handle|lock/i.test(m));
        doorMeshes.forEach((m) => assignedSet.add(m));

        const trimMeshes = discoveredMeshes.filter((m) => !assignedSet.has(m) && /corner|trim|beam|column|pillar|post|railing|fence/i.test(m));
        trimMeshes.forEach((m) => assignedSet.add(m));

        const ventMeshes = discoveredMeshes.filter((m) => !assignedSet.has(m) && /vent|grid|fan|chimney|cupola|weather|arrow|light|lamp/i.test(m));
        ventMeshes.forEach((m) => assignedSet.add(m));

        const floorMeshes = discoveredMeshes.filter((m) => !assignedSet.has(m) && /floor|ground|parquet|wood|deck|patio/i.test(m));
        floorMeshes.forEach((m) => assignedSet.add(m));

        const bathMeshes = discoveredMeshes.filter((m) => !assignedSet.has(m) && /bath|tile|ceramic|shower|toilet/i.test(m));
        bathMeshes.forEach((m) => assignedSet.add(m));

        // Remaining unassigned meshes
        const remainingMeshes = discoveredMeshes.filter((m) => !assignedSet.has(m));

        if (roofMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_roof',
            name: 'Roofing & Canopy',
            category: 'roof',
            meshNames: roofMeshes,
            defaultMaterialId: 'original',
          });
        }
        if (wallMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_wall',
            name: 'Exterior & Interior Walls',
            category: 'wall',
            meshNames: wallMeshes,
            defaultMaterialId: 'original',
          });
        }
        if (doorMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_door',
            name: 'Doors, Gates & Hardware',
            category: 'door',
            meshNames: doorMeshes,
            defaultMaterialId: 'original',
          });
        }
        if (trimMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_trim',
            name: 'Corners, Trim & Columns',
            category: 'exterior',
            meshNames: trimMeshes,
            defaultMaterialId: 'original',
          });
        }
        if (ventMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_vents',
            name: 'Vents, Fixtures & Accents',
            category: 'roof',
            meshNames: ventMeshes,
            defaultMaterialId: 'original',
          });
        }
        if (floorMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_floor',
            name: 'Main Flooring & Decks',
            category: 'floor',
            meshNames: floorMeshes,
            defaultMaterialId: 'original',
          });
        }
        if (bathMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_bath',
            name: 'Bathroom & Wet Surfaces',
            category: 'bathroom',
            meshNames: bathMeshes,
            defaultMaterialId: 'original',
          });
        }
        if (remainingMeshes.length > 0 && remainingMeshes.length <= 15) {
          candidateZones.push({
            id: 'zone_other',
            name: 'Architectural Details',
            category: 'exterior',
            meshNames: remainingMeshes,
            defaultMaterialId: 'original',
          });
        }

        // If none matched, group all into a general zone
        if (candidateZones.length === 0 && discoveredMeshes.length > 0) {
          candidateZones.push({
            id: 'zone_general',
            name: 'Primary Structure',
            category: 'wall',
            meshNames: discoveredMeshes,
            defaultMaterialId: 'original',
          });
        }
      } else if (selectedFile.name.toLowerCase().endsWith('.skp')) {
        // Built-in SketchUp template
        modelUrl = '/models/sample-sketchup-house.glb';
        generatedThumbnail = '/models/sample-sketchup-thumb.png';
        setCapturedThumbnailUrl('/models/sample-sketchup-thumb.png');
        candidateZones.push(
          {
            id: 'zone_wall',
            name: 'Exterior & Interior Facade',
            category: 'wall',
            meshNames: ['mesh_0_2', 'mesh_0_4', 'Wall_Exterior'],
            defaultMaterialId: 'wall-pure-white',
          },
          {
            id: 'zone_roof',
            name: 'Overhanging Roof Canopy',
            category: 'roof',
            meshNames: ['mesh_0_3', 'Roof_Main'],
            defaultMaterialId: 'roof-zinc-charcoal',
          },
          {
            id: 'zone_floor',
            name: 'Timber Ground Floor',
            category: 'floor',
            meshNames: ['mesh_0', 'mesh_0_1', 'Floor_Living'],
            defaultMaterialId: 'floor-oak-natural',
          },
          {
            id: 'zone_door',
            name: 'Entry Door Pivot',
            category: 'door',
            meshNames: ['mesh_0_5', 'Door_Entrance'],
            defaultMaterialId: 'door-teak-wood',
          }
        );
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
      thumbnailUrl: generatedThumbnail || capturedThumbnailUrl || '/models/villa-thumb.png',
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
            <p className="text-xs text-secondary max-w-sm mx-auto mb-4">
              Extracted geometry and created {detectedZonesCount} configurable material zones.
            </p>

            {/* Display the newly captured 3D PNG thumbnail */}
            {capturedThumbnailUrl && (
              <div className="w-full max-w-md mx-auto aspect-[16/9] rounded-2xl overflow-hidden border border-border shadow-float mb-6 relative group bg-[#F7F7F5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedThumbnailUrl}
                  alt="Captured 3D Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 text-[10px] font-mono font-medium bg-black/70 backdrop-blur-md text-white rounded-lg flex items-center gap-1.5 shadow-subtle">
                  <Camera className="w-3 h-3 text-emerald-400" />
                  <span>Captured 3D PNG Preview</span>
                </div>
              </div>
            )}

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-primary block">
                    3D House Model (.glb, .gltf, atau .skp SketchUp) *
                  </label>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">
                    SKP Ready
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleUseDemoTemplate}
                    className="flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-primary hover:underline"
                  >
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>Demo GLB</span>
                  </button>
                  <span className="text-border">|</span>
                  <button
                    type="button"
                    onClick={handleUseSkpTemplate}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Demo SketchUp (.skp)</span>
                  </button>
                </div>
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
                  accept=".glb,.gltf,.skp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mb-3 shadow-subtle">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-primary">{selectedFile.name}</span>
                    {selectedFile.name.toLowerCase().endsWith('.skp') && (
                      <span className="mt-1 px-2.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                        SketchUp (.skp) Auto-Converter Active
                      </span>
                    )}
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
                      Drag & drop file GLB, GLTF, atau SketchUp (.skp) di sini
                    </p>
                    <p className="text-[11px] text-secondary mb-4">
                      File .skp akan otomatis dikonversi ke Web 3D & diekstrak zona materialnya
                    </p>
                    <span className="px-3.5 py-1.5 text-xs font-medium text-primary bg-white border border-border rounded-lg shadow-subtle hover:bg-surface-50">
                      Pilih File Dari Komputer
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
                    <span className="font-medium text-primary">
                      {stage === 'uploading' && (selectedFile?.name.toLowerCase().endsWith('.skp') ? 'Mengunggah file SketchUp...' : 'Uploading 3D Model...')}
                      {stage === 'processing' && (selectedFile?.name.toLowerCase().endsWith('.skp') ? 'Mengonversi SketchUp (.skp) ke Web 3D GLB...' : 'Processing scene hierarchy...')}
                      {stage === 'geometry' && 'Memuat geometri 3D & UV buffers...'}
                      {stage === 'detecting' && 'Mendeteksi zona material & mengambil snapshot PNG...'}
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
