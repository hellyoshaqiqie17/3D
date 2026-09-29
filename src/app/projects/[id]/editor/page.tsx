'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/project-store';
import { MaterialZone, MaterialCategory } from '@/types';
import { MATERIAL_CATEGORIES, MATERIAL_LIBRARY } from '@/lib/materials';
import { ConfiguratorCanvas } from '@/components/3d/ConfiguratorCanvas';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  Eye,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Save,
  MousePointerClick,
} from 'lucide-react';

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export default function ZoneEditorPage({ params }: EditorPageProps) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;
  const router = useRouter();

  const getProject = useProjectStore((s) => s.getProject);
  const updateProjectZones = useProjectStore((s) => s.updateProjectZones);
  const project = getProject(projectId);

  const [zones, setZones] = useState<MaterialZone[]>([]);
  const [selectedMeshName, setSelectedMeshName] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // New zone creation state
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCategory, setNewZoneCategory] = useState<MaterialCategory>('wall');
  const [newZoneMeshes, setNewZoneMeshes] = useState<string[]>([]);

  useEffect(() => {
    if (project) {
      setZones(project.zones || []);
      if (project.zones && project.zones.length > 0) {
        setActiveZoneId(project.zones[0].id);
      }
    }
  }, [project]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6 text-center">
        <p className="text-secondary text-sm">Project not found.</p>
      </div>
    );
  }

  // Handle 3D mesh click from canvas
  const handleMeshClick = (meshName: string) => {
    setSelectedMeshName(meshName);

    // If currently creating a new zone, toggle this mesh in the new zone's mesh list!
    if (isCreatingZone) {
      setNewZoneMeshes((prev) =>
        prev.includes(meshName) ? prev.filter((m) => m !== meshName) : [...prev, meshName]
      );
      return;
    }

    // Otherwise, check if this mesh belongs to an existing zone
    const parentZone = zones.find((z) => z.meshNames.includes(meshName));
    if (parentZone) {
      setActiveZoneId(parentZone.id);
    }
  };

  const handleSaveZones = () => {
    updateProjectZones(project.id, zones);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleDeleteZone = (zoneId: string) => {
    const updated = zones.filter((z) => z.id !== zoneId);
    setZones(updated);
    if (activeZoneId === zoneId) {
      setActiveZoneId(updated[0]?.id || null);
    }
  };

  const handleCreateZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim() || newZoneMeshes.length === 0) return;

    const defaultMat = MATERIAL_LIBRARY.find((m) => m.category === newZoneCategory)?.id || 'wall-pure-white';

    const newZone: MaterialZone = {
      id: `zone_${Date.now()}`,
      name: newZoneName.trim(),
      category: newZoneCategory,
      meshNames: newZoneMeshes,
      defaultMaterialId: defaultMat,
      description: `Configurable ${newZoneCategory} surface mapped to ${newZoneMeshes.length} meshes.`,
    };

    const updated = [...zones, newZone];
    setZones(updated);
    setActiveZoneId(newZone.id);
    setIsCreatingZone(false);
    setNewZoneName('');
    setNewZoneMeshes([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F7F7F5]">
      {/* Top Header */}
      <header className="h-16 px-6 bg-white border-b border-border flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-100"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-primary">Material Zone Editor</h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-medium bg-surface-100 text-secondary rounded border border-border">
                {project.name}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Inspect 3D geometry and assign configurable material zones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/configurator/${project.id}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-surface-100 rounded-lg transition-colors border border-border"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Test Configurator</span>
          </Link>

          <button
            onClick={handleSaveZones}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-subtle"
          >
            {isSavedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSavedNotice ? 'Saved!' : 'Save Zones'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* 3D Scene for Visual Inspection */}
        <div className="flex-1 relative w-full h-full bg-[#F7F7F5]">
          <ConfiguratorCanvas
            modelUrl={project.modelUrl}
            zones={zones}
            onMeshClick={handleMeshClick}
          />

          {/* Floating Mesh Inspection Tooltip */}
          {selectedMeshName && (
            <div className="absolute top-6 left-6 z-10 p-3.5 bg-white/95 backdrop-blur-md rounded-xl border border-border shadow-float flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-primary">
                <MousePointerClick className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block">
                  Clicked 3D Mesh
                </span>
                <span className="text-xs font-mono font-semibold text-primary">{selectedMeshName}</span>
              </div>
              {isCreatingZone && (
                <button
                  onClick={() => {
                    setNewZoneMeshes((prev) =>
                      prev.includes(selectedMeshName)
                        ? prev.filter((m) => m !== selectedMeshName)
                        : [...prev, selectedMeshName]
                    );
                  }}
                  className={`ml-2 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                    newZoneMeshes.includes(selectedMeshName)
                      ? 'bg-primary text-white'
                      : 'bg-surface-100 text-secondary hover:text-primary'
                  }`}
                >
                  {newZoneMeshes.includes(selectedMeshName) ? 'Added' : '+ Add to New Zone'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Admin Configurable Zones Sidebar */}
        <aside className="w-full lg:w-96 bg-white border-l border-border flex flex-col h-[400px] lg:h-full z-10 shrink-0 shadow-subtle overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                Configurable Zones ({zones.length})
              </h2>
            </div>

            <button
              onClick={() => {
                setIsCreatingZone(!isCreatingZone);
                if (selectedMeshName && !newZoneMeshes.includes(selectedMeshName)) {
                  setNewZoneMeshes([selectedMeshName]);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary hover:bg-surface-100 rounded-lg border border-border transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingZone ? 'Cancel' : 'New Zone'}</span>
            </button>
          </div>

          {/* New Zone Creation Form */}
          {isCreatingZone && (
            <form onSubmit={handleCreateZoneSubmit} className="p-4 bg-surface-50 border-b border-border space-y-3">
              <h3 className="text-xs font-semibold text-primary">Define New Material Zone</h3>

              <div>
                <label className="text-[11px] font-medium text-secondary block mb-1">
                  Zone Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom Wall"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border focus:outline-none focus:border-primary text-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-secondary block mb-1">
                  Material Category
                </label>
                <select
                  value={newZoneCategory}
                  onChange={(e) => setNewZoneCategory(e.target.value as MaterialCategory)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border focus:outline-none focus:border-primary text-primary bg-white"
                >
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-secondary block mb-1">
                  Assigned Meshes ({newZoneMeshes.length})
                </label>
                {newZoneMeshes.length === 0 ? (
                  <p className="text-[11px] text-secondary/80 italic">
                    Click any mesh on the 3D model to attach it to this zone.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {newZoneMeshes.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 text-[10px] font-mono bg-white border border-border rounded flex items-center gap-1"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => setNewZoneMeshes((prev) => prev.filter((x) => x !== m))}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={newZoneMeshes.length === 0 || !newZoneName.trim()}
                className="w-full py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
              >
                Create Configurable Zone
              </button>
            </form>
          )}

          {/* Zones List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {zones.map((zone) => {
              const isActive = activeZoneId === zone.id;

              return (
                <div
                  key={zone.id}
                  onClick={() => setActiveZoneId(zone.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-surface-50 border-primary ring-1 ring-primary shadow-subtle'
                      : 'bg-white border-border hover:border-surface-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-primary">{zone.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] uppercase font-medium bg-surface-100 text-secondary rounded">
                        {zone.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone.id);
                        }}
                        className="text-secondary hover:text-red-600 transition-colors p-1"
                        title="Remove Zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-secondary mb-2 line-clamp-2">
                    {zone.description || 'Configurable architectural surface.'}
                  </p>

                  {/* Attached meshes tags */}
                  <div className="flex flex-wrap gap-1">
                    {zone.meshNames.map((meshName) => (
                      <span
                        key={meshName}
                        className="px-2 py-0.5 text-[10px] font-mono bg-white border border-border/80 rounded text-secondary"
                      >
                        {meshName}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-surface-50 border-t border-border text-[11px] text-secondary text-center">
            Click any mesh on the 3D model to inspect its zone mapping
          </div>
        </aside>
      </div>
    </div>
  );
}
