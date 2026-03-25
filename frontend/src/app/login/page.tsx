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

  function fillDemo() {
    setEmail("admin@anandacore.io");
    setPassword("AnandaCore2026!");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ===== LEFT BRANDING PANEL ===== */}
      <div
        style={{
          width: "52%",
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
        className="hidden lg:flex"
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-60px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />

        {/* Top: Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              ❤
            </div>
            <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px" }}>
              AnandaCore
            </span>
          </div>
        </div>

        {/* Center: Hero text */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "440px" }}>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "16px",
              letterSpacing: "-1px",
            }}
          >
            Sistem Manajemen
            <br />
            <span style={{ color: "#bfdbfe" }}>Yayasan Kasih Ananda</span>
          </h1>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "rgba(191, 219, 254, 0.85)",
              marginBottom: "32px",
            }}
          >
            Platform terpadu untuk mengelola program, dokumen, mitra, dan seluruh
            operasional yayasan secara efisien dan transparan.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              "📁 Arsip Digital",
              "✉️ Surat Menyurat",
              "📋 Program & Kegiatan",
              "🤝 Manajemen Mitra",
              "🏷️ Aset & Inventaris",
            ].map((f) => (
              <span
                key={f}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "13px",
                  color: "#dbeafe",
                  whiteSpace: "nowrap",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom: Quote */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "24px",
          }}
        >
          <p style={{ fontSize: "14px", color: "rgba(191, 219, 254, 0.5)", fontStyle: "italic" }}>
            &ldquo;Melayani dengan kasih, mengelola dengan profesional&rdquo;
          </p>
        </div>
      </div>

      {/* ===== RIGHT LOGIN PANEL ===== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          background: "#f8fafc",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Mobile-only logo */}
          <div
            className="lg:hidden"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
              }}
            >
              ❤
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                AnandaCore
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Yayasan Kasih Ananda
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
            Selamat Datang
          </h2>
          <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "32px" }}>
            Masuk ke akun Anda untuk melanjutkan
          </p>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: "24px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="nama@anandacore.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "14px",
                  borderRadius: "10px",
                  border: "1.5px solid #d1d5db",
                  background: "#ffffff",
                  color: "#111827",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    padding: "12px 48px 12px 16px",
                    fontSize: "14px",
                    borderRadius: "10px",
                    border: "1.5px solid #d1d5db",
                    background: "#ffffff",
                    color: "#111827",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#9ca3af",
                    padding: "4px",
                    lineHeight: 1,
                  }}
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
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 600,
                color: "white",
                background: loading ? "#93c5fd" : "#2563eb",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s, box-shadow 0.2s",
                boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseOver={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = "#1d4ed8";
              }}
              onMouseOut={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = "#2563eb";
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  Memproses...
                </>
              ) : (
                <>Masuk →</>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div
            style={{
              marginTop: "32px",
              padding: "16px 20px",
              borderRadius: "12px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#1d4ed8",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "10px",
              }}
            >
              Demo Credentials
            </div>
            <table style={{ fontSize: "13px", color: "#1e3a5f", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ paddingRight: "12px", paddingBottom: "4px", color: "#3b82f6", fontWeight: 500 }}>
                    Email
                  </td>
                  <td style={{ paddingBottom: "4px" }}>
                    <button
                      type="button"
                      onClick={fillDemo}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "monospace",
                        fontSize: "13px",
                        color: "#1e3a5f",
                        padding: 0,
                        textDecoration: "underline",
                        textDecorationColor: "#93c5fd",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      admin@anandacore.io
                    </button>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingRight: "12px", color: "#3b82f6", fontWeight: 500 }}>
                    Password
                  </td>
                  <td>
                    <code
                      style={{
                        fontFamily: "monospace",
                        fontSize: "13px",
                        background: "#dbeafe",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        color: "#1e3a5f",
                      }}
                    >
                      AnandaCore2026!
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#9ca3af",
              marginTop: "32px",
            }}
          >
            &copy; {new Date().getFullYear()} Yayasan Kasih Ananda &mdash; All rights reserved.
          </p>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
