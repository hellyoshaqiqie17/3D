'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/lib/auth-store';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Building2,
  CheckCircle2,
  Sparkles,
  Shield,
  Palette,
  User as UserIcon,
  LogOut,
  Sparkle,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginDemo,
    loginWithGoogle,
    register,
    logout,
    syncSession,
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setStatusMessage('');

    if (!email || !password) {
      setFormError('Silakan masukkan email/username dan kata sandi.');
      return;
    }

    if (mode === 'signup' && !name) {
      setFormError('Silakan masukkan nama lengkap Anda.');
      return;
    }

    if (mode === 'signin') {
      const res = await login(email, password);
      if (res.success) {
        setStatusMessage(res.message || 'Login berhasil! Menuju dashboard...');
        setTimeout(() => {
          router.push(redirectPath);
        }, 500);
      } else {
        setFormError(res.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      }
    } else {
      const res = await register({ name, email, password, studioName });
      if (res.success) {
        setStatusMessage(res.message || 'Akun berhasil dibuat! Menuju dashboard...');
        setTimeout(() => {
          router.push(redirectPath);
        }, 500);
      } else {
        setFormError(res.message || 'Gagal membuat akun baru.');
      }
    }
  };

  const handleFillAdmin = () => {
    setMode('signin');
    setEmail('admin');
    setPassword('admin123');
    setFormError('');
    setStatusMessage('Kredensial admin telah diisi. Silakan klik "Masuk ke Dashboard".');
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    setStatusMessage('Menghubungkan akun Google...');
    const res = await loginWithGoogle();
    if (res.success) {
      setStatusMessage('Autentikasi Google berhasil. Menuju dashboard...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
    } else {
      setFormError('Gagal masuk dengan Google. Silakan coba lagi.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setFormError('');
    setStatusMessage('Masuk sebagai akun demo...');
    const res = await loginDemo();
    if (res.success) {
      setStatusMessage('Selamat datang! Membuka dashboard interior...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
    } else {
      setFormError('Gagal mengakses akun demo.');
    }
  };

  return (
    <div className="min-h-screen bg-[#5D2E21] p-3 sm:p-5 lg:p-7 flex items-center justify-center font-sans selection:bg-[#C28448] selection:text-white">
      {/* Master Card Container - Matching Landing Page Rounded Frame */}
      <div className="w-full max-w-6xl rounded-[28px] sm:rounded-[38px] lg:rounded-[44px] overflow-hidden shadow-2xl border border-white/10 flex flex-col lg:flex-row bg-white min-h-[640px] sm:min-h-[700px]">
        {/* ====================================================================
            LEFT COLUMN: Elegant Interior Showcase & Philosophy
            ==================================================================== */}
        <div className="relative hidden lg:flex lg:w-1/2 bg-[#1E1E1E] text-white flex-col justify-between p-10 xl:p-14 overflow-hidden">
          {/* Background Photography: Warm modern luxury interior matching landing page */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2400&q=85"
              alt="Mitra Megah Interior Residence"
              className="w-full h-full object-cover object-center"
            />
            {/* Atmospheric dark gradient overlay for optimal readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/60 to-black/75 pointer-events-none" />
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden shadow-lg border border-amber-300/40 group-hover:scale-105 transition-transform shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Mitra Megah Interior"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-[0.12em] text-white uppercase group-hover:text-amber-200 transition-colors leading-tight">
                  MITRA MEGAH
                </span>
                <span className="text-[10px] tracking-[0.22em] text-white/80 font-medium uppercase leading-tight">
                  INTERIOR
                </span>
              </div>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          {/* Center Main Presentation Content */}
          <div className="relative z-10 my-auto py-8">
            <p className="text-xs text-amber-200/90 font-medium tracking-wide uppercase mb-3 flex items-center gap-2">
              <Sparkle className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Desain &amp; Tata Ruang Berkualitas</span>
            </p>

            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-[1.15] mb-4">
              Wujudkan Ruang <br />
              <span className="font-serif italic font-normal text-[#E2C39B]">
                Hunian Impian
              </span> Anda.
            </h1>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-6 font-light max-w-md">
              Masuk ke akun Anda untuk merancang interior secara interaktif, memilih variasi warna dan material mewah, serta memantau progres pengerjaan hunian Anda.
            </p>

            {/* Approachable, Client-Friendly Feature Highlights (Replaces technical azimuth & HUD) */}
            <div className="space-y-2.5 max-w-md">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Visualisasi 3D Interaktif</h4>
                  <p className="text-[11px] text-white/70">Ubah warna dinding, motif marmer, dan parket secara instan</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Furnitur &amp; Interior Kustom</h4>
                  <p className="text-[11px] text-white/70">Rancangan presisi untuk kitchen set, backdrop, dan wardrobe</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Kualitas &amp; Pengerjaan Rapi</h4>
                  <p className="text-[11px] text-white/70">Dikerjakan oleh tim ahli dengan material berkualitas pilihan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Warm Philosophy Quote */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
            <p className="italic font-serif text-[11px] text-white/80">
              &ldquo;Kenyamanan dan estetika hunian yang menyatu dalam kehangatan keluarga.&rdquo;
            </p>
            <span className="text-[10px] text-white/50 tracking-wider uppercase pl-2 shrink-0">
              Mitra Megah Interior
            </span>
          </div>
        </div>

        {/* ====================================================================
            RIGHT COLUMN: Clean & Friendly Authentication Form
            ==================================================================== */}
        <div className="w-full lg:w-1/2 bg-[#F7F7F5] flex flex-col justify-between p-6 sm:p-10 md:p-12 overflow-y-auto">
          {/* Mobile Top Header (Shown on mobile devices only) */}
          <div className="flex lg:hidden items-center justify-between mb-6 pb-4 border-b border-[#E8E8E5]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm border border-amber-400/40 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Mitra Megah Interior"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-sm tracking-tight text-[#171717]">
                MITRA MEGAH INTERIOR
              </span>
            </Link>
            <Link href="/" className="text-xs text-[#6B6B6B] hover:text-[#171717] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>
          </div>

          {/* Form Container */}
          <div className="max-w-md w-full mx-auto my-auto py-4">
            {/* If already signed in, provide active session banner */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-white border border-[#DCDCD7] shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8E8E5]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-[#6B6B6B]">SEDANG AKTIF</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="text-xs text-[#6B6B6B] hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Keluar</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#171717] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {user.avatar || 'MM'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#171717]">{user.name}</h4>
                    <p className="text-xs text-[#6B6B6B]">{user.studioName || 'Mitra Megah Interior'}</p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="w-full py-2.5 px-4 bg-[#171717] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <span>Buka Dashboard Proyek</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            )}

            {/* Header Title (Clean, human-friendly, no jargon) */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
                {mode === 'signin' ? 'Selamat Datang' : 'Buat Akun Baru'}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5 leading-relaxed">
                {mode === 'signin'
                  ? 'Silakan masuk ke akun Anda untuk melanjutkan penataan interior dan melihat proyek.'
                  : 'Daftarkan akun untuk mulai merancang dan mengkustomisasi interior hunian Anda.'}
              </p>
            </div>

            {/* Mode Switch Tabs with Animated Pill */}
            <div className="relative p-1 bg-[#EBEBE7] rounded-xl flex items-center mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setFormError('');
                  setStatusMessage('');
                }}
                className={`relative z-10 flex-1 py-2 text-xs font-medium transition-colors text-center cursor-pointer ${
                  mode === 'signin' ? 'text-[#171717] font-semibold' : 'text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setFormError('');
                  setStatusMessage('');
                }}
                className={`relative z-10 flex-1 py-2 text-xs font-medium transition-colors text-center cursor-pointer ${
                  mode === 'signup' ? 'text-[#171717] font-semibold' : 'text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                Daftar Akun
              </button>

              {/* Sliding Tab Pill */}
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-y-1 rounded-lg bg-white shadow-sm pointer-events-none"
                style={{
                  width: 'calc(50% - 4px)',
                  left: mode === 'signin' ? '4px' : 'calc(50%)',
                }}
              />
            </div>

            {/* Status / Error Notifications */}
            <AnimatePresence mode="wait">
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{statusMessage}</span>
                </motion.div>
              )}

              {(formError || error) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError || error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#4A4A46]">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3A39E]">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCDCD7] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] rounded-xl text-xs text-[#171717] placeholder-[#A3A39E] transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#4A4A46]">Nama Studio / Proyek (Opsional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3A39E]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={studioName}
                        onChange={(e) => setStudioName(e.target.value)}
                        placeholder="Contoh: Rumah Tinggal BSD"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCDCD7] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] rounded-xl text-xs text-[#171717] placeholder-[#A3A39E] transition-all outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Username / Email Field */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#4A4A46]">Email atau Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3A39E]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: admin atau nama@email.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCDCD7] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] rounded-xl text-xs text-[#171717] placeholder-[#A3A39E] transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#4A4A46]">Kata Sandi</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => alert('Tautan pemulihan kata sandi telah dikirim ke email Anda.')}
                      className="text-[11px] text-[#6B6B6B] hover:text-[#171717] transition-colors"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3A39E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi Anda"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#DCDCD7] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] rounded-xl text-xs text-[#171717] placeholder-[#A3A39E] transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A3A39E] hover:text-[#171717] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Quick Admin Helper */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#DCDCD7] text-[#171717] focus:ring-[#171717]"
                  />
                  <span className="text-xs text-[#6B6B6B]">Ingat saya</span>
                </label>

                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleFillAdmin}
                    className="text-[11px] text-[#C28448] hover:text-[#9A6230] font-medium transition-colors"
                  >
                    Isi Akun Admin
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className="w-full py-3 px-4 bg-[#171717] hover:bg-[#262626] text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi akun...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Masuk ke Dashboard' : 'Daftar Akun Sekarang'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Simple Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#DCDCD7]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-[#A3A39E]">
                <span className="bg-[#F7F7F5] px-3 font-medium">atau masuk dengan</span>
              </div>
            </div>

            {/* Social & Demo Buttons (Clean & Friendly) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="py-2.5 px-3 bg-white hover:bg-[#F5F5F3] border border-[#DCDCD7] rounded-xl text-xs font-medium text-[#171717] flex items-center justify-center gap-2 transition-colors shadow-xs group cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="py-2.5 px-3 bg-white hover:bg-[#F5F5F3] border border-[#DCDCD7] rounded-xl text-xs font-medium text-[#171717] flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C28448]" />
                <span>Akun Tamu (Demo)</span>
              </button>
            </div>

            {/* Privacy & Terms Notice */}
            <p className="text-[11px] text-[#A3A39E] text-center mt-6 leading-relaxed">
              Dengan masuk ke akun ini, Anda menyetujui Kebijakan Privasi serta Syarat &amp; Ketentuan Mitra Megah Interior.
            </p>
          </div>

          {/* Footer info */}
          <div className="pt-4 border-t border-[#E8E8E5] flex items-center justify-between text-[11px] text-[#A3A39E]">
            <span className="font-semibold text-[#6B6B6B]">MITRA MEGAH INTERIOR</span>
            <span>© 2026 Hak Cipta Dilindungi</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#5D2E21] flex items-center justify-center text-white font-mono text-xs">
          Memuat halaman login...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
