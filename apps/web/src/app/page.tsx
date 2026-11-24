"use client";

import React, { useState, useEffect } from "react";
import {
  BANDUNG_LOCATIONS,
  INITIAL_COMMUNITY_REPORTS,
  INITIAL_FLOOD_ZONES,
  LocationDashboardState,
  LocationOption,
  SMART_TRAVEL_CORRIDORS,
  buildLocationState,
} from "@/lib/weatherly-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

export default function WeatherlyDashboardPage() {
  const [selectedLoc, setSelectedLoc] = useState<LocationOption>(BANDUNG_LOCATIONS[0]);
  const [data, setData] = useState<LocationDashboardState>(() =>
    buildLocationState(BANDUNG_LOCATIONS[0])
  );
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(SMART_TRAVEL_CORRIDORS[0].id);
  const [communityReports, setCommunityReports] = useState(INITIAL_COMMUNITY_REPORTS);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});
  const [newReportText, setNewReportText] = useState<string>("");
  const [newReportType, setNewReportType] = useState<
    "Hujan Lokal" | "Genangan / Banjir" | "Angin Kencang" | "Pohon Tumbang"
  >("Hujan Lokal");
  const [activeAIQuestionId, setActiveAIQuestionId] = useState<string>("ai-q1");

  function handleSelectLocation(loc: LocationOption) {
    setSelectedLoc(loc);
    setData(buildLocationState(loc));
  }

  useEffect(() => {
    let active = true;
    async function syncLiveBackend() {
      try {
        const q = `?name=${encodeURIComponent(selectedLoc.name)}&lat=${selectedLoc.lat}&lon=${selectedLoc.lon}`;
        const [currRes, rainRes] = await Promise.all([
          fetch(`${API_BASE}/weather/current${q}`),
          fetch(`${API_BASE}/rain/prediction${q}`),
        ]);
        if (!currRes.ok || !rainRes.ok) return;
        const currJson = await currRes.json();
        const rainJson = await rainRes.json();
        if (active && typeof currJson.temperature_c === "number") {
          setData((prev) => ({
            ...prev,
            currentTempC: currJson.temperature_c,
            rainArrivalMin: rainJson.estimated_arrival_minutes ?? prev.rainArrivalMin,
            peakPrecipMmHr: rainJson.peak_intensity_mm_per_hr ?? prev.peakPrecipMmHr,
          }));
          setBackendConnected(true);
        }
      } catch {
        if (active) setBackendConnected(false);
      }
    }
    syncLiveBackend();
    return () => {
      active = false;
    };
  }, [selectedLoc]);

  function handleUpvoteReport(id: string) {
    if (votedMap[id]) return;
    setVotedMap((prev) => ({ ...prev, [id]: true }));
    setCommunityReports((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, upvotes: item.upvotes + 1, verified: item.upvotes + 1 >= 5 }
          : item
      )
    );
  }

  function handleAddCommunityReport(e: React.FormEvent) {
    e.preventDefault();
    const clean = newReportText.trim();
    if (!clean) return;
    const newId = `comm-0${communityReports.length + 1}`;
    setCommunityReports((prev) => [
      {
        id: newId,
        author: "Anda (Kontributor Weatherly)",
        locationName: selectedLoc.name,
        reportType: newReportType,
        description: clean,
        coords: `${selectedLoc.lat.toFixed(4)}, ${selectedLoc.lon.toFixed(4)}`,
        timeAgo: "Baru saja",
        verified: false,
        upvotes: 1,
      },
      ...prev,
    ]);
    setVotedMap((prev) => ({ ...prev, [newId]: true }));
    setNewReportText("");
  }

  const activeRoute =
    SMART_TRAVEL_CORRIDORS.find((r) => r.id === selectedRouteId) || SMART_TRAVEL_CORRIDORS[0];

  return (
    <main className="weatherly-app">
      {/* ====================================================================
          1. HEADER & ATMOSPHERIC SKY HERO WITH DRIFTING PARALLAX CLOUDS
          ==================================================================== */}
      <header className="hero-observatory">
        <div className="sky-canvas">
          {/* Cloud Layer 1 (Deep Background) */}
          <svg
            className="drifting-cloud drifting-cloud--layer1"
            viewBox="0 0 1200 160"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M80 135C80 105 110 84 146 88C166 52 214 34 260 48C294 18 358 20 390 56C428 50 464 74 474 110C506 112 528 135 528 135H80Z"
              fill="#a8bbd8"
              fillOpacity="0.22"
            />
            <path
              d="M690 140C690 110 722 88 760 92C782 54 832 36 880 50C916 18 982 22 1014 58C1054 52 1092 78 1102 115H690V140Z"
              fill="#22d3ee"
              fillOpacity="0.18"
            />
          </svg>

          {/* Cloud Layer 2 (Midground Directly Behind WEATHERLY) */}
          <svg
            className="drifting-cloud drifting-cloud--layer2"
            viewBox="0 0 1200 160"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M270 144C270 108 308 82 350 87C374 44 434 24 492 40C536 4 614 8 652 50C698 44 744 72 756 116C794 118 820 144 820 144H270Z"
              fill="#ffffff"
              fillOpacity="0.22"
            />
          </svg>

          <div className="brand-badge-row">
            <span className="pulse-dot" />
            <span>WEATHER INTELLIGENCE PLATFORM • BANDUNG &amp; JAWA BARAT</span>
          </div>

          <h1 className="brand-title">WEATHERLY</h1>

          {/* Cloud Layer 3 (Foreground Mist Drifting Across Lower Typography) */}
          <svg
            className="drifting-cloud drifting-cloud--layer3"
            viewBox="0 0 1200 100"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M190 92C190 70 222 56 258 60C280 36 330 24 378 34C414 12 478 14 510 40C550 36 588 52 598 76H190V92Z"
              fill="#f4f7fb"
              fillOpacity="0.16"
            />
            <path
              d="M620 94C620 72 652 58 690 62C714 38 764 26 814 36C852 14 918 16 950 42C990 38 1028 54 1038 78H620V94Z"
              fill="#a8bbd8"
              fillOpacity="0.18"
            />
          </svg>

          <p className="brand-motto">
            Know the Weather. Prepare Before It Happens. — Prediksi Kedatangan Hujan 10–60 Menit,
            Peringatan Cuaca Ekstrem BMKG, &amp; Rekomendasi Aktivitas Berbasis AI.
          </p>
        </div>

        {/* Location Management Switcher & Telemetry Status */}
        <div className="hero-controls-bar">
          <nav className="location-switcher" aria-label="Manajemen Lokasi Pemantauan Bandung">
            {BANDUNG_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className="loc-chip"
                aria-pressed={selectedLoc.id === loc.id}
                onClick={() => handleSelectLocation(loc)}
              >
                <span>{loc.name}</span>
                <span className="tabular-nums" style={{ opacity: 0.75, fontSize: "0.75rem" }}>
                  ({loc.elevationM}m)
                </span>
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="badge-pill tabular-nums">
              PostGIS {selectedLoc.lat.toFixed(4)}, {selectedLoc.lon.toFixed(4)} • ADM4{" "}
              {selectedLoc.adm4}
            </span>
            <span className="badge-pill badge-pill--success">
              {backendConnected ? "Go API /api/v1 Terhubung" : "BMKG + Open-Meteo Normalized"}
            </span>
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. WEATHERLY POSITIONING TRIO (ANSWERING WHAT, WHEN, AND HOW TO PREPARE)
          ==================================================================== */}
      <section className="decision-trio-grid" aria-label="Keputusan Cuaca Proaktif">
        <div className="decision-box">
          <span className="decision-question">1. APA YANG AKAN TERJADI DI LOKASI SAYA?</span>
          <p className="decision-answer">{data.conditionLabel}</p>
          <p className="decision-sub">
            {selectedLoc.district} • Suhu aktual{" "}
            <strong className="tabular-nums">{data.currentTempC.toFixed(1)}°C</strong> (Kelembapan{" "}
            <strong className="tabular-nums">{data.humidityPct}%</strong>)
          </p>
        </div>

        <div className="decision-box decision-box--urgent">
          <span className="decision-question" style={{ color: "var(--accent-amber)" }}>
            2. KAPAN HUJAN AKAN TURUN (NOWCASTING)?
          </span>
          <p className="decision-answer tabular-nums" style={{ color: "var(--accent-amber)" }}>
            Tiba dalam ~{data.rainArrivalMin} Menit (Puncak {data.peakPrecipMmHr} mm/jam)
          </p>
          <p className="decision-sub">
            Confidence <strong className="tabular-nums">{data.rainConfidencePct}%</strong> •{" "}
            {data.rainAlertSummary}
          </p>
        </div>

        <div className="decision-box">
          <span className="decision-question">3. APA YANG SEBAIKNYA SAYA PERSIAPKAN?</span>
          <p className="decision-answer">Siapkan Jas Hujan / Payung &amp; Cek Rute</p>
          <p className="decision-sub">{data.whatToPrepare}</p>
        </div>
      </section>

      {/* ====================================================================
          3. ROW 1: LIVE WEATHER + RAIN INTELLIGENCE (7 COL) & EXTREME ALERTS + RADAR (5 COL)
          ==================================================================== */}
      <div className="dashboard-grid">
        {/* MODULE 1: RAIN INTELLIGENCE & CURRENT WEATHER */}
        <section className="module-panel span-7" aria-labelledby="mod-rain-intelligence">
          <div className="module-header">
            <div className="module-title-group">
              <h2 id="mod-rain-intelligence" className="module-title">
                Current Weather &amp; Rain Intelligence (10–60 Menit)
              </h2>
              <span className="badge-pill badge-pill--core">CORE MODULE 01</span>
            </div>
            <span className="badge-pill tabular-nums">
              Akurasi Historis: POD 88% • FAR 12% • MAE 6.5m
            </span>
          </div>

          <div className="live-weather-hero">
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
                <p className="temp-giant tabular-nums">{data.currentTempC.toFixed(1)}°C</p>
                <div>
                  <strong style={{ color: "var(--accent-cyan)", display: "block" }}>
                    {data.conditionLabel}
                  </strong>
                  <span className="tabular-nums" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Terasa {data.feelsLikeC.toFixed(1)}°C • H: {data.highTempC}° / L: {data.lowTempC}°
                  </span>
                </div>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: "0.86rem", color: "var(--text-secondary)" }}>
                {data.rainAlertSummary} Estimasi durasi hujan sekitar{" "}
                <strong className="tabular-nums">{data.rainDurationMin} menit</strong>.
              </p>
            </div>

            <div className="metrics-grid-4">
              <div className="metric-tile">
                <span className="metric-label">KELEMBAPAN &amp; EMBUN</span>
                <span className="metric-val">
                  {data.humidityPct}% <small style={{ fontWeight: 400, fontSize: "0.8rem" }}>({data.dewPointC}°C)</small>
                </span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">ANGIN</span>
                <span className="metric-val">{data.windSpeedKmh} km/j</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">TEKANAN UDARA</span>
                <span className="metric-val">{data.pressureHpa} hPa</span>
              </div>
              <div className="metric-tile">
                <span className="metric-label">JARAK PANDANG</span>
                <span className="metric-val">{data.visibilityKm} km</span>
              </div>
            </div>
          </div>

          {/* 10-60 Minute Precipitation Progression Chart */}
          <div className="nowcast-chart-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <strong style={{ fontSize: "0.88rem" }}>
                Grafik Perkembangan Presipitasi 10–60 Menit ke Depan ({selectedLoc.name})
              </strong>
              <span className="badge-pill badge-pill--warning tabular-nums">
                Notifikasi Pra-Hujan: T-{data.rainArrivalMin} Menit
              </span>
            </div>

            <div className="nowcast-bars" role="list" aria-label="Grafik prediksi hujan 10 hingga 60 menit">
              {data.minutelyCurve.map((pt) => {
                const heightPct = Math.min(100, Math.max(14, Math.round((pt.mmPerHr / 7.0) * 100)));
                const isHeavy = pt.mmPerHr >= 4.0;
                return (
                  <div key={pt.minute} className="nowcast-col" role="listitem">
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.74rem",
                        color: isHeavy ? "var(--accent-amber)" : "var(--text-primary)",
                        fontWeight: 600,
                      }}
                    >
                      {pt.mmPerHr.toFixed(1)} mm/j
                    </span>
                    <div className="nowcast-well">
                      <div
                        className={`nowcast-fill ${isHeavy ? "nowcast-fill--heavy" : ""}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <strong className="tabular-nums" style={{ fontSize: "0.8rem" }}>
                      {pt.timeLabel}
                    </strong>
                    <span className="tabular-nums" style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      Peluang {pt.probPct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Forecast Strip */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <strong style={{ fontSize: "0.88rem" }}>Hourly Forecast (Prakiraan Per Jam)</strong>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Sumber: BMKG Digital Forecast &amp; Open-Meteo
              </span>
            </div>
            <div className="hourly-strip" role="list">
              {data.hourlyForecast.map((hr) => (
                <div
                  key={hr.time}
                  role="listitem"
                  className={`hourly-slot ${hr.rainProbPct >= 60 ? "hourly-slot--rain" : ""}`}
                >
                  <span className="tabular-nums" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    {hr.time}
                  </span>
                  <strong className="tabular-nums" style={{ fontSize: "1.05rem", fontFamily: "var(--font-display)" }}>
                    {hr.tempC.toFixed(1)}°C
                  </strong>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-Primary)" }}>{hr.label}</span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      color: hr.rainProbPct >= 60 ? "var(--accent-amber)" : "var(--accent-cyan)",
                    }}
                  >
                    {hr.rainProbPct}% ({hr.precipMm}mm)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MODULE 8: EXTREME WEATHER ALERTS & WEATHER RADAR MAP */}
        <section className="module-panel span-5" aria-labelledby="mod-extreme-radar">
          <div className="module-header">
            <div className="module-title-group">
              <h2 id="mod-extreme-radar" className="module-title">
                Active Extreme Alerts &amp; Weather Radar
              </h2>
              <span className="badge-pill badge-pill--danger">CORE MODULE 08</span>
            </div>
            <span className="badge-pill">{data.extremeAlert.validWindow}</span>
          </div>

          {/* Active BMKG Extreme Weather Card */}
          <div
            style={{
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.45)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <strong style={{ color: "#fda4af", fontSize: "0.94rem" }}>
                {data.extremeAlert.title}
              </strong>
              <span className="badge-pill badge-pill--danger">{data.extremeAlert.severity}</span>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
              {data.extremeAlert.description}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {data.extremeAlert.phenomena.map((item) => (
                <span key={item} className="badge-pill badge-pill--warning">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Weather Radar Bandung Map */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <strong style={{ fontSize: "0.88rem" }}>
                Weather Radar — Peta Sebaran Sel Hujan Cekungan Bandung
              </strong>
              <span className="tabular-nums" style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>
                Zoom 11 • Live dBZ Reflectivity
              </span>
            </div>

            <div className="radar-map-stage" aria-label="Peta Radar Hujan Bandung">
              <div className="radar-sweep-line" />

              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
                <span className="badge-pill">BMKG + RainViewer Radar Layer</span>
                <span className="badge-pill badge-pill--warning tabular-nums">
                  Inti Sel Konvektif: 45 dBZ (Arah Tenggara)
                </span>
              </div>

              {/* Plotted Bandung Radar Coordinates */}
              <svg
                viewBox="0 0 420 150"
                style={{ width: "100%", height: "145px", position: "relative", zIndex: 2 }}
                role="img"
                aria-label="Visualisasi koordinat radar Bandung"
              >
                {/* Grid Hairlines */}
                <line x1="0" y1="35" x2="420" y2="35" stroke="#1e3154" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="420" y2="75" stroke="#1e3154" strokeDasharray="3 3" />
                <line x1="0" y1="115" x2="420" y2="115" stroke="#1e3154" strokeDasharray="3 3" />
                <line x1="140" y1="0" x2="140" y2="150" stroke="#1e3154" strokeDasharray="3 3" />
                <line x1="280" y1="0" x2="280" y2="150" stroke="#1e3154" strokeDasharray="3 3" />

                {/* Storm Vectors */}
                <ellipse cx="165" cy="48" rx="68" ry="34" fill="#22d3ee" fillOpacity="0.22" />
                <ellipse cx="175" cy="52" rx="38" ry="20" fill="#f59e0b" fillOpacity="0.45" />
                <ellipse cx="285" cy="96" rx="55" ry="26" fill="#22d3ee" fillOpacity="0.26" />

                {/* Dago Node */}
                <circle cx="175" cy="36" r="5" fill="#f59e0b" />
                <text x="185" y="40" fill="#f4f7fb" fontSize="10" fontFamily="monospace">
                  Dago (-6.885, 107.613) • 6.4mm/j
                </text>

                {/* Bandung Pusat Node */}
                <circle cx="195" cy="76" r="6" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />
                <text x="206" y="80" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  Bandung Pusat (T-{data.rainArrivalMin}m)
                </text>

                {/* Gedebage Node */}
                <circle cx="305" cy="96" r="5" fill="#38bdf8" />
                <text x="235" y="114" fill="#a8bbd8" fontSize="10" fontFamily="monospace">
                  Gedebage (Genangan 10-15cm)
                </text>

                {/* Dayeuhkolot Node */}
                <circle cx="185" cy="126" r="5" fill="#f43f5e" />
                <text x="195" y="130" fill="#fda4af" fontSize="10" fontFamily="monospace">
                  Dayeuhkolot (Siaga BPBD)
                </text>
              </svg>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "var(--text-secondary)", position: "relative", zIndex: 2 }}>
                <span>Legenda Presipitasi: Ringan (Biru) • Sedang (Cyan) • Lebat (Amber/Merah)</span>
                <span className="tabular-nums">Update: UTC+7 WIB</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ====================================================================
          4. ROW 2: AI WEATHER INSIGHTS (6 COL) & ENVIRONMENTAL INDICATORS AQI + UV (6 COL)
          ==================================================================== */}
      <div className="dashboard-grid">
        {/* MODULE 4: AI WEATHER INSIGHTS (TWO-STAGE PIPELINE) */}
        <section className="module-panel span-6" aria-labelledby="mod-ai-insights">
          <div className="module-header">
            <div className="module-title-group">
              <h2 id="mod-ai-insights" className="module-title">
                AI Weather Insights &amp; Activity Recommendations
              </h2>
              <span className="badge-pill badge-pill--core">INTELLIGENCE MODULE 04</span>
            </div>
            <span className="badge-pill">Stage-1 Rule Engine + Stage-2 AI</span>
          </div>

          <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-secondary)" }}>
            Sistem analisis otomatis berbasis data cuaca tervalidasi (bukan chatbot yang mengarang
            angka). Pilih pertanyaan analisis aktivitas untuk melihat rekomendasi:
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {data.aiQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                className="loc-chip"
                aria-pressed={activeAIQuestionId === q.id}
                onClick={() => setActiveAIQuestionId(q.id)}
              >
                {q.question}
              </button>
            ))}
          </div>

          <div className="divided-list">
            {data.aiQuestions.map((item) => {
              const isSelected = item.id === activeAIQuestionId;
              return (
                <div
                  key={item.id}
                  className="divided-row"
                  style={{
                    background: isSelected ? "rgba(34, 211, 238, 0.07)" : "transparent",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div>
                    <strong style={{ display: "block", fontSize: "0.92rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                      &ldquo;{item.question}&rdquo;
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {item.answer}
                    </span>
                  </div>
                  <span
                    className={`badge-pill ${
                      item.severity === "warning"
                        ? "badge-pill--warning"
                        : item.severity === "safe"
                        ? "badge-pill--success"
                        : ""
                    }`}
                  >
                    {item.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* MODULE 2 & 7: AIR QUALITY MONITORING & UV MONITORING */}
        <section className="module-panel span-6" aria-labelledby="mod-env-indicators">
          <div className="module-header">
            <div className="module-title-group">
              <h2 id="mod-env-indicators" className="module-title">
                Environmental Indicators: Air Quality (AQI) &amp; UV Index
              </h2>
              <span className="badge-pill">MODULES 02 &amp; 07</span>
            </div>
            <span className="badge-pill">Honest NULL Sensor Policy</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
            {/* Air Quality Box */}
            <div className="metric-tile" style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="metric-label">AIR QUALITY INDEX (US AQI)</span>
                <span className="badge-pill badge-pill--success">{data.aqi.category}</span>
              </div>
              <p className="temp-giant tabular-nums" style={{ fontSize: "2.4rem", margin: "8px 0" }}>
                {data.aqi.index}
              </p>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                {data.aqi.outdoorAdvice}
              </span>
            </div>

            {/* UV Index Box */}
            <div className="metric-tile" style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="metric-label">UV INDEX &amp; PROTEKSI KULIT</span>
                <span className="badge-pill badge-pill--warning">
                  {data.uv.category} (SPF {data.uv.recommendedSpf}+)
                </span>
              </div>
              <p
                className="temp-giant tabular-nums"
                style={{ fontSize: "2.4rem", margin: "8px 0", color: "var(--accent-amber)" }}
              >
                {data.uv.index.toFixed(1)}
              </p>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Jam UV Tinggi: <strong className="tabular-nums">{data.uv.peakWindow}</strong>.{" "}
                {data.uv.skinAdvice}
              </span>
            </div>
          </div>

          {/* Pollutant Parameters Grid (Demonstrating Blueprint Rule: Unavailable SO2 = NULL) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
            <div className="metric-tile">
              <span className="metric-label">PM2.5 (PARTIKULAT HALUS)</span>
              <span className="metric-val">{data.aqi.pm25} µg/m³</span>
            </div>
            <div className="metric-tile">
              <span className="metric-label">PM10 (PARTIKULAT KASAR)</span>
              <span className="metric-val">{data.aqi.pm10} µg/m³</span>
            </div>
            <div className="metric-tile">
              <span className="metric-label">NO2 &amp; O3 (OZON)</span>
              <span className="metric-val">
                {data.aqi.no2} / {data.aqi.o3} µg/m³
              </span>
            </div>
            <div className="metric-tile">
              <span className="metric-label">CO (KARBON MONOKSIDA)</span>
              <span className="metric-val">{data.aqi.co} µg/m³</span>
            </div>
            <div className="metric-tile" style={{ gridColumn: "span 2 / span 2" }}>
              <span className="metric-label">SO2 (SULFUR DIOKSIDA — SENSOR TIDAK TERSEDIA)</span>
              <span className="metric-val" style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                {data.aqi.so2 !== null ? `${data.aqi.so2} µg/m³` : "NULL (Tidak Diisi Angka Perkiraan)"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ====================================================================
          5. ROW 3: FLOOD MONITORING (4 COL), SMART TRAVEL (4 COL), COMMUNITY REPORTS (4 COL)
          ==================================================================== */}
      <div className="dashboard-grid">
        {/* MODULE 3: FLOOD MONITORING */}
        <section className="module-panel span-4" aria-labelledby="mod-flood">
          <div className="module-header">
            <div className="module-title-group">
              <h2 id="mod-flood" className="module-title">
                Flood Monitoring
              </h2>
              <span className="badge-pill badge-pill--warning">MODULE 03</span>
            </div>
            <span className="badge-pill">Risk vs Confirmed</span>
          </div>

          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            Membedakan dengan tegas antara <strong>peringatan resmi (`official`)</strong>,{" "}
            <strong>laporan warga (`community`)</strong>, dan{" "}
            <strong>konteks risiko curah hujan (`estimated_risk`)</strong>:
          </p>

          <div className="divided-list">
            {INITIAL_FLOOD_ZONES.map((fz) => (
              <div key={fz.id} className="divided-row">
                <div>
                  <strong style={{ display: "block", fontSize: "0.88rem" }}>{fz.areaName}</strong>
                  <span
                    className="tabular-nums"
                    style={{ display: "block", fontSize: "0.76rem", color: "var(--accent-cyan)", margin: "2px 0" }}
                  >
                    {fz.source} • {fz.waterDepthCm}
                  </span>
                  <span style={{ fontSize: "0.81rem", color: "var(--text-secondary)" }}>
                    {fz.description}
                  </span>
                </div>
                <span
                  className={`badge-pill ${
                    fz.sourceType === "official"
                      ? "badge-pill--danger"
                      : fz.sourceType === "community"
                      ? "badge-pill--success"
                      : "badge-pill--warning"
                  }`}
                >
                  {fz.sourceType}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* MODULE 5: SMART TRAVEL CORRIDOR */}
        <section className="module-panel span-4" aria-labelledby="mod-travel">
          <div className="module-header">
            <div className="module-title-group">
              <h2 id="mod-travel" className="module-title">
                Smart Travel Route Weather
              </h2>
              <span className="badge-pill">MODULE 05</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SMART_TRAVEL_CORRIDORS.map((route) => (
              <button
                key={route.id}
                type="button"
                className="btn-secondary"
                style={{
                  borderColor:
                    selectedRouteId === route.id ? "var(--accent-cyan)" : "var(--border-subtle)",
                  color: selectedRouteId === route.id ? "var(--accent-cyan)" : "var(--text-secondary)",
                }}
                onClick={() => setSelectedRouteId(route.id)}
              >
                {route.name}
              </button>
            ))}
          </div>

          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              fontSize: "0.82rem",
            }}
          >
            <strong style={{ color: "var(--accent-amber)", display: "block", marginBottom: "4px" }}>
              {activeRoute.overallStatus} ({activeRoute.distanceKm} km • ~{activeRoute.estDurationMin} mnt)
            </strong>
            <span style={{ color: "var(--text-secondary)" }}>{activeRoute.recommendation}</span>
          </div>

          <div className="divided-list">
            {activeRoute.checkpoints.map((cp) => (
              <div key={cp.pointName} className="divided-row">
                <div>
                  <strong style={{ display: "block", fontSize: "0.86rem" }}>
                    {cp.pointName} (+{cp.etaOffsetMin}m)
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {cp.condition} • {cp.tempC}°C ({cp.precipMm} mm/j)
                  </span>
                  {cp.warning && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.76rem",
                        color: "var(--accent-amber)",
                        marginTop: "2px",
                      }}
                    >
                      ⚠️ {cp.warning}
                    </span>
                  )}
                </div>
                <span
                  className={`badge-pill tabular-nums ${
                    cp.rainProbPct >= 75 ? "badge-pill--warning" : ""
                  }`}
                >
                  Hujan {cp.rainProbPct}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* MODULE 6: COMMUNITY REPORTS & VERIFICATION */}
        <section className="module-panel span-4" aria-labelledby="mod-community">
          <div className="module-header">
            <div className="module-title-group">
              <h2 id="mod-community" className="module-title">
                Community Reports
              </h2>
              <span className="badge-pill badge-pill--success">MODULE 06</span>
            </div>
            <span className="badge-pill">UNIQUE(report_id, user_id)</span>
          </div>

          <form onSubmit={handleAddCommunityReport} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <select
                aria-label="Jenis laporan cuaca komunitas"
                className="input-field"
                style={{ width: "44%" }}
                value={newReportType}
                onChange={(e) =>
                  setNewReportType(
                    e.target.value as
                      | "Hujan Lokal"
                      | "Genangan / Banjir"
                      | "Angin Kencang"
                      | "Pohon Tumbang"
                  )
                }
              >
                <option value="Hujan Lokal">Hujan Lokal</option>
                <option value="Genangan / Banjir">Genangan / Banjir</option>
                <option value="Angin Kencang">Angin Kencang</option>
                <option value="Pohon Tumbang">Pohon Tumbang</option>
              </select>
              <input
                type="text"
                className="input-field"
                placeholder={`Laporkan kondisi di ${selectedLoc.name}...`}
                value={newReportText}
                onChange={(e) => setNewReportText(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-action">
              + Kirim Laporan Kondisi Lokal ({selectedLoc.name})
            </button>
          </form>

          <div className="divided-list">
            {communityReports.map((rep) => {
              const hasVoted = Boolean(votedMap[rep.id]);
              return (
                <div key={rep.id} className="divided-row">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "0.86rem" }}>{rep.locationName}</strong>
                      <span className="badge-pill">{rep.reportType}</span>
                    </div>
                    <p style={{ margin: "4px 0", fontSize: "0.81rem", color: "var(--text-secondary)" }}>
                      {rep.description}
                    </p>
                    <span className="tabular-nums" style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                      {rep.author} • {rep.timeAgo} • GPS {rep.coords}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary tabular-nums"
                    disabled={hasVoted}
                    onClick={() => handleUpvoteReport(rep.id)}
                  >
                    {hasVoted ? `✓ Valid (${rep.upvotes})` : `Upvote (+${rep.upvotes})`}
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
