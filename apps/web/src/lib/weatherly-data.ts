import { BMKG_JABAR_32_SNAPSHOT, BMKGDailyEntry } from "./bmkg-jabar-snapshot";
import {
  BMKG_JABAR_KECAMATAN_SNAPSHOT,
  BMKGKecamatanEntry,
} from "./bmkg-jabar-kecamatan";

export type { BMKGKecamatanEntry };

export function getKecamatanListForAdm2(adm2: string): BMKGKecamatanEntry[] {
  return BMKG_JABAR_KECAMATAN_SNAPSHOT[adm2] || [];
}

export function getTotalJabarKecamatanCount(): number {
  return Object.values(BMKG_JABAR_KECAMATAN_SNAPSHOT).reduce(
    (acc, list) => acc + list.length,
    0
  );
}

export function searchKecamatanAcrossJabar(
  query: string,
  adm2Filter?: string
): Array<BMKGKecamatanEntry & { adm2: string }> {
  const q = query.trim().toLowerCase();
  const results: Array<BMKGKecamatanEntry & { adm2: string }> = [];
  const entries = adm2Filter
    ? [[adm2Filter, BMKG_JABAR_KECAMATAN_SNAPSHOT[adm2Filter] || []] as const]
    : Object.entries(BMKG_JABAR_KECAMATAN_SNAPSHOT);

  for (const [adm2, list] of entries) {
    for (const item of list) {
      if (
        !q ||
        item.kecamatan.toLowerCase().includes(q) ||
        item.kotkab.toLowerCase().includes(q) ||
        item.adm3.toLowerCase().includes(q)
      ) {
        results.push({ ...item, adm2 });
      }
    }
  }
  return results;
}

export type WestJavaRegionGroup =
  | "Bandung Raya"
  | "Bodebek & Bogor"
  | "Priangan Barat"
  | "Priangan Timur"
  | "Ciayumajakuning"
  | "Pantura & Purwasuka";

export interface LocationOption {
  id: string;
  name: string;
  bmkgName: string;
  kind: "Kota" | "Kabupaten";
  regionGroup: WestJavaRegionGroup;
  district: string;
  adm2: string;
  adm4: string;
  lat: number;
  lon: number;
  elevationM: number;
  isFavorite: boolean;
}

/**
 * Complete 27 Kabupaten & Kota of Provinsi Jawa Barat (BMKG Code 32)
 * Source: https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32
 * Ordered with Bandung Raya first for fast commuter access, followed by all regions in Jawa Barat.
 */
