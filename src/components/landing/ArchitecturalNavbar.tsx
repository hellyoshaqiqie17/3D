'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowRight, ChevronRight, User as UserIcon, LogOut, LayoutDashboard, Menu, X, Box } from 'lucide-react';

export function ArchitecturalNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, syncSession } = useAuthStore();

  useEffect(() => {
    syncSession();
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [syncSession]);

  return (
    <>
      {/* Primary Top Bar embedded within the Hero frame header */}
      <header className="w-full pt-6 pb-2 px-6 sm:px-10 lg:px-14 flex items-center justify-between relative z-30">
        {/* Brand Logo: Mitra Megah Interior */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-lg border border-amber-300/40 group-hover:scale-105 transition-transform shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mitra Megah Interior"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-[0.12em] text-white uppercase group-hover:text-amber-200 transition-colors leading-tight">
              MITRA MEGAH
            </span>
            <span className="text-[10px] tracking-[0.25em] text-white/80 font-medium uppercase leading-tight">
              INTERIOR
            </span>
          </div>
        </Link>

        {/* Center White Tab / Notch Navigation Menu (Matching Image 1) */}
        <nav className="hidden md:flex items-center bg-white text-[#171717] px-8 py-2.5 rounded-b-2xl shadow-sm border-b border-x border-[#E8E8E5] gap-7 text-xs font-semibold tracking-wide">
          <a href="#projects" className="text-[#171717] hover:text-[#C28448] transition-colors">
            Projects
          </a>
          <a href="#about" className="text-[#171717] hover:text-[#C28448] transition-colors">
            About us
          </a>
          <a href="#architects" className="text-[#171717] hover:text-[#C28448] transition-colors">
            Designers
          </a>
          <a href="#contact" className="text-[#171717] hover:text-[#C28448] transition-colors">
            Contact
          </a>
        </nav>

        {/* Right CTA Button */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white text-xs font-medium transition-all group"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">{user.name.split(' ')[0]} (Studio)</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-white border border-white/20 transition-all text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#2C3834]/80 hover:bg-[#202926] text-white border border-white/20 backdrop-blur-md text-xs font-medium tracking-wide shadow-sm hover:shadow transition-all group"
            >
              <span>Get started</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-white/10 border border-white/20 text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Floating Sticky Pill Bar when user scrolls past Hero */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
          isScrolled ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="bg-[#171717]/90 text-white backdrop-blur-xl px-5 py-2 rounded-full border border-white/15 shadow-2xl flex items-center gap-6 text-xs font-medium">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-wider text-xs uppercase text-white hover:text-amber-200 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Mitra Megah Interior"
              className="w-6 h-6 rounded-full object-cover shadow-sm border border-white/20"
            />
            <span>Mitra Megah Interior</span>
          </Link>
          <div className="hidden sm:flex items-center gap-5 text-white/70">
            <a href="#projects" className="hover:text-white transition-colors">
              Projects
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#architects" className="hover:text-white transition-colors">
              Architects
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-2 pl-2 border-l border-white/15">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="bg-white text-[#171717] px-3.5 py-1.5 rounded-full font-semibold text-[11px] hover:bg-[#F0F0ED] transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-white text-[#171717] px-3.5 py-1.5 rounded-full font-semibold text-[11px] hover:bg-[#F0F0ED] transition-colors flex items-center gap-1"
              >
                <span>Studio Login</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-20 z-50 bg-[#1A1A1A] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-4">
          <div className="flex flex-col space-y-3 font-medium text-sm">
            <a
              href="#projects"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-white/10 hover:text-[#C28448]"
            >
              Projects
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-white/10 hover:text-[#C28448]"
            >
              About us
            </a>
            <a
              href="#architects"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-white/10 hover:text-[#C28448]"
            >
              Our Architects
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#C28448]"
            >
              Contact Mitra Megah
            </a>
          </div>

          <div className="pt-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 bg-white text-black font-semibold rounded-2xl flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Studio Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 bg-white text-black font-semibold rounded-2xl flex items-center justify-center gap-2"
              >
                <span>Studio Login</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
