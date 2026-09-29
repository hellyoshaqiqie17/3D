'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProjectStore } from '@/lib/project-store';
import { MATERIAL_LIBRARY } from '@/lib/materials';
import {
  Plus,
  Search,
  ExternalLink,
  SlidersHorizontal,
  Box,
  Eye,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Share2,
  Copy,
  Check,
  LayoutDashboard,
  FolderKanban,
  Palette,
  Settings,
  Bell,
  Trash2,
} from 'lucide-react';

export default function DashboardPage() {
  const projects = useProjectStore((s) => s.projects);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'materials'>('projects');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = (projectId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/configurator/${projectId}`;
      navigator.clipboard.writeText(url);
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-white border-b border-border flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm tracking-wider">
              HC
            </div>
            <span className="font-semibold text-sm tracking-tight text-primary">
              HOMECRAFT <span className="font-normal text-secondary">STUDIO</span>
            </span>
          </Link>

          <div className="relative hidden md:block w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Search projects or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface-50 rounded-lg border border-border focus:outline-none focus:border-primary text-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New 3D Project</span>
          </Link>

          <div className="h-4 w-px bg-border mx-1" />

          <button className="p-2 text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
          </button>

          <div className="w-8 h-8 rounded-full bg-surface-200 border border-border flex items-center justify-center text-xs font-semibold text-primary">
            AL
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-8">
        {/* Left Navigation Sidebar */}
        <aside className="w-56 shrink-0 hidden md:flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all ${
              activeTab === 'projects'
                ? 'bg-white text-primary border border-border shadow-subtle'
                : 'text-secondary hover:text-primary hover:bg-surface-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Architectural Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all ${
              activeTab === 'materials'
                ? 'bg-white text-primary border border-border shadow-subtle'
                : 'text-secondary hover:text-primary hover:bg-surface-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>PBR Material Library</span>
          </button>

          <div className="my-3 border-t border-border" />

          <div className="p-4 bg-white rounded-xl border border-border">
            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block mb-1">
              Active Pipeline
            </span>
            <div className="text-xl font-bold text-primary mb-1">{projects.length} Models</div>
            <p className="text-[11px] text-secondary leading-snug">
              Interactive 3D configurators published & accessible to buyers.
            </p>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'projects' ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-primary">Architectural Projects</h2>
                  <p className="text-xs text-secondary">
                    Select a house to launch the buyer configurator or adjust material zones.
                  </p>
                </div>
                <Link
                  href="/projects/new"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-primary bg-white hover:bg-surface-50 border border-border rounded-xl transition-colors shadow-subtle"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Model</span>
                </Link>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-border shadow-subtle hover:shadow-float transition-all p-5 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Bar with Status and Actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary">
                            Live Configurator
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyLink(p.id)}
                            title="Copy customer link"
                            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors"
                          >
                            {copiedId === p.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <Link
                            href={`/projects/${p.id}/editor`}
                            title="Edit Material Zones"
                            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* 3D Visual Box */}
                      <div className="relative aspect-[16/9] w-full rounded-xl bg-surface-100 border border-border/80 flex flex-col items-center justify-center mb-4 overflow-hidden group-hover:border-primary/40 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-subtle flex items-center justify-center text-primary mb-2">
                          <Building2 className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <span className="text-[11px] font-mono text-secondary">
                          {p.modelUrl.split('/').pop()}
                        </span>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[9px] uppercase font-mono font-medium bg-black/60 backdrop-blur-sm text-white rounded">
                          GLB 3D
                        </div>
                      </div>

                      {/* Project Meta */}
                      <h3 className="text-sm font-semibold text-primary mb-1">{p.name}</h3>
                      <p className="text-xs text-secondary mb-3">{p.clientName}</p>
                      <p className="text-xs text-secondary/80 line-clamp-2 mb-4 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    {/* Footer Info & Configurator Button */}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-secondary text-[11px]">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{p.zones.length} Zones</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/projects/${p.id}/editor`}
                          className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors border border-border"
                        >
                          Zone Editor
                        </Link>
                        <Link
                          href={`/configurator/${p.id}`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-subtle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open 3D</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Materials Library Tab */
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-primary">Architectural PBR Materials</h2>
                <p className="text-xs text-secondary">
                  Pre-calibrated physically based materials applied across walls, floors, and tiles.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {MATERIAL_LIBRARY.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-3.5 bg-white rounded-xl border border-border shadow-subtle"
                  >
                    <div
                      className="w-full h-20 rounded-lg mb-2.5 border border-border/80 flex items-center justify-center"
                      style={{ backgroundColor: mat.color || '#E5E7EB' }}
                    >
                      {mat.tag && (
                        <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-black/60 text-white rounded">
                          {mat.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-primary block truncate">
                      {mat.name}
                    </span>
                    <span className="text-[10px] text-secondary uppercase font-medium">
                      {mat.category} • {mat.finish}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
