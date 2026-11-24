export interface LocationPreset {
  id: string;
  name: string;
  subdistrict: string;
  lat: number;
  lon: number;
}

export const BANDUNG_LOCATIONS: LocationPreset[] = [
  { id: "bdg-pusat", name: "Bandung Pusat", subdistrict: "Sumur Bandung", lat: -6.9175, lon: 107.6191 },
  { id: "bdg-dago", name: "Dago Utara", subdistrict: "Coblong", lat: -6.885, lon: 107.6135 },
  { id: "bdg-gedebage", name: "Gedebage", subdistrict: "Bandung Timur", lat: -6.9445, lon: 107.691 },
  { id: "bdg-dayeuhkolot", name: "Dayeuhkolot", subdistrict: "Bandung Selatan", lat: -6.9881, lon: 107.6269 },
];

export interface MinutelyPoint {
  minutes_ahead: number;
  precipitation_mm: number;
  rain_probability: number;
  intensity_level: string;
}

export interface RainPredictionData {
  location_name: string;
  will_rain_soon: boolean;
  estimated_arrival_minutes: number | null;
  peak_intensity_mm_per_hr: number;
  intensity_category: string;
  confidence_probability: number;
  alert_message: string;
  provider: string;
  curve: MinutelyPoint[];
}

export interface CurrentWeatherData {
  location_name: string;
  latitude: number;
  longitude: number;
  temperature_c: number;
  feels_like_c: number | null;
  humidity_pct: number | null;
  wind_speed_kmh: number | null;
  precipitation_mm: number;
  condition_code: string;
  condition_label: string;
  provider: string;
}

export interface AirQualityData {
  aqi: number;
  category: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  co: number | null;
  so2: number | null; // Strictly preserved as null when sensor omits SO2
  outdoor_recommendation: string;
  provider: string;
}

export interface UVData {
  uv_index: number;
  uv_category: string;
  peak_hours_window: string;
  protection_advice: string;
  recommended_spf: number;
}

export interface AIInsightItem {
  type: string;
  severity: string;
  recommendation: string;
}

export interface DailyInsightsData {
  location: string;
  summary: string;
  insights: AIInsightItem[];
  model_name: string;
}

export interface FloodReportItem {
  id: string;
  source: string;
  source_type: "official" | "community" | "estimated_risk";
  flood_level: string;
  description: string;
  verified: boolean;
}

export interface CommunityReportItem {
  id: string;
  report_type: string;
  description: string;
  verification_status: string;
  upvotes: number;
}

export interface ObservatorySnapshot {
  current: CurrentWeatherData;
  rain: RainPredictionData;
  airQuality: AirQualityData;
  uv: UVData;
  insights: DailyInsightsData;
  floodReports: FloodReportItem[];
  communityReports: CommunityReportItem[];
}

export function getFallbackSnapshot(loc: LocationPreset): ObservatorySnapshot {
  const tempOffset = (loc.lat + 6.9175) * 3.2;
  const temp = Number((24.5 + tempOffset).toFixed(1));
  return {
    current: {
      location_name: loc.name,
      latitude: loc.lat,
      longitude: loc.lon,
      temperature_c: temp,
      feels_like_c: Number((temp + 0.4).toFixed(1)),
      humidity_pct: 78,
      wind_speed_kmh: 12.4,
      precipitation_mm: 0.4,
      condition_code: "CLOUDY_RAIN_RISK",
      condition_label: "Berawan Tebal Berpotensi Hujan",
      provider: "BMKG + Open-Meteo",
    },
    rain: {
      location_name: loc.name,
      will_rain_soon: true,
      estimated_arrival_minutes: 20,
      peak_intensity_mm_per_hr: 5.2,
      intensity_category: "moderate_rain",
      confidence_probability: 0.9,
      alert_message: `Hujan intensitas sedang diperkirakan tiba di ${loc.name} dalam ~20 menit. Siapkan payung atau jas hujan sebelum berangkat.`,
      provider: "Weatherly Nowcast Engine",
      curve: [
        { minutes_ahead: 10, precipitation_mm: 0.2, rain_probability: 0.35, intensity_level: "no_rain" },
        { minutes_ahead: 20, precipitation_mm: 1.4, rain_probability: 0.68, intensity_level: "light_rain" },
        { minutes_ahead: 30, precipitation_mm: 3.8, rain_probability: 0.84, intensity_level: "moderate_rain" },
        { minutes_ahead: 40, precipitation_mm: 5.2, rain_probability: 0.9, intensity_level: "moderate_rain" },
        { minutes_ahead: 50, precipitation_mm: 2.6, rain_probability: 0.75, intensity_level: "moderate_rain" },
        { minutes_ahead: 60, precipitation_mm: 0.8, rain_probability: 0.45, intensity_level: "light_rain" },
      ],
    },
    airQuality: {
      aqi: 74,
      category: "Moderate",
      pm25: 28.4,
      pm10: 54.0,
      no2: 16.2,
      o3: 41.5,
      co: 310.0,
      so2: null,
      outdoor_recommendation:
        "Kualitas udara sedang; aman untuk aktivitas luar ruangan, kelompok sensitif disarankan membatasi paparan panjang.",
      provider: "Open-Meteo AQI",
    },
    uv: {
      uv_index: 7.4,
      uv_category: "High",
      peak_hours_window: "10:30 - 14:30 WIB",
      protection_advice:
        "Paparan UV tinggi. Gunakan sunscreen SPF 30+, topi, dan kurangi paparan langsung pukul 11:00–14:00 WIB.",
      recommended_spf: 30,
    },
    insights: {
      location: loc.name,
      summary: "Potensi hujan meningkat pada sore hari.",
      model_name: "Stage-1 Rule Engine + Stage-2 Gemini Adapter",
      insights: [
        {
          type: "rain",
          severity: "medium",
          recommendation: `Siapkan payung atau jas hujan sebelum bepergian dari ${loc.name} (estimasi hujan tiba ~20 menit lagi).`,
        },
        {
          type: "uv",
          severity: "high",
          recommendation: "Gunakan perlindungan kulit SPF 30+ pada jendela puncak radiasi 10:30 - 14:30 WIB.",
        },
        {
          type: "air_quality",
          severity: "low",
          recommendation:
            "Kualitas udara AQI 74 (Moderate). Parameter polutan SO2 tidak tersedia (NULL) dari stasiun regional.",
        },
      ],
    },
    floodReports: [
      {
        id: "flood-bdg-01",
        source: "BPBD Jawa Barat / Kab. Bandung",
        source_type: "official",
        flood_level: "medium",
        description:
          "Peringatan resmi potensi genangan di koridor Dayeuhkolot & Baleendah saat intensitas hujan hulu Bandung > 5 mm/jam.",
        verified: true,
      },
      {
        id: "flood-bdg-02",
        source: "Laporan Komunitas Pengguna",
        source_type: "community",
        flood_level: "low",
        description:
          "Genangan permukaan ~10-15 cm di jalur lambat Jl. Soekarno-Hatta (Gedebage), kendaraan masih bisa melintas.",
        verified: true,
      },
    ],
    communityReports: [
      {
        id: "comm-bdg-01",
        report_type: "local_rain",
        description:
          "Hujan deras disertai angin cukup kencang mulai turun di sekitar Simpang Dago & Dipatiukur.",
        verification_status: "verified",
        upvotes: 5,
      },
    ],
  };
}
