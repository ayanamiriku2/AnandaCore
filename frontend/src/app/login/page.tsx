"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Email atau password salah";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh]">
      {/* ===== LEFT BRANDING PANEL ===== */}
      <div className="hidden lg:flex w-[52%] bg-gradient-to-br from-blue-800 via-blue-500 to-indigo-500 flex-col justify-between p-12 relative overflow-hidden text-white">
        {/* Decorative circles */}
        <div className="absolute -top-[100px] -right-[80px] w-[400px] h-[400px] rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-[120px] -left-[60px] w-[500px] h-[500px] rounded-full bg-white/[0.04]" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo-192.png"
              alt="Logo"
              className="w-11 h-11 rounded-xl"
            />
            <span className="text-xl font-bold tracking-tight">
              AnandaCore
            </span>
          </div>
        </div>

        {/* Center: Hero text */}
        <div className="relative z-10 max-w-[440px]">
          <h1 className="text-[40px] font-extrabold leading-[1.15] mb-4 tracking-tight">
            Sistem Manajemen
            <br />
            <span className="text-blue-200">Yayasan Kasih Ananda</span>
          </h1>
          <p className="text-base leading-relaxed text-blue-200/85 mb-8">
            Platform terpadu untuk mengelola program, dokumen, mitra, dan seluruh
            operasional yayasan secara efisien dan transparan.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "📁 Arsip Digital",
              "✉️ Surat Menyurat",
              "📋 Program & Kegiatan",
              "🤝 Manajemen Mitra",
              "🏷️ Aset & Inventaris",
            ].map((f) => (
              <span
                key={f}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.12] border border-white/[0.15] text-[13px] text-blue-100 whitespace-nowrap"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom: Quote */}
        <div className="relative z-10 border-t border-white/[0.12] pt-6">
          <p className="text-sm text-blue-200/50 italic">
            &ldquo;Melayani dengan kasih, mengelola dengan profesional&rdquo;
          </p>
        </div>
      </div>

      {/* ===== RIGHT LOGIN PANEL ===== */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 bg-slate-50">
        <div className="w-full max-w-[400px]">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <img
              src="/logo-192.png"
              alt="Logo"
              className="w-12 h-12 rounded-xl"
            />
            <div>
              <div className="text-xl font-bold text-gray-900">
                AnandaCore
              </div>
              <div className="text-xs text-gray-500">
                Yayasan Kasih Ananda
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">
            Selamat Datang
          </h2>
          <p className="text-[15px] text-gray-500 mb-8">
            Masuk ke akun Anda untuk melanjutkan
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
              <span className="text-lg">⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 text-sm rounded-[10px] border-[1.5px] border-gray-300 bg-white text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-4 pr-12 py-3 text-sm rounded-[10px] border-[1.5px] border-gray-300 bg-white text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-lg text-gray-400 leading-none"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-[15px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-[10px] transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>Masuk →</>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            &copy; {new Date().getFullYear()} Yayasan Kasih Ananda &mdash; All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
