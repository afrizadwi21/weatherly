"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  WestJavaRegionGroup,
  buildLocationState,
  getBMKGSnapshotForLocation,
  getImminentRainLocationsJabar,
  getKecamatanListForAdm2,
  searchKecamatanAcrossJabar,
  searchWestJavaLocations,
} from "@/lib/weatherly-data";
import { useWeatherlySession } from "@/lib/weatherly-session";
import "./landing.css";

const FILTER_TABS: Array<{
  id: "ALL" | "Kota" | "Kabupaten" | WestJavaRegionGroup;
  label: string;
}> = [
  { id: "ALL", label: "Semua Jawa Barat (27)" },
  { id: "Kota", label: "9 Kota" },
  { id: "Kabupaten", label: "18 Kabupaten" },
  { id: "Bandung Raya", label: "Bandung Raya" },
  { id: "Bodebek & Bogor", label: "Bodebek & Bogor" },
  { id: "Priangan Timur", label: "Priangan Timur" },
  { id: "Ciayumajakuning", label: "Ciayumajakuning" },
  { id: "Pantura & Purwasuka", label: "Pantura & Purwasuka" },
  { id: "Priangan Barat", label: "Priangan Barat" },
];

const GUEST_FEATURES = [
  {
    title: "Melihat cuaca saat ini di 27 Kota/Kabupaten & 627 Kecamatan Jawa Barat",
    detail: "Suhu aktual, kelembapan, titik embun, angin, tekanan udara, dan jarak pandang.",
  },
  {
    title: "Melihat prakiraan cuaca harian BMKG",
    detail: "Prakiraan cuaca Hari Ini, Besok, hingga 6 hari ke depan di seluruh wilayah Jawa Barat.",
  },
  {
    title: "Melihat Berita Acara Cuaca & Bencana Jawa Barat",
    detail: "Rangkuman berita cuaca ekstrem, banjir, dan longsor di Jawa Barat lengkap dengan tanggal laporan dan sumber resmi.",
  },
  {
    title: "Mengecek UV, kualitas udara, dan radar hujan",
    detail: "Indeks kualitas udara (AQI), PM2.5, PM10, NO₂, O₃, CO, SO₂, dan rekomendasi pelindung UV.",
  },
  {
    title: "Melihat peringatan cuaca publik",
    detail: "Buletin peringatan dini cuaca ekstrem BMKG dan pemantauan hidrometeorologi.",
  },
];

const REGISTERED_FEATURES = [
  {
    title: "Menyimpan banyak lokasi & kecamatan favorit",
    detail: "Tandai Kota/Kabupaten atau Kecamatan favorit di Jawa Barat (rumah, kampus, kantor) untuk akses cepat.",
  },
  {
    title: "Mengatur pengingat cuaca berdasarkan lokasi",
    detail: "Terima peringatan cuaca real-time khusus untuk lokasi-lokasi yang Anda simpan.",
  },
  {
    title: "Melihat histori dan personalisasi",
    detail: "Riwayat peringatan cuaca dan preferensi aktivitas harian Anda.",
  },
  {
    title: "Menyimpan analisis asisten cuaca AI",
    detail: "Simpan rekomendasi cuaca harian untuk referensi perjalanan Anda.",
  },
  {
    title: "Membuat laporan warga berfoto",
    detail: "Kirim laporan kondisi cuaca atau genangan lengkap dengan bukti foto lapangan dan tanggal laporan.",
  },
  {
    title: "Menyimpan rute perjalanan Smart Travel",
    detail: "Susun dan simpan koridor perjalanan lintas kota/kabupaten pilihan Anda.",
  },
];

