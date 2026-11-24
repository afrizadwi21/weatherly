export interface LocationOption {
  id: string;
  name: string;
  district: string;
  adm4: string;
  lat: number;
  lon: number;
  elevationM: number;
  isFavorite: boolean;
}

export const BANDUNG_LOCATIONS: LocationOption[] = [
  {
    id: "loc-bandung-pusat",
    name: "Bandung Pusat",
    district: "Sumur Bandung • Braga",
    adm4: "32.73.01.1001",
    lat: -6.9175,
    lon: 107.6191,
    elevationM: 715,
    isFavorite: true,
  },
  {
    id: "loc-dago",
    name: "Dago & Coblong",
    district: "Bandung Utara • ITB/Dipatiukur",
    adm4: "32.73.08.1003",
    lat: -6.885,
    lon: 107.6135,
    elevationM: 840,
    isFavorite: true,
  },
  {
    id: "loc-gedebage",
    name: "Gedebage",
    district: "Bandung Timur • Soekarno-Hatta",
    adm4: "32.73.27.1001",
    lat: -6.9445,
    lon: 107.691,
    elevationM: 668,
    isFavorite: false,
  },
  {
    id: "loc-dayeuhkolot",
    name: "Dayeuhkolot & Baleendah",
    district: "Bandung Selatan • Koridor Citarum",
    adm4: "32.04.12.2001",
    lat: -6.9881,
    lon: 107.6269,
    elevationM: 655,
    isFavorite: true,
  },
];

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
  windSpeedKmh: number;
  windDirLabel: string;
  pressureHpa: number;
  visibilityKm: number;
  dewPointC: number;
  conditionCode: string;
  conditionLabel: string;
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
    name: "Dago (ITB) → Braga → Buahbatu",
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
    name: "Pasteur → Cicaheum → Gedebage",
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
];

