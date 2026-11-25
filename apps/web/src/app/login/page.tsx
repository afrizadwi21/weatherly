"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteNav from "@/components/SiteNav";
import {
  setStoredSession,
  signOutSession,
  useWeatherlySession,
} from "@/lib/weatherly-session";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const session = useWeatherlySession();
  const [mode, setMode] = useState<"login" | "register">(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("mode") === "register"
        ? "register"
        : "login";
    }
    return "login";
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Alamat email belum lengkap. Contoh: nama@email.com");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    if (mode === "register") {
      if (fullName.trim().length < 2) {
        setError("Nama lengkap wajib diisi minimal 2 karakter.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Konfirmasi kata sandi tidak sama dengan kata sandi.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? {
                action: "register",
                fullName: fullName.trim(),
                email: email.trim(),
                password,
              }
            : {
                action: "login",
                email: email.trim(),
                password,
              }
        ),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal memproses akun.");
        setLoading(false);
        return;
      }

      const savedLocIds = Array.isArray(json.locations)
        ? json.locations.map((l: { adm2: string }) => `jabar-${l.adm2}`)
        : [];
      const notifMap: Record<string, boolean> = {};
      for (const lid of savedLocIds) {
        notifMap[lid] = true;
      }

      setStoredSession({
        id: json.user.id,
        email: json.user.email,
        name: json.user.name,
        savedLocations: savedLocIds,
        notificationsEnabled: notifMap,
        savedAIInsights: [],
        savedRoutes: [],
      });

      router.push("/dashboard");
    } catch {
      setError("Gagal memproses permintaan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteNav />
      <main className="login">
        <section className="login__intro" aria-labelledby="login-title">
          <span className="stamp">AKUN PERSONAL WEATHERLY</span>
          <h1 id="login-title" className="login__title">
            {mode === "register"
              ? "Daftar Akun Baru Weatherly."
              : "Masuk untuk fitur personal."}
          </h1>
          <p className="login__copy">
            Weatherly tidak memaksa login untuk melihat cuaca. Gunakan <strong>Guest Mode</strong>{" "}
            secara gratis, atau masuk dengan akun personal agar lokasi favorit, pengingat cuaca
            real-time, rute perjalanan Anda, dan laporan warga berfoto tersimpan pada akun Anda.
          </p>

          {!session && (
            <div className="login__modes">
              <div className="login__mode-box">
                <div className="login__mode-head">
                  <strong>1. Guest Mode (Tanpa Login)</strong>
                  <span className="stamp stamp--green">GRATIS</span>
                </div>
                <ul>
                  <li>Melihat cuaca saat ini &amp; prakiraan harian BMKG</li>
                  <li>Melihat radar hujan &amp; tanda Sebentar Lagi Hujan</li>
                  <li>Mengecek indeks UV dan kualitas udara (AQI)</li>
                  <li>Melihat peringatan cuaca publik BMKG &amp; Berita Acara</li>
                </ul>
              </div>

              <div className="login__mode-box login__mode-box--personal">
                <div className="login__mode-head">
                  <strong>2. Akun Personal (Masuk / Daftar)</strong>
                  <span className="stamp stamp--red">PERSONAL</span>
                </div>
                <ul>
                  <li>Menyimpan lokasi pilihan untuk Peringatan Cuaca Real-Time</li>
                  <li>Membuat &amp; menyimpan rute perjalanan Smart Travel</li>
                  <li>Mengirim laporan warga dengan bukti foto lapangan</li>
                  <li>Menyimpan histori analisis cuaca AI</li>
                </ul>
              </div>
            </div>
          )}
        </section>

        <section className="login__form-col" aria-label="Formulir Masuk dan Pendaftaran">
          {session ? (
            <div className="login__active-card">
              <span className="stamp stamp--green">AKUN PERSONAL AKTIF</span>
              <h2 className="login__subhead">Halo, {session.name}</h2>
              <p className="login__copy">
                Anda sedang masuk dengan akun <strong>{session.email}</strong>. Lokasi favorit,
                pengingat cuaca real-time, rute perjalanan, dan laporan warga Anda telah aktif.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                <Link href="/dashboard" className="btn-ink btn-lg">
                  Buka Dasbor Cuaca
                </Link>
                <button
                  type="button"
                  className="btn-line"
                  onClick={() => signOutSession()}
                >
                  Keluar Akun
                </button>
              </div>
            </div>
          ) : (
            <form className="login__form" onSubmit={handleSubmit} noValidate autoComplete="off">
              <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--rule-strong)", paddingBottom: "14px" }}>
                <button
                  type="button"
                  className="btn-outline"
                  aria-pressed={mode === "login"}
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  aria-pressed={mode === "register"}
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                >
                  Daftar Akun Baru
                </button>
              </div>

              <h2 className="login__subhead">
                {mode === "register"
                  ? "Buat Akun Baru Weatherly"
                  : "Masuk ke Akun Weatherly"}
              </h2>

              {mode === "register" && (
                <div className="field">
                  <label htmlFor="fullName">Nama Lengkap</label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="off"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    required
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="email">Alamat Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Kata Sandi (minimal 6 karakter)</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                />
              </div>

              {mode === "register" && (
                <div className="field">
                  <label htmlFor="confirmPassword">Konfirmasi Kata Sandi</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    required
                  />
                </div>
              )}

              {error && (
                <p className="login__msg login__msg--error" role="alert">
                  {error}
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="submit" className="btn-ink btn-lg" disabled={loading}>
                  {loading
                    ? "Memproses..."
                    : mode === "register"
                    ? "Daftar Akun"
                    : "Masuk Akun"}
                </button>
                <Link href="/dashboard" className="btn-line">
                  Lanjut Tanpa Login
                </Link>
              </div>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
