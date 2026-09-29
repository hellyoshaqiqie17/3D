'use client';

import React from 'react';
import Link from 'next/link';
import { InteractiveHeroViewer } from '@/components/landing/InteractiveHeroViewer';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Box,
  Eye,
  Share2,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-primary flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Top Navbar */}
      <nav className="h-20 px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm tracking-wider">
            HC
          </div>
          <span className="font-semibold text-sm tracking-tight text-primary">
            HOMECRAFT <span className="font-normal text-secondary">3D</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-secondary">
          <a href="#pipeline" className="hover:text-primary transition-colors">Pipeline</a>
          <a href="#features" className="hover:text-primary transition-colors">Material System</a>
          <a href="#showcase" className="hover:text-primary transition-colors">Showcase</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-100 rounded-xl transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/configurator/house-001"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-colors"
          >
            <span>Launch Configurator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-border text-[11px] font-medium text-secondary mb-6 shadow-subtle">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Web 3D for Modern Architecture</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary leading-[1.1] mb-6">
            Interactive 3D Home Visualization
          </h1>

          <p className="text-base md:text-lg text-secondary leading-relaxed mb-8">
            Present your architectural designs and let customers customize their future home in real time.
            Swap wall colors, floor timbers, and ceramic tiles seamlessly in the browser.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-6 py-3 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-subtle transition-all"
            >
              <span>Create Project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/configurator/house-001"
              className="flex items-center gap-2 px-6 py-3 text-xs font-medium text-primary bg-white hover:bg-surface-50 border border-border rounded-xl shadow-subtle transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Explore Live Demo</span>
            </Link>
          </div>
        </div>

        {/* Embedded Interactive 3D Hero Model */}
        <InteractiveHeroViewer />
      </section>

      {/* Pipeline Section */}
      <section id="pipeline" className="py-20 px-6 md:px-12 border-t border-border bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary block mb-2">
              The Architecture Workflow
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
              From CAD Export to Customer Experience in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-surface-50 border border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary mb-4 font-mono font-bold text-xs">
                  01
                </div>
                <h3 className="text-sm font-semibold text-primary mb-2">3D Model Export</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Export standard GLB/GLTF geometry from Revit, Rhino, SketchUp, Blender, or Archicad.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-50 border border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary mb-4 font-mono font-bold text-xs">
                  02
                </div>
                <h3 className="text-sm font-semibold text-primary mb-2">Detect Material Zones</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Inspect meshes in the admin editor and map them to Exterior Wall, Flooring, or Bathroom Tile zones.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-50 border border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary mb-4 font-mono font-bold text-xs">
                  03
                </div>
                <h3 className="text-sm font-semibold text-primary mb-2">PBR Real-Time Engine</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Apply oak parquet, Italian marble, custom paint colors, or glazed subway ceramics without page reloads.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-50 border border-border flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary mb-4 font-mono font-bold text-xs">
                  04
                </div>
                <h3 className="text-sm font-semibold text-primary mb-2">Share & Present</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Send reproducible customer URLs, capture high-res presentation renders, and export JSON material schedules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary block mb-2">
            Engineered for Architecture
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Every Detail Calibrated for Real Estate & Construction
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-7 bg-white rounded-2xl border border-border shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-primary mb-4">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-primary mb-2">Physically Based Materials</h3>
            <p className="text-xs text-secondary leading-relaxed">
              True roughness, reflectance, and normal relief mapping ensure timber grain and marble veining react authentically to lighting.
            </p>
          </div>

          <div className="p-7 bg-white rounded-2xl border border-border shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-primary mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-primary mb-2">Architectural Camera Presets</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Preset views for Living Room, Ensuite Bathroom, Exterior Hero, and Top-down plan view with smooth camera interpolation.
            </p>
          </div>

          <div className="p-7 bg-white rounded-2xl border border-border shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-primary mb-4">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-primary mb-2">Reproducible Customer URLs</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Home buyers can save their customized home design and share the exact configuration link with your sales team.
            </p>
          </div>
        </div>
      </section>

      {/* Models Showcase */}
      <section id="showcase" className="py-20 px-6 md:px-12 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary block mb-2">
                Curated Architecture
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
                Explore Demo Models
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="mt-4 md:mt-0 text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View Architect Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl border border-border bg-[#F7F7F5] flex flex-col justify-between">
              <div>
                <div className="aspect-[16/10] bg-white rounded-xl border border-border/80 flex items-center justify-center mb-5">
                  <Box className="w-10 h-10 text-secondary/70 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-semibold text-primary mb-1">Modern Pavilion Villa</h3>
                <p className="text-xs text-secondary mb-4">
                  Single-storey luxury pavilion featuring floor-to-ceiling glass, terrace patio, and 9 customizable material zones.
                </p>
              </div>
              <Link
                href="/configurator/house-001"
                className="w-full py-2.5 bg-primary text-white text-xs font-medium rounded-xl text-center hover:bg-primary-hover transition-colors"
              >
                Launch Configurator
              </Link>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-[#F7F7F5] flex flex-col justify-between">
              <div>
                <div className="aspect-[16/10] bg-white rounded-xl border border-border/80 flex items-center justify-center mb-5">
                  <Box className="w-10 h-10 text-secondary/70 stroke-[1.5]" />
                </div>
                <h3 className="text-base font-semibold text-primary mb-1">Nordic Minimalist Studio</h3>
                <p className="text-xs text-secondary mb-4">
                  Compact 85m² architectural guest pavilion with microcement surfaces, dark accent walls, and ensuite stone surfaces.
                </p>
              </div>
              <Link
                href="/configurator/studio-002"
                className="w-full py-2.5 bg-primary text-white text-xs font-medium rounded-xl text-center hover:bg-primary-hover transition-colors"
              >
                Launch Configurator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 md:px-12 border-t border-border bg-white text-xs text-secondary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">HOMECRAFT 3D</span>
            <span>•</span>
            <span>Commercial 3D Architectural Configurator Platform</span>
          </div>
          <p>© 2026 HomeCraft Architecture. Precision WebGL 3D Visualization.</p>
        </div>
      </footer>
    </div>
  );
}
