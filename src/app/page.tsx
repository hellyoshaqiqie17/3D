'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArchitecturalNavbar } from '@/components/landing/ArchitecturalNavbar';
import {
  CardTopNotch,
  HeroBottomNotch,
  BannerTopNotch,
  BannerBottomNotch,
} from '@/components/landing/ArchitecturalNotch';
import {
  ChevronRight,
} from 'lucide-react';

export default function ArchitecturalShowcasePage() {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  // Hero carousel slides featuring Mitra Megah Interior
  const heroSlides = [
    {
      image:
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Mitra Megah',
      headlineSerif: 'Interior',
      vitruviusQuote:
        'Harmoni kemewahan ruang, presisi material, dan kenyamanan fungsional berpadu sempurna dalam setiap karya interior modern.',
      definitionTitle: 'Filosofi Interior Kami:',
      definitionText:
        'Mewujudkan ruang hunian dan komersial eksklusif dengan keahlian pengerjaan tinggi, material premium, dan visualisasi 3D spasial interaktif.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Kemewahan &',
      headlineSerif: 'Kenyamanan',
      vitruviusQuote:
        'Kualitas tanpa kompromi: dari kurasi marmer alami, panel kayu arsitektural kustom, hingga tata pencahayaan yang memikat.',
      definitionTitle: 'Desain Kustom Spasial:',
      definitionText:
        'Personalisasi interior presisi tinggi yang disesuaikan secara khusus dengan karakter dan gaya hidup prestisius Anda.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Living',
      headlineSerif: 'Sanctuary',
      vitruviusQuote:
        'Menghadirkan suasana hunian yang hangat, menenangkan, sekaligus megah melalui sentuhan estetika interior kontemporer.',
      definitionTitle: 'Material Craftsmanship:',
      definitionText:
        'Pilihan marmer premium, parket kayu solid, dan finishing PBR realistis yang dapat disimulasikan secara interaktif.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Modernist',
      headlineSerif: 'Elegance',
      vitruviusQuote:
        'Kemitraan terpercaya untuk kebutuhan rancang bangun, renovasi total, dan pembuatan furnitur kustom berstandar tinggi.',
      definitionTitle: 'Mitra Megah Interior:',
      definitionText:
        'Konsultasikan proyek interior hunian, apartemen, atau ruang kantor Anda bersama tim perancang profesional kami.',
    },
  ];

  // Recent Projects - Mitra Megah Interior Portfolio
  const recentProjects = [
    {
      id: 'proj-1',
      title: 'Modern Luxury Penthouse Suite',
      location: 'SCBD, Jakarta Selatan',
      image:
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'proj-2',
      title: 'Grand Residence Living & Dining',
      location: 'Pondok Indah, Jakarta Selatan',
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'proj-3',
      title: 'Contemporary Luxury Villa Interior',
      location: 'Canggu, Bali',
      image:
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  // Architects & Designers Directory
  const architectsDirectory = [
    {
      name: 'Tim Desainer Mitra Megah Interior',
      specialty: '• Spesialis Konsep Interior Modern Kontemporer & Luxury Living',
      hasAvatar: true,
      avatarUrl: '/logo.png',
    },
    {
      name: 'Spatial Planner & Lighting Architect',
      specialty: '• Tata Ruang Fungsional, Ergonomi & Ambience Pencahayaan Arsitektural',
      hasAvatar: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Material & Finishing Specialist',
      specialty: '• Kurasi Marmer Alami, Custom Woodworking & High-End Finishes',
      hasAvatar: false,
    },
  ];

  // Case studies
  const caseStudies = [
    {
      title: 'Transformasi Luxury Master Bedroom & Walk-in Closet',
      description:
        'Optimalisasi tata ruang kamar utama dengan panel kayu oak bertekstur, pencahayaan LED tersembunyi, dan walk-in wardrobe elegan bernuansa mewah.',
      image:
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Open-Concept Living & Dining Room Pavilion',
      description:
        'Penggabungan ruang keluarga dan ruang makan bergaya kontemporer dengan finishing marmer carrara dan sofa kustom berdimensi presisi.',
      image:
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const currentSlide = heroSlides[activeHeroSlide];

  return (
    <div className="min-h-screen bg-[#5D2E21] text-[#171717] font-sans antialiased selection:bg-[#C28448] selection:text-white flex flex-col">
      {/* 
        ========================================================================
        TERRACOTTA FRAMED HERO AREA (Matching Image 1 Top Section)
        ========================================================================
      */}
      <div className="p-3 sm:p-5 lg:p-7">
        <div className="relative rounded-[32px] sm:rounded-[44px] lg:rounded-[52px] overflow-hidden bg-[#1E1E1E] text-white min-h-[640px] sm:min-h-[720px] lg:min-h-[780px] flex flex-col justify-between shadow-2xl border border-white/10">
          {/* Background Photography: Cinematic Twilight Villa (Always Clean & Visible) */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              key={currentSlide.image}
              src={currentSlide.image}
              alt="Architectural Atelier Twilight Residence"
              className="w-full h-full object-cover object-center select-none transition-opacity duration-700"
            />
            {/* Atmospheric architectural dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 pointer-events-none" />
          </div>

          {/* Integrated Mitra Megah Interior Header Navigation */}
          <ArchitecturalNavbar />

          {/* Hero Main Content */}
          <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-8 sm:py-12 flex flex-col justify-between flex-grow">
            {/* Top-left Vitruvius Quote */}
            <div className="max-w-md pt-4">
              <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed font-normal tracking-wide">
                {currentSlide.vitruviusQuote}
              </p>
            </div>

            {/* Monumental Headline: "Building Beyond" */}
            <div className="my-auto py-12 sm:py-16">
              <div>
                {/* Word 1: Bold Sans */}
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[108px] font-bold text-white tracking-tight leading-[0.92] uppercase sm:normal-case">
                  {currentSlide.headlineSans}
                </h1>

                {/* Word 2: Elegant Italic Serif + Contact CTA */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-7 mt-1 sm:mt-2">
                  <span className="text-6xl sm:text-7xl md:text-8xl lg:text-[108px] font-serif italic font-normal text-white tracking-normal leading-[0.92]">
                    {currentSlide.headlineSerif}
                  </span>

                  <a
                    href="#contact"
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md border border-white/30 text-white text-xs font-semibold tracking-wider transition-all shadow-xl hover:border-white/60 group"
                  >
                    <span>Contact us</span>
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom-right Architectural Definition */}
            <div className="max-w-sm sm:max-w-md ml-auto text-left">
              <h3 className="text-sm font-bold text-white tracking-wide">
                {currentSlide.definitionTitle}
              </h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {currentSlide.definitionText}
              </p>
            </div>
          </div>

          {/* Signature Scalloped Notch on Bottom of Hero */}
          <div className="relative z-10 w-full">
            <HeroBottomNotch fillColor="#5D2E21" />
          </div>
        </div>

        {/* Carousel Pagination Dots beneath Hero Frame (4 dots matching Image 1) */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveHeroSlide(idx)}
              title={`Slide ${idx + 1}`}
              className={`transition-all duration-300 ${
                activeHeroSlide === idx
                  ? 'w-7 h-2 rounded-full bg-white shadow-sm'
                  : 'w-2 h-2 rounded-full bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 
        ========================================================================
        WHITE STUDIO PRESENTATION CANVAS (Sections 2 to 6)
        ========================================================================
      */}
      <main className="bg-[#FFFFFF] text-[#171717] rounded-t-[36px] sm:rounded-t-[48px] px-6 sm:px-12 lg:px-20 py-16 sm:py-24 space-y-28 shadow-2xl">
        {/* 
          ----------------------------------------------------------------------
          SECTION 2: • TENTANG KAMI (Manifesto)
          ----------------------------------------------------------------------
        */}
        <section id="about" className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start pt-4">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#171717]">
              <span className="w-2 h-2 rounded-full bg-[#171717]" />
              <span>Tentang Mitra Megah Interior</span>
            </div>
          </div>
          <div className="md:col-span-9">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-[#171717] leading-[1.25] tracking-tight">
              Seni dan presisi rancang bangun interior serta tata ruang arsitektural. Mitra Megah Interior menghadirkan keindahan, fungsionalitas, dan kualitas pengerjaan terbaik untuk mewujudkan hunian dan ruang impian Anda.
            </h2>
          </div>
        </section>

        {/* 
          ----------------------------------------------------------------------
          SECTION 3: RECENT PROJECTS (3 Scalloped Showcase Cards)
          ----------------------------------------------------------------------
        */}
        <section id="projects" className="max-w-7xl mx-auto space-y-12">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pb-4 border-b border-[#F0F0ED]">
            <div className="md:col-span-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#171717] leading-none">
                Portofolio <br />
                <span className="font-serif italic font-normal text-[#171717]">
                  Terbaru
                </span>
              </h2>
            </div>
            <div className="md:col-span-5">
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed max-w-md">
                Eksplorasi karya desain interior dan rancang bangun pilihan dari Mitra Megah Interior, dirancang dengan sentuhan kemewahan modern dan material berkualitas tinggi.
              </p>
            </div>
            <div className="md:col-span-3 md:text-right">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#171717] hover:bg-[#171717] hover:text-white transition-all text-xs font-semibold tracking-wide group"
              >
                <span>Lihat Semua</span>
                <span className="w-5 h-5 rounded-full bg-[#171717] text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#171717] transition-colors">
                  <ChevronRight className="w-3 h-3" />
                </span>
              </a>
            </div>
          </div>

          {/* 3 Project Cards Grid with signature scalloped notch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="group flex flex-col cursor-pointer"
              >
                {/* Image Frame with Scalloped Top Notch */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#EBEBE8] shadow-sm group-hover:shadow-xl transition-all duration-500">
                  {/* Top Architectural Scoop Notch Overlay */}
                  <CardTopNotch className="absolute top-0 inset-x-0 z-10" fillColor="#FFFFFF" />
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Meta details */}
                <div className="pt-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#8A8A85] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A8A85]" />
                    <span>{project.location}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#171717] group-hover:text-[#C28448] transition-colors">
                    {project.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 
          ----------------------------------------------------------------------
          SECTION 4: • TIM DESAINER (Directory)
          ----------------------------------------------------------------------
        */}
        <section id="architects" className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start pt-6">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#171717]">
              <span className="w-2 h-2 rounded-full bg-[#171717]" />
              <span>Tim &amp; Konsultan Desain</span>
            </div>
          </div>

          <div className="md:col-span-9 space-y-0 divide-y divide-[#E5E5E0]">
            {architectsDirectory.map((architect) => (
              <div
                key={architect.name}
                className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-[#FAFAF8] px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  {architect.hasAvatar && architect.avatarUrl ? (
                    <img
                      src={architect.avatarUrl}
                      alt={architect.name}
                      className="w-12 h-12 rounded-xl object-cover object-center shadow-sm border border-black/5"
                    />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C28448] hidden sm:block" />
                  )}
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-[#171717] group-hover:text-[#C28448] transition-colors">
                      {architect.name}
                    </h4>
                  </div>
                </div>

                <div className="flex-1 sm:px-8">
                  <p className="text-xs sm:text-sm text-[#737373] italic">
                    {architect.specialty}
                  </p>
                </div>

                <div>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#171717] hover:text-[#C28448] transition-colors"
                  >
                    <span>Konsultasi</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 
          ----------------------------------------------------------------------
          SECTION 5: PROJECT CATEGORIES (Monumental Curved Banner)
          ----------------------------------------------------------------------
        */}
        <section className="max-w-7xl mx-auto">
          <div className="relative rounded-[32px] sm:rounded-[44px] overflow-hidden bg-[#1E1E1E] text-white min-h-[480px] sm:min-h-[540px] flex flex-col justify-between shadow-2xl">
            {/* Background Photographic Render */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=85"
                alt="Mitra Megah Interior modern luxury interior"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent pointer-events-none" />
            </div>

            {/* Top Scalloped Notch on the banner */}
            <div className="relative z-10 w-full">
              <BannerTopNotch fillColor="#FFFFFF" />
            </div>

            {/* Banner Main Content */}
            <div className="relative z-10 px-8 sm:px-14 lg:px-16 py-12 flex flex-col md:flex-row justify-between items-end gap-10 flex-grow">
              <div className="space-y-8">
                {/* Headline: "Layanan & Kategori" */}
                <div>
                  <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none">
                    Layanan <br />
                    <span className="font-serif italic font-normal text-white">
                      Interior
                    </span>
                  </h2>
                </div>

                {/* Bullet List */}
                <ul className="space-y-2 text-sm sm:text-base font-medium text-white/90">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Interior Design &amp; Fit-Out Kontraktor</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Custom Furniture, Kitchen Set &amp; Wardrobe</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Luxury Residential Architecture &amp; Remodeling</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Commercial, Office &amp; Retail Space Styling</span>
                  </li>
                </ul>
              </div>

              {/* Right CTA Button */}
              <div>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-3 px-7 py-3 rounded-full bg-black/65 hover:bg-black text-white border border-white/20 backdrop-blur-md text-xs font-semibold tracking-wider transition-all shadow-xl hover:border-white/50 group"
                >
                  <span>Hubungi Kami</span>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </a>
              </div>
            </div>

            {/* Bottom Scalloped Notch on the banner */}
            <div className="relative z-10 w-full">
              <BannerBottomNotch fillColor="#FFFFFF" />
            </div>
          </div>
        </section>

        {/* 
          ----------------------------------------------------------------------
          SECTION 6: • STUDI KASUS PROYEK
          ----------------------------------------------------------------------
        */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start pt-4">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#171717]">
              <span className="w-2 h-2 rounded-full bg-[#171717]" />
              <span>Studi Kasus Interior</span>
            </div>
          </div>

          <div className="md:col-span-9 space-y-12 divide-y divide-[#E5E5E0]">
            {caseStudies.map((study, idx) => (
              <div
                key={study.title}
                className={`grid grid-cols-1 md:grid-cols-12 gap-8 items-center ${
                  idx > 0 ? 'pt-12' : ''
                }`}
              >
                {/* Left Info Column */}
                <div className="md:col-span-6 space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight leading-snug">
                    {study.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] leading-relaxed max-w-md">
                    {study.description}
                  </p>
                  <div className="pt-2">
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#EAEAEA] hover:bg-[#171717] hover:text-white transition-all text-xs font-semibold text-[#171717] group shadow-sm"
                    >
                      <span>Pelajari detail</span>
                      <span className="w-5 h-5 rounded-full bg-[#171717] text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#171717] transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  </div>
                </div>

                {/* Right Image Column with Scalloped Top Notch */}
                <div className="md:col-span-6">
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-[#EBEBE8] shadow-md group">
                    <CardTopNotch className="absolute top-0 inset-x-0 z-10" fillColor="#FFFFFF" />
                    <img
                      src={study.image}
                      alt={study.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 
          ----------------------------------------------------------------------
          MITRA MEGAH INTERIOR FOOTER
          ----------------------------------------------------------------------
        */}
        <footer id="contact" className="max-w-7xl mx-auto pt-16 border-t border-[#E5E5E0] space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden shadow-md border border-amber-400/40 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Mitra Megah Interior"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base tracking-[0.12em] text-[#171717] uppercase leading-tight">
                    MITRA MEGAH
                  </span>
                  <span className="text-[10px] tracking-[0.25em] text-[#737373] font-semibold uppercase leading-tight">
                    INTERIOR
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed max-w-sm">
                Studio perancangan interior &amp; kontraktor kustom terpercaya. Menghadirkan solusi tata ruang berkelas, furnitur eksklusif, dan visualisasi arsitektur 3D interaktif real-time.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <h5 className="font-bold text-[#171717] tracking-wider uppercase mb-3 text-[11px]">
                Kantor &amp; Workshop
              </h5>
              <p className="text-[#737373]">Jakarta • SCBD District 8 &amp; Senopati</p>
              <p className="text-[#737373]">Tangerang • BSD City Commercial Area</p>
              <p className="text-[#737373]">Surabaya • Pakuwon Mall Area</p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <h5 className="font-bold text-[#171717] tracking-wider uppercase mb-3 text-[11px]">
                Navigasi
              </h5>
              <div>
                <a href="#projects" className="text-[#737373] hover:text-[#171717]">
                  Portofolio Proyek
                </a>
              </div>
              <div>
                <a href="#about" className="text-[#737373] hover:text-[#171717]">
                  Tentang Mitra Megah
                </a>
              </div>
              <div>
                <a href="#architects" className="text-[#737373] hover:text-[#171717]">
                  Konsultan Desain
                </a>
              </div>
              <div>
                <a href="#contact" className="text-[#737373] hover:text-[#171717]">
                  Kontak &amp; Konsultasi
                </a>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 text-xs">
              <h5 className="font-bold text-[#171717] tracking-wider uppercase mb-3 text-[11px]">
                Studio Workspace
              </h5>
              <div>
                <Link href="/login" className="text-[#737373] hover:text-[#171717]">
                  Studio Sign In
                </Link>
              </div>
              <div>
                <Link href="/dashboard" className="text-[#737373] hover:text-[#171717]">
                  3D Configurator
                </Link>
              </div>
              <div>
                <a href="#about" className="text-[#737373] hover:text-[#171717]">
                  Filosofi Desain
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#F0F0ED] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8A85] gap-4">
            <p>© 2026 MITRA MEGAH INTERIOR. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-[#171717] cursor-pointer">Kebijakan Privasi</span>
              <span className="hover:text-[#171717] cursor-pointer">Syarat &amp; Ketentuan</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-[#171717] cursor-pointer font-medium"
              >
                Kembali ke atas ↑
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
