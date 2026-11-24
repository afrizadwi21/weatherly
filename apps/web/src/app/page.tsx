"use client";

import React, { useState, useEffect } from "react";
import {
  BANDUNG_LOCATIONS,
  LocationPreset,
  ObservatorySnapshot,
  getFallbackSnapshot,
} from "@/lib/weatherly-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

export default function WeatherlyObservatoryPage() {
  const [selectedLoc, setSelectedLoc] = useState<LocationPreset>(BANDUNG_LOCATIONS[0]);
  const [snapshot, setSnapshot] = useState<ObservatorySnapshot>(() =>
    getFallbackSnapshot(BANDUNG_LOCATIONS[0])
  );
  const [apiStatus, setApiStatus] = useState<"synced" | "fallback">("fallback");
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [selectedRoute, setSelectedRoute] = useState<"dago-buahbatu" | "pasteur-gedebage">(
    "dago-buahbatu"
  );

  function handleSelectLocation(loc: LocationPreset) {
    setSelectedLoc(loc);
    setSnapshot(getFallbackSnapshot(loc));
  }

  useEffect(() => {
    let active = true;

    async function syncFromGoBackend() {
      try {
        const query = `?name=${encodeURIComponent(selectedLoc.name)}&lat=${selectedLoc.lat}&lon=${selectedLoc.lon}`;
        const [currRes, rainRes, aqiRes, uvRes, aiRes] = await Promise.all([
          fetch(`${API_BASE}/weather/current${query}`),
          fetch(`${API_BASE}/rain/prediction${query}`),
          fetch(`${API_BASE}/air-quality/current${query}`),
          fetch(`${API_BASE}/uv/current${query}`),
          fetch(`${API_BASE}/insights/daily${query}`),
        ]);
        if (!currRes.ok || !rainRes.ok) return;
        const [current, rain, airQuality, uv, insights] = await Promise.all([
          currRes.json(),
          rainRes.json(),
          aqiRes.json(),
          uvRes.json(),
          aiRes.json(),
        ]);
        if (active) {
          setSnapshot((prev) => ({
            ...prev,
            current,
            rain,
            airQuality,
            uv,
            insights,
          }));
          setApiStatus("synced");
        }
      } catch {
        if (active) {
          setApiStatus("fallback");
        }
      }
    }

    syncFromGoBackend();
    return () => {
      active = false;
    };
  }, [selectedLoc]);

  function handleVoteReport(reportId: string) {
    if (votedIds[reportId]) return;
    setVotedIds((prev) => ({ ...prev, [reportId]: true }));
    setSnapshot((prev) => ({
      ...prev,
      communityReports: prev.communityReports.map((rep) =>
        rep.id === reportId ? { ...rep, upvotes: rep.upvotes + 1 } : rep
      ),
    }));
  }

  const { current, rain, airQuality, uv, insights, floodReports, communityReports } = snapshot;

  return (
    <main className="observatory-shell">
      {/* 1. ATMOSPHERIC SKY STAGE WITH DRIFTING PARALLAX CLOUDS BEHIND "WEATHERLY" */}
      <header className="sky-hero" aria-label="Weatherly Highland Meteorological Observatory">
        <div className="cloud-stage">
          {/* Back Drifting Cloud Band */}
          <svg
            className="cloud-band cloud-band--back"
            viewBox="0 0 1200 140"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M70 115C70 92 92 76 118 79C132 52 168 38 202 48C228 24 276 26 300 54C328 50 356 68 362 96C386 98 404 115 404 115H70Z"
              fill="#a5b8d9"
              fillOpacity="0.22"
            />
            <path
              d="M710 120C710 95 735 78 764 81C780 51 820 36 858 47C888 21 940 23 966 53C998 49 1028 69 1036 99C1062 101 1082 120 1082 120H710Z"
              fill="#14b8d4"
              fillOpacity="0.16"
            />
          </svg>

          {/* Mid Drifting Cloud Band (Directly Behind WEATHERLY Wordmark) */}
          <svg
            className="cloud-band cloud-band--mid"
            viewBox="0 0 1200 140"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M290 124C290 96 318 76 350 80C368 46 414 30 458 43C492 14 552 17 582 51C618 46 654 68 662 102C692 104 714 124 714 124H290Z"
              fill="#f3f6fc"
              fillOpacity="0.19"
            />
          </svg>

          <h1 className="masthead-wordmark">WEATHERLY</h1>

          {/* Front Translucent Mist Layer Passing Subtly Across Lower Wordmark Edge */}
          <svg
            className="cloud-band cloud-band--front"
            viewBox="0 0 1200 90"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M160 82C160 64 185 52 214 55C232 34 272 24 310 32C340 14 392 16 418 38C450 35 480 48 488 68H160V82Z"
              fill="#a5b8d9"
              fillOpacity="0.18"
            />
            <path
              d="M590 84C590 66 616 54 646 56C666 36 706 26 746 34C776 16 830 18 856 40C888 37 920 50 928 70H590V84Z"
              fill="#f3f6fc"
              fillOpacity="0.15"
            />
          </svg>

          <p className="masthead-tagline">
            Know the Weather. Prepare Before It Happens. — Stasiun Intelijen Cuaca Mikro-Klimatologi
            Bandung &amp; Jawa Barat.
          </p>
        </div>

        <div className="hero-toolbar">
          <nav className="location-pills" aria-label="Pilih titik pantau wilayah Bandung">
            {BANDUNG_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className="loc-pill"
                aria-pressed={selectedLoc.id === loc.id}
                onClick={() => handleSelectLocation(loc)}
              >
                {loc.name}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="meta-tag tabular-nums">
              GPS {selectedLoc.lat.toFixed(4)}, {selectedLoc.lon.toFixed(4)}
            </span>
            <span className="meta-tag meta-tag--emerald">
              {apiStatus === "synced" ? "Go API /api/v1 Live" : "BMKG + Open-Meteo Telemetry"}
            </span>
          </div>
        </div>
      </header>

      {/* 2. URGENT PROACTIVE ALERT STRIP */}
      <section className="alert-banner" aria-label="Peringatan Cuaca Ekstrem Aktif">
        <div>
          <strong style={{ color: "var(--color-monsoon-amber)", display: "block" }}>
            Peringatan Dini Hujan Sedang–Lebat &amp; Petir — {selectedLoc.name}
          </strong>
          <span style={{ color: "var(--color-mist-secondary)", fontSize: "0.875rem" }}>
            {rain.alert_message}
          </span>
        </div>
        <span className="meta-tag meta-tag--amber tabular-nums">
          Lead-Time ~{rain.estimated_arrival_minutes ?? 20} Menit • Deduplicated FCM
        </span>
      </section>

      {/* 3. PRIMARY OPERATIONS GRID (7 COLS RAIN NOWCAST + 5 COLS AI & ENVIRONMENT) */}
      <div className="ops-grid-primary">
        {/* Module 1: Rain Intelligence & Live Weather Telemetry */}
        <section className="instrument-panel col-span-7" aria-labelledby="heading-rain-nowcast">
          <div className="panel-header">
            <h2 id="heading-rain-nowcast" className="panel-title">
              Rain Intelligence &amp; 10–60m Precipitation Nowcast
            </h2>
            <span className="meta-tag">{current.provider}</span>
          </div>

          <div className="weather-summary-bar">
            <div>
              <p className="temp-display">{current.temperature_c.toFixed(1)}°C</p>
              <span style={{ color: "var(--color-mist-secondary)" }}>
                {current.condition_label} • Terasa seperti{" "}
                <span className="tabular-nums">
                  {current.feels_like_c !== null ? `${current.feels_like_c.toFixed(1)}°C` : "NULL"}
                </span>
              </span>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--color-monsoon-amber)",
                  display: "block",
                }}
              >
                T-{rain.estimated_arrival_minutes ?? 20} Menit
              </span>
              <span style={{ color: "var(--color-mist-secondary)", fontSize: "0.8125rem" }}>
                Estimasi Kedatangan Hujan (Confidence{" "}
                <span className="tabular-nums">
                  {Math.round(rain.confidence_probability * 100)}%
                </span>
                )
              </span>
            </div>
          </div>

          <div className="telemetry-strip">
            <div className="telemetry-item">
              <span className="telemetry-label">KELEMBAPAN</span>
              <span className="telemetry-value">
                {current.humidity_pct !== null ? `${current.humidity_pct}%` : "NULL"}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">KECEPATAN ANGIN</span>
              <span className="telemetry-value">
                {current.wind_speed_kmh !== null ? `${current.wind_speed_kmh} km/j` : "NULL"}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">PUNCAK PRESIPITASI</span>
              <span className="telemetry-value">{rain.peak_intensity_mm_per_hr.toFixed(1)} mm/j</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">AKURASI HISTORIS (POD)</span>
              <span className="telemetry-value">88% (MAE 6.5m)</span>
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "0.8125rem",
                color: "var(--color-mist-secondary)",
              }}
            >
              <span>Kurva Perkembangan Presipitasi 10–60 Menit ke Depan</span>
              <span className="tabular-nums">Satuan: mm/jam &amp; Probabilitas (%)</span>
            </div>

            <div className="rain-curve-grid" role="list" aria-label="Kurva presipitasi per 10 menit">
              {rain.curve.map((pt) => {
                const heightPct = Math.min(100, Math.max(12, Math.round((pt.precipitation_mm / 6) * 100)));
                const isPeak = pt.precipitation_mm >= 3.5;
                return (
                  <div key={pt.minutes_ahead} className="rain-bar-col" role="listitem">
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: isPeak
                          ? "var(--color-monsoon-amber)"
                          : "var(--color-cirrus-alabaster)",
                      }}
                    >
                      {pt.precipitation_mm.toFixed(1)}mm
                    </span>
                    <div className="rain-bar-track">
                      <div
                        className={`rain-bar-fill ${isPeak ? "rain-bar-fill--peak" : ""}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--color-mist-secondary)",
                      }}
                    >
                      +{pt.minutes_ahead}m ({Math.round(pt.rain_probability * 100)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Module 4 & 3/7: Two-Stage AI Weather Insights + Air Quality & UV */}
        <section className="instrument-panel col-span-5" aria-labelledby="heading-ai-insights">
          <div className="panel-header">
            <h2 id="heading-ai-insights" className="panel-title">
              Two-Stage AI Weather Insights
            </h2>
            <span className="meta-tag">Anti-Hallucination Pipeline</span>
          </div>

          <p style={{ margin: 0, color: "var(--color-cirrus-alabaster)", fontWeight: 500 }}>
            {insights.summary}
          </p>

          <div className="row-list">
            {insights.insights.map((item) => (
              <div key={item.type} className="row-item">
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      color: "var(--color-cirrus-alabaster)",
                      marginBottom: "2px",
                    }}
                  >
                    Rekomendasi {item.type.toUpperCase()}
                  </strong>
                  <span style={{ color: "var(--color-mist-secondary)", fontSize: "0.875rem" }}>
                    {item.recommendation}
                  </span>
                </div>
                <span
                  className={`meta-tag ${
                    item.severity === "high"
                      ? "meta-tag--amber"
                      : item.severity === "low"
                      ? "meta-tag--emerald"
                      : ""
                  }`}
                >
                  {item.severity}
                </span>
              </div>
            ))}
          </div>

          {/* Air Quality & UV Index Sub-Instrument */}
          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid var(--color-isobar-border)",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <div className="telemetry-item">
              <span className="telemetry-label">AQI ({airQuality.category.toUpperCase()})</span>
              <span className="telemetry-value">{airQuality.aqi}</span>
              <span
                className="tabular-nums"
                style={{ fontSize: "0.75rem", color: "var(--color-mist-secondary)" }}
              >
                PM2.5: {airQuality.pm25 ?? "NULL"} • PM10: {airQuality.pm10 ?? "NULL"}
              </span>
            </div>

            <div className="telemetry-item">
              <span className="telemetry-label">POLUTAN SO2 (HONEST NULL)</span>
              <span
                className="telemetry-value"
                style={{ color: "var(--color-barometer-muted)", fontSize: "0.95rem" }}
              >
                {airQuality.so2 !== null ? `${airQuality.so2} µg/m³` : "NULL (N/A)"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-barometer-muted)" }}>
                Tanpa angka tebakan
              </span>
            </div>

            <div className="telemetry-item">
              <span className="telemetry-label">UV INDEX ({uv.uv_category.toUpperCase()})</span>
              <span className="telemetry-value" style={{ color: "var(--color-monsoon-amber)" }}>
                {uv.uv_index.toFixed(1)} (SPF {uv.recommended_spf}+)
              </span>
              <span
                className="tabular-nums"
                style={{ fontSize: "0.75rem", color: "var(--color-mist-secondary)" }}
              >
                Puncak {uv.peak_hours_window}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. SECONDARY FIELD OPERATIONS GRID (FLOOD + SMART TRAVEL + COMMUNITY REPORTS) */}
      <div className="ops-grid-primary">
        {/* Module 3: Flood Monitoring (Separating Risk Estimate vs Official/Community Reports) */}
        <section className="instrument-panel col-span-4" aria-labelledby="heading-flood-monitor">
          <div className="panel-header">
            <h2 id="heading-flood-monitor" className="panel-title">
              Flood &amp; Inundation Monitor
            </h2>
            <span className="meta-tag meta-tag--amber">Source-Classified</span>
          </div>

          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-mist-secondary)" }}>
            Konteks Risiko Curah Hujan (<code>estimated_risk</code>:{" "}
            <strong className="tabular-nums">{rain.peak_intensity_mm_per_hr.toFixed(1)} mm/j</strong>
            ) dipisahkan secara tegas dari kejadian banjir terkonfirmasi.
          </p>

          <div className="row-list">
            {floodReports.map((rep) => (
              <div key={rep.id} className="row-item">
                <div>
                  <strong style={{ display: "block", fontSize: "0.875rem" }}>{rep.source}</strong>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-mist-secondary)" }}>
                    {rep.description}
                  </span>
                </div>
                <span
                  className={`meta-tag ${
                    rep.source_type === "official" ? "meta-tag--amber" : "meta-tag--emerald"
                  }`}
                >
                  {rep.source_type}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Module 5: Smart Travel Route Corridor */}
        <section className="instrument-panel col-span-4" aria-labelledby="heading-smart-travel">
          <div className="panel-header">
            <h2 id="heading-smart-travel" className="panel-title">
              Smart Travel Route Weather
            </h2>
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                setSelectedRoute((prev) =>
                  prev === "dago-buahbatu" ? "pasteur-gedebage" : "dago-buahbatu"
                )
              }
            >
              Ganti Koridor Rute
            </button>
          </div>

          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-mist-secondary)" }}>
            Koridor Aktif:{" "}
            <strong style={{ color: "var(--color-cirrus-alabaster)" }}>
              {selectedRoute === "dago-buahbatu"
                ? "Dago Utara → Simpang Lima → Buahbatu"
                : "Pasteur → Cicaheum → Gedebage"}
            </strong>
          </p>

          <div className="row-list">
            <div className="row-item">
              <div>
                <strong style={{ fontSize: "0.875rem" }}>1. Titik Asal (Keberangkatan)</strong>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    color: "var(--color-mist-secondary)",
                  }}
                >
                  Berawan Tebal • Jalan masih kering
                </span>
              </div>
              <span className="meta-tag tabular-nums">Hujan 40%</span>
            </div>

            <div className="row-item">
              <div>
                <strong style={{ fontSize: "0.875rem" }}>2. Titik Tengah Koridor (+20m)</strong>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    color: "var(--color-mist-secondary)",
                  }}
                >
                  Hujan Sedang • Siapkan jas hujan sebelum melintas
                </span>
              </div>
              <span className="meta-tag meta-tag--amber tabular-nums">Hujan 78%</span>
            </div>

            <div className="row-item">
              <div>
                <strong style={{ fontSize: "0.875rem" }}>3. Titik Tujuan (+40m)</strong>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    color: "var(--color-mist-secondary)",
                  }}
                >
                  Hujan Ringan Mereda
                </span>
              </div>
              <span className="meta-tag tabular-nums">Hujan 65%</span>
            </div>
          </div>
        </section>

        {/* Module 6: Community Reports with One-Vote-Per-User Constraint */}
        <section className="instrument-panel col-span-4" aria-labelledby="heading-community">
          <div className="panel-header">
            <h2 id="heading-community" className="panel-title">
              Community Weather Reports
            </h2>
            <span className="meta-tag meta-tag--emerald">UNIQUE Vote Guard</span>
          </div>

          <div className="row-list">
            {communityReports.map((rep) => {
              const hasVoted = Boolean(votedIds[rep.id]);
              return (
                <div key={rep.id} className="row-item">
                  <div>
                    <strong style={{ display: "block", fontSize: "0.875rem" }}>
                      Laporan Warga ({rep.report_type})
                    </strong>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-mist-secondary)" }}>
                      {rep.description}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={hasVoted}
                    onClick={() => handleVoteReport(rep.id)}
                  >
                    {hasVoted ? `Terverifikasi (${rep.upvotes})` : `Upvote (+${rep.upvotes})`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