export default function LandingPage() {
  const [loc, setLoc] = useState<LocationOption>(WEST_JAVA_LOCATIONS[0]);
  const [bmkgMap, setBmkgMap] =
    useState<Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>>(BMKG_JABAR_32_SNAPSHOT);
  const [kecamatanList, setKecamatanList] = useState<BMKGKecamatanEntry[]>(() =>
    getKecamatanListForAdm2(WEST_JAVA_LOCATIONS[0].adm2)
  );
  const [selectedKec, setSelectedKec] = useState<BMKGKecamatanEntry | null>(
    () => getKecamatanListForAdm2(WEST_JAVA_LOCATIONS[0].adm2)[0] || null
  );
  const [kecSearchQuery, setKecSearchQuery] = useState("");
  const [beritaAcara, setBeritaAcara] = useState<BeritaAcaraItem[]>(INITIAL_BERITA_ACARA_JABAR);
  const [data, setData] = useState<LocationDashboardState>(() =>
    buildLocationState(WEST_JAVA_LOCATIONS[0], BMKG_JABAR_32_SNAPSHOT)
  );
  const [live, setLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<
    "ALL" | "Kota" | "Kabupaten" | WestJavaRegionGroup
  >("Bandung Raya");
  const [customAIQuestion, setCustomAIQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<{
    provider: string;
    liveAI: boolean;
    rejectedOffTopic?: boolean;
    question: string;
    answer: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const session = useWeatherlySession();

  async function handleAskAI(e?: React.FormEvent, presetQuestion?: string) {
    if (e) e.preventDefault();
    const qText = (presetQuestion ?? customAIQuestion).trim();
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adm2: loc.adm2,
          adm3: selectedKec?.adm3,
          locationName: loc.name,
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
          question: qText || undefined,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          provider: string;
          liveAI: boolean;
          question: string;
          answer: string;
        };
        setAiResponse(json);
      }
    } finally {
      setAiLoading(false);
    }
  }

  function handleSelectLocation(next: LocationOption, preferredAdm3?: string) {
    setLoc(next);
    setData(buildLocationState(next, bmkgMap));
    const snapshotKec = getKecamatanListForAdm2(next.adm2);
    setKecamatanList(snapshotKec);
    const chosenKec =
      (preferredAdm3 && snapshotKec.find((k) => k.adm3 === preferredAdm3)) ||
      snapshotKec[0] ||
      null;
    setSelectedKec(chosenKec);
    setLive(false);
  }

  useEffect(() => {
    let active = true;
    async function syncLiveBMKGAndRealtime() {
      try {
        const res = await fetch(
          `/api/bmkg/jabar?adm2=${encodeURIComponent(loc.adm2)}&lat=${loc.lat}&lon=${loc.lon}`
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

        const nextRegions = json.regions || bmkgMap;
        if (json.regions) {
          setBmkgMap(json.regions);
        }
        if (json.kecamatan_list && json.kecamatan_list.length > 0) {
          const kList = json.kecamatan_list;
          setKecamatanList(kList);
          setSelectedKec((prev) =>
            prev && kList.some((k) => k.adm3 === prev.adm3)
              ? kList.find((k) => k.adm3 === prev.adm3) || kList[0]
              : kList[0]
          );
        }
        if (json.berita_acara && json.berita_acara.length > 0) {
          setBeritaAcara(json.berita_acara);
        }

        const baseState = buildLocationState(loc, nextRegions);
        if (json.realtime && typeof json.realtime.temperature_c === "number") {
          const rtAqi = json.realtime.aqi;
          const liveAqiVal =
            typeof rtAqi?.us_aqi === "number" ? rtAqi.us_aqi : baseState.aqi.index;
          const liveUvVal =
            typeof rtAqi?.uv_index === "number" ? rtAqi.uv_index : baseState.uv.index;
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
            ...baseState,
            currentTempC: json.realtime.temperature_c,
            feelsLikeC: json.realtime.feels_like_c ?? baseState.feelsLikeC,
            humidityPct: json.realtime.humidity_pct
              ? Math.round(json.realtime.humidity_pct)
              : baseState.humidityPct,
            windSpeedKmh: json.realtime.wind_speed_kmh ?? baseState.windSpeedKmh,
            pressureHpa: json.realtime.pressure_hpa ?? baseState.pressureHpa,
            aqi: {
              ...baseState.aqi,
              index: liveAqiVal,
              category: aqiCat,
              pm25: typeof rtAqi?.pm25 === "number" ? rtAqi.pm25 : baseState.aqi.pm25,
              pm10: typeof rtAqi?.pm10 === "number" ? rtAqi.pm10 : baseState.aqi.pm10,
              no2: typeof rtAqi?.no2 === "number" ? rtAqi.no2 : baseState.aqi.no2,
              o3: typeof rtAqi?.o3 === "number" ? rtAqi.o3 : baseState.aqi.o3,
              co: typeof rtAqi?.co === "number" ? rtAqi.co : baseState.aqi.co,
              so2: rtAqi?.so2 !== undefined ? rtAqi.so2 : null,
            },
            uv: {
              ...baseState.uv,
              index: liveUvVal,
              category: uvCat,
            },
          });
          setLive(true);
        } else {
          setData(baseState);
          setLive(true);
        }
      } catch {
        /* fallback to deterministic BMKG 32 snapshot */
      }
    }
    syncLiveBMKGAndRealtime();
    return () => {
      active = false;
    };
  }, [loc]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredLocations = searchWestJavaLocations(searchQuery, regionFilter);
  const filteredKecamatan = kecamatanList.filter((k) => {
    const q = kecSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      k.kecamatan.toLowerCase().includes(q) ||
      k.adm3.toLowerCase().includes(q) ||
      k.weather_desc.toLowerCase().includes(q)
    );
  });
  const globalKecMatches =
    searchQuery.trim().length >= 2 ? searchKecamatanAcrossJabar(searchQuery).slice(0, 8) : [];

  const stage2 = data.aiQuestions[1];

  return (
    <>
      <SiteNav />
      <main id="main">
        {/* ── Hero: the basin plate, drifting clouds behind the wordmark, and the working rain check ── */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__plate" aria-hidden="true">
            <Image
              src="/bandung-basin-etching.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="hero__plate-img"
            />
          </div>

          <div className="hero__copy">
            <div className="hero__sky" aria-hidden="true">
              <svg className="drift drift--far" viewBox="0 0 520 120" fill="none">
                <path
                  className="cloud-ink"
                  d="M22 104c0-22 20-36 44-33 12-26 44-40 76-30 22-24 66-22 86 6 28-4 54 14 60 40 22 0 38 17 38 17H22Z"
                />
                <path className="cloud-hatch" d="M70 92h60M150 96h80M250 90h70M96 84h40" />
              </svg>
              <svg className="drift drift--near" viewBox="0 0 640 140" fill="none">
                <path
                  className="cloud-ink"
                  d="M30 128c0-28 26-46 58-42 16-34 58-50 98-38 30-30 86-28 112 8 36-6 70 18 78 50 28 2 48 22 48 22H30Z"
                />
                <path className="cloud-hatch" d="M90 116h90M210 120h110M340 112h60M130 106h50" />
              </svg>
            </div>

            <h1 id="hero-title" className="hero__title">
              WEATHERLY
            </h1>
            <p className="hero__tagline">Know the Weather. Prepare Before It Happens.</p>
            <p className="hero__lead">
              Platform intelijen cuaca real-time untuk seluruh{" "}
              <strong>27 Kota &amp; Kabupaten serta 627 Kecamatan di Jawa Barat (BMKG Kode 32)</strong>
              , dilengkapi <strong>Berita Acara Cuaca &amp; Bencana Jawa Barat</strong> beserta link
              sumber resmi.
            </p>
            <div className="hero__actions">
              <Link
                href={`/dashboard?adm2=${loc.adm2}${
                  selectedKec ? `&adm3=${selectedKec.adm3}` : ""
                }`}
                className="btn-ink btn-lg"
              >
                {session
                  ? `Buka Dasbor (${selectedKec ? `Kec. ${selectedKec.kecamatan}` : loc.name})`
                  : `Buka Dasbor ${loc.name} (Tanpa Login)`}
              </Link>
              <a href="#jabar-bmkg" className="btn-line">
                27 Kota/Kab &amp; 627 Kecamatan
              </a>
              <a href="#berita-acara" className="btn-line">
                Berita Acara Jabar
              </a>
            </div>
          </div>

          {/* The category's real action, in working form: search or pick any of the 27 West Java regions + 627 Kecamatan */}
          <form
            className="probe"
            aria-label="Cari cuaca real-time 27 Kota, Kabupaten, dan 627 Kecamatan Jawa Barat"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="probe__cell probe__cell--loc">
              <label htmlFor="probe-search" className="probe__label">
                Cari Kota / Kabupaten / 627 Kecamatan Jabar
              </label>
              <input
                id="probe-search"
                type="search"
                className="probe__search"
                placeholder="Ketik: Coblong, Lembang, Cibinong, Soreang, Garut..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length >= 2) {
                    const kecHits = searchKecamatanAcrossJabar(val);
                    if (kecHits.length > 0) {
                      const parentLoc = WEST_JAVA_LOCATIONS.find(
                        (l) => l.adm2 === kecHits[0].adm2
                      );
                      if (parentLoc) {
                        handleSelectLocation(parentLoc, kecHits[0].adm3);
                        return;
                      }
                    }
                    const matches = searchWestJavaLocations(val, "ALL");
                    if (matches.length > 0 && matches[0].id !== loc.id) {
                      handleSelectLocation(matches[0]);
                    }
                  }
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <div className="select-wrap">
                  <select
                    id="probe-loc"
                    aria-label="Pilih dari 27 Kota dan Kabupaten Jawa Barat"
                    className="probe__select"
                    style={{ fontSize: "0.92rem", padding: "8px 28px 8px 10px" }}
                    value={loc.id}
                    onChange={(e) => {
                      const found = WEST_JAVA_LOCATIONS.find((l) => l.id === e.target.value);
                      if (found) handleSelectLocation(found);
                    }}
                  >
                    {WEST_JAVA_LOCATIONS.map((l) => (
                      <option key={l.id} value={l.id}>
                        [{l.adm2}] {l.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    aria-hidden="true"
                    className="select-wrap__chev"
                  >
                    <path
                      d="M3.5 6l4.5 4.5L12.5 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>

                <div className="select-wrap">
                  <select
                    id="probe-kec"
                    aria-label={`Pilih Kecamatan di ${loc.name}`}
                    className="probe__select"
                    style={{ fontSize: "0.92rem", padding: "8px 28px 8px 10px" }}
                    value={selectedKec?.adm3 || ""}
                    onChange={(e) => {
                      const foundKec = kecamatanList.find((k) => k.adm3 === e.target.value);
                      if (foundKec) setSelectedKec(foundKec);
                    }}
                  >
                    {kecamatanList.map((k) => (
                      <option key={k.adm3} value={k.adm3}>
                        Kec. {k.kecamatan} ({k.adm3})
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    aria-hidden="true"
                    className="select-wrap__chev"
                  >
                    <path
                      d="M3.5 6l4.5 4.5L12.5 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
              </div>
              <span className="probe__meta tabular-nums">
                BMKG {selectedKec ? selectedKec.adm3 : loc.adm2} ·{" "}
                {selectedKec ? `Kec. ${selectedKec.kecamatan}, ${loc.name}` : loc.name} ·{" "}
                {loc.elevationM} mdpl
              </span>
            </div>

            <div className="probe__cell probe__cell--count" aria-live="polite">
              <span className="probe__label">
                Hari Ini di {selectedKec ? `Kec. ${selectedKec.kecamatan}` : loc.name}:{" "}
                <strong>{selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc}</strong>
              </span>
              <p className="probe__count tabular-nums">
                {data.currentTempC.toFixed(1)}°C
                <span className="probe__unit">
                  Besok:{" "}
                  {selectedKec
                    ? selectedKec.tomorrow_desc
                    : data.bmkgDaily[1]?.weather_desc || data.bmkgTodayDesc}
                </span>
              </p>
              <span className="probe__meta tabular-nums">
                Rentang Hari Ini:{" "}
                {selectedKec
                  ? `${selectedKec.tmin}–${selectedKec.tmax}°C · RH ${selectedKec.humin}–${selectedKec.humax}%`
                  : `${data.lowTempC}–${data.highTempC}°C · RH ${data.huminPct}–${data.humaxPct}%`}
              </span>
            </div>

            <dl className="probe__cell probe__specs">
              <div>
                <dt>Prakiraan Hari Ini</dt>
                <dd className="tabular-nums">
                  {selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc}
                </dd>
              </div>
              <div>
                <dt>Prakiraan Besok</dt>
                <dd className="tabular-nums">
                  {selectedKec
                    ? selectedKec.tomorrow_desc
                    : data.bmkgDaily[1]?.weather_desc || data.bmkgTodayDesc}
                </dd>
              </div>
              <div>
                <dt>Total Kecamatan</dt>
                <dd className="tabular-nums">
                  {kecamatanList.length} Kec ({loc.adm2})
                </dd>
              </div>
            </dl>

            <div className="probe__cell probe__cell--advice">
              <span className="probe__label">
                Rekomendasi ({selectedKec ? `Kec. ${selectedKec.kecamatan}` : loc.name})
              </span>
              <p className="probe__advice">{data.whatToPrepare}</p>
              <span className="probe__source">
                {live
                  ? `Real-Time BMKG (${selectedKec ? selectedKec.adm3 : loc.adm2}) + Open-Meteo`
                  : "Memuat telemetri BMKG Jawa Barat..."}
              </span>
            </div>
          </form>
        </section>

        {/* ── SECTION: Clean Master-Detail Schedule for 27 Kota/Kabupaten + 627 Kecamatan Jawa Barat ── */}
        <section id="jabar-bmkg" className="band band--stack" aria-labelledby="jabar-bmkg-title">
          <div className="band__text band__text--wide">
            <div className="jabar-header-row">
              <div>
                <h2 id="jabar-bmkg-title" className="band__title">
                  Jadwal Cuaca BMKG Jawa Barat: 27 Kota/Kab &amp; 627 Kecamatan.
                </h2>
                <p className="band__copy" style={{ marginTop: "8px" }}>
                  Tersinkronisasi langsung dengan{" "}
                  <a
                    href="https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    bmkg.go.id/cuaca/prakiraan-cuaca/32 ↗
                  </a>
                  . Pilih wilayah di panel kiri untuk memeriksa seluruh kecamatan di panel kanan
                  tanpa memenuhi layar.
                </p>
              </div>

              <div className="jabar-filter-pills" role="tablist" aria-label="Filter koridor wilayah Jawa Barat">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className="btn-outline"
                    aria-pressed={regionFilter === tab.id}
                    onClick={() => setRegionFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Radar Ticker of West Java Locations Showing Signs of "Sebentar Lagi Hujan" */}
            <div
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid var(--rule-strong)",
                backgroundColor: "var(--signal-amber-tint)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span className="stamp stamp--red">
                RADAR SEBENTAR LAGI HUJAN JAWA BARAT
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                Wilayah dengan tanda kelembapan tinggi &amp; sel hujan mendekat (simpan di Dasbor
                untuk terima alert real-time):
              </span>
              {getImminentRainLocationsJabar(bmkgMap).map((item) => (
                <button
                  key={item.loc.id}
                  type="button"
                  className="btn-outline tabular-nums"
                  aria-pressed={loc.id === item.loc.id}
                  onClick={() => handleSelectLocation(item.loc)}
                >
                  {item.loc.name} ({item.dayLabel} · RH {item.humidityMax}%)
                </button>
              ))}
            </div>

            {/* Unified Search Input across 27 Kota/Kab and 627 Kecamatan */}
            <div className="jabar-search-bar" role="search" aria-label="Cari wilayah Jawa Barat">
              <div className="jabar-search-input-wrap">
                <input
                  type="search"
                  className="jabar-search-input"
                  placeholder="Cari cepat Kota, Kabupaten, atau salah satu dari 627 Kecamatan (mis. Coblong, Lembang, Cibinong, Cikarang, Soreang)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length > 0 && regionFilter !== "ALL") {
                      setRegionFilter("ALL");
                    }
                  }}
                  aria-label="Cari Kota, Kabupaten, atau Kecamatan di Jawa Barat"
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

              {globalKecMatches.length > 0 && (
                <div className="jabar-quick-hits">
                  <span className="proof-meta">Kecamatan cocok:</span>
                  {globalKecMatches.map((km) => (
                    <button
                      key={km.adm3}
                      type="button"
                      className="btn-outline"
                      onClick={() => {
                        const parent = WEST_JAVA_LOCATIONS.find((l) => l.adm2 === km.adm2);
                        if (parent) {
                          handleSelectLocation(parent, km.adm3);
                        }
                      }}
                    >
                      Kec. {km.kecamatan} ({km.kotkab}) · {km.weather_desc} {km.tmin}–{km.tmax}°C
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Master–Detail Editorial Split (No 27-Box Wall) */}
          <div className="jabar-workspace">
            {/* LEFT: Master Region Schedule List */}
            <div className="jabar-master">
              <div className="jabar-pane-bar">
                <strong>Daftar Kota &amp; Kabupaten ({filteredLocations.length} Wilayah)</strong>
                <span className="proof-meta tabular-nums">KLIK UNTUK DETAIL KECAMATAN</span>
              </div>

              {filteredLocations.length === 0 ? (
                <div className="jabar-empty">
                  <p>
                    Tidak ditemukan wilayah untuk <strong>&ldquo;{searchQuery}&rdquo;</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn-ink btn-sm"
                    onClick={() => {
                      setSearchQuery("");
                      setRegionFilter("ALL");
                    }}
                  >
                    Tampilkan Semua 27 Wilayah
                  </button>
                </div>
              ) : (
                <div className="jabar-master__scroll" role="listbox" aria-label="27 Kota dan Kabupaten Jawa Barat">
                  {filteredLocations.map((item) => {
                    const bmkg = getBMKGSnapshotForLocation(item.adm2, bmkgMap);
                    const kecCount = getKecamatanListForAdm2(item.adm2).length;
                    const today = bmkg.cuaca[0] || {
                      weather_desc: "Berawan",
                      tmin: 22,
                      tmax: 26,
                      humin: 85,
                      humax: 96,
                    };
                    const isActive = item.id === loc.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`jabar-row ${isActive ? "is-active" : ""}`}
                        onClick={() => handleSelectLocation(item)}
                      >
                        <span className="jabar-row__code tabular-nums">{item.adm2}</span>
                        <span className="jabar-row__main">
                          <strong>{item.name}</strong>
                          <span className="jabar-row__sub">
                            {kecCount} Kecamatan · {item.regionGroup}
                          </span>
                        </span>
                        <span
                          className={`stamp ${
                            today.weather_desc.toLowerCase().includes("cerah")
                              ? "stamp--green"
                              : today.weather_desc.toLowerCase().includes("hujan")
                              ? "stamp--red"
                              : "stamp--amber"
                          }`}
                        >
                          {today.weather_desc}
                        </span>
                        <span className="jabar-row__temp tabular-nums">
                          {today.tmin}–{today.tmax}°C
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: Active Region Inspector & Complete Kecamatan Schedule Table */}
            <div className="jabar-detail">
              <div className="jabar-detail__summary">
                <div>
                  <span className="proof-meta tabular-nums">
                    BMKG ADM2 {loc.adm2} · {loc.regionGroup.toUpperCase()} · {loc.elevationM} MDPL
                  </span>
                  <h3 className="jabar-detail__title">
                    {loc.name}{" "}
                    {selectedKec ? (
                      <span className="jabar-detail__kec-badge">
                        → Kec. {selectedKec.kecamatan} ({selectedKec.adm3})
                      </span>
                    ) : null}
                  </h3>
                  <p className="jabar-detail__sub">{loc.district}</p>
                </div>

                <div className="jabar-detail__stats tabular-nums">
                  <div>
                    <span className="proof-meta">SUHU AKTUAL</span>
                    <strong className="jabar-detail__big">{data.currentTempC.toFixed(1)}°C</strong>
                  </div>
                  <div>
                    <span className="proof-meta">PREDIKSI HARI INI</span>
                    <strong className="jabar-detail__big jabar-detail__big--alert">
                      {selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc}
                    </strong>
                  </div>
                  <a
                    href={`https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${loc.adm2}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline"
                    style={{ textDecoration: "none" }}
                  >
                    BMKG {loc.adm2} ↗
                  </a>
                </div>
              </div>

              <div className="jabar-pane-bar">
                <strong>
                  Seluruh Kecamatan di {loc.name} ({filteredKecamatan.length} /{" "}
                  {kecamatanList.length} Kecamatan)
                </strong>
                <input
                  type="search"
                  className="jabar-kec-filter"
                  placeholder={`Filter kecamatan di ${loc.name}...`}
                  value={kecSearchQuery}
                  onChange={(e) => setKecSearchQuery(e.target.value)}
                  aria-label={`Filter kecamatan di ${loc.name}`}
                />
              </div>

              <div className="jabar-kec-table-wrap">
                <table className="ledger-table jabar-kec-table">
                  <thead>
                    <tr>
                      <th scope="col">Kode</th>
                      <th scope="col">Kecamatan</th>
                      <th scope="col">Cuaca Hari Ini</th>
                      <th scope="col">Suhu</th>
                      <th scope="col">RH</th>
                      <th scope="col">Prakiraan Besok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKecamatan.map((kec) => {
                      const isSelected = selectedKec?.adm3 === kec.adm3;
                      return (
                        <tr
                          key={kec.adm3}
                          className={isSelected ? "is-selected" : ""}
                          onClick={() => setSelectedKec(kec)}
                        >
                          <td className="tabular-nums proof-meta">{kec.adm3}</td>
                          <td>
                            <button
                              type="button"
                              className="jabar-kec-select-btn"
                              onClick={() => setSelectedKec(kec)}
                            >
                              Kec. {kec.kecamatan}
                            </button>
                          </td>
                          <td>
                            <span
                              className={`stamp ${
                                kec.weather_desc.toLowerCase().includes("cerah")
                                  ? "stamp--green"
                                  : kec.weather_desc.toLowerCase().includes("hujan")
                                  ? "stamp--red"
                                  : "stamp--amber"
                              }`}
                            >
                              {kec.weather_desc}
                            </span>
                          </td>
                          <td className="num tabular-nums">
                            {kec.tmin}–{kec.tmax}°C
                          </td>
                          <td className="tabular-nums">
                            {kec.humin}–{kec.humax}%
                          </td>
                          <td className="tabular-nums">
                            {kec.tomorrow_desc} ({kec.tomorrow_tmin}–{kec.tomorrow_tmax}°C)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEW SECTION: Berita Acara Cuaca & Bencana Jawa Barat (with official Links & Sources) ── */}
        <section id="berita-acara" className="band band--stack" aria-labelledby="ba-title">
          <div className="band__text band__text--wide">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "16px",
                width: "100%",
              }}
            >
              <div>
                <h2 id="ba-title" className="band__title">
                  Berita Acara Cuaca &amp; Bencana Jawa Barat.
                </h2>
                <p className="band__copy" style={{ marginTop: "10px" }}>
                  Log berita cuaca ekstrem, peringatan dini BMKG, banjir, dan tanah longsor di
                  Provinsi Jawa Barat yang diperbarui secara otomatis beserta{" "}
                  <strong>tautan artikel asli dan portal sumber resminya</strong>.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span className="stamp stamp--red">LIVE FEED CUACA &amp; BENCANA JABAR</span>
                <a
                  href="https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                  style={{ textDecoration: "none" }}
                >
                  Portal BMKG Jawa Barat ↗
                </a>
              </div>
            </div>
          </div>

          <div className="ba-grid">
            {beritaAcara.map((ba) => (
              <article key={ba.id} className="ba-card">
                <header className="ba-card__head">
                  <span className="jabar-card__code tabular-nums">
                    Tanggal Laporan: {ba.publishedAt}
                  </span>
                  <span
                    className={`stamp ${
                      ba.category === "Cuaca Ekstrem BMKG" || ba.category === "Siaga Darurat Bencana"
                        ? "stamp--red"
                        : "stamp--amber"
                    }`}
                  >
                    {ba.category}
                  </span>
                </header>

                <h3 className="ba-card__title">{ba.title}</h3>
                <p className="ba-card__summary">{ba.summary}</p>

                <footer className="ba-card__foot">
                  <div className="ba-card__meta">
                    <span>
                      Wilayah: <strong>{ba.region}</strong>
                    </span>
                    <span>
                      Sumber:{" "}
                      <a
                        href={ba.sourceDomainUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ba-card__source-link"
                      >
                        {ba.sourceName} ({ba.sourceDomainUrl.replace(/^https?:\/\//, "")}) ↗
                      </a>
                    </span>
                  </div>

                  <div className="ba-card__actions">
                    <a
                      href={ba.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ink btn-sm"
                    >
                      Baca Berita &amp; Sumber ↗
                    </a>
                    <a
                      href={ba.sourceDomainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline"
                      style={{ textDecoration: "none" }}
                    >
                      Portal {ba.sourceName} ↗
                    </a>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </section>

        {/* ── Daily BMKG Forecast ── */}
        <section id="nowcast" className="band band--split" aria-labelledby="nowcast-title">
          <div className="band__text">
            <h2 id="nowcast-title" className="band__title">
              Prakiraan Harian Resmi BMKG untuk{" "}
              {selectedKec ? `Kec. ${selectedKec.kecamatan}, ${loc.name}` : loc.name}.
            </h2>
            <p className="band__copy">
              Menampilkan data prakiraan cuaca harian yang valid langsung dari BMKG Jawa Barat
              (Kode <code>{selectedKec ? selectedKec.adm3 : loc.adm2}</code>) mulai dari{" "}
              <strong>Hari Ini, Besok, hingga 6 Hari ke Depan</strong> tanpa angka menit buatan.
            </p>
            <table className="verify">
              <caption>
                Prakiraan multi-hari BMKG · {loc.name} ({loc.adm2})
              </caption>
              <tbody>
                {data.bmkgDaily.slice(0, 5).map((d, idx) => (
                  <tr key={d.local_datetime || idx}>
                    <th scope="row">
                      {idx === 0
                        ? "Hari Ini"
                        : idx === 1
                        ? "Besok"
                        : d.local_datetime.slice(0, 10)}{" "}
                      · {d.weather_desc}
                    </th>
                    <td className="tabular-nums">
                      {d.tmin}–{d.tmax}°C ({d.humin}–{d.humax}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="band__proof">
            <div className="proof-head">
              <h3 className="proof-title">
                Grafik Prakiraan 6 Hari BMKG ·{" "}
                {selectedKec ? `Kec. ${selectedKec.kecamatan} (${selectedKec.adm3})` : loc.name}
              </h3>
              <span className="stamp stamp--green">DATA RESMI BMKG 32</span>
            </div>
            <ol
              className="curve"
              aria-label={`Grafik prakiraan harian BMKG di ${loc.name}`}
            >
              {data.bmkgDaily.slice(0, 6).map((day, idx) => {
                const isRainDay = day.weather_desc.toLowerCase().includes("hujan");
                const h = Math.max(25, Math.round((day.humax / 100) * 100));
                const dayLabel =
                  idx === 0 ? "Hari Ini" : idx === 1 ? "Besok" : day.local_datetime.slice(5, 10);
                return (
                  <li key={day.local_datetime || idx} className={`curve__col ${isRainDay ? "is-peak" : ""}`}>
                    <span className="curve__val tabular-nums">
                      {day.tmin}–{day.tmax}°
                    </span>
                    <span className="curve__well">
                      <span className="curve__bar" style={{ height: `${h}%` }} />
                    </span>
                    <span className="curve__time tabular-nums">{dayLabel}</span>
                    <span className="curve__prob tabular-nums">{day.weather_desc}</span>
                  </li>
                );
              })}
            </ol>
            <p className="proof-note">
              Pilih salah satu dari 27 Kota/Kabupaten atau 627 Kecamatan Jawa Barat di atas; grafik
              prakiraan harian BMKG ini langsung menyesuaikan wilayah tersebut.
            </p>
          </div>
        </section>

        {/* ── Extreme alerts + dedup ── */}
        <section id="peringatan" className="band band--split band--flip" aria-labelledby="alert-title">
          <div className="band__text">
            <h2 id="alert-title" className="band__title">
              Satu peringatan yang tepat waktu, bukan sepuluh notifikasi.
            </h2>
            <p className="band__copy">
              Peringatan cuaca publik BMKG Jawa Barat dapat dilihat langsung oleh semua pengunjung
              tanpa login. Untuk pengguna terdaftar, notifikasi pra-hujan berbasis lokasi dikirim
              sekali per kejadian dengan kunci deduplikasi agar tidak membanjiri ponsel Anda.
            </p>
          </div>

          <div className="band__proof">
            <article className="bulletin" aria-labelledby="bulletin-title">
              <header className="bulletin__head">
                <span className="stamp stamp--red">{data.extremeAlert.severity} · PUBLIK</span>
                <span className="proof-meta tabular-nums">{data.extremeAlert.validWindow}</span>
              </header>
              <h3 id="bulletin-title" className="bulletin__title">
                {data.extremeAlert.title}
              </h3>
              <p className="bulletin__body">{data.extremeAlert.description}</p>
              <ul className="bulletin__tags">
                {data.extremeAlert.phenomena.map((p) => (
                  <li key={p} className="stamp">
                    {p}
                  </li>
                ))}
              </ul>
              <p className="proof-meta">Sumber: {data.extremeAlert.bmkgRef}</p>
            </article>

            <table className="ledger-table">
              <caption>Riwayat kiriman notifikasi personal (Registered User)</caption>
              <thead>
                <tr>
                  <th scope="col">Waktu</th>
                  <th scope="col">Kejadian</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="tabular-nums">14:02</td>
                  <td>BMKG menerbitkan peringatan {loc.name}</td>
                  <td>
                    <span className="stamp stamp--green">Dikirim</span>
                  </td>
                </tr>
                <tr>
                  <td className="tabular-nums">14:09</td>
                  <td>Pembaruan BMKG, kunci kejadian sama</td>
                  <td>
                    <span className="stamp stamp--muted">Ditahan</span>
                  </td>
                </tr>
                <tr>
                  <td className="tabular-nums">14:15</td>
                  <td>Sel hujan yang sama dari radar</td>
                  <td>
                    <span className="stamp stamp--muted">Ditahan</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Two-stage AI ── */}
        <section id="ai-insights" className="band band--stack" aria-labelledby="ai-title">
          <div className="band__text band__text--wide">
            <h2 id="ai-title" className="band__title">
              Asisten Cuaca Pintar untuk Aktivitas Harian Anda.
            </h2>
            <p className="band__copy">
              Berdasarkan data cuaca resmi BMKG, indeks UV, dan kualitas udara di wilayah yang Anda
              pilih, asisten cuaca memberikan penjelasan kondisi saat ini terlebih dahulu lalu
              prediksi harian untuk membantu rencana perjalanan dan aktivitas luar ruang Anda.
            </p>
          </div>

          <div className="pipeline">
            <div className="pipeline__stage">
              <h3 className="pipeline__title">
                Ringkasan Data Cuaca ·{" "}
                {selectedKec ? `Kec. ${selectedKec.kecamatan}, ${loc.name}` : loc.name}
              </h3>
              <table className="verify" style={{ marginTop: "8px" }}>
                <tbody>
                  <tr>
                    <th scope="row">Wilayah</th>
                    <td>
                      {selectedKec ? `Kec. ${selectedKec.kecamatan}, ${loc.name}` : loc.name}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Cuaca Hari Ini (BMKG)</th>
                    <td>{selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc}</td>
                  </tr>
                  <tr>
                    <th scope="row">Prakiraan Besok (BMKG)</th>
                    <td>
                      {selectedKec
                        ? selectedKec.tomorrow_desc
                        : data.bmkgDaily[1]?.weather_desc || data.bmkgTodayDesc}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Suhu &amp; Kelembapan</th>
                    <td className="tabular-nums">
                      {data.currentTempC.toFixed(1)}°C · RH {data.humidityPct}%
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Kualitas Udara &amp; UV</th>
                    <td className="tabular-nums">
                      AQI {data.aqi.index} ({data.aqi.category}) · UV {data.uv.index}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pipeline__stage pipeline__stage--answer">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 className="pipeline__title">Rekomendasi &amp; Tanya Jawab Cuaca</h3>
                <span
                  className={`stamp ${
                    aiResponse?.rejectedOffTopic ? "stamp--red" : "stamp--green"
                  }`}
                >
                  {aiResponse?.rejectedOffTopic
                    ? "KHUSUS PERTANYAAN CUACA"
                    : "CUACA SAAT INI & PREDIKSI HARIAN"}
                </span>
              </div>
              <p className="pipeline__q">{aiResponse ? aiResponse.question : stage2.question}</p>
              <p
                className="pipeline__a"
                style={
                  aiResponse?.rejectedOffTopic
                    ? { color: "var(--signal-red)", fontWeight: 600 }
                    : undefined
                }
              >
                {aiResponse ? aiResponse.answer : stage2.answer}
              </p>

              <form
                onSubmit={(e) => handleAskAI(e)}
                style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}
              >
                <input
                  type="text"
                  className="probe__search"
                  style={{ flex: "1 1 240px" }}
                  placeholder={`Tanya cuaca di ${selectedKec ? `Kec. ${selectedKec.kecamatan}` : loc.name}...`}
                  value={customAIQuestion}
                  onChange={(e) => setCustomAIQuestion(e.target.value)}
                />
                <button type="submit" className="btn-ink btn-sm" disabled={aiLoading}>
                  {aiLoading ? "Memproses..." : "Tanya AI"}
                </button>
              </form>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span className="stamp stamp--red">{stage2.tag}</span>
                <span className="stamp stamp--green">Hanya Menjawab Seputar Cuaca &amp; Lingkungan</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Air quality & UV ── */}
        <section id="lingkungan" className="band band--split" aria-labelledby="env-title">
          <div className="band__text">
            <h2 id="env-title" className="band__title">
              Kualitas Udara dan Indeks UV di {loc.name}.
            </h2>
            <p className="band__copy">{data.aqi.outdoorAdvice}</p>
            <p className="band__copy">
              UV tertinggi pukul <strong className="tabular-nums">{data.uv.peakWindow}</strong>.
              Indeks <strong className="tabular-nums">{data.uv.index}</strong> ({data.uv.category}),
              gunakan SPF {data.uv.recommendedSpf}+. Dapat diakses gratis tanpa akun.
            </p>
          </div>
          <div className="band__proof">
            <table className="ledger-table ledger-table--env">
              <caption>
                Parameter udara · {loc.name}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Parameter</th>
                  <th scope="col">Nilai</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Indeks kualitas udara (AQI)</td>
                  <td className="num tabular-nums">{data.aqi.index}</td>
                  <td>
                    <span className="stamp stamp--amber">{data.aqi.category}</span>
                  </td>
                </tr>
                <tr>
                  <td>PM2.5</td>
                  <td className="num tabular-nums">{data.aqi.pm25} µg/m³</td>
                  <td>Terukur</td>
                </tr>
                <tr>
                  <td>PM10</td>
                  <td className="num tabular-nums">{data.aqi.pm10} µg/m³</td>
                  <td>Terukur</td>
                </tr>
                <tr>
                  <td>NO₂ · O₃ · CO</td>
                  <td className="num tabular-nums">
                    {data.aqi.no2} · {data.aqi.o3} · {data.aqi.co}
                  </td>
                  <td>Terukur</td>
                </tr>
                <tr>
                  <td>SO₂</td>
                  <td className="num tabular-nums">
                    {data.aqi.so2 !== null ? `${data.aqi.so2} µg/m³` : "—"}
                  </td>
                  <td>
                    {data.aqi.so2 !== null ? "Terukur" : "Belum tersedia"}
                  </td>
                </tr>
                <tr>
                  <td>Indeks UV</td>
                  <td className="num tabular-nums">{data.uv.index}</td>
                  <td>
                    <span className="stamp stamp--amber">{data.uv.category}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Flood + Smart Travel ── */}
        <section id="banjir-rute" className="band band--stack" aria-labelledby="flood-title">
          <div className="band__text band__text--wide">
            <h2 id="flood-title" className="band__title">
              Pemantauan Banjir &amp; Rute Perjalanan Anda.
            </h2>
            <p className="band__copy">
              Menampilkan informasi resmi dari BMKG, BNPB, dan BPBD Jawa Barat, laporan warga yang
              disertai foto lapangan, serta prakiraan kelembapan harian BMKG. Untuk perjalanan
              harian, Anda dapat menyusun sendiri rute <strong>Smart Travel</strong> di Dasbor.
            </p>
          </div>

          <div className="twin">
            <div className="twin__col">
              <h3 className="proof-title">Pemantauan Hidrometeorologi Jawa Barat</h3>
              <ul className="records">
                {beritaAcara.slice(0, 2).map((ba) => (
                  <li key={ba.id} className="record record--official">
                    <div className="record__head">
                      <strong>
                        {ba.region} — {ba.title}
                      </strong>
                      <span className="stamp stamp--red">Sumber Resmi ({ba.sourceName})</span>
                    </div>
                    <p className="record__body">{ba.summary}</p>
                    <span className="proof-meta tabular-nums">
                      Tanggal Laporan: {ba.publishedAt}
                    </span>
                  </li>
                ))}
                <li className="record record--estimated_risk">
                  <div className="record__head">
                    <strong>
                      Prakiraan Kelembapan Harian BMKG — {loc.name}
                    </strong>
                    <span className="stamp stamp--amber stamp--dashed">Prakiraan Cuaca</span>
                  </div>
                  <p className="record__body">
                    Prakiraan resmi BMKG Hari Ini di {loc.name} mencatat kondisi{" "}
                    {data.bmkgTodayDesc} dengan kelembapan {data.huminPct}–{data.humaxPct}%.
                  </p>
                  <span className="proof-meta tabular-nums">
                    BMKG Jawa Barat · Prakiraan Besok:{" "}
                    {data.bmkgDaily[1]?.weather_desc || data.bmkgTodayDesc}
                  </span>
                </li>
              </ul>
            </div>

            <div className="twin__col">
              <div className="proof-head" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <h3 className="proof-title">Smart Travel Route</h3>
                <span className="stamp">RUTE PILIHAN ANDA</span>
              </div>
              <p className="route__advice" style={{ marginTop: "8px" }}>
                Tentukan sendiri <strong>Titik Asal</strong>, <strong>Titik Transit</strong>, dan{" "}
                <strong>Titik Tujuan</strong> dari 27 Kota/Kabupaten Jawa Barat di Dasbor untuk
                memantau prakiraan cuaca harian di sepanjang rute perjalanan Anda.
              </p>
              <div style={{ marginTop: "12px" }}>
                <Link href={`/dashboard?adm2=${loc.adm2}#h-travel`} className="btn-ink">
                  + Buat Rute Perjalanan di Dasbor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Community ── */}
        <section id="komunitas" className="band band--split band--flip" aria-labelledby="comm-title">
          <div className="band__text">
            <h2 id="comm-title" className="band__title">
              Laporan warga disertai foto bukti lapangan &amp; tanggal kejadian.
            </h2>
            <p className="band__copy">
              Setiap laporan kondisi cuaca atau genangan yang dikirim warga wajib menyertakan{" "}
              <strong>foto bukti lapangan asli</strong> dan dilengkapi{" "}
              <strong>tanggal serta tahun laporan</strong> agar akurat dan dapat dipertanggungjawabkan.
            </p>
            <Link href={session ? "/dashboard#h-community" : "/login?mode=register"} className="btn-line">
              {session
                ? "Kirim laporan & foto di dasbor"
                : "Daftar / Masuk untuk mengirim laporan warga"}
            </Link>
          </div>
          <div className="band__proof">
            <div
              style={{
                border: "1px solid var(--rule-strong)",
                backgroundColor: "var(--paper)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span className="stamp stamp--green" style={{ alignSelf: "flex-start" }}>
                LAPORAN WARGA TERVERIFIKASI
              </span>
              <strong style={{ fontSize: "1.05rem" }}>
                Bukti Foto Lapangan &amp; Tanggal Laporan Lengkap
              </strong>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-secondary)" }}>
                1. Setiap laporan warga wajib melampirkan foto kondisi cuaca di lokasi.
                <br />
                2. Tercatat lengkap dengan tanggal, bulan, dan tahun laporan dibuat.
                <br />
                3. Warga lain dapat memberikan dukungan verifikasi pada laporan yang akurat.
              </p>
            </div>
          </div>
        </section>

        {/* ── Access Architecture: Only shown when NOT logged in! ── */}
        {!session && (
          <section id="akses" className="band band--stack" aria-labelledby="access-title">
            <div className="band__text band__text--wide">
              <h2 id="access-title" className="band__title">
                Tidak semua fitur harus login.
              </h2>
              <p className="band__copy">
                Informasi keselamatan cuaca harus bisa diakses siapa saja dalam hitungan detik. Karena
                itu Weatherly memisahkan fitur publik <strong>Tanpa Login</strong> dari fitur{" "}
                <strong>Akun Personal</strong> untuk menyimpan lokasi favorit dan mengirim laporan
                warga.
              </p>
            </div>

            <div className="access-grid">
              {/* Tier 1: Guest Mode */}
              <article className="access-tier" aria-labelledby="tier-guest-title">
                <header className="access-tier__head">
                  <div>
                    <span className="stamp stamp--green">1. TANPA LOGIN</span>
                    <h3 id="tier-guest-title" className="access-tier__title">
                      Gratis &amp; Instan
                    </h3>
                  </div>
                  <span className="access-tier__price">Gratis</span>
                </header>
                <p className="access-tier__desc">
                  Buka aplikasi dan langsung pantau kondisi cuaca aktual di seluruh 27 Kota/Kabupaten
                  dan 627 Kecamatan Jawa Barat tanpa membuat akun:
                </p>
                <ul className="access-list">
                  {GUEST_FEATURES.map((f) => (
                    <li key={f.title} className="access-list__item">
                      <span className="access-list__mark" aria-hidden="true">
                        ✓
                      </span>
                      <div>
                        <strong>{f.title}</strong>
                        <p>{f.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="access-tier__foot">
                  <Link href={`/dashboard?adm2=${loc.adm2}`} className="btn-line">
                    Langsung buka dasbor
                  </Link>
                </div>
              </article>

              {/* Tier 2: Registered User */}
              <article className="access-tier access-tier--personal" aria-labelledby="tier-reg-title">
                <header className="access-tier__head">
                  <div>
                    <span className="stamp stamp--red">2. AKUN PERSONAL · LOGIN</span>
                    <h3 id="tier-reg-title" className="access-tier__title">
                      Personal &amp; Tersimpan
                    </h3>
                  </div>
                  <span className="access-tier__price">Akun</span>
                </header>
                <p className="access-tier__desc">
                  Semua fitur publik ditambah penyimpanan lokasi peringatan cuaca, rute perjalanan,
                  dan kontribusi laporan warga:
                </p>
                <ul className="access-list">
                  {REGISTERED_FEATURES.map((f) => (
                    <li key={f.title} className="access-list__item">
                      <span
                        className="access-list__mark access-list__mark--personal"
                        aria-hidden="true"
                      >
                        +
                      </span>
                      <div>
                        <strong>{f.title}</strong>
                        <p>{f.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="access-tier__foot">
                  <Link href="/login" className="btn-ink btn-lg">
                    Masuk / Buat Akun Personal
                  </Link>
                </div>
              </article>
            </div>
          </section>
        )}

        {/* ── Close ── */}
        <section className="closing" aria-labelledby="closing-title">
          <h2 id="closing-title" className="closing__title">
            Prakiraan BMKG Hari Ini di{" "}
            {selectedKec ? `Kec. ${selectedKec.kecamatan} (${loc.name})` : loc.name}:{" "}
            <span className="closing__count tabular-nums">
              {selectedKec ? selectedKec.weather_desc : data.bmkgTodayDesc} (
              {selectedKec
                ? `${selectedKec.tmin}–${selectedKec.tmax}°C`
                : `${data.lowTempC}–${data.highTempC}°C`}
              )
            </span>
            .
          </h2>
          <div className="closing__actions">
            <Link
              href={`/dashboard?adm2=${loc.adm2}${
                selectedKec ? `&adm3=${selectedKec.adm3}` : ""
              }`}
              className="btn-ink btn-lg"
            >
              {session ? `Buka dasbor ${loc.name}` : `Cek ${loc.name} tanpa login`}
            </Link>
            {!session && (
              <Link href="/login" className="btn-line">
                Masuk untuk simpan lokasi &amp; rute
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="site-foot__brand">
          <strong>Weatherly</strong>
          <span>Know the Weather. Prepare Before It Happens.</span>
        </div>
        <div>
          <h2 className="site-foot__title">Sumber data &amp; berita</h2>
          <ul>
            <li>
              <a
                href="https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32"
                target="_blank"
                rel="noopener noreferrer"
              >
                BMKG Provinsi Jawa Barat (Kode 32) ↗
              </a>
            </li>
            <li>
              <a href="https://bnpb.go.id" target="_blank" rel="noopener noreferrer">
                BNPB &amp; BPBD Jawa Barat ↗
              </a>
            </li>
            <li>
              <a href="https://jabarprov.go.id" target="_blank" rel="noopener noreferrer">
                Portal Resmi Pemprov Jabar ↗
              </a>
            </li>
            <li>Open-Meteo &amp; RainViewer</li>
          </ul>
        </div>
        <div>
          <h2 className="site-foot__title">Cakupan Jawa Barat</h2>
          <ul>
            <li>
              <a href="#jabar-bmkg">27 Kota/Kab &amp; 627 Kecamatan</a>
            </li>
            <li>
              <a href="#berita-acara">Berita Acara Cuaca &amp; Bencana</a>
            </li>
            <li>
              <a href="#akses">Guest Mode &amp; Registered User</a>
            </li>
          </ul>
        </div>
        <p className="site-foot__fine">
          Provinsi Jawa Barat (BMKG 32) · 27 Kota/Kabupaten · 627 Kecamatan · Berita Acara Terverifikasi
        </p>
      </footer>
    </>
  );
}