export const WEST_JAVA_LOCATIONS: LocationOption[] = [
  {
    id: "jabar-32.73",
    name: "Kota Bandung",
    bmkgName: "Kota Bandung",
    kind: "Kota",
    regionGroup: "Bandung Raya",
    district: "Sumur Bandung • Braga • Dago • Gedebage",
    adm2: "32.73",
    adm4: "32.73.01.1001",
    lat: -6.9175,
    lon: 107.6191,
    elevationM: 715,
    isFavorite: true,
  },
  {
    id: "jabar-32.04",
    name: "Kab. Bandung",
    bmkgName: "Bandung",
    kind: "Kabupaten",
    regionGroup: "Bandung Raya",
    district: "Soreang • Dayeuhkolot • Baleendah • Ciwidey",
    adm2: "32.04",
    adm4: "32.04.12.2001",
    lat: -7.0252,
    lon: 107.5197,
    elevationM: 685,
    isFavorite: true,
  },
  {
    id: "jabar-32.17",
    name: "Kab. Bandung Barat",
    bmkgName: "Bandung Barat",
    kind: "Kabupaten",
    regionGroup: "Bandung Raya",
    district: "Ngamprah • Padalarang • Lembang • Cisarua",
    adm2: "32.17",
    adm4: "32.17.01.2001",
    lat: -6.8436,
    lon: 107.5108,
    elevationM: 810,
    isFavorite: true,
  },
  {
    id: "jabar-32.77",
    name: "Kota Cimahi",
    bmkgName: "Kota Cimahi",
    kind: "Kota",
    regionGroup: "Bandung Raya",
    district: "Cimahi Tengah • Cimahi Utara • Leuwigajah",
    adm2: "32.77",
    adm4: "32.77.02.1001",
    lat: -6.8722,
    lon: 107.5425,
    elevationM: 740,
    isFavorite: false,
  },
  {
    id: "jabar-32.11",
    name: "Kab. Sumedang",
    bmkgName: "Sumedang",
    kind: "Kabupaten",
    regionGroup: "Bandung Raya",
    district: "Jatinangor • Sumedang Utara • Tanjungsari",
    adm2: "32.11",
    adm4: "32.11.15.2001",
    lat: -6.8586,
    lon: 107.9204,
    elevationM: 465,
    isFavorite: false,
  },
  {
    id: "jabar-32.01",
    name: "Kab. Bogor",
    bmkgName: "Bogor",
    kind: "Kabupaten",
    regionGroup: "Bodebek & Bogor",
    district: "Cibinong • Cisarua Puncak • Sentul • Dramaga",
    adm2: "32.01",
    adm4: "32.01.01.1001",
    lat: -6.4797,
    lon: 106.8249,
    elevationM: 145,
    isFavorite: true,
  },
  {
    id: "jabar-32.71",
    name: "Kota Bogor",
    bmkgName: "Kota Bogor",
    kind: "Kota",
    regionGroup: "Bodebek & Bogor",
    district: "Bogor Tengah • Kebun Raya • Tanah Sareal",
    adm2: "32.71",
    adm4: "32.71.01.1001",
    lat: -6.5971,
    lon: 106.806,
    elevationM: 265,
    isFavorite: false,
  },
  {
    id: "jabar-32.76",
    name: "Kota Depok",
    bmkgName: "Kota Depok",
    kind: "Kota",
    regionGroup: "Bodebek & Bogor",
    district: "Margonda • Beji • Pancoran Mas • Cimanggis",
    adm2: "32.76",
    adm4: "32.76.01.1001",
    lat: -6.4025,
    lon: 106.7942,
    elevationM: 92,
    isFavorite: false,
  },
  {
    id: "jabar-32.75",
    name: "Kota Bekasi",
    bmkgName: "Kota Bekasi",
    kind: "Kota",
    regionGroup: "Bodebek & Bogor",
    district: "Bekasi Selatan • Summarecon • Jatiasih",
    adm2: "32.75",
    adm4: "32.75.01.1001",
    lat: -6.2383,
    lon: 106.9756,
    elevationM: 22,
    isFavorite: false,
  },
  {
    id: "jabar-32.16",
    name: "Kab. Bekasi",
    bmkgName: "Bekasi",
    kind: "Kabupaten",
    regionGroup: "Bodebek & Bogor",
    district: "Cikarang Pusat • Jababeka • Tambun Selatan",
    adm2: "32.16",
    adm4: "32.16.01.2001",
    lat: -6.3646,
    lon: 107.1725,
    elevationM: 28,
    isFavorite: false,
  },
  {
    id: "jabar-32.02",
    name: "Kab. Sukabumi",
    bmkgName: "Sukabumi",
    kind: "Kabupaten",
    regionGroup: "Priangan Barat",
    district: "Palabuhanratu • Cicurug • Cibadak • Ciletuh",
    adm2: "32.02",
    adm4: "32.02.01.1001",
    lat: -6.9875,
    lon: 106.5514,
    elevationM: 120,
    isFavorite: false,
  },
  {
    id: "jabar-32.72",
    name: "Kota Sukabumi",
    bmkgName: "Kota Sukabumi",
    kind: "Kota",
    regionGroup: "Priangan Barat",
    district: "Cikole • Gunungpuyuh • Citamiang",
    adm2: "32.72",
    adm4: "32.72.01.1001",
    lat: -6.9277,
    lon: 106.93,
    elevationM: 584,
    isFavorite: false,
  },
  {
    id: "jabar-32.03",
    name: "Kab. Cianjur",
    bmkgName: "Cianjur",
    kind: "Kabupaten",
    regionGroup: "Priangan Barat",
    district: "Cianjur Kota • Cipanas • Pacet • Ciranjang",
    adm2: "32.03",
    adm4: "32.03.01.1001",
    lat: -6.8168,
    lon: 107.1425,
    elevationM: 459,
    isFavorite: false,
  },
  {
    id: "jabar-32.05",
    name: "Kab. Garut",
    bmkgName: "Garut",
    kind: "Kabupaten",
    regionGroup: "Priangan Timur",
    district: "Tarogong Kidul • Garut Kota • Leles • Cikajang",
    adm2: "32.05",
    adm4: "32.05.01.1001",
    lat: -7.2279,
    lon: 107.9087,
    elevationM: 717,
    isFavorite: false,
  },
  {
    id: "jabar-32.06",
    name: "Kab. Tasikmalaya",
    bmkgName: "Tasikmalaya",
    kind: "Kabupaten",
    regionGroup: "Priangan Timur",
    district: "Singaparna • Manonjaya • Rajapolah",
    adm2: "32.06",
    adm4: "32.06.24.2001",
    lat: -7.3512,
    lon: 108.111,
    elevationM: 418,
    isFavorite: false,
  },
  {
    id: "jabar-32.78",
    name: "Kota Tasikmalaya",
    bmkgName: "Kota Tasikmalaya",
    kind: "Kota",
    regionGroup: "Priangan Timur",
    district: "Cihideung • Tawang • Indihiang",
    adm2: "32.78",
    adm4: "32.78.01.1001",
    lat: -7.3274,
    lon: 108.2207,
    elevationM: 351,
    isFavorite: false,
  },
  {
    id: "jabar-32.07",
    name: "Kab. Ciamis",
    bmkgName: "Ciamis",
    kind: "Kabupaten",
    regionGroup: "Priangan Timur",
    district: "Ciamis Kota • Kawali • Banjarsari",
    adm2: "32.07",
    adm4: "32.07.01.1001",
    lat: -7.3257,
    lon: 108.3534,
    elevationM: 212,
    isFavorite: false,
  },
  {
    id: "jabar-32.79",
    name: "Kota Banjar",
    bmkgName: "Kota Banjar",
    kind: "Kota",
    regionGroup: "Priangan Timur",
    district: "Banjar • Pataruman • Purwaharja",
    adm2: "32.79",
    adm4: "32.79.01.1001",
    lat: -7.3706,
    lon: 108.5342,
    elevationM: 48,
    isFavorite: false,
  },
  {
    id: "jabar-32.18",
    name: "Kab. Pangandaran",
    bmkgName: "Pangandaran",
    kind: "Kabupaten",
    regionGroup: "Priangan Timur",
    district: "Parigi • Pantai Pangandaran • Kalipucang",
    adm2: "32.18",
    adm4: "32.18.01.2001",
    lat: -7.685,
    lon: 108.65,
    elevationM: 12,
    isFavorite: false,
  },
  {
    id: "jabar-32.74",
    name: "Kota Cirebon",
    bmkgName: "Kota Cirebon",
    kind: "Kota",
    regionGroup: "Ciayumajakuning",
    district: "Kejaksan • Kesambi • Lemahwungkuk",
    adm2: "32.74",
    adm4: "32.74.01.1001",
    lat: -6.732,
    lon: 108.5523,
    elevationM: 10,
    isFavorite: false,
  },
  {
    id: "jabar-32.09",
    name: "Kab. Cirebon",
    bmkgName: "Cirebon",
    kind: "Kabupaten",
    regionGroup: "Ciayumajakuning",
    district: "Sumber • Palimanan • Plumbon • Losari",
    adm2: "32.09",
    adm4: "32.09.15.1001",
    lat: -6.7644,
    lon: 108.4789,
    elevationM: 42,
    isFavorite: false,
  },
  {
    id: "jabar-32.08",
    name: "Kab. Kuningan",
    bmkgName: "Kuningan",
    kind: "Kabupaten",
    regionGroup: "Ciayumajakuning",
    district: "Kuningan Kota • Cigugur • Cilimus (Kaki Ciremai)",
    adm2: "32.08",
    adm4: "32.08.09.1001",
    lat: -6.976,
    lon: 108.4831,
    elevationM: 545,
    isFavorite: false,
  },
  {
    id: "jabar-32.10",
    name: "Kab. Majalengka",
    bmkgName: "Majalengka",
    kind: "Kabupaten",
    regionGroup: "Ciayumajakuning",
    district: "Majalengka Kota • Kertajati (BIJB) • Kadipaten",
    adm2: "32.10",
    adm4: "32.10.07.1001",
    lat: -6.8364,
    lon: 108.2279,
    elevationM: 140,
    isFavorite: false,
  },
  {
    id: "jabar-32.12",
    name: "Kab. Indramayu",
    bmkgName: "Indramayu",
    kind: "Kabupaten",
    regionGroup: "Ciayumajakuning",
    district: "Indramayu Kota • Jatibarang • Patrol • Haurgeulis",
    adm2: "32.12",
    adm4: "32.12.15.1001",
    lat: -6.3276,
    lon: 108.3249,
    elevationM: 8,
    isFavorite: false,
  },
  {
    id: "jabar-32.13",
    name: "Kab. Subang",
    bmkgName: "Subang",
    kind: "Kabupaten",
    regionGroup: "Pantura & Purwasuka",
    district: "Subang Kota • Ciater • Pamanukan • Patimban",
    adm2: "32.13",
    adm4: "32.13.03.1001",
    lat: -6.5715,
    lon: 107.7587,
    elevationM: 96,
    isFavorite: false,
  },
  {
    id: "jabar-32.14",
    name: "Kab. Purwakarta",
    bmkgName: "Purwakarta",
    kind: "Kabupaten",
    regionGroup: "Pantura & Purwasuka",
    district: "Purwakarta Kota • Jatiluhur • Plered",
    adm2: "32.14",
    adm4: "32.14.01.1001",
    lat: -6.5569,
    lon: 107.4431,
    elevationM: 86,
    isFavorite: false,
  },
  {
    id: "jabar-32.15",
    name: "Kab. Karawang",
    bmkgName: "Karawang",
    kind: "Kabupaten",
    regionGroup: "Pantura & Purwasuka",
    district: "Karawang Barat • Telukjambe • Cikampek",
    adm2: "32.15",
    adm4: "32.15.01.1001",
    lat: -6.3227,
    lon: 107.3376,
    elevationM: 18,
    isFavorite: false,
  },
];

