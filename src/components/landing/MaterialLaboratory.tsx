'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Layers, Sliders, Check, Palette, ShieldCheck } from 'lucide-react';

interface MaterialSpec {
  id: string;
  name: string;
  category: string;
  colorHex: string;
  roughness: number;
  metalness: number;
  origin: string;
  application: string;
  description: string;
  textureType: string;
}

const SPEC_MATERIALS: MaterialSpec[] = [
  {
    id: 'marble-carrara',
    name: 'Statuario Carrara Marble',
    category: 'Natural Stone',
    colorHex: '#F4F4F2',
    roughness: 0.12,
    metalness: 0.05,
    origin: 'Carrara Quarries, Tuscany, Italy',
    application: 'Living room flooring, kitchen islands, luxury ensuite partitions',
    description: 'Polished white crystalline marble with delicate grey feather veining and high specular reflectivity.',
    textureType: 'High-Res Seamless PBR Normal & Albedo',
  },
  {
    id: 'wood-oak',
    name: 'Nordic White Oak Parquet',
    category: 'Architectural Timber',
    colorHex: '#D4B996',
    roughness: 0.55,
    metalness: 0.0,
    origin: 'Sustainably Harvested Nordic Forests',
    application: 'Continuous residential flooring, feature wall battens, cabinetry',
    description: 'Wire-brushed European white oak finished with non-toxic matte lacquer preserving authentic grain relief.',
    textureType: 'Procedural Wood Grain + 4K Displacement',
  },
  {
    id: 'stone-travertine',
    name: 'Honed Roman Travertine',
    category: 'Porous Sedimentary Stone',
    colorHex: '#E0D4C3',
    roughness: 0.72,
    metalness: 0.0,
    origin: 'Tivoli, Central Italy',
    application: 'Terrace decks, bath vanities, outdoor feature facades',
    description: 'Cross-cut beige travertine with filled pores, soft tactile matte finish, and warm light diffusion.',
    textureType: 'Physical PBR Micro-Surface Relief',
  },
  {
    id: 'metal-corten',
    name: 'Oxidized Corten Steel',
    category: 'Architectural Alloy',
    colorHex: '#8C4E2B',
    roughness: 0.88,
    metalness: 0.35,
    origin: 'Recycled Structural Steel Facility',
    application: 'Exterior cantilever cladding, louvers, landscape planters',
    description: 'Atmospheric weathering steel with natural velvety rust patina that stabilizes against weather corrosion.',
    textureType: 'Atmospheric Micro-Grain Specular Map',
  },
  {
    id: 'wood-shousugi',
    name: 'Charred Shou Sugi Ban Cedar',
    category: 'Carbonized Timber',
    colorHex: '#1F1F21',
    roughness: 0.78,
    metalness: 0.08,
    origin: 'Okayama Prefecture, Japan',
    application: 'Exterior villa siding, accent entryways, meditation screens',
    description: 'Traditional Japanese Yakisugi method of flame-treating Japanese cedar for deep soot luster and termite resistance.',
    textureType: 'Deep Carbon Fissure Normal Mapping',
  },
];

