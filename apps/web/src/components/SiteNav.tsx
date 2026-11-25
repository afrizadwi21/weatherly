"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { signOutSession, useWeatherlySession } from "@/lib/weatherly-session";

/* Navbar items map 1:1 to the modules in PRODUCT.md (Capabilities and Constraints) + Access Modes. */
export const SITE_SECTIONS = [
  { id: "jabar-bmkg", label: "27 Kota/Kab & 627 Kec" },
  { id: "berita-acara", label: "Berita Acara" },
  { id: "nowcast", label: "Nowcast" },
  { id: "peringatan", label: "Peringatan" },
  { id: "ai-insights", label: "AI Insights" },
  { id: "lingkungan", label: "Udara & UV" },
  { id: "banjir-rute", label: "Banjir & Rute" },
  { id: "akses", label: "Mode Akses" },
] as const;

type Theme = "light" | "dark";

function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function handleToggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
  }

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={handleToggle}
      aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const onLanding = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const session = useWeatherlySession();

  useEffect(() => {
    if (!onLanding) return;
    const targets = SITE_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onLanding]);

  const sectionHref = (id: string) => (onLanding ? `#${id}` : `/#${id}`);

  const visibleSections = session
    ? SITE_SECTIONS.filter((s) => s.id !== "akses")
    : SITE_SECTIONS;

  return (
    <header className="site-nav">
      <div className="site-nav__bar">
        <Link href="/" className="site-nav__brand" aria-label="Weatherly, beranda">
          Weatherly
        </Link>

        <nav className="site-nav__links" aria-label="Modul Weatherly">
          {visibleSections.map((s) => (
            <a
              key={s.id}
              href={sectionHref(s.id)}
              className="site-nav__link"
              aria-current={onLanding && activeId === s.id ? "true" : undefined}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="site-nav__actions">
          <span
            className={`stamp ${session ? "stamp--green" : "stamp--muted"}`}
            title={session ? `Masuk sebagai ${session.email}` : "Mode Tamu — Akses Publik Gratis"}
          >
            {session ? `AKUN · ${session.name.toUpperCase()}` : "TANPA LOGIN · GRATIS"}
          </span>
          <Link
            href="/dashboard"
            className="site-nav__link site-nav__link--plain"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            Dasbor
          </Link>
          <ThemeToggle />
          {session ? (
            <button
              type="button"
              className="btn-outline"
              onClick={() => signOutSession()}
              title="Keluar dari akun"
            >
              Keluar
            </button>
          ) : (
            <>
              <Link href="/login?mode=register" className="btn-outline" style={{ textDecoration: "none" }}>
                Daftar
              </Link>
              <Link href="/login" className="btn-ink btn-sm">
                Masuk
              </Link>
            </>
          )}
          <button
            type="button"
            className="icon-btn site-nav__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-nav-drawer"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <nav
        id="site-nav-drawer"
        className="site-nav__drawer"
        aria-label="Modul Weatherly (menu)"
        hidden={!menuOpen}
      >
        {visibleSections.map((s) => (
          <a key={s.id} href={sectionHref(s.id)} className="site-nav__drawer-link" onClick={() => setMenuOpen(false)}>
            {s.label}
          </a>
        ))}
        <Link href="/dashboard" className="site-nav__drawer-link" onClick={() => setMenuOpen(false)}>
          Dasbor Cuaca
        </Link>
      </nav>
    </header>
  );
}
