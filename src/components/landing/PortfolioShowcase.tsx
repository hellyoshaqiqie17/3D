'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { DEMO_PROJECTS } from '@/lib/demo-project';
import { ModelThumbnailPreview } from '@/components/dashboard/ModelThumbnailPreview';
import { ArrowRight, Eye, Layers, Compass, ExternalLink, MapPin, Maximize2 } from 'lucide-react';

interface ShowcaseProject {
  id: string;
  name: string;
  category: 'residential' | 'pavilion' | 'commercial';
  location: string;
  area: string;
  year: string;
  description: string;
  modelUrl: string;
  zonesCount: number;
  highlightMaterial: string;
}

const SHOWCASE_ITEMS: ShowcaseProject[] = [
  {
    id: 'house-001',
    name: 'Modern Pavilion Villa',
    category: 'residential',
    location: 'Kyoto Prefecture, Japan',
    area: '340 m²',
    year: '2026',
    description: 'Single-storey contemporary villa with panoramic floor-to-ceiling glass, terrace patio, and 9 customizable material zones.',
    modelUrl: '/models/modern-villa.glb',
    zonesCount: 9,
    highlightMaterial: 'Carrara Marble & Natural Oak',
  },
  {
    id: 'studio-002',
    name: 'Nordic Minimalist Studio',
    category: 'pavilion',
    location: 'Bergen Coastal Fjord, Norway',
    area: '85 m²',
    year: '2026',
    description: 'Compact architectural guest pavilion with polished microcement surfaces, dark accents, and private Japanese bath garden.',
    modelUrl: '/models/minimalist-studio.glb',
    zonesCount: 7,
    highlightMaterial: 'Honed Travertine & Raw Concrete',
  },
  {
    id: 'villa-alpine',
    name: 'Alpine Cantilever Residence',
    category: 'residential',
    location: 'Engadin Valley, Switzerland',
    area: '480 m²',
    year: '2025',
    description: 'Cantilevered mountain home featuring charred Shou Sugi Ban cedar cladding, solar triple-glazing, and basalt stone fireplace.',
    modelUrl: '/models/modern-villa.glb',
    zonesCount: 8,
    highlightMaterial: 'Charred Shou Sugi Ban & Slate',
  },
  {
    id: 'pavilion-zen',
    name: 'Kyoto Tea Pavilion & Gallery',
    category: 'commercial',
    location: 'Arashiyama, Kyoto',
    area: '210 m²',
    year: '2025',
    description: 'Parametric timber lattice pavilion celebrating light filtration, hinoki cypress flooring, and hammered bronze fixtures.',
    modelUrl: '/models/minimalist-studio.glb',
    zonesCount: 6,
    highlightMaterial: 'Hinoki Cypress & Brushed Bronze',
  },
];

export function PortfolioShowcase() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'residential' | 'pavilion' | 'commercial'>('all');

  const filteredProjects = SHOWCASE_ITEMS.filter((item) =>
    activeFilter === 'all' ? true : item.category === activeFilter
  );

  return (
    <section id="portfolio" className="py-24 px-6 md:px-12 bg-white border-t border-[#E8E8E5] relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F3] border border-[#E8E8E5] text-[11px] font-mono font-medium text-[#6B6B6B] mb-3">
              <Compass className="w-3.5 h-3.5 text-[#C28448]" />
              <span>CURATED ARCHITECTURAL COMMISSIONS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#171717]">
              Interactive Spatial Typologies
            </h2>
            <p className="text-sm text-[#6B6B6B] mt-2 max-w-xl">
              Select any architectural model below to inspect parametric zones, rotate geometries, and swap materials in real time.
            </p>
          </div>

          {/* Filter Pills with Motion */}
          <div className="mt-6 md:mt-0 flex items-center gap-1.5 p-1 bg-[#F5F5F3] rounded-xl border border-[#E8E8E5] overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Typologies' },
                { id: 'residential', label: 'Residential' },
                { id: 'pavilion', label: 'Pavilions' },
                { id: 'commercial', label: 'Gallery & Cultural' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
                  activeFilter === tab.id
                    ? 'text-[#171717] font-semibold'
                    : 'text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                {activeFilter === tab.id && (
                  <motion.div
                    layoutId="portfolioFilterPill"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute inset-0 bg-white rounded-lg shadow-subtle border border-[#E8E8E5]"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative rounded-2xl md:rounded-3xl border border-[#E8E8E5] bg-[#F7F7F5] overflow-hidden hover:border-[#171717] transition-all duration-300 flex flex-col justify-between"
              >
                {/* Visual Thumbnail Frame */}
                <div className="relative aspect-[16/10] bg-[#EBEBE7] overflow-hidden border-b border-[#E8E8E5]">
                  <Link
                    href={`/configurator/${project.id === 'villa-alpine' ? 'house-001' : project.id === 'pavilion-zen' ? 'studio-002' : project.id}`}
                    className="block w-full h-full cursor-pointer"
                  >
                    <ModelThumbnailPreview
                      project={
                        project.id === 'studio-002' || project.id === 'pavilion-zen'
                          ? DEMO_PROJECTS[1]
                          : DEMO_PROJECTS[0]
                      }
                    />
                  </Link>

                  {/* Corner Architectural Spec Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-mono font-semibold text-[#171717] border border-black/5 shadow-sm">
                      {project.area}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono text-white">
                      {project.year}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-mono text-[#6B6B6B] flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#C28448]" />
                      <span>{project.zonesCount} Zones</span>
                    </span>
                  </div>

                  {/* Hover Overlay Prompt */}
                  <div className="absolute inset-0 bg-[#171717]/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-2 bg-white text-[#171717] rounded-xl text-xs font-semibold shadow-panel flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Launch Spatial Configurator</span>
                    </div>
                  </div>
                </div>

                {/* Card Information */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#A3A39E] mb-2">
                      <MapPin className="w-3 h-3 text-[#C28448]" />
                      <span>{project.location}</span>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-[#171717] group-hover:text-[#C28448] transition-colors mb-2">
                      {project.name}
                    </h3>

                    <p className="text-xs text-[#6B6B6B] leading-relaxed mb-5 font-normal">
                      {project.description}
                    </p>
                  </div>

                  <div>
                    {/* Material Finishes Tag */}
                    <div className="p-3 rounded-xl bg-[#F5F5F3] border border-[#E8E8E5] mb-5 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-[#6B6B6B]">Key Materiality:</span>
                      <span className="font-medium text-[#171717] text-xs">{project.highlightMaterial}</span>
                    </div>

                    {/* Launch Button */}
                    <Link
                      href={`/configurator/${project.id === 'villa-alpine' ? 'house-001' : project.id === 'pavilion-zen' ? 'studio-002' : project.id}`}
                      className="w-full py-2.5 px-4 bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-subtle group-hover:shadow-md"
                    >
                      <span>Open in 3D Configurator</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