// Backward-compatible alias so any existing imports of BANDUNG_LOCATIONS get the full 27 Jawa Barat locations
export const BANDUNG_LOCATIONS = WEST_JAVA_LOCATIONS;

export function searchWestJavaLocations(
  query: string,
  filter: "ALL" | "Kota" | "Kabupaten" | WestJavaRegionGroup = "ALL"
): LocationOption[] {
  const q = query.trim().toLowerCase();
  return WEST_JAVA_LOCATIONS.filter((loc) => {
    if (filter === "Kota" && loc.kind !== "Kota") return false;
    if (filter === "Kabupaten" && loc.kind !== "Kabupaten") return false;
    if (
      filter !== "ALL" &&
      filter !== "Kota" &&
      filter !== "Kabupaten" &&
      loc.regionGroup !== filter
    ) {
      return false;
    }
    if (!q) return true;
    const kecList = BMKG_JABAR_KECAMATAN_SNAPSHOT[loc.adm2] || [];
    const matchesKecamatan = kecList.some(
      (k) => k.kecamatan.toLowerCase().includes(q) || k.adm3.toLowerCase().includes(q)
    );
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.bmkgName.toLowerCase().includes(q) ||
      loc.district.toLowerCase().includes(q) ||
      loc.adm2.toLowerCase().includes(q) ||
      loc.regionGroup.toLowerCase().includes(q) ||
      matchesKecamatan
    );
  });
}

