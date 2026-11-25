"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { BMKG_JABAR_32_SNAPSHOT, BMKGDailyEntry } from "@/lib/bmkg-jabar-snapshot";
import {
  BeritaAcaraItem,
  INITIAL_BERITA_ACARA_JABAR,
} from "@/lib/berita-acara-jabar";
import {
  BMKGKecamatanEntry,
  WEST_JAVA_LOCATIONS,
  LocationDashboardState,
  LocationOption,
  buildCustomTravelCorridor,
  buildLocationState,
  getImminentRainLocationsJabar,
  getKecamatanListForAdm2,
  searchKecamatanAcrossJabar,
  searchWestJavaLocations,
} from "@/lib/weatherly-data";
import {
  toggleSavedAIInsight,
  useWeatherlySession,
} from "@/lib/weatherly-session";

interface SavedDBLocation {
  id: string;
  userId: string;
  adm2: string;
  adm3?: string;
  name: string;
  kecamatanName?: string;
  lat: number;
  lon: number;
  alertEnabled: boolean;
}

interface SavedDBRoute {
  id: string;
  userId: string;
  routeName: string;
  originAdm2: string;
  originName: string;
  midAdm2?: string;
  midName?: string;
  destAdm2: string;
  destName: string;
}

interface DBReportItem {
  id: string;
  userId: string;
  author: string;
  locationName: string;
  adm2: string;
  reportType: "Hujan Lokal" | "Genangan / Banjir" | "Angin Kencang" | "Pohon Tumbang";
  description: string;
  coords: string;
  imageUrl: string;
  timeAgo: string;
  reportDate?: string;
  createdAt?: string;
  verified: boolean;
  upvotes: number;
  voterIds: string[];
}