export const INITIAL_FLOOD_ZONES: FloodZoneItem[] = [
  {
    id: "fz-01",
    areaName: "Koridor Dayeuhkolot & Bojongsoang",
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
    areaName: "Jalur Lambat Jl. Soekarno-Hatta (Gedebage)",
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
    areaName: "Cekungan Pagarsih & Astanaanyar",
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

export const INITIAL_COMMUNITY_REPORTS: CommunityReportEntry[] = [
  {
    id: "comm-01",
    author: "Rizky Pratama (Pengendara Motor)",
    locationName: "Simpang Dago – Dipatiukur",
    reportType: "Hujan Lokal",
    description:
      "Hujan deras disertai angin cukup kencang baru saja turun di sekitar kampus Unpad Dipatiukur, jarak pandang berkurang.",
    coords: "-6.8904, 107.6158",
    timeAgo: "8 menit lalu",
    verified: true,
    upvotes: 14,
  },
  {
    id: "comm-02",
    author: "Nadia Putri (Komuter)",
    locationName: "Jl. Soekarno-Hatta (Perempatan Gedebage)",
    reportType: "Genangan / Banjir",
    description:
      "Genangan setinggi mata kaki di jalur lambat arah Cibiru, drainase meluap. Ambil lajur cepat sebelah kanan.",
    coords: "-6.9445, 107.6910",
    timeAgo: "15 menit lalu",
    verified: true,
    upvotes: 9,
  },
  {
    id: "comm-03",
    author: "Hendri Saputra (Pekerja Lapangan)",
    locationName: "Tamansari – Babakan Siliwangi",
    reportType: "Angin Kencang",
    description:
      "Hembusan angin kencang di jalur pepohonan Babakan Siliwangi menjelang hujan turun, hati-hati ranting pohon rapuh.",
    coords: "-6.8858, 107.6079",
    timeAgo: "22 menit lalu",
    verified: false,
    upvotes: 4,
  },
];

export function buildLocationState(loc: LocationOption): LocationDashboardState {
  const isNorth = loc.id === "loc-dago";
  const isSouth = loc.id === "loc-dayeuhkolot";
  const baseTemp = isNorth ? 22.8 : isSouth ? 25.4 : 24.5;
  const arrivalMin = isNorth ? 12 : isSouth ? 25 : 18;
  const peakMm = isNorth ? 6.4 : 5.2;

  return {
    currentTempC: baseTemp,
    feelsLikeC: Number((baseTemp + 0.6).toFixed(1)),
    highTempC: Number((baseTemp + 3.2).toFixed(1)),
    lowTempC: Number((baseTemp - 4.1).toFixed(1)),
    humidityPct: isNorth ? 84 : 78,
    windSpeedKmh: isNorth ? 16.8 : 12.4,
    windDirLabel: "Barat Daya (245°)",
    pressureHpa: 1011,
    visibilityKm: 7.5,
    dewPointC: 20.4,
    conditionCode: "CONVECTIVE_RAIN_APPROACHING",
    conditionLabel: "Berawan Konvektif • Hujan Mendekat",
    whatToPrepare: `Hujan intensitas sedang–lebat diperkirakan tiba di ${loc.name} dalam ${arrivalMin} menit. Siapkan jas hujan/payung sekarang dan hindari berteduh di bawah pohon besar.`,
    rainArrivalMin: arrivalMin,
    rainDurationMin: 45,
    peakPrecipMmHr: peakMm,
    rainConfidencePct: 89,
    rainAlertSummary: `Sel hujan bergerak dari arah Barat Laut menuju ${loc.name} dengan kecepatan 14 km/jam.`,
    minutelyCurve: [
      { minute: 10, timeLabel: "+10m", mmPerHr: 0.4, probPct: 40, intensity: "Berawan" },
      { minute: 20, timeLabel: "+20m", mmPerHr: 2.1, probPct: 76, intensity: "Hujan Ringan" },
      { minute: 30, timeLabel: "+30m", mmPerHr: 4.5, probPct: 88, intensity: "Hujan Sedang" },
      { minute: 40, timeLabel: "+40m", mmPerHr: peakMm, probPct: 92, intensity: "Hujan Lebat" },
      { minute: 50, timeLabel: "+50m", mmPerHr: 2.8, probPct: 74, intensity: "Hujan Sedang" },
      { minute: 60, timeLabel: "+60m", mmPerHr: 0.9, probPct: 45, intensity: "Hujan Ringan" },
    ],
    hourlyForecast: [
      { time: "Sekarang", tempC: baseTemp, rainProbPct: 40, precipMm: 0.4, condition: "cloudy", label: "Berawan Tebal" },
      { time: "15:00", tempC: Number((baseTemp - 0.8).toFixed(1)), rainProbPct: 88, precipMm: 4.8, condition: "heavy_rain", label: "Hujan Deras" },
      { time: "16:00", tempC: Number((baseTemp - 1.4).toFixed(1)), rainProbPct: 82, precipMm: 3.6, condition: "thunderstorm", label: "Hujan Petir" },
      { time: "17:00", tempC: Number((baseTemp - 1.1).toFixed(1)), rainProbPct: 60, precipMm: 1.5, condition: "light_rain", label: "Hujan Ringan" },
      { time: "18:00", tempC: Number((baseTemp - 1.6).toFixed(1)), rainProbPct: 35, precipMm: 0.2, condition: "cloudy", label: "Berawan" },
      { time: "19:00", tempC: Number((baseTemp - 2.2).toFixed(1)), rainProbPct: 20, precipMm: 0.0, condition: "partly_cloudy", label: "Cerah Berawan" },
      { time: "20:00", tempC: Number((baseTemp - 2.7).toFixed(1)), rainProbPct: 15, precipMm: 0.0, condition: "clear", label: "Langit Bersih" },
      { time: "21:00", tempC: Number((baseTemp - 3.1).toFixed(1)), rainProbPct: 10, precipMm: 0.0, condition: "clear", label: "Cerah Malam" },
    ],
    aqi: {
      index: isNorth ? 58 : 74,
      category: "Sedang",
      pm25: isNorth ? 19.2 : 28.4,
      pm10: isNorth ? 38.5 : 54.0,
      no2: 16.2,
      o3: 41.5,
      co: 310.0,
      so2: null,
      outdoorAdvice:
        "Kualitas udara kategori Sedang (AQI 74). Aman untuk aktivitas luar ruangan, namun kelompok sensitif/asma disarankan menggunakan masker saat melintasi jalan arteri padat.",
      history: [
        { hour: "09:00", aqi: 62 },
        { hour: "10:00", aqi: 68 },
        { hour: "11:00", aqi: 75 },
        { hour: "12:00", aqi: 82 },
        { hour: "13:00", aqi: 78 },
        { hour: "14:00", aqi: isNorth ? 58 : 74 },
      ],
    },
    uv: {
      index: 7.4,
      category: "Tinggi",
      peakWindow: "10:30 – 14:30 WIB",
      recommendedSpf: 30,
      skinAdvice:
        "Indeks UV mencapai 7.4 (Tinggi) sebelum tutupan awan hujan menebal. Gunakan sunscreen SPF 30+ dan kacamata UV jika berkendara di siang hari.",
    },
    extremeAlert: {
      id: "BMKG-JB-BDG-2026",
      title: `Peringatan Dini Cuaca Ekstrem BMKG — ${loc.name}`,
      bmkgRef: "Stasiun Geofisika Kelas I Bandung",
      severity: "Siaga",
      phenomena: ["Hujan Lebat (>5 mm/jam)", "Kilat / Petir Konvektif", "Angin Kencang Sesaat"],
      description:
        "Pertumbuhan awan Cumulonimbus terdeteksi aktif di cekungan Bandung. Waspadai penurunan jarak pandang mendadak, sambaran petir, dan genangan lokal pada titik drainase padat.",
      validWindow: "Berlaku hingga 17:30 WIB",
    },
    aiQuestions: [
      {
        id: "ai-q1",
        question: "Apa pengaruh cuaca hari ini terhadap aktivitas saya?",
        answer: `Di ${loc.name}, pagi–siang didominasi UV tinggi (7.4), namun sore hari terjadi transisi cepat ke hujan konvektif (${peakMm} mm/jam dalam ~${arrivalMin} menit). Selesaikan aktivitas luar ruang sebelum pukul 14:45 WIB.`,
        tag: "Ringkasan Harian",
        severity: "caution",
      },
      {
        id: "ai-q2",
        question: "Apakah sore ini cocok untuk berkendara?",
        answer: `Kurang ideal untuk berkendara motor tanpa jas hujan antara pukul 14:30–16:30 WIB. Puncak presipitasi ${peakMm} mm/jam menurunkan jarak pandang hingga <3 km dan memicu genangan di jalur lambat.`,
        tag: "Komuter & Berkendara",
        severity: "warning",
      },
      {
        id: "ai-q3",
        question: "Kapan waktu terbaik untuk berolahraga di luar ruangan?",
        answer:
          "Waktu terbaik adalah pukul 06:00–08:30 WIB atau setelah pukul 17:45 WIB saat hujan telah mencuci polutan PM2.5 (AQI turun ke kisaran <50) dan indeks UV sudah 0.",
        tag: "Olahraga & Kesehatan",
        severity: "safe",
      },
      {
        id: "ai-q4",
        question: "Mengapa Weatherly memberikan peringatan hujan sekarang?",
        answer: `Rule Engine mendeteksi kelembapan udara mencapai ${isNorth ? 84 : 78}%, titik embun 20.4°C, serta pergerakan gema radar presipitasi menuju koordinat ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)} dengan probabilitas 89%.`,
        tag: "Transparansi AI & Rule Engine",
        severity: "caution",
      },
    ],
  };
}
