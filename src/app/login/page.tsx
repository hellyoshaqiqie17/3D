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
  Layers,
  Compass,
  Cpu,
  User as UserIcon,
  LogOut,
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
      setFormError('Please enter both work email and password.');
      return;
    }

    if (mode === 'signup' && !name) {
      setFormError('Please enter your full name or title.');
      return;
    }

    if (mode === 'signin') {
      const res = await login(email, password);
      if (res.success) {
        setStatusMessage(res.message || 'Credentials verified. Connecting to studio workspace...');
        setTimeout(() => {
          router.push(redirectPath);
        }, 600);
      } else {
        setFormError(res.message || 'Failed to authenticate.');
      }
    } else {
      const res = await register({ name, email, password, studioName });
      if (res.success) {
        setStatusMessage(res.message || 'Studio workspace created. Redirecting...');
        setTimeout(() => {
          router.push(redirectPath);
        }, 600);
      } else {
        setFormError(res.message || 'Failed to create studio account.');
      }
    }
  };

  const handleFillAdmin = () => {
    setMode('signin');
    setEmail('admin');
    setPassword('admin123');
    setFormError('');
    setStatusMessage('Kredensial Admin terisi. Klik tombol "Enter Studio Workspace" di bawah.');
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    setStatusMessage('Connecting to Google Workspace...');
    const res = await loginWithGoogle();
    if (res.success) {
      setStatusMessage('Google authentication verified. Entering Dashboard...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
    } else {
      setFormError('Google sign in failed. Please try again.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setFormError('');
    setStatusMessage('Authenticating as Lead Architect (Demo)...');
    const res = await loginDemo();
    if (res.success) {
      setStatusMessage('Welcome back, Lead Architect. Loading BIM Dashboard...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
    } else {
      setFormError('Could not initialize demo login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#121211] flex flex-col lg:flex-row text-[#171717] font-sans selection:bg-[#C28448] selection:text-white">
      {/* LEFT COLUMN: Architectural Studio Visual & Branding (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-[#141413] text-white flex-col justify-between p-12 xl:p-16 border-r border-[#242422] overflow-hidden">
        {/* Subtle Architectural Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Ambient Warm Architectural Light Glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#C28448]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header & Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#121211] flex items-center justify-center font-bold text-sm tracking-wider shadow-md group-hover:scale-105 transition-transform">
              HC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">HOMECRAFT 3D</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                  STUDIO
                </span>
              </div>
              <span className="text-[11px] text-white/50 block font-mono">Spatial BIM & CAD Visualization</span>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing</span>
          </Link>
        </div>

        {/* Center: Architectural Blueprint Elevation HUD Card */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-3xl xl:text-4xl font-light tracking-tight text-white leading-snug mb-4">
              Real-Time Parametric CAD for <span className="font-serif italic text-[#E2C39B]">Visionary</span> Ateliers.
            </h1>

            <p className="text-sm text-white/60 leading-relaxed mb-8 font-light">
              Collaborate on 3D residential models, calibrate PBR material schedules, and deliver instantaneous photorealistic presentations directly to client browsers.
            </p>

            {/* Architectural Blueprint Spec Card */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 text-[11px] font-mono text-white/40">
                <span>PROJECT: VILLA-PAVILION-001</span>
                <span>STATUS: LATENCY 24ms</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] text-white/40 block font-mono">AZIMUTH</span>
                  <span className="text-xs font-semibold text-white/90">214.5° SW</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] text-white/40 block font-mono">TEXTURE MAPS</span>
                  <span className="text-xs font-semibold text-white/90">4K PBR Albedo</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[10px] text-white/40 block font-mono">ENGINE</span>
                  <span className="text-xs font-semibold text-emerald-400">WebGL 2.0</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/70">
                <span className="italic font-serif text-white/50 text-[11px]">
                  &ldquo;Architecture is the learned game, correct and magnificent, of forms assembled in the light.&rdquo;
                </span>
                <span className="text-[10px] font-mono text-white/30 uppercase pl-2 shrink-0">— Le Corbusier</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Studio Indicators */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#C28448]" />
              <span>Studio Engine v2.6.4</span>
            </span>
            <span className="hidden xl:inline text-white/20">•</span>
            <span className="hidden xl:flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Revit / Rhino / SketchUp Compatible</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px]">100% Edge Uptime</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Functional High-End Authentication Card */}
      <div className="w-full lg:w-1/2 bg-[#F7F7F5] flex flex-col justify-between p-6 sm:p-10 md:p-16 min-h-screen lg:min-h-0 overflow-y-auto">
        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between mb-8 pb-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center font-bold text-xs">
              HC
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#171717]">HOMECRAFT 3D</span>
          </Link>
          <Link href="/" className="text-xs text-[#6B6B6B] hover:text-[#171717] flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-6">
          {/* If already signed in, provide active session banner */}
          {isAuthenticated && user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-5 rounded-2xl bg-white border border-[#DCDCD7] shadow-float"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E8E5]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-medium text-[#6B6B6B]">ACTIVE STUDIO WORKSTATION</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="text-xs text-[#6B6B6B] hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign out</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#171717] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {user.avatar || 'MK'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#171717]">{user.name}</h4>
                  <p className="text-xs text-[#6B6B6B]">{user.role} • {user.studioName}</p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 bg-[#171717] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-subtle"
              >
                <span>Enter Architect Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          )}

          {/* Header Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EBEBE7] text-[11px] font-mono font-medium text-[#4A4A46] mb-3">
              <Building2 className="w-3 h-3 text-[#C28448]" />
              <span>STUDIO WORKSPACE ACCESS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
              {mode === 'signin' ? 'Sign in to your Studio' : 'Create an Architect Account'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5 leading-relaxed">
              {mode === 'signin'
                ? 'Enter your professional credentials to manage BIM models and live 3D customer configurations.'
                : 'Join top architecture ateliers delivering spatial real-time CAD experiences.'}
            </p>
          </div>

          {/* Mode Switch Tabs with Animated Pill */}
          <div className="relative p-1 bg-[#EBEBE7] rounded-xl flex items-center mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setFormError('');
                setStatusMessage('');
              }}
              className={`relative z-10 flex-1 py-2 text-xs font-medium transition-colors text-center ${
                mode === 'signin' ? 'text-[#171717] font-semibold' : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              Architect Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setFormError('');
                setStatusMessage('');
              }}
              className={`relative z-10 flex-1 py-2 text-xs font-medium transition-colors text-center ${
                mode === 'signup' ? 'text-[#171717] font-semibold' : 'text-[#6B6B6B] hover:text-[#171717]'
              }`}
            >
              Create Studio Account
            </button>

            {/* Sliding Tab Pill */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              className="absolute inset-y-1 rounded-lg bg-white shadow-subtle"
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
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#4A4A46]">Your Full Name / Title</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3A39E]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Marcus Kōzō, AIA"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCDCD7] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] rounded-xl text-xs text-[#171717] placeholder-[#A3A39E] transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#4A4A46]">Studio or Firm Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3A39E]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="e.g. Atelier Kōzō Architects"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCDCD7] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] rounded-xl text-xs text-[#171717] placeholder-[#A3A39E] transition-all outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Username / Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4A4A46]">Username or Work Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3A39E]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin atau architect@firm-domain.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#DCDCD7] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] rounded-xl text-xs text-[#171717] placeholder-[#A3A39E] transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#4A4A46]">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset verification link has been sent to your work email.')}
                    className="text-[11px] text-[#6B6B6B] hover:text-[#171717] transition-colors"
                  >
                    Forgot password?
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
                  placeholder="••••••••••••"
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

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#DCDCD7] text-[#171717] focus:ring-[#171717]"
                />
                <span className="text-xs text-[#6B6B6B]">Keep workstation authenticated</span>
              </label>
              <span className="text-[11px] font-mono text-[#A3A39E]">SSL 256-Bit</span>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              className="w-full py-3 px-4 bg-[#171717] hover:bg-[#262626] text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Verifying Studio License...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Enter Studio Workspace' : 'Initialize Studio License'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Social / BIM Single Sign-On Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DCDCD7]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-mono text-[#A3A39E]">
              <span className="bg-[#F7F7F5] px-3">or authenticate via BIM SSO</span>
            </div>
          </div>

          {/* Social / Enterprise Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="py-2.5 px-3 bg-white hover:bg-[#F5F5F3] border border-[#DCDCD7] rounded-xl text-xs font-medium text-[#171717] flex items-center justify-center gap-2 transition-colors shadow-sm group"
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
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="py-2.5 px-3 bg-white hover:bg-[#F5F5F3] border border-[#DCDCD7] rounded-xl text-xs font-medium text-[#171717] flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-[#0696D7]" />
              <span>Autodesk ID</span>
            </button>
          </div>

          {/* Privacy & Terms Notice */}
          <p className="text-[11px] text-[#A3A39E] text-center mt-8 leading-relaxed">
            By accessing this studio workspace, you agree to the Architectural Digital Rights, Cloud R2 Asset Security, and Terms of Service.
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#E8E8E5] flex items-center justify-between text-[11px] text-[#A3A39E] font-mono">
          <span>HOMECRAFT 3D PLATFORM</span>
          <span>© 2026 ARCHITECTURAL TECHNOLOGIES</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#121211] flex items-center justify-center text-white font-mono text-xs">
          Loading Studio Workspace...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