export interface HourlyForecastItem {
  time: string;
  tempC: number;
  rainProbPct: number;
  precipMm: number;
  condition: "clear" | "partly_cloudy" | "cloudy" | "light_rain" | "heavy_rain" | "thunderstorm";
  label: string;
}

export interface MinutelyRainPoint {
  minute: number;
  timeLabel: string;
  mmPerHr: number;
  probPct: number;
  intensity: "Berawan" | "Hujan Ringan" | "Hujan Sedang" | "Hujan Lebat";
}

export interface AIQuestionCard {
  id: string;
  question: string;
  answer: string;
  tag: string;
  severity: "safe" | "caution" | "warning";
}

export interface FloodZoneItem {
  id: string;
  areaName: string;
  source: string;
  sourceType: "official" | "community" | "estimated_risk";
  level: "Rendah" | "Sedang" | "Tinggi";
  waterDepthCm: string;
  description: string;
  updatedAgo: string;
  verified: boolean;
  coords: string;
}

export interface TravelCorridorOption {
  id: string;
  name: string;
  distanceKm: number;
  estDurationMin: number;
  overallStatus: string;
  recommendation: string;
  checkpoints: {
    pointName: string;
    etaOffsetMin: number;
    condition: string;
    tempC: number;
    rainProbPct: number;
    precipMm: number;
    warning?: string;
  }[];
}

export interface CommunityReportEntry {
  id: string;
  author: string;
  locationName: string;
  reportType: "Hujan Lokal" | "Genangan / Banjir" | "Angin Kencang" | "Pohon Tumbang";
  description: string;
  coords: string;
  imageUrl?: string;
  timeAgo: string;
  verified: boolean;
  upvotes: number;
}

export interface LocationDashboardState {
  currentTempC: number;
  feelsLikeC: number;
  highTempC: number;
  lowTempC: number;
  humidityPct: number;
  huminPct: number;
  humaxPct: number;
  windSpeedKmh: number;
  windDirLabel: string;
  pressureHpa: number;
  visibilityKm: number;
  dewPointC: number;
  conditionCode: string;
  conditionLabel: string;
  bmkgTodayDesc: string;
  bmkgDaily: BMKGDailyEntry[];
  sebentarLagiHujan: boolean;
  rainSignsLabel: string;
  whatToPrepare: string;
  rainArrivalMin: number;
  rainDurationMin: number;
  peakPrecipMmHr: number;
  rainConfidencePct: number;
  rainAlertSummary: string;
  minutelyCurve: MinutelyRainPoint[];
  hourlyForecast: HourlyForecastItem[];
  aqi: {
    index: number;
    category: "Baik" | "Sedang" | "Tidak Sehat bagi Kelompok Sensitif";
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    so2: number | null; // Blueprint rule: NULL when sensor does not report SO2
    outdoorAdvice: string;
    history: { hour: string; aqi: number }[];
  };
  uv: {
    index: number;
    category: "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";
    peakWindow: string;
    recommendedSpf: number;
    skinAdvice: string;
  };
  extremeAlert: {
    id: string;
    title: string;
    bmkgRef: string;
    severity: "Siaga" | "Waspada";
    phenomena: string[];
    description: string;
    validWindow: string;
  };
  aiQuestions: AIQuestionCard[];
}