export default function DashboardPage() {
  const session = useWeatherlySession();
  const [selectedLoc, setSelectedLoc] = useState<LocationOption>(WEST_JAVA_LOCATIONS[0]);
  const [bmkgMap, setBmkgMap] =
    useState<Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>>(BMKG_JABAR_32_SNAPSHOT);
  const [kecamatanList, setKecamatanList] = useState<BMKGKecamatanEntry[]>(() =>
    getKecamatanListForAdm2(WEST_JAVA_LOCATIONS[0].adm2)
  );
  const [selectedKec, setSelectedKec] = useState<BMKGKecamatanEntry | null>(
    () => getKecamatanListForAdm2(WEST_JAVA_LOCATIONS[0].adm2)[0] || null
  );
  const [beritaAcara, setBeritaAcara] = useState<BeritaAcaraItem[]>(INITIAL_BERITA_ACARA_JABAR);
  const [data, setData] = useState<LocationDashboardState>(() =>
    buildLocationState(WEST_JAVA_LOCATIONS[0], BMKG_JABAR_32_SNAPSHOT)
  );
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [kecSearchQuery, setKecSearchQuery] = useState<string>("");
  const [kindFilter, setKindFilter] = useState<"ALL" | "Kota" | "Kabupaten" | "FAV">("ALL");

  // Saved user states
  const [savedLocationsDB, setSavedLocationsDB] = useState<SavedDBLocation[]>([]);
  const [userRoutesDB, setUserRoutesDB] = useState<SavedDBRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [communityReports, setCommunityReports] = useState<DBReportItem[]>([]);

  // User-defined Smart Travel Builder form state (starts empty until user adds!)
  const [originAdm2, setOriginAdm2] = useState<string>("32.73");
  const [midAdm2, setMidAdm2] = useState<string>("");
  const [destAdm2, setDestAdm2] = useState<string>("32.04");
  const [customRouteName, setCustomRouteName] = useState<string>("");

  // Community Report with Mandatory Photo state
  const [newReportText, setNewReportText] = useState<string>("");
  const [newReportType, setNewReportType] = useState<
    "Hujan Lokal" | "Genangan / Banjir" | "Angin Kencang" | "Pohon Tumbang"
  >("Hujan Lokal");
  const [newReportImage, setNewReportImage] = useState<string>("");
  const [newReportImageName, setNewReportImageName] = useState<string>("");
  const [reportError, setReportError] = useState<string | null>(null);

  // AI Insights state (No model name exposed, button is strictly "Tanya AI")
  const [activeAIQuestionId, setActiveAIQuestionId] = useState<string>("ai-q1");
  const [customAIQuestion, setCustomAIQuestion] = useState<string>("");
  const [aiLiveResult, setAiLiveResult] = useState<{
    rejectedOffTopic?: boolean;
    question: string;
    answer: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Load persistent data from /api/db
  async function refreshDatabaseState(uid?: string) {
    try {
      const q = uid ? `?userId=${encodeURIComponent(uid)}` : "";
      const res = await fetch(`/api/db${q}`);
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.locations)) setSavedLocationsDB(json.locations);
      if (Array.isArray(json.travel_routes)) {
        setUserRoutesDB(json.travel_routes);
        if (json.travel_routes.length > 0 && !selectedRouteId) {
          setSelectedRouteId(json.travel_routes[0].id);
        }
      }
      if (Array.isArray(json.community_reports)) {
        setCommunityReports(json.community_reports);
      }
    } catch {
      /* ignore network error */
    }
  }

  useEffect(() => {
    let active = true;
    const q = session?.id ? `?userId=${encodeURIComponent(session.id)}` : "";
    fetch(`/api/db${q}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!active || !json) return;
        if (Array.isArray(json.locations)) setSavedLocationsDB(json.locations);
        if (Array.isArray(json.travel_routes)) {
          setUserRoutesDB(json.travel_routes);
          if (json.travel_routes.length > 0 && !selectedRouteId) {
            setSelectedRouteId(json.travel_routes[0].id);
          }
        }
        if (Array.isArray(json.community_reports)) {
          setCommunityReports(json.community_reports);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectLocation(loc: LocationOption, preferredAdm3?: string) {
    setSelectedLoc(loc);
    setData(buildLocationState(loc, bmkgMap));
    const list = getKecamatanListForAdm2(loc.adm2);
    setKecamatanList(list);
    setSelectedKec(
      (preferredAdm3 && list.find((k) => k.adm3 === preferredAdm3)) || list[0] || null
    );
  }

  useEffect(() => {
    let active = true;
    async function syncLiveBMKGJabar() {
      try {
        let targetLoc = selectedLoc;
        let preferredAdm3: string | null = null;
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          const adm2Param = sp.get("adm2");
          preferredAdm3 = sp.get("adm3");
          if (adm2Param && adm2Param !== selectedLoc.adm2) {
            const match = WEST_JAVA_LOCATIONS.find((l) => l.adm2 === adm2Param);
            if (match) {
              targetLoc = match;
              window.history.replaceState(null, "", "/dashboard");
            }
          }
        }
        const res = await fetch(
          `/api/bmkg/jabar?adm2=${encodeURIComponent(targetLoc.adm2)}&lat=${targetLoc.lat}&lon=${targetLoc.lon}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          regions?: Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>;
          kecamatan_list?: BMKGKecamatanEntry[];
          berita_acara?: BeritaAcaraItem[];
          realtime?: {
            temperature_c?: number;
            feels_like_c?: number;
            humidity_pct?: number;
            wind_speed_kmh?: number;
            pressure_hpa?: number;
            condition_label?: string;
            aqi?: {
              us_aqi?: number;
              pm25?: number;
              pm10?: number;
              no2?: number;
              o3?: number;
              co?: number;
              so2?: number | null;
              uv_index?: number;
            };
          } | null;
        };
        if (!active) return;

        if (targetLoc.id !== selectedLoc.id) {
          setSelectedLoc(targetLoc);
        }
        const nextRegions = json.regions || bmkgMap;
        if (json.regions) {
          setBmkgMap(json.regions);
        }
        if (json.kecamatan_list && json.kecamatan_list.length > 0) {
          const kList = json.kecamatan_list;
          setKecamatanList(kList);
          setSelectedKec((prev) => {
            if (preferredAdm3) {
              const found = kList.find((k) => k.adm3 === preferredAdm3);
              if (found) return found;
            }
            if (prev && kList.some((k) => k.adm3 === prev.adm3)) {
              return kList.find((k) => k.adm3 === prev.adm3) || kList[0];
            }
            return kList[0];
          });
        }
        if (json.berita_acara && json.berita_acara.length > 0) {
          setBeritaAcara(json.berita_acara);
        }

        const base = buildLocationState(targetLoc, nextRegions);
        if (json.realtime && typeof json.realtime.temperature_c === "number") {
          const rtAqi = json.realtime.aqi;
          const liveAqiVal = typeof rtAqi?.us_aqi === "number" ? rtAqi.us_aqi : base.aqi.index;
          const liveUvVal = typeof rtAqi?.uv_index === "number" ? rtAqi.uv_index : base.uv.index;
          const aqiCat: LocationDashboardState["aqi"]["category"] =
            liveAqiVal <= 50
              ? "Baik"
              : liveAqiVal <= 100
              ? "Sedang"
              : "Tidak Sehat bagi Kelompok Sensitif";
          const uvCat: LocationDashboardState["uv"]["category"] =
            liveUvVal < 3
              ? "Rendah"
              : liveUvVal < 6
              ? "Sedang"
              : liveUvVal < 8
              ? "Tinggi"
              : "Sangat Tinggi";

          setData({
            ...base,
            currentTempC: json.realtime.temperature_c,
            feelsLikeC: json.realtime.feels_like_c ?? base.feelsLikeC,
            humidityPct: json.realtime.humidity_pct
              ? Math.round(json.realtime.humidity_pct)
              : base.humidityPct,
            windSpeedKmh: json.realtime.wind_speed_kmh ?? base.windSpeedKmh,
            pressureHpa: json.realtime.pressure_hpa ?? base.pressureHpa,
            aqi: {
              ...base.aqi,
              index: liveAqiVal,
              category: aqiCat,
              pm25: typeof rtAqi?.pm25 === "number" ? rtAqi.pm25 : base.aqi.pm25,
              pm10: typeof rtAqi?.pm10 === "number" ? rtAqi.pm10 : base.aqi.pm10,
              no2: typeof rtAqi?.no2 === "number" ? rtAqi.no2 : base.aqi.no2,
              o3: typeof rtAqi?.o3 === "number" ? rtAqi.o3 : base.aqi.o3,
              co: typeof rtAqi?.co === "number" ? rtAqi.co : base.aqi.co,
              so2: rtAqi?.so2 !== undefined ? rtAqi.so2 : null,
              outdoorAdvice: `Data sensor real-time Open-Meteo di ${targetLoc.name}: AQI ${liveAqiVal} (${aqiCat}), PM2.5 ${
                rtAqi?.pm25 ?? base.aqi.pm25
              } µg/m³.`,
            },
            uv: {
              ...base.uv,
              index: liveUvVal,
              category: uvCat,
              skinAdvice: `Sensor UV real-time di ${targetLoc.name} saat ini: ${liveUvVal.toFixed(
                1
              )} (${uvCat}).`,
            },
          });
          setBackendConnected(true);
        } else {
          setData(base);
          setBackendConnected(true);
        }
      } catch {
        if (active) setBackendConnected(false);
      }
    }
    syncLiveBMKGJabar();
    return () => {
      active = false;
    };
  }, [selectedLoc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save/unsave any location (Kota/Kab or Kecamatan) to Database for Real-Time Weather Alerts
  async function handleToggleSaveLocationForAlert(targetLoc: LocationOption, targetKec?: BMKGKecamatanEntry | null) {
    if (!session) return;
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_location",
        userId: session.id,
        adm2: targetLoc.adm2,
        adm3: targetKec?.adm3,
        name: targetLoc.name,
        kecamatanName: targetKec?.kecamatan,
        lat: targetLoc.lat,
        lon: targetLoc.lon,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setSavedLocationsDB(json.locations || []);
      refreshDatabaseState(session.id);
    }
  }

  // Add user-created Smart Travel Route to Database
  async function handleCreateSmartTravelRoute(e: React.FormEvent) {
    e.preventDefault();
    const uid = session?.id || "guest";
    const originObj = WEST_JAVA_LOCATIONS.find((l) => l.adm2 === originAdm2) || WEST_JAVA_LOCATIONS[0];
    const destObj = WEST_JAVA_LOCATIONS.find((l) => l.adm2 === destAdm2) || WEST_JAVA_LOCATIONS[1];
    const midObj = midAdm2 ? WEST_JAVA_LOCATIONS.find((l) => l.adm2 === midAdm2) : undefined;

    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_route",
        userId: uid,
        routeName: customRouteName.trim(),
        originAdm2: originObj.adm2,
        originName: originObj.name,
        midAdm2: midObj?.adm2,
        midName: midObj?.name,
        destAdm2: destObj.adm2,
        destName: destObj.name,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setUserRoutesDB(json.travel_routes || []);
      if (json.route?.id) setSelectedRouteId(json.route.id);
      setCustomRouteName("");
      refreshDatabaseState(session?.id);
    }
  }

  async function handleDeleteSmartTravelRoute(routeId: string) {
    const uid = session?.id || "guest";
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_route",
        userId: uid,
        routeId,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const nextList = json.travel_routes || [];
      setUserRoutesDB(nextList);
      setSelectedRouteId(nextList[0]?.id || "");
      refreshDatabaseState(session?.id);
    }
  }

  // Handle photo file input for Community Reports (compress to data:image/jpeg or webp)
  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setReportError(null);
    if (!file) {
      setNewReportImage("");
      setNewReportImageName("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setReportError("File yang dipilih harus berupa gambar/foto (JPG, PNG, WebP).");
      return;
    }
    setNewReportImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewReportImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleAddCommunityReport(e: React.FormEvent) {
    e.preventDefault();
    setReportError(null);
    if (!session) {
      setReportError("Silakan masuk terlebih dahulu untuk mengirim laporan.");
      return;
    }
    const clean = newReportText.trim();
    if (!clean) {
      setReportError("Deskripsi kondisi lapangan wajib diisi.");
      return;
    }
    if (!newReportImage) {
      setReportError(
        "Wajib menyertakan foto bukti kondisi cuaca/lapangan agar laporan tidak mengada-ada."
      );
      return;
    }

    const labelLoc = selectedKec
      ? `Kec. ${selectedKec.kecamatan}, ${selectedLoc.name} (${selectedKec.adm3})`
      : `${selectedLoc.name} (${selectedLoc.adm2})`;

    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_community_report",
        userId: session.id,
        author: `${session.name} (Terverifikasi)`,
        locationName: labelLoc,
        adm2: selectedLoc.adm2,
        reportType: newReportType,
        description: clean,
        coords: `${selectedLoc.lat.toFixed(4)}, ${selectedLoc.lon.toFixed(4)}`,
        imageUrl: newReportImage,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setReportError(json.error || "Gagal menyimpan laporan ke database.");
      return;
    }
    setCommunityReports(json.community_reports || []);
    setNewReportText("");
    setNewReportImage("");
    setNewReportImageName("");
    refreshDatabaseState(session.id);
  }

  async function handleUpvoteReport(id: string) {
    if (!session) return;
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "vote_community_report",
        userId: session.id,
        reportId: id,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      setCommunityReports(json.community_reports || []);
    }
  }

  async function handleAskDashboardAI(e: React.FormEvent) {
    e.preventDefault();
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adm2: selectedLoc.adm2,
          adm3: selectedKec?.adm3,
          locationName: selectedLoc.name,
          kecamatanName: selectedKec?.kecamatan,
          bmkgStatus: selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc,
          tomorrowStatus: selectedKec
            ? selectedKec.tomorrow_desc
            : data.bmkgDaily[1]?.weather_desc,
          sebentarLagiHujan: data.sebentarLagiHujan,
          rainSignsLabel: data.rainSignsLabel,
          temperatureC: data.currentTempC,
          tminC: selectedKec ? selectedKec.tmin : data.lowTempC,
          tmaxC: selectedKec ? selectedKec.tmax : data.highTempC,
          humidityPct: data.humidityPct,
          huminPct: selectedKec ? selectedKec.humin : data.huminPct,
          humaxPct: selectedKec ? selectedKec.humax : data.humaxPct,
          windSpeedKmh: data.windSpeedKmh,
          rainArrivalMin: data.rainArrivalMin,
          peakMmPerHr: data.peakPrecipMmHr,
          rainConfidencePct: data.rainConfidencePct,
          uvIndex: data.uv.index,
          aqiIndex: data.aqi.index,
          pm25: data.aqi.pm25,
          so2: data.aqi.so2,
          question: customAIQuestion.trim() || undefined,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          rejectedOffTopic?: boolean;
          question: string;
          answer: string;
        };
        setAiLiveResult(json);
        if (session && !json.rejectedOffTopic) {
          fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save_ai_insight",
              userId: session.id,
              locationName: selectedKec
                ? `Kec. ${selectedKec.kecamatan}, ${selectedLoc.name}`
                : selectedLoc.name,
              question: json.question,
              answer: json.answer,
            }),
          }).then(() => refreshDatabaseState(session.id));
        }
      }
    } finally {
      setAiLoading(false);
    }
  }

  const baseMatches = searchWestJavaLocations(
    searchQuery,
    kindFilter === "FAV" ? "ALL" : kindFilter
  );
  const filteredLocations =
    kindFilter === "FAV"
      ? baseMatches.filter((l) => savedLocationsDB.some((s) => s.adm2 === l.adm2))
      : baseMatches;

  const globalKecMatches =
    searchQuery.trim().length >= 2 ? searchKecamatanAcrossJabar(searchQuery).slice(0, 6) : [];

  const filteredKecamatan = kecamatanList.filter((k) => {
    const q = kecSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      k.kecamatan.toLowerCase().includes(q) ||
      k.adm3.toLowerCase().includes(q) ||
      k.weather_desc.toLowerCase().includes(q)
    );
  });

  const imminentRainLocations = getImminentRainLocationsJabar(bmkgMap);
  const isCurrentSelectionSaved = savedLocationsDB.some(
    (s) =>
      s.adm2 === selectedLoc.adm2 &&
      (s.adm3 || "") === (selectedKec?.adm3 || "")
  );

  const activeRouteRecord =
    userRoutesDB.find((r) => r.id === selectedRouteId) || userRoutesDB[0] || null;
  const activeRouteAnalysis = activeRouteRecord
    ? buildCustomTravelCorridor(activeRouteRecord, bmkgMap)
    : null;

  return (
    <>
      <SiteNav />
      <main className="folio-wrapper">
        <div className="folio-sheet">
          {/* ====================================================================
              1. TOP INSTRUMENT STATUS BAR (EXPOSED 1PX RULED HEADER)
              ==================================================================== */}
          <div className="folio-topbar">
            <span>
              PEMANTAUAN CUACA JAWA BARAT (27 KOTA/KABUPATEN • 627 KECAMATAN)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span className="tabular-nums">
                {selectedKec ? `KEC. ${selectedKec.kecamatan.toUpperCase()}, ` : ""}
                {selectedLoc.name.toUpperCase()}
              </span>
              <span className="stamp stamp--green">
                {backendConnected ? "DATA CUACA BMKG AKTIF" : "BMKG JAWA BARAT"}
              </span>
            </div>
          </div>

          {/* ====================================================================
              1B. REAL-TIME SAVED-LOCATION RAIN ALERTS & "SEBENTAR LAGI HUJAN" RADAR
              ==================================================================== */}
          <section
            aria-label="Radar Sebentar Lagi Hujan dan Alert Lokasi Tersimpan"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              borderBottom: "1px solid var(--rule-strong)",
              backgroundColor: "var(--paper)",
            }}
          >
            {/* LEFT (7 COL): User's Saved Locations Real-Time Weather Alerts */}
            <div
              className="grid-col-7"
              style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span className="stamp stamp--green">
                    ALERT CUACA REAL-TIME · LOKASI TERSIMPAN ({savedLocationsDB.length})
                  </span>
                  <strong style={{ fontSize: "0.86rem" }}>
                    Hanya lokasi yang Anda simpan yang mengirimkan peringatan cuaca real-time
                  </strong>
                </div>

                {session ? (
                  <button
                    type="button"
                    className={isCurrentSelectionSaved ? "btn-outline" : "btn-ink btn-sm"}
                    onClick={() => handleToggleSaveLocationForAlert(selectedLoc, selectedKec)}
                  >
                    {isCurrentSelectionSaved
                      ? `★ Tersimpan untuk Alert: ${
                          selectedKec ? `Kec. ${selectedKec.kecamatan}` : selectedLoc.name
                        }`
                      : `+ Simpan ${
                          selectedKec ? `Kec. ${selectedKec.kecamatan}` : selectedLoc.name
                        } untuk Alert Real-Time`}
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Link href="/login?mode=register" className="btn-ink btn-sm">
                      Daftar / Masuk untuk Simpan Lokasi Alert
                    </Link>
                  </div>
                )}
              </div>

              {!session ? (
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                  Simpan lokasi favorit Anda setelah masuk atau daftar akun untuk menerima
                  peringatan real-time saat cuaca di lokasi tersebut menunjukkan tanda{" "}
                  <strong>Sebentar Lagi Hujan</strong>.
                </p>
              ) : savedLocationsDB.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                  Belum ada lokasi yang disimpan. Pilih Kota/Kabupaten atau Kecamatan di bawah lalu
                  klik <strong>+ Simpan untuk Alert Real-Time</strong>.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {savedLocationsDB.map((sl) => {
                    const locObj =
                      WEST_JAVA_LOCATIONS.find((l) => l.adm2 === sl.adm2) || WEST_JAVA_LOCATIONS[0];
                    const st = buildLocationState(locObj, bmkgMap);
                    return (
                      <div
                        key={sl.id}
                        style={{
                          border: `1px solid ${
                            st.sebentarLagiHujan ? "var(--signal-red)" : "var(--rule-strong)"
                          }`,
                          backgroundColor: st.sebentarLagiHujan
                            ? "var(--signal-red-Tint)"
                            : "var(--paper-alt)",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "0.8rem",
                        }}
                      >
                        <button
                          type="button"
                          style={{
                            appearance: "none",
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            textAlign: "left",
                            cursor: "pointer",
                            color: "var(--ink)",
                          }}
                          onClick={() => handleSelectLocation(locObj, sl.adm3)}
                        >
                          <strong style={{ display: "block" }}>
                            {sl.kecamatanName ? `Kec. ${sl.kecamatanName}, ${sl.name}` : sl.name}
                          </strong>
                          <span className="tabular-nums" style={{ fontSize: "0.75rem" }}>
                            Hari Ini: {st.bmkgTodayDesc} ({st.lowTempC}–{st.highTempC}°C) • Besok:{" "}
                            {st.bmkgDaily[1]?.weather_desc || st.bmkgTodayDesc}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                          title="Hapus dari lokasi alert"
                          onClick={() =>
                            handleToggleSaveLocationForAlert(
                              locObj,
                              sl.adm3
                                ? {
                                    adm3: sl.adm3,
                                    kecamatan: sl.kecamatanName || "",
                                    kotkab: sl.name,
                                    weather_desc: st.bmkgTodayDesc,
                                    local_datetime: "",
                                    tmin: st.lowTempC,
                                    tmax: st.highTempC,
                                    humin: st.huminPct,
                                    humax: st.humaxPct,
                                    tomorrow_desc: "",
                                    tomorrow_tmin: st.lowTempC,
                                    tomorrow_tmax: st.highTempC,
                                  }
                                : null
                            )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT (5 COL): Live Radar of All West Java Locations Showing "Sebentar Lagi Hujan" */}
            <div
              className="grid-col-5"
              style={{
                padding: "14px 20px",
                backgroundColor: "var(--signal-amber-tint)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span className="stamp stamp--red">
                  RADAR DETEKSI TANDA HUJAN JAWA BARAT ({imminentRainLocations.length} WILAYAH)
                </span>
                <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
                  LIVE BMKG 32
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.79rem", color: "var(--ink-secondary)" }}>
                Wilayah Jawa Barat dengan prakiraan hujan harian menurut data resmi BMKG (Hari Ini &amp;
                Besok):
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "84px", overflowY: "auto" }}>
                {imminentRainLocations.map((item) => (
                  <button
                    key={item.loc.id}
                    type="button"
                    className="btn-outline tabular-nums"
                    aria-pressed={selectedLoc.id === item.loc.id}
                    onClick={() => handleSelectLocation(item.loc)}
                  >
                    {item.loc.name} — {item.dayLabel} (RH {item.humidityMax}%)
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ====================================================================
              2. MASTHEAD WITH ETCHED CONTOUR CLOUDS DRIFTING BEHIND "WEATHERLY"
              ==================================================================== */}
          <header className="masthead-stage">
            <svg
              className="cloud-layer cloud-layer--back"
              viewBox="0 0 1200 140"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M60 125C60 95 90 74 126 78C146 42 194 24 240 38C274 8 338 10 370 46C408 40 444 64 454 100C486 102 508 125 508 125H60Z"
                fill="var(--paper-hover)"
                stroke="var(--rule)"
                strokeWidth="1"
              />
              <path
                d="M680 128C680 98 712 76 750 80C772 42 822 24 870 38C906 6 972 10 1004 46C1044 40 1082 66 1092 103H680V128Z"
                fill="var(--paper-alt)"
                stroke="var(--rule)"
                strokeWidth="1"
              />
            </svg>

            <svg
              className="cloud-layer cloud-layer--mid"
              viewBox="0 0 1200 140"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M230 132C230 96 268 70 310 75C334 32 394 12 452 28C496 -8 574 -4 612 38C658 32 704 60 716 104C754 106 780 132 780 132H230Z"
                fill="var(--paper-alt)"
                stroke="var(--rule)"
                strokeWidth="1"
              />
            </svg>

            <svg
              className="cloud-layer cloud-layer--front"
              viewBox="0 0 1200 90"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M140 86C140 66 172 52 208 56C230 32 280 20 328 30C364 8 428 10 460 36C500 32 538 48 548 72H140V86Z"
                fill="var(--paper)"
                fillOpacity="0.68"
                stroke="var(--rule)"
                strokeWidth="1"
              />
            </svg>

            <div className="masthead-inner">
              <div>
                <h1 className="masthead-title">WEATHERLY</h1>
              </div>
              <p className="masthead-lead">
                <strong>Know the Weather. Prepare Before It Happens.</strong> Menampilkan kondisi
                cuaca saat ini secara jujur, mendeteksi tanda{" "}
                <strong>Sebentar Lagi Hujan</strong> secara real-time, dan mengirimkan alert hanya
                pada lokasi yang Anda simpan.
              </p>
            </div>
          </header>

          {/* ====================================================================
              3. SEARCHABLE WEST JAVA 27 KOTA & KABUPATEN + 627 KECAMATAN COMMAND BAR
              ==================================================================== */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--rule-strong)",
              backgroundColor: "var(--paper)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 360px" }}>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Cari 27 Kota/Kabupaten atau 627 Kecamatan Jawa Barat (mis. Coblong, Lembang, Cibinong, Soreang, 32.xx)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cari Kota, Kabupaten, atau Kecamatan Jawa Barat"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setSearchQuery("")}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-outline"
                  aria-pressed={kindFilter === "ALL"}
                  onClick={() => setKindFilter("ALL")}
                >
                  Semua (27)
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  aria-pressed={kindFilter === "Kota"}
                  onClick={() => setKindFilter("Kota")}
                >
                  9 Kota
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  aria-pressed={kindFilter === "Kabupaten"}
                  onClick={() => setKindFilter("Kabupaten")}
                >
                  18 Kabupaten
                </button>
                {session && (
                  <button
                    type="button"
                    className="btn-outline"
                    aria-pressed={kindFilter === "FAV"}
                    onClick={() => setKindFilter("FAV")}
                  >
                    ★ Tersimpan ({savedLocationsDB.length})
                  </button>
                )}
              </div>
            </div>

            {globalKecMatches.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                  KECAMATAN COCOK:
                </span>
                {globalKecMatches.map((km) => (
                  <button
                    key={km.adm3}
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      const parent = WEST_JAVA_LOCATIONS.find((l) => l.adm2 === km.adm2);
                      if (parent) handleSelectLocation(parent, km.adm3);
                    }}
                  >
                    Kec. {km.kecamatan} ({km.kotkab} · {km.adm3}) — Saat ini {km.weather_desc}{" "}
                    {km.tmin}–{km.tmax}°C
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav
            className="location-rail"
            aria-label="Pilih dari 27 Kota dan Kabupaten di Jawa Barat"
            style={{ maxHeight: "148px", overflowY: "auto" }}
          >
            {filteredLocations.length === 0 ? (
              <div style={{ padding: "12px 20px", fontSize: "0.84rem", color: "var(--ink-secondary)" }}>
                Tidak ada wilayah yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const fav = savedLocationsDB.some((s) => s.adm2 === loc.adm2);
                const kecLen = getKecamatanListForAdm2(loc.adm2).length;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    className="location-tab"
                    aria-pressed={selectedLoc.id === loc.id}
                    onClick={() => handleSelectLocation(loc)}
                  >
                    <span className="tabular-nums" style={{ fontSize: "0.72rem", opacity: 0.7 }}>
                      [{loc.adm2}]
                    </span>
                    <span>
                      {fav ? "★ " : ""}
                      {loc.name}
                    </span>
                    <span className="tabular-nums" style={{ fontSize: "0.72rem", opacity: 0.75 }}>
                      {kecLen} Kec
                    </span>
                  </button>
                );
              })
            )}
          </nav>

          {/* ====================================================================
              3B. COMPLETE KECAMATAN RAIL FOR THE SELECTED KABUPATEN / KOTA
              ==================================================================== */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: "1px solid var(--rule-strong)",
              backgroundColor: "var(--paper-alt)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className="stamp stamp--green tabular-nums">
                  KECAMATAN DI {selectedLoc.name.toUpperCase()} ({kecamatanList.length} KECAMATAN)
                </span>
                {selectedKec && (
                  <span style={{ fontSize: "0.82rem" }}>
                    Terpilih: <strong>Kec. {selectedKec.kecamatan}</strong> ({selectedKec.adm3}) •
                    Saat ini: <strong>{selectedKec.weather_desc}</strong> • Suhu{" "}
                    <strong className="tabular-nums">
                      {selectedKec.tmin}–{selectedKec.tmax}°C
                    </strong>{" "}
                    • RH{" "}
                    <strong className="tabular-nums">
                      {selectedKec.humin}–{selectedKec.humax}%
                    </strong>
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <input
                  type="search"
                  className="form-control"
                  style={{ width: "230px", padding: "5px 10px", fontSize: "0.78rem" }}
                  placeholder={`Filter kecamatan di ${selectedLoc.name}...`}
                  value={kecSearchQuery}
                  onChange={(e) => setKecSearchQuery(e.target.value)}
                  aria-label={`Filter kecamatan di ${selectedLoc.name}`}
                />
                <a
                  href={`https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${selectedLoc.adm2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                  style={{ textDecoration: "none" }}
                >
                  Sumber BMKG {selectedLoc.adm2} ↗
                </a>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              {filteredKecamatan.map((k) => (
                <button
                  key={k.adm3}
                  type="button"
                  className="btn-outline tabular-nums"
                  aria-pressed={selectedKec?.adm3 === k.adm3}
                  onClick={() => setSelectedKec(k)}
                >
                  Kec. {k.kecamatan} (Saat ini: {k.weather_desc} · {k.tmin}–{k.tmax}°C)
                </button>
              ))}
            </div>
          </div>

          {/* ====================================================================
              4. POSITIONING LEDGER TRIO (CURRENT WEATHER FIRST -> RAIN SIGNS -> ACTION)
              ==================================================================== */}
          <section className="ledger-trio" aria-label="Ringkasan Keputusan Cuaca">
            <div className="ledger-cell">
              <span className="cell-index">
                01 — CUACA SAAT INI DI{" "}
                {selectedKec
                  ? `KEC. ${selectedKec.kecamatan.toUpperCase()}`
                  : selectedLoc.name.toUpperCase()}
              </span>
              <p className="cell-headline">
                Saat Ini:{" "}
                {selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc} (
                {data.currentTempC.toFixed(1)}°C)
              </p>
              <p className="cell-copy">
                Rentang suhu hari ini{" "}
                <strong className="tabular-nums">
                  {selectedKec
                    ? `${selectedKec.tmin}–${selectedKec.tmax}°C`
                    : `${data.lowTempC}–{data.highTempC}°C`}
                </strong>{" "}
                dengan kelembapan udara{" "}
                <strong className="tabular-nums">
                  {selectedKec
                    ? `${selectedKec.humin}–${selectedKec.humax}%`
                    : `${data.huminPct}–{data.humaxPct}%`}
                </strong>
                .
              </p>
            </div>

            <div className={`ledger-cell ${data.sebentarLagiHujan ? "ledger-cell--alert" : ""}`}>
              <span
                className="cell-index"
                style={{ color: data.sebentarLagiHujan ? "var(--signal-red)" : "var(--signal-green)" }}
              >
                02 — PREDIKSI HARIAN BMKG (HARI INI &amp; BESOK)
              </span>
              <p
                className="cell-headline tabular-nums"
                style={{ color: data.sebentarLagiHujan ? "var(--signal-red)" : "var(--ink)" }}
              >
                Hari Ini: {selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc} • Besok:{" "}
                {selectedKec
                  ? selectedKec.tomorrow_desc
                  : data.bmkgDaily[1]?.weather_desc || data.bmkgTodayDesc}
              </p>
              <p className="cell-copy">{data.rainSignsLabel}</p>
            </div>

            <div className="ledger-cell">
              <span className="cell-index">03 — REKOMENDASI &amp; ALERT LOKASI</span>
              <p className="cell-headline">
                {data.sebentarLagiHujan
                  ? "Siapkan Jas Hujan Sekarang"
                  : "Aman Beraktivitas Luar Ruang"}
              </p>
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
                  Cuaca Aktual &amp; Prakiraan Harian BMKG —{" "}
                  {selectedKec
                    ? `Kec. ${selectedKec.kecamatan}, ${selectedLoc.name}`
                    : selectedLoc.name}
                </h2>
                <span className={`stamp ${data.sebentarLagiHujan ? "stamp--red" : "stamp--green"}`}>
                  HARI INI:{" "}
                  {(selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc).toUpperCase()}
                </span>
              </div>

              <div className="primary-reading-flex">
                <div style={{ display: "flex", alignItems: "baseline", gap: "18px" }}>
                  <p className="degree-giant tabular-nums">{data.currentTempC.toFixed(1)}°C</p>
                  <div>
                    <strong style={{ display: "block", fontSize: "1.05rem" }}>
                      Hari Ini:{" "}
                      {selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc}
                    </strong>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: "0.84rem", color: "var(--ink-secondary)" }}
                    >
                      Terasa {data.feelsLikeC.toFixed(1)}°C • Rentang Hari Ini{" "}
                      {selectedKec
                        ? `${selectedKec.tmin}°–${selectedKec.tmax}°C`
                        : `${data.lowTempC}°–${data.highTempC}°C`}{" "}
                      • Prediksi Besok:{" "}
                      {selectedKec
                        ? selectedKec.tomorrow_desc
                        : data.bmkgDaily[1]?.weather_desc || "Berawan"}
                    </span>
                  </div>
                </div>

                <div>
                  {session ? (
                    <button
                      type="button"
                      className={isCurrentSelectionSaved ? "btn-outline" : "btn-ink btn-sm"}
                      onClick={() => handleToggleSaveLocationForAlert(selectedLoc, selectedKec)}
                    >
                      {isCurrentSelectionSaved
                        ? "★ Alert Real-Time Aktif di Lokasi Ini"
                        : "+ Simpan Lokasi untuk Alert Real-Time"}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="stamp stamp--red tabular-nums"
                      style={{ textDecoration: "none" }}
                    >
                      MASUK UNTUK SIMPAN ALERT LOKASI INI
                    </Link>
                  )}
                </div>
              </div>

              <div className="spec-strip">
                <div className="spec-cell">
                  <span className="spec-key">KELEMBAPAN BMKG</span>
                  <span className="spec-val">
                    {selectedKec
                      ? `${selectedKec.humin}–${selectedKec.humax}%`
                      : `${data.huminPct}–${data.humaxPct}%`}{" "}
                    ({data.dewPointC}°C)
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

              {/* 6-Day Daily BMKG Barograph Chart (Days instead of minutes!) */}
              <div style={{ marginTop: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <strong style={{ fontSize: "0.9rem" }}>
                    Grafik Prakiraan 6 Hari BMKG — Hari Ini s.d. 5 Hari ke Depan ({selectedLoc.name})
                  </strong>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.74rem",
                      color: "var(--ink-muted)",
                    }}
                  >
                    DATA HARIAN RESMI BMKG PROVINSI 32
                  </span>
                </div>

                <div
                  className="barograph-grid"
                  role="list"
                  aria-label="Grafik prakiraan harian BMKG"
                >
                  {data.bmkgDaily.slice(0, 6).map((day, idx) => {
                    const isRainDay = day.weather_desc.toLowerCase().includes("hujan");
                    const heightPct = Math.min(
                      100,
                      Math.max(25, Math.round((day.humax / 100) * 100))
                    );
                    const dayLabel =
                      idx === 0
                        ? "Hari Ini"
                        : idx === 1
                        ? "Besok"
                        : day.local_datetime.slice(5, 10);
                    return (
                      <div key={day.local_datetime || idx} className="barograph-col" role="listitem">
                        <span
                          className="tabular-nums"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: isRainDay ? "var(--signal-red)" : "var(--ink)",
                          }}
                        >
                          {day.tmin}–{day.tmax}°C
                        </span>
                        <div className="barograph-well">
                          <div
                            className={`barograph-bar ${isRainDay ? "barograph-bar--peak" : ""}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <strong
                          className="tabular-nums"
                          style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}
                        >
                          {dayLabel}
                        </strong>
                        <span
                          className="tabular-nums"
                          style={{ fontSize: "0.72rem", color: "var(--ink-secondary)", textAlign: "center" }}
                        >
                          {day.weather_desc} ({day.humax}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official BMKG Multi-Day Forecast Table */}
              <div style={{ marginTop: "22px" }}>
                <strong style={{ fontSize: "0.9rem" }}>
                  Prakiraan Harian Resmi BMKG Jawa Barat — {selectedLoc.name} (Kode{" "}
                  {selectedLoc.adm2})
                </strong>
                <table className="timetable">
                  <thead>
                    <tr>
                      <th>PERIODE (WIB)</th>
                      <th>KONDISI / PRAKIRAAN BMKG</th>
                      <th>SUHU (MIN–MAKS)</th>
                      <th>KELEMBAPAN (MIN–MAKS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bmkgDaily.slice(0, 6).map((day, idx) => (
                      <tr key={day.local_datetime || idx}>
                        <td className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                          {idx === 0
                            ? `Saat Ini (${day.local_datetime.slice(0, 10)})`
                            : idx === 1
                            ? `Besok (${day.local_datetime.slice(0, 10)})`
                            : day.local_datetime.slice(0, 10)}
                        </td>
                        <td>
                          <span
                            className={`stamp ${
                              day.weather_desc.toLowerCase().includes("hujan")
                                ? "stamp--red"
                                : day.weather_desc.toLowerCase().includes("cerah")
                                ? "stamp--green"
                                : "stamp--amber"
                            }`}
                          >
                            {day.weather_desc}
                          </span>
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 600 }}>
                          {day.tmin}°C – {day.tmax}°C
                        </td>
                        <td className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                          {day.humin}% – {day.humax}%
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
                  Peringatan Cuaca &amp; Radar Hujan
                </h2>
                <span className="stamp stamp--red">
                  {data.extremeAlert.severity.toUpperCase()} · PUBLIK
                </span>
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
                  <span>
                    RADAR KONTUR PRESIPITASI ({selectedKec ? selectedKec.adm3 : selectedLoc.adm2})
                  </span>
                  <span>
                    {data.sebentarLagiHujan ? "SEBENTAR LAGI HUJAN" : "CUACA SAAT INI STABIL"}
                  </span>
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
                  aria-label={`Peta kontur isobar dan sel hujan ${selectedLoc.name}`}
                >
                  <line x1="0" y1="52" x2="420" y2="52" stroke="var(--rule)" strokeWidth="1" />
                  <line x1="0" y1="105" x2="420" y2="105" stroke="var(--rule)" strokeWidth="1" />
                  <line x1="0" y1="157" x2="420" y2="157" stroke="var(--rule)" strokeWidth="1" />
                  <line x1="105" y1="0" x2="105" y2="210" stroke="var(--rule)" strokeWidth="1" />
                  <line x1="210" y1="0" x2="210" y2="210" stroke="var(--rule)" strokeWidth="1" />
                  <line x1="315" y1="0" x2="315" y2="210" stroke="var(--rule)" strokeWidth="1" />

                  <ellipse
                    cx="185"
                    cy="74"
                    rx="105"
                    ry="52"
                    fill="var(--signal-amber-tint)"
                    stroke="var(--signal-amber)"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                  {data.sebentarLagiHujan && (
                    <ellipse
                      cx="175"
                      cy="68"
                      rx="62"
                      ry="30"
                      fill="var(--signal-red-Tint)"
                      stroke="var(--signal-red)"
                      strokeWidth="1.25"
                    />
                  )}
                  <ellipse
                    cx="295"
                    cy="132"
                    rx="68"
                    ry="32"
                    fill="var(--signal-amber-tint)"
                    stroke="var(--signal-amber)"
                    strokeWidth="1"
                  />

                  <rect x="165" y="48" width="6" height="6" fill="var(--signal-red)" />
                  <text x="176" y="55" fill="var(--ink)" fontSize="10" fontFamily="monospace">
                    {data.sebentarLagiHujan
                      ? `SEL HUJAN MENDEKAT • ${data.peakPrecipMmHr} mm/j`
                      : `SAAT INI: ${(selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc).toUpperCase()}`}
                  </text>

                  <rect x="192" y="98" width="7" height="7" fill="var(--ink)" />
                  <text
                    x="204"
                    y="105"
                    fill="var(--ink)"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {selectedKec
                      ? `KEC. ${selectedKec.kecamatan.toUpperCase()} (${data.currentTempC}°C)`
                      : `${selectedLoc.name.toUpperCase()} (${data.currentTempC}°C)`}
                  </text>

                  <rect x="282" y="132" width="6" height="6" fill="var(--signal-amber)" />
                  <text
                    x="180"
                    y="150"
                    fill="var(--ink-secondary)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {selectedLoc.name.toUpperCase()} ({selectedLoc.adm2})
                  </text>

                  <rect x="178" y="172" width="6" height="6" fill="var(--signal-red)" />
                  <text x="189" y="179" fill="var(--signal-red)" fontSize="10" fontFamily="monospace">
                    RH BMKG:{" "}
                    {selectedKec
                      ? `${selectedKec.humin}–${selectedKec.humax}%`
                      : `${data.huminPct}–${data.humaxPct}%`}
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
                  <span>Garis Putus Amber: Zona Pemantauan Awan</span>
                </div>
              </div>
            </section>
          </div>

          {/* ====================================================================
              5B. FULL-WIDTH ROW: BERITA ACARA CUACA & BENCANA JAWA BARAT (WITH SOURCE LINKS)
              ==================================================================== */}
          <div className="ruled-row">
            <section
              className="section-pad"
              style={{ gridColumn: "span 12 / span 12" }}
              aria-labelledby="h-berita-acara-dash"
            >
              <div className="section-bar">
                <div>
                  <h2 id="h-berita-acara-dash" className="section-heading">
                    Berita Acara Cuaca &amp; Bencana Provinsi Jawa Barat (Live Update &amp; Sumber Resmi)
                  </h2>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span className="stamp stamp--red">OTOMATIS TERUPDATE DARI PORTAL RESMI</span>
                  <a
                    href="https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline"
                    style={{ textDecoration: "none" }}
                  >
                    BMKG Jawa Barat (Kode 32) ↗
                  </a>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                  borderTop: "1px solid var(--rule-strong)",
                  borderLeft: "1px solid var(--rule-strong)",
                }}
              >
                {beritaAcara.map((ba) => (
                  <article
                    key={ba.id}
                    style={{
                      padding: "16px 18px",
                      borderRight: "1px solid var(--rule-strong)",
                      borderBottom: "1px solid var(--rule-strong)",
                      backgroundColor: "var(--paper)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.72rem",
                          color: "var(--ink-muted)",
                        }}
                      >
                        Tanggal Laporan: {ba.publishedAt}
                      </span>
                      <span
                        className={`stamp ${
                          ba.category === "Cuaca Ekstrem BMKG" ||
                          ba.category === "Siaga Darurat Bencana"
                            ? "stamp--red"
                            : "stamp--amber"
                        }`}
                      >
                        {ba.category}
                      </span>
                    </div>

                    <strong style={{ fontSize: "0.96rem", lineHeight: 1.35 }}>{ba.title}</strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.82rem",
                        color: "var(--ink-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {ba.summary}
                    </p>

                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--rule)",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div style={{ fontSize: "0.76rem", color: "var(--ink-secondary)" }}>
                        <div>
                          Wilayah: <strong>{ba.region}</strong>
                        </div>
                        <div>
                          Sumber:{" "}
                          <a
                            href={ba.sourceDomainUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontWeight: 600, textDecoration: "underline" }}
                          >
                            {ba.sourceName} ↗
                          </a>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <a
                          href={ba.articleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ink btn-sm"
                        >
                          Baca Berita ↗
                        </a>
                        <a
                          href={ba.sourceDomainUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline"
                          style={{ textDecoration: "none" }}
                        >
                          Sumber ↗
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* ====================================================================
              6. ROW 2: AI WEATHER INSIGHTS (6 COL) + AIR QUALITY & UV MONITORING (6 COL)
              ==================================================================== */}
          <div className="ruled-row">
            {/* MODULE 4: AI WEATHER INSIGHTS (Clean "Tanya AI" button, no model names!) */}
            <section className="grid-col-6 section-pad" aria-labelledby="h-ai-insights">
              <div className="section-bar">
                <h2 id="h-ai-insights" className="section-heading">
                  AI Weather Insights —{" "}
                  {selectedKec ? `Kec. ${selectedKec.kecamatan}` : selectedLoc.name}
                </h2>
                <span className="stamp">
                  {session
                    ? `TERSIMPAN: ${session.savedAIInsights.length}`
                    : "KHUSUS TOPIK CUACA"}
                </span>
              </div>

              <p style={{ margin: "0 0 14px", fontSize: "0.86rem", color: "var(--ink-secondary)" }}>
                Menjelaskan <strong>kondisi cuaca saat ini</strong> terlebih dahulu, lalu{" "}
                <strong>prediksi dan tanda-tanda hujan</strong> ke depan. Pertanyaan di luar topik
                cuaca akan otomatis ditolak.
              </p>

              <form
                onSubmit={handleAskDashboardAI}
                style={{
                  display: "flex",
                  gap: "6px",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  style={{ flex: "1 1 240px" }}
                  placeholder={`Tanya cuaca di ${
                    selectedKec ? `Kec. ${selectedKec.kecamatan}` : selectedLoc.name
                  }...`}
                  value={customAIQuestion}
                  onChange={(e) => setCustomAIQuestion(e.target.value)}
                />
                <button type="submit" className="btn-ink" disabled={aiLoading}>
                  {aiLoading ? "Memproses..." : "Tanya AI"}
                </button>
              </form>

              {aiLiveResult && (
                <div
                  style={{
                    border: `1px solid ${
                      aiLiveResult.rejectedOffTopic ? "var(--signal-red)" : "var(--rule-strong)"
                    }`,
                    backgroundColor: aiLiveResult.rejectedOffTopic
                      ? "var(--signal-red-Tint)"
                      : "var(--paper-alt)",
                    padding: "12px",
                    marginBottom: "14px",
                    fontSize: "0.84rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong>{aiLiveResult.question}</strong>
                    <span
                      className={`stamp ${
                        aiLiveResult.rejectedOffTopic ? "stamp--red" : "stamp--green"
                      }`}
                    >
                      {aiLiveResult.rejectedOffTopic
                        ? "TOPIK DI LUAR CUACA DITOLAK"
                        : "ANALISIS CUACA TERVALIDASI"}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "var(--ink)" }}>{aiLiveResult.answer}</p>
                </div>
              )}

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
                  const isSaved = Boolean(session?.savedAIInsights.includes(item.id));
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
                        <strong
                          style={{ display: "block", fontSize: "0.92rem", marginBottom: "4px" }}
                        >
                          {item.question}
                        </strong>
                        <span style={{ fontSize: "0.85rem", color: "var(--ink-secondary)" }}>
                          {item.answer}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "6px",
                        }}
                      >
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
                        {session ? (
                          <button
                            type="button"
                            className="btn-outline"
                            aria-pressed={isSaved}
                            onClick={() => toggleSavedAIInsight(item.id)}
                          >
                            {isSaved ? "★ Tersimpan" : "☆ Simpan Analisis"}
                          </button>
                        ) : (
                          <Link
                            href="/login"
                            className="stamp stamp--muted"
                            style={{ textDecoration: "none" }}
                          >
                            Masuk untuk simpan
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* MODULE 2 & 7: AIR QUALITY & UV MONITORING */}
            <section className="grid-col-6 section-pad" aria-labelledby="h-aqi-uv">
              <div className="section-bar">
                <h2 id="h-aqi-uv" className="section-heading">
                  Air Quality Monitoring (AQI) &amp; UV Index — {selectedLoc.name}
                </h2>
                <span className="stamp stamp--green">TERBUKA TANPA LOGIN</span>
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span className="spec-key">INDEKS KUALITAS UDARA (AQI)</span>
                    <span className="stamp stamp--green">{data.aqi.category.toUpperCase()}</span>
                  </div>
                  <p
                    className="degree-giant tabular-nums"
                    style={{ fontSize: "2.6rem", margin: "10px 0" }}
                  >
                    {data.aqi.index}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                    {data.aqi.outdoorAdvice}
                  </p>
                </div>

                <div style={{ padding: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
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

              {/* Pollutant Ledger Table */}
              <strong style={{ fontSize: "0.88rem" }}>
                Tabel Parameter Kualitas Udara
              </strong>
              <table className="timetable">
                <thead>
                  <tr>
                    <th>PARAMETER</th>
                    <th>KONSENTRASI</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>PM2.5 (Partikulat Halus &lt;2.5µm)</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>
                      {data.aqi.pm25} µg/m³
                    </td>
                    <td>
                      <span className="stamp stamp--green">TERUKUR</span>
                    </td>
                  </tr>
                  <tr>
                    <td>PM10 (Partikulat Kasar &lt;10µm)</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>
                      {data.aqi.pm10} µg/m³
                    </td>
                    <td>
                      <span className="stamp stamp--green">TERUKUR</span>
                    </td>
                  </tr>
                  <tr>
                    <td>NO2 / O3 / CO</td>
                    <td className="tabular-nums">
                      {data.aqi.no2} / {data.aqi.o3} / {data.aqi.co} µg/m³
                    </td>
                    <td>
                      <span className="stamp stamp--green">TERUKUR</span>
                    </td>
                  </tr>
                  <tr>
                    <td>SO2 (Sulfur Dioksida)</td>
                    <td
                      className="tabular-nums"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}
                    >
                      {data.aqi.so2 !== null ? `${data.aqi.so2} µg/m³` : "—"}
                    </td>
                    <td>
                      <span className={`stamp ${data.aqi.so2 !== null ? "stamp--green" : "stamp--muted"}`}>
                        {data.aqi.so2 !== null ? "TERUKUR" : "BELUM TERSEDIA"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          {/* ====================================================================
              7. ROW 3: FLOOD MONITORING (4 COL) + USER-CREATED SMART TRAVEL (4 COL) + PHOTO COMMUNITY REPORTS (4 COL)
              ==================================================================== */}
          <div className="ruled-row">
            {/* MODULE 3: FLOOD MONITORING */}
            <section className="grid-col-4 section-pad" aria-labelledby="h-flood">
              <div className="section-bar">
                <h2 id="h-flood" className="section-heading">
                  Pemantauan Banjir &amp; Cuaca
                </h2>
                <span className="stamp stamp--green">TERVERIFIKASI</span>
              </div>

              <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                Menampilkan informasi resmi BMKG/BNPB/BPBD, laporan banjir warga yang disertai foto,
                serta prakiraan kelembapan harian BMKG:
              </p>

              <div className="ledger-list">
                {/* 1. Official Live News from BMKG / BNPB / Pemprov Jabar */}
                {beritaAcara.slice(0, 2).map((ba) => (
                  <div key={ba.id} className="ledger-item">
                    <div>
                      <strong style={{ display: "block", fontSize: "0.86rem" }}>
                        {ba.region} — {ba.title}
                      </strong>
                      <span
                        className="tabular-nums"
                        style={{
                          display: "block",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.72rem",
                          color: "var(--ink-muted)",
                          margin: "2px 0 4px",
                        }}
                      >
                        Sumber Resmi: {ba.sourceName} • Tanggal Laporan: {ba.publishedAt}
                      </span>
                      <a
                        href={ba.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.78rem", textDecoration: "underline" }}
                      >
                        Buka Rilis Resmi ({ba.sourceName}) ↗
                      </a>
                    </div>
                    <span className="stamp stamp--red">Resmi</span>
                  </div>
                ))}

                {/* 2. Real User-Submitted Flood Reports */}
                {communityReports
                  .filter((r) => r.reportType === "Genangan / Banjir")
                  .map((rep) => (
                    <div key={rep.id} className="ledger-item">
                      <div>
                        <strong style={{ display: "block", fontSize: "0.86rem" }}>
                          {rep.locationName}
                        </strong>
                        <span
                          className="tabular-nums"
                          style={{
                            display: "block",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.72rem",
                            color: "var(--ink-muted)",
                            margin: "2px 0 4px",
                          }}
                        >
                          Laporan Warga: {rep.author} • Tanggal: {rep.reportDate || rep.timeAgo}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                          {rep.description}
                        </span>
                      </div>
                      <span className="stamp stamp--green">Warga</span>
                    </div>
                  ))}

                {/* 3. Live BMKG Daily Hydrometeorological Context for Selected Region */}
                <div className="ledger-item">
                  <div>
                    <strong style={{ display: "block", fontSize: "0.86rem" }}>
                      Prakiraan Hidrometeorologi Harian — {selectedLoc.name}
                    </strong>
                    <span
                      className="tabular-nums"
                      style={{
                        display: "block",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        color: "var(--ink-muted)",
                        margin: "2px 0 4px",
                      }}
                    >
                      BMKG Jawa Barat • Hari Ini: {data.bmkgTodayDesc} • RH {data.huminPct}–
                      {data.humaxPct}%
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                      Kondisi kelembapan harian BMKG untuk {selectedLoc.name} (Prakiraan Besok:{" "}
                      {data.bmkgDaily[1]?.weather_desc || data.bmkgTodayDesc}).
                    </span>
                  </div>
                  <span className="stamp stamp--amber">Prakiraan</span>
                </div>
              </div>
            </section>

            {/* MODULE 5: SMART TRAVEL (STARTS EMPTY UNTIL USER ADDS THEIR OWN ROUTE!) */}
            <section className="grid-col-4 section-pad" aria-labelledby="h-travel">
              <div className="section-bar">
                <h2 id="h-travel" className="section-heading">
                  Smart Travel Route
                </h2>
                <span className="stamp">
                  {userRoutesDB.length} RUTE BUATAN ANDA
                </span>
              </div>

              {/* User Route Builder Form */}
              <form
                onSubmit={handleCreateSmartTravelRoute}
                style={{
                  border: "1px solid var(--rule-strong)",
                  backgroundColor: "var(--paper-alt)",
                  padding: "12px",
                  marginBottom: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <strong style={{ fontSize: "0.82rem" }}>
                  + Buat Rute Perjalanan Anda Sendiri
                </strong>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Label rute (opsional, mis. Rumah → Kampus)"
                  value={customRouteName}
                  onChange={(e) => setCustomRouteName(e.target.value)}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div>
                    <label
                      htmlFor="travel-origin"
                      style={{ display: "block", fontSize: "0.72rem", marginBottom: "2px" }}
                    >
                      Titik Asal
                    </label>
                    <select
                      id="travel-origin"
                      className="form-control"
                      value={originAdm2}
                      onChange={(e) => setOriginAdm2(e.target.value)}
                    >
                      {WEST_JAVA_LOCATIONS.map((l) => (
                        <option key={l.adm2} value={l.adm2}>
                          {l.name} ({l.adm2})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="travel-dest"
                      style={{ display: "block", fontSize: "0.72rem", marginBottom: "2px" }}
                    >
                      Titik Tujuan
                    </label>
                    <select
                      id="travel-dest"
                      className="form-control"
                      value={destAdm2}
                      onChange={(e) => setDestAdm2(e.target.value)}
                    >
                      {WEST_JAVA_LOCATIONS.map((l) => (
                        <option key={l.adm2} value={l.adm2}>
                          {l.name} ({l.adm2})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="travel-mid"
                    style={{ display: "block", fontSize: "0.72rem", marginBottom: "2px" }}
                  >
                    Titik Transit / Tengah (Opsional)
                  </label>
                  <select
                    id="travel-mid"
                    className="form-control"
                    value={midAdm2}
                    onChange={(e) => setMidAdm2(e.target.value)}
                  >
                    <option value="">— Tanpa Titik Transit —</option>
                    {WEST_JAVA_LOCATIONS.map((l) => (
                      <option key={l.adm2} value={l.adm2}>
                        {l.name} ({l.adm2})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-ink">
                  + Tambah &amp; Cek Cuaca Rute
                </button>
              </form>

              {userRoutesDB.length === 0 || !activeRouteAnalysis ? (
                <div
                  style={{
                    border: "1px dashed var(--rule-strong)",
                    padding: "20px 14px",
                    textAlign: "center",
                    fontSize: "0.82rem",
                    color: "var(--ink-secondary)",
                  }}
                >
                  <strong style={{ display: "block", color: "var(--ink)", marginBottom: "4px" }}>
                    Daftar Smart Travel Masih Kosong
                  </strong>
                  Pilih titik asal dan tujuan Anda pada form di atas untuk menambahkan rute
                  perjalanan dan memantau cuaca di sepanjang jalur Anda.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "12px",
                    }}
                  >
                    {userRoutesDB.map((route) => (
                      <div key={route.id} style={{ display: "inline-flex", gap: "2px" }}>
                        <button
                          type="button"
                          className="btn-outline"
                          aria-pressed={activeRouteRecord?.id === route.id}
                          onClick={() => setSelectedRouteId(route.id)}
                        >
                          {route.routeName}
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          title="Hapus rute ini"
                          onClick={() => handleDeleteSmartTravelRoute(route.id)}
                        >
                          ✕
                        </button>
                      </div>
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
                      {activeRouteAnalysis.overallStatus} ({activeRouteAnalysis.distanceKm} km • ~
                      {activeRouteAnalysis.estDurationMin} mnt)
                    </strong>
                    <span style={{ color: "var(--ink-secondary)" }}>
                      {activeRouteAnalysis.recommendation}
                    </span>
                  </div>

                  <div className="ledger-list">
                    {activeRouteAnalysis.checkpoints.map((cp) => (
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
                </>
              )}
            </section>

            {/* MODULE 6: COMMUNITY REPORTS (MANDATORY PHOTO PROOF!) */}
            <section className="grid-col-4 section-pad" aria-labelledby="h-community">
              <div className="section-bar">
                <h2 id="h-community" className="section-heading">
                  Community Reports (Wajib Foto)
                </h2>
                <span className={`stamp ${session ? "stamp--green" : "stamp--red"}`}>
                  {session ? "BUKTI FOTO WAJIB" : "LAPOR · WAJIB LOGIN & FOTO"}
                </span>
              </div>

              {session ? (
                <form
                  onSubmit={handleAddCommunityReport}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "16px",
                    border: "1px solid var(--rule-strong)",
                    backgroundColor: "var(--paper-alt)",
                    padding: "12px",
                  }}
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
                      placeholder={`Deskripsi kondisi di ${
                        selectedKec ? `Kec. ${selectedKec.kecamatan}` : selectedLoc.name
                      }...`}
                      value={newReportText}
                      onChange={(e) => setNewReportText(e.target.value)}
                    />
                  </div>

                  {/* Mandatory Photo Upload Input */}
                  <div>
                    <label
                      htmlFor="community-photo"
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      Unggah Foto Bukti Lapangan (WAJIB agar laporan valid):
                    </label>
                    <input
                      id="community-photo"
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handlePhotoFileChange}
                      required
                    />
                  </div>

                  {newReportImage && (
                    <div
                      style={{
                        border: "1px solid var(--rule-strong)",
                        padding: "6px",
                        backgroundColor: "var(--paper)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newReportImage}
                        alt="Pratinjau foto laporan"
                        style={{
                          width: "100%",
                          height: "110px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          color: "var(--signal-green)",
                        }}
                      >
                        ✓ Foto siap diunggah: {newReportImageName}
                      </span>
                    </div>
                  )}

                  {reportError && (
                    <p
                      role="alert"
                      style={{
                        margin: 0,
                        padding: "8px",
                        border: "1px solid var(--signal-red)",
                        backgroundColor: "var(--signal-red-Tint)",
                        fontSize: "0.78rem",
                        color: "var(--ink)",
                      }}
                    >
                      {reportError}
                    </p>
                  )}

                  <button type="submit" className="btn-ink">
                    Kirim Laporan &amp; Foto ({selectedKec ? `Kec. ${selectedKec.kecamatan}` : selectedLoc.name})
                  </button>
                </form>
              ) : (
                <div
                  style={{
                    border: "1px solid var(--rule-strong)",
                    backgroundColor: "var(--paper-alt)",
                    padding: "12px",
                    marginBottom: "16px",
                    fontSize: "0.82rem",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "4px" }}>
                    Kirim Laporan Warga Berfoto
                  </strong>
                  <p style={{ margin: "0 0 10px", color: "var(--ink-secondary)" }}>
                    Untuk menjaga keakuratan informasi, pengiriman laporan warga wajib menggunakan
                    akun terdaftar dan menyertakan <strong>foto bukti lapangan</strong>.
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Link href="/login?mode=register" className="btn-ink btn-sm">
                      Daftar / Masuk untuk Melapor
                    </Link>
                  </div>
                </div>
              )}

              <div className="ledger-list">
                {communityReports.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed var(--rule-strong)",
                      padding: "20px 14px",
                      textAlign: "center",
                      fontSize: "0.82rem",
                      color: "var(--ink-secondary)",
                    }}
                  >
                    <strong style={{ display: "block", color: "var(--ink)", marginBottom: "4px" }}>
                      Belum Ada Laporan Warga Hari Ini
                    </strong>
                    Jadilah warga pertama yang melaporkan kondisi cuaca di sekitar Anda bersama foto
                    bukti lapangan.
                  </div>
                ) : (
                  communityReports.map((rep) => {
                    const hasVoted = Boolean(session && rep.voterIds?.includes(session.id));
                    const reportDateLabel =
                      rep.reportDate ||
                      (rep.createdAt
                        ? new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(rep.createdAt)) + " WIB"
                        : rep.timeAgo);
                    return (
                      <div
                        key={rep.id}
                        className="ledger-item"
                        style={{ flexDirection: "column", alignItems: "stretch" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "8px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <strong style={{ fontSize: "0.86rem" }}>{rep.locationName}</strong>
                              <span className="stamp">{rep.reportType}</span>
                            </div>
                            <p
                              style={{
                                margin: "4px 0",
                                fontSize: "0.81rem",
                                color: "var(--ink-secondary)",
                              }}
                            >
                              {rep.description}
                            </p>
                          </div>

                          {session ? (
                            <button
                              type="button"
                              className="btn-outline tabular-nums"
                              disabled={hasVoted}
                              onClick={() => handleUpvoteReport(rep.id)}
                            >
                              {hasVoted ? `Valid (${rep.upvotes})` : `Dukung +${rep.upvotes}`}
                            </button>
                          ) : (
                            <span
                              className="stamp stamp--muted tabular-nums"
                              title="Masuk untuk memberi dukungan"
                            >
                              {rep.upvotes} dukungan
                            </span>
                          )}
                        </div>

                        {rep.imageUrl && (
                          <div
                            style={{
                              border: "1px solid var(--rule-strong)",
                              backgroundColor: "var(--paper-alt)",
                              padding: "4px",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rep.imageUrl}
                              alt={`Bukti foto ${rep.locationName}`}
                              style={{
                                width: "100%",
                                height: "135px",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>
                        )}

                        <span
                          className="tabular-nums"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.72rem",
                            color: "var(--ink-muted)",
                          }}
                        >
                          Pelapor: {rep.author} • Tanggal Laporan: {reportDateLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