export function MaterialLaboratory() {
  const [selectedMat, setSelectedMat] = useState<MaterialSpec>(SPEC_MATERIALS[0]);

  return (
    <section id="materials" className="py-24 px-6 md:px-12 bg-[#F7F7F5] border-t border-[#E8E8E5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E8E5] text-[11px] font-mono font-medium text-[#6B6B6B] mb-3 shadow-subtle">
            <Palette className="w-3.5 h-3.5 text-[#C28448]" />
            <span>PBR PHYSICAL FINISH SPECIFIER</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#171717]">
            Architectural Material Laboratory
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-2 leading-relaxed">
            Every material in Mitra Megah Interior is physically calibrated with genuine micro-surface roughness, specular reflectance, and normal maps to ensure exact physical realism under changing daylight.
          </p>
        </div>

        {/* Interactive Lab Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Material Selector List (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[10px] uppercase font-mono font-bold text-[#A3A39E] tracking-wider block mb-2">
              Select Finish to Inspect:
            </span>

            {SPEC_MATERIALS.map((mat) => {
              const isSelected = selectedMat.id === mat.id;
              return (
                <motion.div
                  key={mat.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedMat(mat)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-white border-[#171717] shadow-float'
                      : 'bg-white/60 hover:bg-white border-[#E8E8E5]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Material Color / Texture Indicator Circle */}
                    <div
                      className="w-10 h-10 rounded-xl border border-black/10 shadow-inner flex items-center justify-center shrink-0"
                      style={{ backgroundColor: mat.colorHex }}
                    >
                      {isSelected && (
                        <Check
                          className={`w-4 h-4 ${
                            mat.colorHex === '#1F1F21' ? 'text-white' : 'text-[#171717]'
                          }`}
                        />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-[#171717] leading-tight">{mat.name}</h4>
                      <span className="text-[11px] font-mono text-[#6B6B6B]">{mat.category}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px] text-[#A3A39E]">
                    <span>R: {(mat.roughness * 100).toFixed(0)}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column: Detailed Architectural Spec Sheet (7 Cols) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl border border-[#DCDCD7] p-8 md:p-10 shadow-panel relative overflow-hidden"
              >
                {/* Decorative Swatch Header Band */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#E8E8E5] gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-[#F5F5F3] border border-[#E8E8E5] text-[10px] font-mono font-medium text-[#6B6B6B]">
                        SPEC #{selectedMat.id.toUpperCase()}
                      </span>
                      <span className="text-xs text-[#A3A39E] font-mono">• {selectedMat.origin}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#171717] tracking-tight">
                      {selectedMat.name}
                    </h3>
                  </div>

                  {/* Visual Swatch Pill */}
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F7F7F5] rounded-2xl border border-[#E8E8E5] self-start sm:self-auto">
                    <div
                      className="w-5 h-5 rounded-lg border border-black/10 shadow-sm"
                      style={{ backgroundColor: selectedMat.colorHex }}
                    />
                    <span className="font-mono text-xs font-semibold text-[#171717]">
                      {selectedMat.colorHex}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[#4A4A46] leading-relaxed mb-8">
                  {selectedMat.description}
                </p>

                {/* Calibrated Physical Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5]">
                    <span className="text-[10px] uppercase font-mono text-[#A3A39E] block mb-1">
                      Surface Roughness
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold font-mono text-[#171717]">
                        {(selectedMat.roughness * 100).toFixed(0)}%
                      </span>
                      <span className="text-[11px] text-[#6B6B6B]">
                        {selectedMat.roughness < 0.25 ? 'Glossy' : selectedMat.roughness < 0.6 ? 'Satin' : 'Matte'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5]">
                    <span className="text-[10px] uppercase font-mono text-[#A3A39E] block mb-1">
                      Specular Metalness
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold font-mono text-[#171717]">
                        {(selectedMat.metalness * 100).toFixed(0)}%
                      </span>
                      <span className="text-[11px] text-[#6B6B6B]">
                        {selectedMat.metalness > 0.2 ? 'Metallic' : 'Dielectric'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5] col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-mono text-[#A3A39E] block mb-1">
                      Shader Pipeline
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold font-mono text-[#C28448]">PBR Metallic-Rough</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Typology Application */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EDE8DD] mb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#C28448]" />
                    <span className="text-xs font-semibold text-[#171717]">Recommended Architectural Placement</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">
                    {selectedMat.application}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E8E8E5]">
                  <span className="text-xs font-mono text-[#A3A39E]">
                    Available in WebGL Configurator
                  </span>
                  <Link
                    href="/configurator/house-001"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#C28448] transition-colors"
                  >
                    <span>Test on 3D Villa Model</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