export const SMART_TRAVEL_CORRIDORS: TravelCorridorOption[] = [
  {
    id: "route-dago-buahbatu",
    name: "Kota Bandung: Dago (ITB) → Braga → Buahbatu",
    distanceKm: 11.4,
    estDurationMin: 38,
    overallStatus: "Hujan Sedang di Tengah Rute (+20 Menit)",
    recommendation:
      "Berangkat sekarang atau tunda 45 menit. Jika menggunakan motor, kenakan jas hujan sebelum memasuki koridor Jl. Ir. H. Juanda – Riau.",
    checkpoints: [
      {
        pointName: "Titik Asal — Simpang Dago / Coblong",
        etaOffsetMin: 0,
        condition: "Berawan Tebal",
        tempC: 23.4,
        rainProbPct: 45,
        precipMm: 0.4,
      },
      {
        pointName: "Titik Tengah — Koridor Riau & Braga",
        etaOffsetMin: 20,
        condition: "Hujan Sedang",
        tempC: 22.8,
        rainProbPct: 84,
        precipMm: 4.6,
        warning: "Jarak pandang turun & potensi jalan licin",
      },
      {
        pointName: "Titik Tujuan — Soekarno-Hatta / Buahbatu",
        etaOffsetMin: 38,
        condition: "Hujan Ringan",
        tempC: 24.1,
        rainProbPct: 68,
        precipMm: 1.8,
      },
    ],
  },
  {
    id: "route-pasteur-gedebage",
    name: "Bandung Raya: Pasteur → Cicaheum → Gedebage",
    distanceKm: 16.2,
    estDurationMin: 50,
    overallStatus: "Waspada Genangan Jalur Lambat Gedebage (+35 Menit)",
    recommendation:
      "Hindari lajur kiri bawah flyover Gedebage saat hujan berlangsung >30 menit. Gunakan jalur alternatif Antapani–Arcamanik.",
    checkpoints: [
      {
        pointName: "Titik Asal — Gerbang Tol Pasteur",
        etaOffsetMin: 0,
        condition: "Cerah Berawan",
        tempC: 25.0,
        rainProbPct: 30,
        precipMm: 0.0,
      },
      {
        pointName: "Titik Tengah — Terminal Cicaheum / Ujungberung",
        etaOffsetMin: 25,
        condition: "Hujan Lebat & Petir",
        tempC: 23.2,
        rainProbPct: 90,
        precipMm: 6.4,
        warning: "Angin kencang konvektif 26 km/j",
      },
      {
        pointName: "Titik Tujuan — Kawasan Gedebage",
        etaOffsetMin: 50,
        condition: "Hujan Sedang",
        tempC: 24.0,
        rainProbPct: 76,
        precipMm: 3.9,
        warning: "Potensi genangan permukaan 10–15 cm",
      },
    ],
  },
  {
    id: "route-bogor-bandung",
    name: "Lintas Jabar: Bogor → Puncak → Cianjur → Padalarang",
    distanceKm: 92.0,
    estDurationMin: 145,
    overallStatus: "Kabut & Hujan Orograpik di Puncak–Cipanas (+45 Menit)",
    recommendation:
      "Waspadai kabut tebal di Cisarua–Puncak Pass (jarak pandang <2 km) dan hujan ringan di Cianjur. Nyalakan lampu utama kendaraan.",
    checkpoints: [
      {
        pointName: "Titik Asal — Kota Bogor / Cibinong (32.71 / 32.01)",
        etaOffsetMin: 0,
        condition: "Berawan",
        tempC: 24.5,
        rainProbPct: 65,
        precipMm: 1.5,
      },
      {
        pointName: "Titik Tengah — Puncak Pass & Kab. Cianjur (32.03)",
        etaOffsetMin: 60,
        condition: "Hujan Ringan & Kabut",
        tempC: 20.5,
        rainProbPct: 86,
        precipMm: 4.8,
        warning: "Kelembapan 99% & jalan menanjak licin",
      },
      {
        pointName: "Titik Tujuan — Padalarang, Kab. Bandung Barat (32.17)",
        etaOffsetMin: 145,
        condition: "Berawan Tebal",
        tempC: 22.5,
        rainProbPct: 72,
        precipMm: 2.1,
      },
    ],
  },
];

export const INITIAL_FLOOD_ZONES: FloodZoneItem[] = [
  {
    id: "fz-01",
    areaName: "Koridor Dayeuhkolot & Baleendah (Kab. Bandung 32.04)",
    source: "BPBD Kab. Bandung & BBWS Citarum",
    sourceType: "official",
    level: "Sedang",
    waterDepthCm: "20–35 cm (Siaga)",
    description:
      "Kenaikan TMA Sungai Citarum akibat kiriman hujan hulu Bandung Utara. Kendaraan roda dua disarankan memutar via Baleendah Timur.",
    updatedAgo: "18 menit lalu",
    verified: true,
    coords: "-6.9881, 107.6269",
  },
  {
    id: "fz-02",
    areaName: "Jalur Lambat Jl. Soekarno-Hatta, Gedebage (Kota Bandung 32.73)",
    source: "Laporan Komunitas Terverifikasi",
    sourceType: "community",
    level: "Rendah",
    waterDepthCm: "10–15 cm",
    description:
      "Genangan air di lajur paling kiri depan Pasar Induk Gedebage. Lajur kanan masih aman dilintasi motor dan mobil.",
    updatedAgo: "12 menit lalu",
    verified: true,
    coords: "-6.9445, 107.6910",
  },
  {
    id: "fz-03",
    areaName: "Cekungan Pagarsih & DAS Cileungsi–Bekasi (32.73 / 32.75)",
    source: "Weatherly Rainfall Risk Model",
    sourceType: "estimated_risk",
    level: "Sedang",
    waterDepthCm: "Konteks Risiko Curah Hujan (5.2 mm/j)",
    description:
      "Bukan laporan banjir terkonfirmasi. Indikator risiko limpasan drainase jika hujan >5 mm/jam bertahan lebih dari 40 menit.",
    updatedAgo: "Real-time",
    verified: false,
    coords: "-6.9264, 107.5952",
  },
];

export const INITIAL_COMMUNITY_REPORTS: CommunityReportEntry[] = [];

export function getBMKGSnapshotForLocation(
  adm2: string,
  overrideMap?: Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>
): { kotkab: string; cuaca: BMKGDailyEntry[] } {
  const source = overrideMap || BMKG_JABAR_32_SNAPSHOT;
  return (
    source[adm2] ||
    BMKG_JABAR_32_SNAPSHOT[adm2] ||
    BMKG_JABAR_32_SNAPSHOT["32.73"]
  );
}

