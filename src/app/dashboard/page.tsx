'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/project-store';
import { useAuthStore } from '@/lib/auth-store';
import { MATERIAL_LIBRARY } from '@/lib/materials';
import { useMaterialsStore } from '@/lib/materials-store';
import { UploadMaterialModal } from '@/components/dashboard/UploadMaterialModal';
import { MaterialOption } from '@/types';
import { ModelThumbnailPreview } from '@/components/dashboard/ModelThumbnailPreview';
import { SkpLibraryView } from '@/components/dashboard/SkpLibraryView';
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
  LogOut,
  User as UserIcon,
  UploadCloud,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, logout, syncSession } = useAuthStore();
  const projects = useProjectStore((s) => s.projects);
  const isLoadingProjects = useProjectStore((s) => s.isLoading);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  // Protect route: Redirect to login if explicitly not authenticated after initialization
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !user) {
      router.replace('/login');
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'materials' | 'skp-library'>('projects');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'skp-library' || tab === 'uploads') {
        setActiveTab('skp-library');
      } else if (tab === 'materials') {
        setActiveTab('materials');
      }
    }
  }, []);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const customMaterials = useMaterialsStore((s) => s.customMaterials);
  const fetchCustomMaterials = useMaterialsStore((s) => s.fetchCustomMaterials);
  const deleteCustomMaterial = useMaterialsStore((s) => s.deleteCustomMaterial);

  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState(false);
  const [materialFilterCategory, setMaterialFilterCategory] = useState<string>('all');
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialToDelete, setMaterialToDelete] = useState<MaterialOption | null>(null);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [materialNotice, setMaterialNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomMaterials();
  }, [fetchCustomMaterials]);

  const allDisplayMaterials = React.useMemo(() => {
    const seen = new Set<string>();
    const list: MaterialOption[] = [];
    for (const m of [...customMaterials, ...MATERIAL_LIBRARY]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        list.push(m);
      }
    }
    return list;
  }, [customMaterials]);

  const filteredMaterials = React.useMemo(() => {
    return allDisplayMaterials.filter((mat) => {
      if (materialFilterCategory === 'custom' && !mat.isCustomUpload) return false;
      if (
        materialFilterCategory !== 'all' &&
        materialFilterCategory !== 'custom' &&
        mat.category !== materialFilterCategory
      ) {
        return false;
      }
      if (materialSearch.trim()) {
        const q = materialSearch.toLowerCase();
        return (
          mat.name.toLowerCase().includes(q) ||
          mat.category.toLowerCase().includes(q) ||
          (mat.description && mat.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allDisplayMaterials, materialFilterCategory, materialSearch]);

  const handleConfirmDeleteMaterial = async () => {
    if (!materialToDelete) return;
    setIsDeletingMaterial(true);
    try {
      await deleteCustomMaterial(materialToDelete.id);
      setMaterialNotice(`Material "${materialToDelete.name}" berhasil dihapus.`);
      setTimeout(() => setMaterialNotice(null), 3500);
      setMaterialToDelete(null);
    } catch (err) {
      console.error('Failed to delete custom material:', err);
    } finally {
      setIsDeletingMaterial(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProjects(user.id);
    } else {
      fetchProjects();
    }
  }, [fetchProjects, user?.id]);

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

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id, user?.id);
      setDeleteNotice(`Model "${projectToDelete.name}" berhasil dihapus secara permanen.`);
      setTimeout(() => setDeleteNotice(null), 4000);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Failed to permanently delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = user?.name || (isInitialized ? 'Super Admin Architect' : 'Memuat profil...');
  const displayStudio = user?.studioName || 'HomeCraft 3D Studio';
  const displayRole = user?.role || 'Administrator & Principal Architect';
  const displayAvatar = user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD');

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
          <div className="h-4 w-px bg-border mx-1" />

          <button className="p-2 text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 bg-surface-50 hover:bg-surface-100 border border-border rounded-xl transition-all"
            >
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-primary block leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-secondary font-mono block leading-tight">
                  {displayStudio.split(' ')[0]}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {displayAvatar}
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-border rounded-2xl shadow-float p-3 z-50">
                <div className="p-2 border-b border-border mb-2">
                  <span className="text-xs font-bold text-primary block">{displayName}</span>
                  <span className="text-[11px] text-secondary block font-mono">{user?.email || 'admin@homecraft3d.com'}</span>
                  <span className="text-[10px] text-accent-warm font-semibold block mt-1">{displayRole}</span>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-50 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Public Landing Page</span>
                  </Link>

                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                      router.push('/login');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Left Sidebar Navigation */}
        <aside className="w-56 shrink-0 hidden md:block">
          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all mb-1 ${
              activeTab === 'projects'
                ? 'bg-white text-primary border border-border shadow-subtle'
                : 'text-secondary hover:text-primary hover:bg-surface-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Architectural Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('skp-library')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all mb-1 ${
              activeTab === 'skp-library'
                ? 'bg-white text-primary border border-border shadow-subtle'
                : 'text-secondary hover:text-primary hover:bg-surface-100'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>SKP File Library</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all ${
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
            <div className="text-xl font-bold text-primary mb-1">
              {isLoadingProjects && projects.length === 0 ? '...' : `${projects.length} Models`}
            </div>
            <p className="text-[11px] text-secondary leading-snug">
              Interactive 3D configurators published & accessible to buyers.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-border mt-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary block mb-1">
              Studio Identity
            </span>
            <div className="text-xs font-bold text-primary mb-0.5 truncate">
              {displayStudio}
            </div>
            <p className="text-[11px] text-secondary font-mono truncate">
              {displayName}
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-surface-100 text-[10px] font-mono text-secondary">
              {displayRole}
            </span>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0">
          {/* Deletion Toast Banner */}
          {deleteNotice && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-subtle transition-all">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deleteNotice}</span>
              </div>
              <button
                onClick={() => setDeleteNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-0.5"
              >
                Tutup
              </button>
            </div>
          )}

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('skp-library')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-secondary hover:text-primary bg-white hover:bg-surface-50 border border-border rounded-xl transition-colors shadow-subtle"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>SKP File Library</span>
                  </button>

                  <Link
                    href="/projects/new"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-subtle"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Model</span>
                  </Link>
                </div>
              </div>

              {/* Projects Grid */}
              {isLoadingProjects && projects.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-border p-5 animate-pulse">
                      <div className="w-full h-48 bg-surface-100 rounded-xl mb-4" />
                      <div className="h-4 bg-surface-100 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-surface-100 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-12 text-center">
                  <Box className="w-10 h-10 text-secondary mx-auto mb-3 opacity-50" />
                  <h3 className="text-sm font-semibold text-primary mb-1">Belum Ada Model 3D</h3>
                  <p className="text-xs text-secondary mb-4">
                    Unggah file CAD/BIM (.glb, .skp, .gltf) untuk memulai studio interaktif.
                  </p>
                  <Link
                    href="/projects/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Model Baru</span>
                  </Link>
                </div>
              ) : (
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
                            <button
                              onClick={() => setProjectToDelete(p)}
                              title="Hapus Model 3D Permanen"
                              className="p-1.5 text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive 3D Model Rendering Canvas */}
                        <div className="w-full h-48 rounded-xl bg-surface-50 border border-border/80 overflow-hidden mb-4 relative group/canvas">
                          <ModelThumbnailPreview
                            project={p}
                          />
                        </div>

                        {/* Project Info */}
                        <h3 className="text-sm font-bold text-primary mb-1 group-hover:text-primary-hover transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-xs text-secondary font-medium mb-2">{p.clientName}</p>
                        <p className="text-xs text-secondary/80 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-secondary">
                            {p.zones?.length || 0} Zones
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${p.id}/editor`}
                            className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-lg transition-colors"
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
              )}
            </>
          ) : activeTab === 'skp-library' ? (
            <SkpLibraryView />
          ) : (
            /* Materials Library Tab */
            <div className="space-y-6">
              {/* Header & Upload Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-primary">Architectural PBR Materials</h2>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-primary/10 text-primary rounded-full">
                      {allDisplayMaterials.length} Materials
                    </span>
                    {customMaterials.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded-full">
                        {customMaterials.length} Custom Uploads
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">
                    Katalog material PBR berkalibrasi fisik untuk dinding, lantai, keramik, dan atap. File tekstur kustom yang di-upload otomatis tersedia di sidebar 3D Configurator.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsUploadMaterialOpen(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-subtle hover:shadow transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Upload Material PBR</span>
                </button>
              </div>

              {/* Notification Banner */}
              {materialNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-subtle animate-in fade-in duration-200">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{materialNotice}</span>
                </div>
              )}

              {/* Filter & Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'custom', label: `Khusus Kustom (${customMaterials.length})` },
                    { id: 'wall', label: 'Dinding & Fasad' },
                    { id: 'floor', label: 'Lantai' },
                    { id: 'bathroom', label: 'Keramik & Tiles' },
                    { id: 'roof', label: 'Atap' },
                    { id: 'exterior', label: 'Eksterior' },
                    { id: 'door', label: 'Pintu' },
                  ].map((cat) => {
                    const isSelected = materialFilterCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMaterialFilterCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white shadow-subtle'
                            : 'bg-white border border-border text-secondary hover:text-primary hover:bg-surface-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search Input */}
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama material / tekstur..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-border rounded-xl text-primary focus:outline-none focus:border-primary placeholder:text-secondary/60"
                  />
                </div>
              </div>

              {/* Materials Grid */}
              {filteredMaterials.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-border shadow-subtle text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-100 text-secondary flex items-center justify-center mx-auto mb-3">
                    <Palette className="w-6 h-6 opacity-60" />
                  </div>
                  <h3 className="text-sm font-semibold text-primary mb-1">
                    Tidak ada material yang sesuai
                  </h3>
                  <p className="text-xs text-secondary max-w-sm mx-auto mb-4">
                    {materialFilterCategory === 'custom'
                      ? 'Belum ada material kustom yang diunggah. Klik tombol di bawah untuk mengunggah tekstur keramik atau dinding Anda.'
                      : 'Coba ubah kata kunci pencarian atau kategori filter Anda.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUploadMaterialOpen(true)}
                    className="px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Material Baru</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMaterials.map((mat) => {
                    const isTextured = mat.type === 'texture' && Boolean(mat.previewThumbnail || mat.textureUrl);
                    const repeatX = mat.repeat?.[0] || 4;

                    return (
                      <div
                        key={mat.id}
                        className={`group p-3.5 bg-white rounded-2xl border transition-all relative flex flex-col justify-between ${
                          mat.isCustomUpload
                            ? 'border-emerald-200/80 hover:border-emerald-400 hover:shadow-subtle'
                            : 'border-border hover:border-surface-400 hover:shadow-subtle'
                        }`}
                      >
                        <div>
                          {/* Visual Swatch / Texture Preview */}
                          <div
                            className="w-full h-24 rounded-xl mb-3 border border-border/80 overflow-hidden relative shadow-inner bg-surface-100 flex items-center justify-center"
                            style={{
                              backgroundColor: mat.color || '#E5E7EB',
                            }}
                          >
                            {isTextured ? (
                              <div
                                className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                                style={{
                                  backgroundImage: `url(${mat.previewThumbnail || mat.textureUrl})`,
                                  backgroundSize: `${100 / Math.min(repeatX, 3)}% ${100 / Math.min(repeatX, 3)}%`,
                                  backgroundRepeat: 'repeat',
                                }}
                              />
                            ) : null}

                            {/* Badge */}
                            {mat.isCustomUpload ? (
                              <span className="absolute top-2 left-2 text-[9px] font-mono uppercase px-1.5 py-0.5 bg-emerald-600 text-white font-bold rounded shadow-subtle flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Custom PBR</span>
                              </span>
                            ) : mat.tag ? (
                              <span className="absolute top-2 left-2 text-[9px] font-mono uppercase px-1.5 py-0.5 bg-black/60 text-white font-semibold rounded backdrop-blur-sm">
                                {mat.tag}
                              </span>
                            ) : null}

                            {/* Delete Button for Custom Material */}
                            {mat.isCustomUpload && (
                              <button
                                type="button"
                                title="Hapus Material Kustom"
                                onClick={() => setMaterialToDelete(mat)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-white/90 hover:bg-red-50 text-secondary hover:text-red-600 flex items-center justify-center shadow-subtle opacity-80 group-hover:opacity-100 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Finish Label */}
                            <span className="absolute bottom-2 right-2 text-[8px] font-mono uppercase px-1.5 py-0.2 bg-black/50 text-white/90 rounded backdrop-blur-sm">
                              {mat.finish}
                            </span>
                          </div>

                          {/* Info */}
                          <h4 className="text-xs font-bold text-primary truncate block leading-tight mb-0.5" title={mat.name}>
                            {mat.name}
                          </h4>
                          <span className="text-[10px] text-secondary font-mono block uppercase">
                            {mat.category}
                          </span>
                        </div>

                        {mat.description && (
                          <p className="text-[10px] text-secondary/80 line-clamp-2 mt-2 leading-relaxed">
                            {mat.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal: Delete Project */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-primary mb-2">
              Hapus Model 3D Permanen?
            </h3>
            <p className="text-xs text-secondary leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus model <strong className="text-primary font-semibold">{projectToDelete.name}</strong>? Tindakan ini menghapus file fisik di storage dan data di database secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Custom PBR Material Modal */}
      <UploadMaterialModal
        isOpen={isUploadMaterialOpen}
        onClose={() => setIsUploadMaterialOpen(false)}
        onSuccess={(result) => {
          const list = Array.isArray(result) ? result : [result];
          const label = list.length > 1 ? `${list.length} material tekstur` : `Material "${list[0]?.name}"`;
          setMaterialNotice(`${label} berhasil diunggah dan disimpan ke library!`);
          setTimeout(() => setMaterialNotice(null), 4000);
        }}
      />

      {/* Confirmation Modal: Delete Custom Material */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-primary mb-2">
              Hapus Material PBR Kustom?
            </h3>
            <p className="text-xs text-secondary leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus material <strong className="text-primary font-semibold">{materialToDelete.name}</strong>? File tekstur dan pengaturannya akan dihapus dari katalog PBR dan tidak akan muncul lagi di 3D Configurator.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                disabled={isDeletingMaterial}
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingMaterial}
                onClick={handleConfirmDeleteMaterial}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingMaterial ? 'Menghapus...' : 'Ya, Hapus Material'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
