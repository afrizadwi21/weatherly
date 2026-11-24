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

export default function WeatherlyFolioPage() {
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
        author: "Kontributor Lokal",
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
    <main className="folio-wrapper">
      <div className="folio-sheet">
        {/* ====================================================================
            1. TOP INSTRUMENT STATUS BAR (EXPOSED 1PX RULED HEADER)
            ==================================================================== */}
        <div className="folio-topbar">
          <span>STASIUN PEMANTAUAN MIKRO-KLIMATOLOGI • CEKUNGAN BANDUNG, INDONESIA</span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <span className="tabular-nums">
              POSTGIS 4326: {selectedLoc.lat.toFixed(4)}, {selectedLoc.lon.toFixed(4)} • ADM4{" "}
              {selectedLoc.adm4}
            </span>
            <span className="stamp stamp--green">
              {backendConnected ? "GO API /API/V1 LIVE" : "BMKG + OPEN-METEO SYNC"}
            </span>
          </div>
        </div>

        {/* ====================================================================
            2. MASTHEAD WITH ETCHED CONTOUR CLOUDS DRIFTING BEHIND "WEATHERLY"
            ==================================================================== */}
        <header className="masthead-stage">
          {/* Layer 1: Architectural Contour Cloud Silhouette (Back) */}
          <svg
            className="cloud-layer cloud-layer--back"
            viewBox="0 0 1200 140"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M60 125C60 95 90 74 126 78C146 42 194 24 240 38C274 8 338 10 370 46C408 40 444 64 454 100C486 102 508 125 508 125H60Z"
              fill="#e5e2da"
              stroke="#c9c5ba"
              strokeWidth="1"
            />
            <path
              d="M680 128C680 98 712 76 750 80C772 42 822 24 870 38C906 6 972 10 1004 46C1044 40 1082 66 1092 103H680V128Z"
              fill="#e8e5dd"
              stroke="#c9c5ba"
              strokeWidth="1"
            />
          </svg>

          {/* Layer 2: Midground Cloud Silhouette Behind WEATHERLY Typography */}
          <svg
            className="cloud-layer cloud-layer--mid"
            viewBox="0 0 1200 140"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M230 132C230 96 268 70 310 75C334 32 394 12 452 28C496 -8 574 -4 612 38C658 32 704 60 716 104C754 106 780 132 780 132H230Z"
              fill="#ece9e1"
              stroke="#bfbbb0"
              strokeWidth="1"
            />
          </svg>

          {/* Layer 3: Foreground Translucent Cloud Passing Across Base of Letters */}
          <svg
            className="cloud-layer cloud-layer--front"
            viewBox="0 0 1200 90"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M140 86C140 66 172 52 208 56C230 32 280 20 328 30C364 8 428 10 460 36C500 32 538 48 548 72H140V86Z"
              fill="#f6f5f1"
              fillOpacity="0.68"
              stroke="#d4d1c8"
              strokeWidth="1"
            />
          </svg>

          <div className="masthead-inner">
            <div>
              <h1 className="masthead-title">WEATHERLY</h1>
            </div>
            <p className="masthead-lead">
              <strong>Know the Weather. Prepare Before It Happens.</strong> Platform intelijen cuaca
              untuk memprediksi waktu kedatangan hujan 10–60 menit ke depan, peringatan ekstrem
              BMKG, dan rekomendasi keputusan harian.
            </p>
          </div>
        </header>

        {/* ====================================================================
            3. FLUSH LOCATION SWITCHER RAIL (NO PILL GLOWS)
            ==================================================================== */}
        <nav className="location-rail" aria-label="Pilih Titik Lokasi Pemantauan Bandung">
          {BANDUNG_LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className="location-tab"
              aria-pressed={selectedLoc.id === loc.id}
              onClick={() => handleSelectLocation(loc)}
            >
              <span>{loc.name}</span>
              <span className="tabular-nums" style={{ fontSize: "0.75rem", opacity: 0.75 }}>
                {loc.elevationM} mdpl
              </span>
            </button>
          ))}
        </nav>

        {/* ====================================================================
            4. POSITIONING LEDGER TRIO (WHAT, WHEN, HOW TO PREPARE)
            ==================================================================== */}
        <section className="ledger-trio" aria-label="Ringkasan Keputusan Cuaca">
          <div className="ledger-cell">
            <span className="cell-index">PERTANYAAN 01 — KONDISI LOKASI SAYA</span>
            <p className="cell-headline">{data.conditionLabel}</p>
            <p className="cell-copy">
              {selectedLoc.district} • Suhu aktual{" "}
              <strong className="tabular-nums">{data.currentTempC.toFixed(1)}°C</strong> dengan
              kelembapan <strong className="tabular-nums">{data.humidityPct}%</strong>.
            </p>
          </div>

          <div className="ledger-cell ledger-cell--alert">
            <span className="cell-index" style={{ color: "var(--signal-amber)" }}>
              PERTANYAAN 02 — KAPAN HUJAN TIBA (NOWCAST)
            </span>
            <p className="cell-headline tabular-nums" style={{ color: "var(--signal-red)" }}>
              T-{data.rainArrivalMin} Menit (Puncak {data.peakPrecipMmHr} mm/jam)
            </p>
            <p className="cell-copy">
              Probabilitas <strong className="tabular-nums">{data.rainConfidencePct}%</strong> •{" "}
              {data.rainAlertSummary}
            </p>
          </div>

          <div className="ledger-cell">
            <span className="cell-index">PERTANYAAN 03 — PERSIAPAN SEKARANG</span>
            <p className="cell-headline">Siapkan Jas Hujan &amp; Cek Koridor Rute</p>
            <p className="cell-copy">{data.whatToPrepare}</p>
          </div>
        </section>

        {/* ====================================================================
            5. ROW 1: RAIN INTELLIGENCE & CURRENT WEATHER (7 COL) + EXTREME WEATHER & RADAR (5 COL)
            ==================================================================== */}
        <div className="ruled-row">
          {/* MODULE 1: RAIN INTELLIGENCE & CURRENT WEATHER */}
          <section className="grid-col-7 section-pad" aria-labelledby="h-rain-intel">
            <div className="section-bar">
              <h2 id="h-rain-intel" className="section-heading">
                Rain Intelligence &amp; Pengamatan Cuaca Aktual
              </h2>
              <span className="stamp tabular-nums">
                VERIFIKASI HISTORIS: POD 88% • FAR 12% • MAE 6.5M
              </span>
            </div>

            <div className="primary-reading-flex">
              <div style={{ display: "flex", alignItems: "baseline", gap: "18px" }}>
                <p className="degree-giant tabular-nums">{data.currentTempC.toFixed(1)}°C</p>
                <div>
                  <strong style={{ display: "block", fontSize: "1.05rem" }}>
                    {data.conditionLabel}
                  </strong>
                  <span
                    className="tabular-nums"
                    style={{ fontSize: "0.84rem", color: "var(--ink-secondary)" }}
                  >
                    Terasa {data.feelsLikeC.toFixed(1)}°C • Maks {data.highTempC}° / Min{" "}
                    {data.lowTempC}°
                  </span>
                </div>
              </div>

              <div>
                <span className="stamp stamp--red tabular-nums">
                  NOTIFIKASI PRA-HUJAN: T-{data.rainArrivalMin} MENIT
                </span>
              </div>
            </div>

            <div className="spec-strip">
              <div className="spec-cell">
                <span className="spec-key">KELEMBAPAN / EMBUN</span>
                <span className="spec-val">
                  {data.humidityPct}% ({data.dewPointC}°C)
                </span>
              </div>
              <div className="spec-cell">
                <span className="spec-key">KECEPATAN ANGIN</span>
                <span className="spec-val">{data.windSpeedKmh} km/j</span>
              </div>
              <div className="spec-cell">
                <span className="spec-key">TEKANAN BAROMETRIK</span>
                <span className="spec-val">{data.pressureHpa} hPa</span>
              </div>
              <div className="spec-cell">
                <span className="spec-key">JARAK PANDANG</span>
                <span className="spec-val">{data.visibilityKm} km</span>
              </div>
            </div>

            {/* 10-60 Minute Barograph Chart */}
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ fontSize: "0.9rem" }}>
                  Kurva Presipitasi 10–60 Menit ke Depan ({selectedLoc.name})
                </strong>
                <span
                  className="tabular-nums"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--ink-muted)" }}
                >
                  ESTIMASI DURASI HUJAN: ~{data.rainDurationMin} MENIT
                </span>
              </div>

              <div className="barograph-grid" role="list" aria-label="Kurva presipitasi 10 hingga 60 menit">
                {data.minutelyCurve.map((pt) => {
                  const heightPct = Math.min(100, Math.max(12, Math.round((pt.mmPerHr / 7.0) * 100)));
                  const isPeak = pt.mmPerHr >= 4.0;
                  return (
                    <div key={pt.minute} className="barograph-col" role="listitem">
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: isPeak ? "var(--signal-red)" : "var(--ink)",
                        }}
                      >
                        {pt.mmPerHr.toFixed(1)} mm
                      </span>
                      <div className="barograph-well">
                        <div
                          className={`barograph-bar ${isPeak ? "barograph-bar--peak" : ""}`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <strong
                        className="tabular-nums"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}
                      >
                        {pt.timeLabel}
                      </strong>
                      <span
                        className="tabular-nums"
                        style={{ fontSize: "0.72rem", color: "var(--ink-secondary)" }}
                      >
                        {pt.probPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Forecast Timetable */}
            <div style={{ marginTop: "22px" }}>
              <strong style={{ fontSize: "0.9rem" }}>
                Jadwal Prakiraan Per Jam (BMKG &amp; Open-Meteo)
              </strong>
              <table className="timetable">
                <thead>
                  <tr>
                    <th>JAM (WIB)</th>
                    <th>KONDISI</th>
                    <th>SUHU</th>
                    <th>PELUANG HUJAN</th>
                    <th>CURAH HUJAN</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hourlyForecast.map((hr) => (
                    <tr key={hr.time}>
                      <td className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                        {hr.time}
                      </td>
                      <td>{hr.label}</td>
                      <td className="tabular-nums" style={{ fontWeight: 600 }}>
                        {hr.tempC.toFixed(1)}°C
                      </td>
                      <td className="tabular-nums">
                        {hr.rainProbPct >= 60 ? (
                          <span className="stamp stamp--red">{hr.rainProbPct}%</span>
                        ) : (
                          `${hr.rainProbPct}%`
                        )}
                      </td>
                      <td className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                        {hr.precipMm.toFixed(1)} mm/jam
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* MODULE 8: EXTREME WEATHER ALERTS & SYNOPTIC CONTOUR RADAR */}
          <section className="grid-col-5 section-pad" aria-labelledby="h-extreme-radar">
            <div className="section-bar">
              <h2 id="h-extreme-radar" className="section-heading">
                Peringatan Cuaca Ekstrem &amp; Peta Sinoptik
              </h2>
              <span className="stamp stamp--red">{data.extremeAlert.severity.toUpperCase()}</span>
            </div>

            {/* BMKG Alert Bulletin Box */}
            <div
              style={{
                border: "1px solid var(--signal-red)",
                backgroundColor: "var(--signal-red-Tint)",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <strong style={{ color: "var(--signal-red)", fontSize: "0.95rem" }}>
                  {data.extremeAlert.title}
                </strong>
                <span
                  className="tabular-nums"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
                >
                  {data.extremeAlert.validWindow}
                </span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--ink)" }}>
                {data.extremeAlert.description}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {data.extremeAlert.phenomena.map((f) => (
                  <span key={f} className="stamp">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Synoptic Isobar & Precipitation Contour Map */}
            <div className="cartography-box">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  marginBottom: "10px",
                }}
              >
                <span>PETA KONTUR PRESIPITASI CEKUNGAN BANDUNG</span>
                <span>SKALA 1:250.000 • VEKTOR TENGGARA</span>
              </div>

              <svg
                viewBox="0 0 420 210"
                style={{
                  width: "100%",
                  height: "200px",
                  backgroundColor: "var(--paper)",
                  border: "1px solid var(--rule)",
                }}
                role="img"
                aria-label="Peta kontur isobar dan sel hujan Bandung"
              >
                {/* Ruled Graticule Grid */}
                <line x1="0" y1="52" x2="420" y2="52" stroke="#dcd9d0" strokeWidth="1" />
                <line x1="0" y1="105" x2="420" y2="105" stroke="#dcd9d0" strokeWidth="1" />
                <line x1="0" y1="157" x2="420" y2="157" stroke="#dcd9d0" strokeWidth="1" />
                <line x1="105" y1="0" x2="105" y2="210" stroke="#dcd9d0" strokeWidth="1" />
                <line x1="210" y1="0" x2="210" y2="210" stroke="#dcd9d0" strokeWidth="1" />
                <line x1="315" y1="0" x2="315" y2="210" stroke="#dcd9d0" strokeWidth="1" />

                {/* Topographic Isobar / Rain Cell Contours */}
                <ellipse
                  cx="185"
                  cy="74"
                  rx="105"
                  ry="52"
                  fill="#fdf3e7"
                  stroke="#b86b14"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                />
                <ellipse
                  cx="175"
                  cy="68"
                  rx="62"
                  ry="30"
                  fill="#fbeae8"
                  stroke="#c93b2b"
                  strokeWidth="1.25"
                />
                <ellipse
                  cx="295"
                  cy="132"
                  rx="68"
                  ry="32"
                  fill="#fdf3e7"
                  stroke="#b86b14"
                  strokeWidth="1"
                />

                {/* Station Markers */}
                <rect x="165" y="48" width="6" height="6" fill="#c93b2b" />
                <text x="176" y="55" fill="#141413" fontSize="10" fontFamily="monospace">
                  DAGO (-6.885, 107.613) • 6.4 mm/j
                </text>

                <rect x="192" y="98" width="7" height="7" fill="#141413" />
                <text
                  x="204"
                  y="105"
                  fill="#141413"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  BANDUNG PUSAT (T-{data.rainArrivalMin}m)
                </text>

                <rect x="282" y="132" width="6" height="6" fill="#b86b14" />
                <text x="220" y="150" fill="#4a4946" fontSize="10" fontFamily="monospace">
                  GEDEBAGE (Genangan 10-15cm)
                </text>

                <rect x="178" y="172" width="6" height="6" fill="#c93b2b" />
                <text x="189" y="179" fill="#c93b2b" fontSize="10" fontFamily="monospace">
                  DAYEUHKOLOT (TMA Citarum Siaga)
                </text>
              </svg>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.74rem",
                  color: "var(--ink-secondary)",
                  marginTop: "8px",
                }}
              >
                <span>Garis Utuh Merah: Inti Presipitasi &gt;5 mm/jam</span>
                <span>Garis Putus Amber: Zona Hujan 2–5 mm/jam</span>
              </div>
            </div>
          </section>
        </div>

        {/* ====================================================================
            6. ROW 2: AI WEATHER INSIGHTS (6 COL) + AIR QUALITY & UV MONITORING (6 COL)
            ==================================================================== */}
        <div className="ruled-row">
          {/* MODULE 4: AI WEATHER INSIGHTS */}
          <section className="grid-col-6 section-pad" aria-labelledby="h-ai-insights">
            <div className="section-bar">
              <h2 id="h-ai-insights" className="section-heading">
                AI Weather Insights (Two-Stage Analysis Engine)
              </h2>
              <span className="stamp">RULE ENGINE + AI LAYER</span>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
              AI menerima <code>input_snapshot</code> cuaca yang telah divalidasi oleh Rule Engine
              backend (tanpa mengarang data), lalu menyusun analisis aktivitas harian:
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
              {data.aiQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="btn-outline"
                  aria-pressed={activeAIQuestionId === q.id}
                  onClick={() => setActiveAIQuestionId(q.id)}
                >
                  {q.question}
                </button>
              ))}
            </div>

            <div className="ledger-list">
              {data.aiQuestions.map((item) => {
                const isSelected = item.id === activeAIQuestionId;
                return (
                  <div
                    key={item.id}
                    className="ledger-item"
                    style={{
                      backgroundColor: isSelected ? "var(--paper-alt)" : "transparent",
                      padding: "12px",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", fontSize: "0.92rem", marginBottom: "4px" }}>
                        {item.question}
                      </strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--ink-secondary)" }}>
                        {item.answer}
                      </span>
                    </div>
                    <span
                      className={`stamp ${
                        item.severity === "warning"
                          ? "stamp--red"
                          : item.severity === "safe"
                          ? "stamp--green"
                          : "stamp--amber"
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* MODULE 2 & 7: AIR QUALITY & UV MONITORING */}
          <section className="grid-col-6 section-pad" aria-labelledby="h-aqi-uv">
            <div className="section-bar">
              <h2 id="h-aqi-uv" className="section-heading">
                Air Quality Monitoring (AQI) &amp; UV Index
              </h2>
              <span className="stamp">HONEST NULL POLICY</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                border: "1px solid var(--rule-strong)",
                marginBottom: "18px",
              }}
            >
              <div style={{ padding: "16px", borderRight: "1px solid var(--rule-strong)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="spec-key">INDEKS KUALITAS UDARA (AQI)</span>
                  <span className="stamp stamp--green">{data.aqi.category.toUpperCase()}</span>
                </div>
                <p className="degree-giant tabular-nums" style={{ fontSize: "2.6rem", margin: "10px 0" }}>
                  {data.aqi.index}
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                  {data.aqi.outdoorAdvice}
                </p>
              </div>

              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="spec-key">UV INDEX &amp; PERLINDUNGAN KULIT</span>
                  <span className="stamp stamp--amber">
                    {data.uv.category.toUpperCase()} • SPF {data.uv.recommendedSpf}+
                  </span>
                </div>
                <p
                  className="degree-giant tabular-nums"
                  style={{ fontSize: "2.6rem", margin: "10px 0", color: "var(--signal-amber)" }}
                >
                  {data.uv.index.toFixed(1)}
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                  Jam UV Tinggi: <strong className="tabular-nums">{data.uv.peakWindow}</strong>.{" "}
                  {data.uv.skinAdvice}
                </p>
              </div>
            </div>

            {/* Pollutant Ledger Table showing NULL for SO2 */}
            <strong style={{ fontSize: "0.88rem" }}>
              Tabel Parameter Polutan Udara (Kolom Tidak Tersedia Bernilai NULL)
            </strong>
            <table className="timetable">
              <thead>
                <tr>
                  <th>PARAMETER</th>
                  <th>KONSENTRASI</th>
                  <th>STATUS SENSOR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>PM2.5 (Partikulat Halus &lt;2.5µm)</td>
                  <td className="tabular-nums" style={{ fontWeight: 600 }}>
                    {data.aqi.pm25} µg/m³
                  </td>
                  <td>
                    <span className="stamp stamp--green">AKTIF</span>
                  </td>
                </tr>
                <tr>
                  <td>PM10 (Partikulat Kasar &lt;10µm)</td>
                  <td className="tabular-nums" style={{ fontWeight: 600 }}>
                    {data.aqi.pm10} µg/m³
                  </td>
                  <td>
                    <span className="stamp stamp--green">AKTIF</span>
                  </td>
                </tr>
                <tr>
                  <td>NO2 / O3 / CO</td>
                  <td className="tabular-nums">
                    {data.aqi.no2} / {data.aqi.o3} / {data.aqi.co} µg/m³
                  </td>
                  <td>
                    <span className="stamp stamp--green">AKTIF</span>
                  </td>
                </tr>
                <tr>
                  <td>SO2 (Sulfur Dioksida)</td>
                  <td className="tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}>
                    {data.aqi.so2 !== null ? `${data.aqi.so2} µg/m³` : "NULL"}
                  </td>
                  <td>
                    <span className="stamp stamp--muted">TIDAK TERSEDIA (TANPA ANGKA TEBAKAN)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        {/* ====================================================================
            7. ROW 3: FLOOD MONITORING (4 COL) + SMART TRAVEL (4 COL) + COMMUNITY REPORTS (4 COL)
            ==================================================================== */}
        <div className="ruled-row">
          {/* MODULE 3: FLOOD MONITORING */}
          <section className="grid-col-4 section-pad" aria-labelledby="h-flood">
            <div className="section-bar">
              <h2 id="h-flood" className="section-heading">
                Flood Monitoring
              </h2>
              <span className="stamp">SOURCE-CLASSIFIED</span>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
              Memisahkan laporan resmi (<code>official</code>), laporan komunitas (
              <code>community</code>), dan konteks risiko curah hujan (<code>estimated_risk</code>):
            </p>

            <div className="ledger-list">
              {INITIAL_FLOOD_ZONES.map((fz) => (
                <div key={fz.id} className="ledger-item">
                  <div>
                    <strong style={{ display: "block", fontSize: "0.88rem" }}>{fz.areaName}</strong>
                    <span
                      className="tabular-nums"
                      style={{
                        display: "block",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.74rem",
                        color: "var(--ink-muted)",
                        margin: "2px 0 4px",
                      }}
                    >
                      {fz.source} • {fz.waterDepthCm}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                      {fz.description}
                    </span>
                  </div>
                  <span
                    className={`stamp ${
                      fz.sourceType === "official"
                        ? "stamp--red"
                        : fz.sourceType === "community"
                        ? "stamp--green"
                        : "stamp--amber"
                    }`}
                  >
                    {fz.sourceType}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* MODULE 5: SMART TRAVEL */}
          <section className="grid-col-4 section-pad" aria-labelledby="h-travel">
            <div className="section-bar">
              <h2 id="h-travel" className="section-heading">
                Smart Travel Route
              </h2>
              <span className="stamp">WAYPOINT CHECK</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
              {SMART_TRAVEL_CORRIDORS.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  className="btn-outline"
                  aria-pressed={selectedRouteId === route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                >
                  {route.name}
                </button>
              ))}
            </div>

            <div
              style={{
                border: "1px solid var(--rule-strong)",
                backgroundColor: "var(--paper-alt)",
                padding: "12px",
                marginBottom: "14px",
                fontSize: "0.82rem",
              }}
            >
              <strong style={{ display: "block", marginBottom: "4px" }}>
                {activeRoute.overallStatus} ({activeRoute.distanceKm} km • ~
                {activeRoute.estDurationMin} mnt)
              </strong>
              <span style={{ color: "var(--ink-secondary)" }}>{activeRoute.recommendation}</span>
            </div>

            <div className="ledger-list">
              {activeRoute.checkpoints.map((cp) => (
                <div key={cp.pointName} className="ledger-item">
                  <div>
                    <strong style={{ display: "block", fontSize: "0.86rem" }}>
                      {cp.pointName} (+{cp.etaOffsetMin}m)
                    </strong>
                    <span style={{ fontSize: "0.81rem", color: "var(--ink-secondary)" }}>
                      {cp.condition} • {cp.tempC}°C ({cp.precipMm} mm/jam)
                    </span>
                    {cp.warning && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          color: "var(--signal-red)",
                          marginTop: "2px",
                        }}
                      >
                        Catatan: {cp.warning}
                      </span>
                    )}
                  </div>
                  <span
                    className={`stamp tabular-nums ${
                      cp.rainProbPct >= 75 ? "stamp--red" : "stamp--amber"
                    }`}
                  >
                    {cp.rainProbPct}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* MODULE 6: COMMUNITY REPORTS */}
          <section className="grid-col-4 section-pad" aria-labelledby="h-community">
            <div className="section-bar">
              <h2 id="h-community" className="section-heading">
                Community Reports
              </h2>
              <span className="stamp">1 VOTE / USER</span>
            </div>

            <form
              onSubmit={handleAddCommunityReport}
              style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <select
                  aria-label="Pilih kategori laporan"
                  className="form-control"
                  style={{ width: "45%" }}
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
                  className="form-control"
                  placeholder={`Kondisi di ${selectedLoc.name}...`}
                  value={newReportText}
                  onChange={(e) => setNewReportText(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-ink">
                Kirim Laporan Warga ({selectedLoc.name})
              </button>
            </form>

            <div className="ledger-list">
              {communityReports.map((rep) => {
                const hasVoted = Boolean(votedMap[rep.id]);
                return (
                  <div key={rep.id} className="ledger-item">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "0.86rem" }}>{rep.locationName}</strong>
                        <span className="stamp">{rep.reportType}</span>
                      </div>
                      <p style={{ margin: "4px 0", fontSize: "0.81rem", color: "var(--ink-secondary)" }}>
                        {rep.description}
                      </p>
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.72rem",
                          color: "var(--ink-muted)",
                        }}
                      >
                        {rep.author} • {rep.timeAgo}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-outline tabular-nums"
                      disabled={hasVoted}
                      onClick={() => handleUpvoteReport(rep.id)}
                    >
                      {hasVoted ? `Valid (${rep.upvotes})` : `Vote +${rep.upvotes}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
