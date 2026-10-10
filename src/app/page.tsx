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

  // Hero carousel slides matching Image 1
  const heroSlides = [
    {
      image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Building',
      headlineSerif: 'Beyond',
      vitruviusQuote:
        'According to Vitruvius, the architect should strive to fulfill each of these three attributes as well as possible: firmitas, utilitas, venustas.',
      definitionTitle: 'Architecture can mean:',
      definitionText:
        'A general term to describe buildings and other physical structures.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Form &',
      headlineSerif: 'Function',
      vitruviusQuote:
        'Beauty emerges from the harmony of purpose, materiality, and the living spirit of modern dwelling.',
      definitionTitle: 'Spatial proportions:',
      definitionText:
        'High-contrast volumetric forms engineered for residential and civic masterplans.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Living',
      headlineSerif: 'Sanctuary',
      vitruviusQuote:
        'Every spatial threshold is engineered to blur the boundary between natural landscapes and crafted stone.',
      definitionTitle: 'Material craftsmanship:',
      definitionText:
        'Calibrated timber, honed travertine, and structural glazing customized live.',
    },
    {
      image:
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=2400&q=85',
      headlineSans: 'Modernist',
      headlineSerif: 'Horizon',
      vitruviusQuote:
        'Atelier practice uniting architectural precision with timeless materiality.',
      definitionTitle: 'Architectural atelier:',
      definitionText:
        'Direct physical structure planning with daylight and spatial rhythm.',
    },
  ];

  // Recent Projects matching Image 1
  const recentProjects = [
    {
      id: 'proj-1',
      title: 'The modern Versailles',
      location: 'Alexander City, New York',
      image:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'proj-2',
      title: 'Buckingham Palace',
      location: 'Lake Havasu City, Washington',
      image:
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'proj-3',
      title: 'Les Palais Bulles',
      location: 'North Little Rock, California',
      image:
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  // Architects directory matching Image 1
  const architectsDirectory = [
    {
      name: 'Max Abramovitz',
      specialty: '* Hathor, relief on capitals at Philae island, southern Egypt.',
      hasAvatar: false,
    },
    {
      name: 'Cameron Williamson',
      specialty: '* Brighton, Brighton and Hove, United Kingdom',
      hasAvatar: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      name: 'Pietro Belluschi',
      specialty: '* Cushion capital and early English Gothic foliated capital.',
      hasAvatar: false,
    },
  ];

  // Case studies matching Image 1
  const caseStudies = [
    {
      title: 'Fulham Town Hall extension',
      description:
        'Improvement on the floor plan and layout of a loft apartment in Paris to maximise the use of space and additional.',
      image:
        'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'The White Apartment',
      description:
        'Redefining Urban Elegance: Bridging Heritage and Modern Living in an Iconic Residential Landmark.',
      image:
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
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

          {/* Integrated DNOIN.INC Header Navigation */}
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
          SECTION 2: • ABOUT US (Manifesto)
          ----------------------------------------------------------------------
        */}
        <section id="about" className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start pt-4">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#171717]">
              <span className="w-2 h-2 rounded-full bg-[#171717]" />
              <span>About Us</span>
            </div>
          </div>
          <div className="md:col-span-9">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-[#171717] leading-[1.25] tracking-tight">
              The art and science of designing buildings and nonbuilding structures.
              The style of design and method of construction of buildings and other physical structures.
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
                Recent <br />
                <span className="font-serif italic font-normal text-[#171717]">
                  Projects
                </span>
              </h2>
            </div>
            <div className="md:col-span-5">
              <p className="text-xs sm:text-sm text-[#737373] leading-relaxed max-w-md">
                After completing your year 12 education and earning the necessary scores,
                you may apply for a bachelor&apos;s degree in architecture. To qualify,
                students can complete one of three entrance exams:
              </p>
            </div>
            <div className="md:col-span-3 md:text-right">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#171717] hover:bg-[#171717] hover:text-white transition-all text-xs font-semibold tracking-wide group"
              >
                <span>View All</span>
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
          SECTION 4: • OUR ARCHITECTS (Directory)
          ----------------------------------------------------------------------
        */}
        <section id="architects" className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start pt-6">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#171717]">
              <span className="w-2 h-2 rounded-full bg-[#171717]" />
              <span>Our Architects</span>
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
                      className="w-12 h-12 rounded-xl object-cover object-center shadow-sm"
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
                    <span>View Profile</span>
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
            {/* Background Photographic Render (Warm modern pavilion matching Image 1) */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=85"
                alt="Modern glass architecture pavilion at dusk"
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
                {/* Headline: "Project Categories" */}
                <div>
                  <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none">
                    Project <br />
                    <span className="font-serif italic font-normal text-white">
                      Categories
                    </span>
                  </h2>
                </div>

                {/* Bullet List */}
                <ul className="space-y-2 text-sm sm:text-base font-medium text-white/90">
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Interior design</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Commercial architect</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Landscape architect</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Civic project</span>
                  </li>
                </ul>
              </div>

              {/* Right CTA Button */}
              <div>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-3 px-7 py-3 rounded-full bg-black/65 hover:bg-black text-white border border-white/20 backdrop-blur-md text-xs font-semibold tracking-wider transition-all shadow-xl hover:border-white/50 group"
                >
                  <span>Contact Us</span>
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
          SECTION 6: • RECENT CASE STUDIES
          ----------------------------------------------------------------------
        */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start pt-4">
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#171717]">
              <span className="w-2 h-2 rounded-full bg-[#171717]" />
              <span>Recent case studies</span>
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
                      <span>View more</span>
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
          ATELIER FOOTER
          ----------------------------------------------------------------------
        */}
        <footer id="contact" className="max-w-7xl mx-auto pt-16 border-t border-[#E5E5E0] space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 space-y-3">
              <span className="font-extrabold text-xl tracking-[0.25em] text-[#171717] uppercase block">
                DNOIN.INC
              </span>
              <p className="text-xs text-[#737373] leading-relaxed max-w-sm">
                Architectural atelier &amp; design practice. Designed for
                contemporary residential masterplans, luxury facades, and timeless physical structures.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <h5 className="font-bold text-[#171717] tracking-wider uppercase mb-3 text-[11px]">
                Offices
              </h5>
              <p className="text-[#737373]">Paris • 14 Rue de Rivoli</p>
              <p className="text-[#737373]">Tokyo • Minato City, Roppongi</p>
              <p className="text-[#737373]">Jakarta • SCBD District 8</p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <h5 className="font-bold text-[#171717] tracking-wider uppercase mb-3 text-[11px]">
                Navigation
              </h5>
              <div>
                <a href="#projects" className="text-[#737373] hover:text-[#171717]">
                  Recent Projects
                </a>
              </div>
              <div>
                <a href="#about" className="text-[#737373] hover:text-[#171717]">
                  About Atelier
                </a>
              </div>
              <div>
                <a href="#architects" className="text-[#737373] hover:text-[#171717]">
                  Our Architects
                </a>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 text-xs">
              <h5 className="font-bold text-[#171717] tracking-wider uppercase mb-3 text-[11px]">
                Studio
              </h5>
              <div>
                <Link href="/login" className="text-[#737373] hover:text-[#171717]">
                  Architect Sign In
                </Link>
              </div>
              <div>
                <a href="#about" className="text-[#737373] hover:text-[#171717]">
                  Manifesto
                </a>
              </div>
              <div>
                <a href="#projects" className="text-[#737373] hover:text-[#171717]">
                  Portfolio
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#F0F0ED] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8A85] gap-4">
            <p>© 2026 DNOIN.INC / HOMECRAFT ARCHITECTURE. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-[#171717] cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#171717] cursor-pointer">Terms of Architecture</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-[#171717] cursor-pointer font-medium"
              >
                Back to top ↑
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