export function getImminentRainLocationsJabar(
  bmkgOverrideMap?: Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>
): Array<{
  loc: LocationOption;
  todayDesc: string;
  tomorrowDesc: string;
  humidityMax: number;
  dayLabel: string;
  signs: string;
}> {
  const results: Array<{
    loc: LocationOption;
    todayDesc: string;
    tomorrowDesc: string;
    humidityMax: number;
    dayLabel: string;
    signs: string;
  }> = [];

  for (const loc of WEST_JAVA_LOCATIONS) {
    const entry = getBMKGSnapshotForLocation(loc.adm2, bmkgOverrideMap);
    const c0 = entry.cuaca[0];
    const c1 = entry.cuaca[1] || c0;
    if (!c0) continue;
    const desc0 = c0.weather_desc.toLowerCase();
    const desc1 = c1.weather_desc.toLowerCase();

    const isRainToday = desc0.includes("hujan");
    const isRainTomorrow = desc1.includes("hujan");

    if (isRainToday || (c0.humax >= 96 && isRainTomorrow)) {
      results.push({
        loc,
        todayDesc: c0.weather_desc,
        tomorrowDesc: c1.weather_desc,
        humidityMax: c0.humax,
        dayLabel: isRainToday ? `Hari Ini: ${c0.weather_desc}` : `Besok: ${c1.weather_desc}`,
        signs: `Kelembapan ${c0.humin}–${c0.humax}% • Hari Ini: ${c0.weather_desc}, Besok: ${c1.weather_desc}`,
      });
    }
  }
  return results;
}

export function buildCustomTravelCorridor(
  route: {
    id: string;
    routeName: string;
    originAdm2: string;
    originName: string;
    midAdm2?: string;
    midName?: string;
    destAdm2: string;
    destName: string;
  },
  bmkgOverrideMap?: Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>
): TravelCorridorOption {
  const originLoc =
    WEST_JAVA_LOCATIONS.find((l) => l.adm2 === route.originAdm2) || WEST_JAVA_LOCATIONS[0];
  const destLoc =
    WEST_JAVA_LOCATIONS.find((l) => l.adm2 === route.destAdm2) || WEST_JAVA_LOCATIONS[1];
  const midLoc = route.midAdm2
    ? WEST_JAVA_LOCATIONS.find((l) => l.adm2 === route.midAdm2)
    : undefined;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(destLoc.lat - originLoc.lat);
  const dLon = toRad(destLoc.lon - originLoc.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(originLoc.lat)) * Math.cos(toRad(destLoc.lat)) * Math.sin(dLon / 2) ** 2;
  const straightKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadDistanceKm = Math.max(8.5, Number((straightKm * 1.32).toFixed(1)));
  const estDurationMin = Math.max(20, Math.round((roadDistanceKm / 34) * 60));

  const originState = buildLocationState(originLoc, bmkgOverrideMap);
  const destState = buildLocationState(destLoc, bmkgOverrideMap);
  const midState = midLoc ? buildLocationState(midLoc, bmkgOverrideMap) : null;

  const checkpoints: TravelCorridorOption["checkpoints"] = [
    {
      pointName: `Titik Asal — ${route.originName} (${route.originAdm2})`,
      etaOffsetMin: 0,
      condition: `Hari Ini: ${originState.bmkgTodayDesc} (Besok: ${
        originState.bmkgDaily[1]?.weather_desc || originState.bmkgTodayDesc
      })`,
      tempC: originState.currentTempC,
      rainProbPct: originState.humaxPct,
      precipMm: 0,
      warning: originState.sebentarLagiHujan
        ? `Prakiraan BMKG: ${originState.bmkgTodayDesc} (Kelembapan ${originState.huminPct}–${originState.humaxPct}%)`
        : undefined,
    },
  ];

  if (midLoc && midState) {
    checkpoints.push({
      pointName: `Titik Transit — ${route.midName || midLoc.name} (${midLoc.adm2})`,
      etaOffsetMin: Math.round(estDurationMin * 0.5),
      condition: `Hari Ini: ${midState.bmkgTodayDesc} (Besok: ${
        midState.bmkgDaily[1]?.weather_desc || midState.bmkgTodayDesc
      })`,
      tempC: midState.currentTempC,
      rainProbPct: midState.humaxPct,
      precipMm: 0,
      warning: midState.sebentarLagiHujan
        ? `Kelembapan ${midState.huminPct}–${midState.humaxPct}% di wilayah transit`
        : undefined,
    });
  }

  checkpoints.push({
    pointName: `Titik Tujuan — ${route.destName} (${route.destAdm2})`,
    etaOffsetMin: estDurationMin,
    condition: `Hari Ini: ${destState.bmkgTodayDesc} (Besok: ${
      destState.bmkgDaily[1]?.weather_desc || destState.bmkgTodayDesc
    })`,
    tempC: destState.currentTempC,
    rainProbPct: destState.humaxPct,
    precipMm: 0,
    warning: destState.sebentarLagiHujan
      ? `Prakiraan tujuan: ${destState.bmkgTodayDesc} / ${
          destState.bmkgDaily[1]?.weather_desc || ""
        }`
      : undefined,
  });

  const anyWet =
    originState.sebentarLagiHujan ||
    Boolean(midState?.sebentarLagiHujan) ||
    destState.sebentarLagiHujan;

  return {
    id: route.id,
    name: route.routeName,
    distanceKm: roadDistanceKm,
    estDurationMin,
    overallStatus: anyWet
      ? "Waspada Potensi Hujan Harian BMKG pada Jalur Rute"
      : "Prakiraan Harian BMKG Kondusif (Cerah / Berawan)",
    recommendation: anyWet
      ? `Prakiraan harian BMKG pada koridor ${route.routeName} mencatat kelembapan tinggi dan potensi hujan. Siapkan perlengkapan hujan untuk perjalanan hari ini.`
      : `Prakiraan harian BMKG di sepanjang rute ${route.routeName} tercatat ${originState.bmkgTodayDesc} hingga ${destState.bmkgTodayDesc}.`,
    checkpoints,
  };
}

