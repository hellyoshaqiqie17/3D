'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  ShieldCheck,
  FolderKanban,
  UploadCloud,
  Palette,
  ExternalLink,
  LogOut,
  Bell,
} from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, logout, syncSession } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !user) {
      router.replace('/login');
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('Silakan masukkan kata sandi Anda saat ini.');
      return;
    }

    if (!newPassword) {
      setErrorMessage('Silakan masukkan kata sandi baru.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('Kata sandi baru tidak boleh sama dengan kata sandi lama.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          userId: user?.id || 'admin',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Gagal mengubah kata sandi. Periksa kata sandi saat ini.');
      } else {
        setSuccessMessage(data.message || 'Kata sandi berhasil diperbarui.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setErrorMessage('Terjadi kesalahan koneksi saat mengubah kata sandi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = user?.name || (isInitialized ? 'Super Admin Architect' : 'Memuat profil...');
  const displayStudio = user?.studioName || 'Mitra Megah Interior';
  const displayRole = user?.role || 'Administrator & Principal Architect';
  const displayAvatar = user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : 'MM');

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 bg-white border-b border-neutral-200/80 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm border border-neutral-200 shrink-0 group-hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Mitra Megah Interior"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900">
              MITRA MEGAH <span className="font-normal text-neutral-500">INTERIOR</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/70 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <button
            type="button"
            className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-all cursor-pointer"
            >
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-neutral-900 block leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono block leading-tight truncate max-w-[130px]">
                  {displayStudio}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {displayAvatar}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-2xl shadow-xl p-3 z-50">
                <div className="p-2 border-b border-neutral-100 mb-2">
                  <span className="text-xs font-bold text-neutral-900 block">{displayName}</span>
                  <span className="text-[11px] text-neutral-500 block font-mono">
                    {user?.email || 'admin@mitramegahinterior.com'}
                  </span>
                  <span className="text-[10px] text-[#C28448] font-semibold block mt-1">
                    {displayRole}
                  </span>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Dashboard Proyek</span>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Lihat Halaman Beranda</span>
                  </Link>

                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                      router.push('/login');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
            >
              <FolderKanban className="w-4 h-4 text-neutral-500" />
              <span>Architectural Projects</span>
            </Link>

            <Link
              href="/dashboard?tab=skp-library"
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-neutral-500" />
              <span>3D Model Library</span>
            </Link>

            <Link
              href="/dashboard?tab=materials"
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
            >
              <Palette className="w-4 h-4 text-neutral-500" />
              <span>PBR Material Library</span>
            </Link>

            <div className="my-3 border-t border-neutral-200" />

            <Link
              href="/dashboard/change-password"
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white text-neutral-900 border border-neutral-200 shadow-xs transition-all"
            >
              <KeyRound className="w-4 h-4 text-[#C28448]" />
              <span>Ubah Kata Sandi</span>
            </Link>
          </nav>

          <div className="p-4 bg-white rounded-xl border border-neutral-200 mt-6 shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
              Studio Identity
            </span>
            <div className="text-xs font-bold text-neutral-900 mb-0.5 truncate">
              {displayStudio}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono truncate">
              {displayName}
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-neutral-100 text-[10px] font-mono text-neutral-600">
              {displayRole}
            </span>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 mt-3 text-amber-900 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C28448]" />
              <span>Keamanan Admin</span>
            </div>
            Ganti kata sandi secara berkala untuk menjaga integritas data model dan material 3D studio Anda.
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Link href="/dashboard" className="hover:text-neutral-900 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-neutral-800 font-medium">Ubah Kata Sandi</span>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex md:hidden items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </Link>
          </div>

          {/* Section Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-[#C28448] flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                Ubah Kata Sandi Admin
              </h1>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">
              Perbarui kata sandi akun Mitra Megah Interior Anda. Setelah diperbarui, Anda dapat menggunakan kata sandi baru untuk akses login berikutnya.
            </p>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <h4 className="font-semibold text-emerald-900 mb-0.5">Berhasil Diperbarui</h4>
                <p className="text-emerald-700 leading-relaxed">{successMessage}</p>
                <div className="mt-2.5">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    <span>Lanjutkan ke Dashboard Proyek</span>
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <h4 className="font-semibold text-rose-900 mb-0.5">Peringatan</h4>
                <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Two-Column Form & Guidelines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card: Change Password Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Field 1: Kata Sandi Saat Ini */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="currentPassword"
                      className="text-xs font-semibold text-neutral-800 block"
                    >
                      Kata Sandi Saat Ini
                    </label>
                    <span className="text-[11px] text-neutral-400">Wajib diisi</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="currentPassword"
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi saat ini"
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-neutral-50 hover:bg-neutral-50/70 focus:bg-white rounded-xl border border-neutral-200 focus:border-[#C28448] focus:ring-1 focus:ring-[#C28448] transition-all outline-none text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      title={showCurrent ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5">
                    Jika belum pernah diubah, kata sandi bawaan admin adalah <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800 font-mono text-[10px]">admin123</code>.
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-100" />

                {/* Field 2: Kata Sandi Baru */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="newPassword"
                      className="text-xs font-semibold text-neutral-800 block"
                    >
                      Kata Sandi Baru
                    </label>
                    <span className="text-[11px] text-neutral-400">Min. 6 karakter</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-neutral-50 hover:bg-neutral-50/70 focus:bg-white rounded-xl border border-neutral-200 focus:border-[#C28448] focus:ring-1 focus:ring-[#C28448] transition-all outline-none text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      title={showNew ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field 3: Konfirmasi Kata Sandi Baru */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold text-neutral-800 block"
                    >
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <span className="text-[11px] text-neutral-400">Ketik ulang</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-neutral-50 hover:bg-neutral-50/70 focus:bg-white rounded-xl border border-neutral-200 focus:border-[#C28448] focus:ring-1 focus:ring-[#C28448] transition-all outline-none text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      title={showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Live validation checklist */}
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        isMinLength ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                    <span className={isMinLength ? 'text-emerald-700 font-medium' : 'text-neutral-500'}>
                      Panjang minimal 6 karakter
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        isMatch ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                    <span className={isMatch ? 'text-emerald-700 font-medium' : 'text-neutral-500'}>
                      Konfirmasi kata sandi cocok
                    </span>
                  </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Menyimpan kata sandi...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                        <span>Simpan Kata Sandi Baru</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/dashboard"
                    className="py-2.5 px-4 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium transition-colors"
                  >
                    Batal
                  </Link>
                </div>
              </form>
            </div>

            {/* Right Card: Security Best Practices & Info */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
                <div className="flex items-center gap-2 text-[#C28448] font-bold text-xs uppercase tracking-wider mb-3">
                  <Shield className="w-4 h-4" />
                  <span>Pedoman Keamanan Sandi</span>
                </div>

                <div className="space-y-3.5 text-xs text-neutral-600 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-neutral-100 text-neutral-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <p>
                      <strong>Kombinasi Karakter:</strong> Gunakan campuran huruf besar, huruf kecil, angka, dan simbol untuk kekuatan optimal.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-neutral-100 text-neutral-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <p>
                      <strong>Kerahasiaan Akun:</strong> Jangan berikan kredensial admin kepada siapapun di luar tim interior yang berwenang.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-lg bg-neutral-100 text-neutral-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <p>
                      <strong>Sinkronisasi Otomatis:</strong> Perubahan kata sandi Anda otomatis tersimpan aman ke database penyimpanan cloud Mitra Megah Interior.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