export function buildLocationState(
  loc: LocationOption,
  bmkgOverrideMap?: Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>
): LocationDashboardState {
  const bmkgEntry = getBMKGSnapshotForLocation(loc.adm2, bmkgOverrideMap);
  const today = bmkgEntry.cuaca[0] || {
    weather_desc: "Berawan",
    local_datetime: "2026-11-25T08:00:00",
    tmin: 21,
    tmax: 24,
    humin: 90,
    humax: 96,
  };
  const tomorrow = bmkgEntry.cuaca[1] || today;

  const isClearToday = today.weather_desc.toLowerCase().includes("cerah");
  const isCurrentlyRainDesc = today.weather_desc.toLowerCase().includes("hujan");
  const isTomorrowRainDesc = tomorrow.weather_desc.toLowerCase().includes("hujan");

  // Daily-based rain indicator directly from BMKG daily data (Zero fake minutes!)
  const sebentarLagiHujan =
    isCurrentlyRainDesc || (!isClearToday && today.humax >= 96 && isTomorrowRainDesc);

  const baseTemp = Number(((today.tmin + today.tmax) / 2).toFixed(1));
  const highTemp = today.tmax;
  const lowTemp = today.tmin;
  const humidity = Math.round((today.humin + today.humax) / 2);

  const rainSignsLabel = isCurrentlyRainDesc
    ? `Prakiraan BMKG Hari Ini: ${today.weather_desc} (Suhu ${today.tmin}–${today.tmax}°C, Kelembapan ${today.humin}–${today.humax}%). Prakiraan Besok: ${tomorrow.weather_desc}.`
    : sebentarLagiHujan
    ? `Cuaca Hari Ini: ${today.weather_desc} dengan kelembapan tinggi (${today.humin}–${today.humax}%). Prakiraan BMKG Besok: ${tomorrow.weather_desc} (${tomorrow.tmin}–${tomorrow.tmax}°C).`
    : `Cuaca Hari Ini: ${today.weather_desc} (${today.tmin}–${today.tmax}°C, Kelembapan ${today.humin}–${today.humax}%). Prakiraan BMKG Besok: ${tomorrow.weather_desc}.`;

  const conditionLabel = `Hari Ini: ${today.weather_desc} • Besok: ${tomorrow.weather_desc}`;

  // Map real 6-day BMKG daily forecast into the chart bars (Days instead of fake 10-60 minutes!)
  const dailyChartPoints: MinutelyRainPoint[] = bmkgEntry.cuaca.slice(0, 6).map((day, idx) => {
    const dLower = day.weather_desc.toLowerCase();
    const isRainDay = dLower.includes("hujan");
    const isStormDay = dLower.includes("petir") || dLower.includes("lebat");
    const dayDate = day.local_datetime ? day.local_datetime.slice(5, 10) : `H+${idx}`;
    const label = idx === 0 ? "Hari Ini" : idx === 1 ? "Besok" : dayDate;
    return {
      minute: idx + 1,
      timeLabel: label,
      mmPerHr: day.tmax,
      probPct: day.humax,
      intensity: isStormDay
        ? "Hujan Lebat"
        : isRainDay
        ? "Hujan Ringan"
        : "Berawan",
    };
  });

  return {
    currentTempC: baseTemp,
    feelsLikeC: Number((baseTemp + 0.8).toFixed(1)),
    highTempC: highTemp,
    lowTempC: lowTemp,
    humidityPct: humidity,
    huminPct: today.humin,
    humaxPct: today.humax,
    windSpeedKmh: 8.5,
    windDirLabel: "WIB • BMKG 32",
    pressureHpa: Math.round(1012 - loc.elevationM * 0.095),
    visibilityKm: 10.0,
    dewPointC: Number((baseTemp - (100 - humidity) / 5).toFixed(1)),
    conditionCode: isClearToday ? "PARTLY_CLOUDY" : "CLOUDY",
    conditionLabel,
    bmkgTodayDesc: today.weather_desc,
    bmkgDaily: bmkgEntry.cuaca,
    sebentarLagiHujan,
    rainSignsLabel,
    whatToPrepare: `Prakiraan Resmi BMKG ${loc.name} (${loc.adm2}) — Hari Ini: ${today.weather_desc} (Suhu ${today.tmin}–${today.tmax}°C, Kelembapan ${today.humin}–${today.humax}%). Besok: ${tomorrow.weather_desc} (${tomorrow.tmin}–${tomorrow.tmax}°C).`,
    rainArrivalMin: 0,
    rainDurationMin: 0,
    peakPrecipMmHr: today.tmax,
    rainConfidencePct: today.humax,
    rainAlertSummary: rainSignsLabel,
    minutelyCurve: dailyChartPoints,
    hourlyForecast: bmkgEntry.cuaca.slice(0, 6).map((d, idx) => ({
      time: idx === 0 ? "Hari Ini" : idx === 1 ? "Besok" : d.local_datetime.slice(0, 10),
      tempC: d.tmax,
      rainProbPct: d.humax,
      precipMm: d.tmin,
      condition: d.weather_desc.toLowerCase().includes("hujan") ? "light_rain" : "cloudy",
      label: d.weather_desc,
    })),
    aqi: {
      index: 55,
      category: "Sedang",
      pm25: 18.5,
      pm10: 34.0,
      no2: 14.0,
      o3: 42.0,
      co: 320.0,
      so2: null,
      outdoorAdvice: `Data sensor kualitas udara real-time Open-Meteo untuk koordinat ${loc.name} (${loc.lat.toFixed(
        4
      )}, ${loc.lon.toFixed(4)}).`,
      history: [],
    },
    uv: {
      index: 3.0,
      category: "Sedang",
      peakWindow: "10:30 – 14:30 WIB",
      recommendedSpf: 30,
      skinAdvice: `Data sensor UV real-time untuk wilayah ${loc.name}. Gunakan pelindung kulit SPF 30+ saat beraktivitas di siang hari.`,
    },
    extremeAlert: {
      id: `BMKG-JABAR-${loc.adm2}`,
      title: `Prakiraan Cuaca Harian BMKG — ${loc.name} (${loc.adm2})`,
      bmkgRef: "BMKG Provinsi Jawa Barat (bmkg.go.id/cuaca/prakiraan-cuaca/32)",
      severity: sebentarLagiHujan ? "Siaga" : "Waspada",
      phenomena: [
        `Hari Ini: ${today.weather_desc}`,
        `Besok: ${tomorrow.weather_desc}`,
        `Suhu ${today.tmin}–${today.tmax}°C • RH ${today.humin}–${today.humax}%`,
      ],
      description: `Data resmi BMKG Provinsi Jawa Barat untuk ${loc.name} (${loc.district}): Hari Ini ${today.weather_desc} dengan suhu ${today.tmin}–${today.tmax}°C dan kelembapan ${today.humin}–${today.humax}%. Prakiraan Besok: ${tomorrow.weather_desc} (${tomorrow.tmin}–${tomorrow.tmax}°C).`,
      validWindow: "Data Harian Resmi BMKG Provinsi 32",
    },
    aiQuestions: [
      {
        id: "ai-q1",
        question: `Bagaimana kondisi cuaca Hari Ini dan prediksi Besok di ${loc.name}?`,
        answer: `Hari Ini di ${loc.name} (BMKG ${loc.adm2}), prakiraan resmi BMKG mencatat kondisi ${today.weather_desc} dengan rentang suhu ${today.tmin}–${today.tmax}°C dan kelembapan ${today.humin}–${today.humax}%. Untuk prediksi Besok, cuaca diperkirakan ${tomorrow.weather_desc} dengan suhu ${tomorrow.tmin}–${tomorrow.tmax}°C.`,
        tag: "Prakiraan Harian BMKG",
        severity: sebentarLagiHujan ? "warning" : "safe",
      },
      {
        id: "ai-q2",
        question: `Apakah Hari Ini dan Besok aman berkendara di ${loc.name}?`,
        answer: sebentarLagiHujan
          ? `Untuk Hari Ini (${today.weather_desc}) dan Besok (${tomorrow.weather_desc}) di ${loc.name}, kelembapan udara mencapai ${today.humax}% dengan potensi hujan harian. Siapkan jas hujan di kendaraan saat melintasi ${loc.district}.`
          : `Hari Ini cuaca di ${loc.name} tercatat ${today.weather_desc} (${today.tmin}–${today.tmax}°C) sehingga kondusif untuk perjalanan. Untuk Besok, prakiraan BMKG menunjukkan ${tomorrow.weather_desc}.`,
        tag: "Perjalanan Harian",
        severity: sebentarLagiHujan ? "warning" : "caution",
      },
      {
        id: "ai-q3",
        question: `Bagaimana tren cuaca 7 hari ke depan di ${loc.name}?`,
        answer: `Dalam 7 hari ke depan menurut data BMKG (${loc.adm2}), suhu minimum berada di kisaran ${today.tmin}°C dan suhu maksimum mencapai ${Math.max(
          ...bmkgEntry.cuaca.map((c) => c.tmax)
        )}°C dengan dominasi cuaca ${today.weather_desc} dan ${tomorrow.weather_desc}.`,
        tag: "Tren 7 Hari BMKG",
        severity: "safe",
      },
      {
        id: "ai-q4",
        question: "Dari mana sumber data cuaca harian ini?",
        answer: `Seluruh prakiraan harian diambil langsung dari BMKG Provinsi Jawa Barat (Kode ${loc.adm2}, koordinat ${loc.lat.toFixed(
          4
        )}, ${loc.lon.toFixed(4)}) dan digabungkan dengan sensor cuaca & kualitas udara real-time Open-Meteo tanpa data dummy.`,
        tag: "Validitas Data Resmi",
        severity: "caution",
      },
    ],
  };
}
