import { NextRequest, NextResponse } from "next/server";
import { BMKG_JABAR_32_SNAPSHOT, BMKGDailyEntry } from "@/lib/bmkg-jabar-snapshot";
import {
  BMKG_JABAR_KECAMATAN_SNAPSHOT,
  BMKGKecamatanEntry,
} from "@/lib/bmkg-jabar-kecamatan";
import {
  BeritaAcaraCategory,
  BeritaAcaraItem,
  INITIAL_BERITA_ACARA_JABAR,
} from "@/lib/berita-acara-jabar";

const BMKG_PROV_32_URL = "https://www.bmkg.go.id/cuaca/prakiraan-cuaca/32";

function mapWMOToIndonesian(code?: number): string {
  if (code === undefined || code === null) return "Berawan";
  if (code === 0) return "Cerah";
  if (code === 1 || code === 2) return "Cerah Berawan";
  if (code === 3) return "Berawan";
  if (code >= 45 && code <= 48) return "Kabut / Udara Kabur";
  if (code >= 51 && code <= 57) return "Gerimis / Hujan Ringan";
  if (code >= 61 && code <= 65) return "Hujan";
  if (code >= 80 && code <= 82) return "Hujan Lokal";
  if (code >= 95) return "Hujan Petir";
  return "Berawan";
}

function resolveNuxtValue(arr: unknown[], idx: unknown, depth = 0): unknown {
  if (depth > 12) return null;
  const val = typeof idx === "number" && idx >= 0 && idx < arr.length ? arr[idx] : idx;
  if (Array.isArray(val)) {
    if (
      val.length === 2 &&
      typeof val[0] === "string" &&
      ["ShallowReactive", "Reactive", "EmptyRef", "Ref"].includes(val[0])
    ) {
      return resolveNuxtValue(arr, val[1], depth + 1);
    }
    return val.map((x) => resolveNuxtValue(arr, x, depth + 1));
  }
  if (val && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = resolveNuxtValue(arr, v, depth + 1);
    }
    return out;
  }
  return val;
}

async function fetchLiveBMKGJabar32(): Promise<
  Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }>
> {
  try {
    const res = await fetch(BMKG_PROV_32_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return BMKG_JABAR_32_SNAPSHOT;
    const html = await res.text();
    const match = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return BMKG_JABAR_32_SNAPSHOT;
    const arr = JSON.parse(match[1]) as unknown[];
    const root = resolveNuxtValue(arr, 5) as {
      data?: Array<{
        lokasi?: { adm2?: string; kotkab?: string };
        cuaca?: Array<Record<string, unknown>>;
      }>;
    };
    if (!root?.data || !Array.isArray(root.data)) return BMKG_JABAR_32_SNAPSHOT;

    const parsed: Record<string, { kotkab: string; cuaca: BMKGDailyEntry[] }> = {};
    for (const item of root.data) {
      const adm2 = item.lokasi?.adm2;
      const kotkab = item.lokasi?.kotkab;
      if (!adm2 || !kotkab) continue;
      parsed[adm2] = {
        kotkab,
        cuaca: (item.cuaca || []).slice(0, 7).map((c) => ({
          weather_desc: String(c.weather_desc ?? "Berawan"),
          local_datetime: String(c.local_datetime ?? ""),
          tmin: Number(c.tmin ?? 22),
          tmax: Number(c.tmax ?? 29),
          humin: Number(c.humin ?? 70),
          humax: Number(c.humax ?? 95),
        })),
      };
    }
    return Object.keys(parsed).length >= 20 ? parsed : BMKG_JABAR_32_SNAPSHOT;
  } catch {
    return BMKG_JABAR_32_SNAPSHOT;
  }
}

async function fetchLiveBMKGKecamatanByAdm2(adm2: string): Promise<BMKGKecamatanEntry[]> {
  const fallback = BMKG_JABAR_KECAMATAN_SNAPSHOT[adm2] || [];
  try {
    const res = await fetch(
      `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${encodeURIComponent(adm2)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return fallback;
    const html = await res.text();
    const match = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return fallback;
    const arr = JSON.parse(match[1]) as unknown[];
    const root = resolveNuxtValue(arr, 5) as {
      data?: Array<{
        lokasi?: { adm3?: string; kecamatan?: string; kotkab?: string };
        cuaca?: Array<Record<string, unknown>>;
      }>;
    };
    if (!root?.data || !Array.isArray(root.data) || root.data.length === 0) return fallback;

    return root.data.map((entry) => {
      const loc = entry.lokasi || {};
      const cuaca = entry.cuaca || [];
      const c0 = cuaca[0] || {};
      const c1 = cuaca[1] || c0;
      return {
        adm3: String(loc.adm3 ?? ""),
        kecamatan: String(loc.kecamatan ?? ""),
        kotkab: String(loc.kotkab ?? ""),
        weather_desc: String(c0.weather_desc ?? "Berawan"),
        local_datetime: String(c0.local_datetime ?? ""),
        tmin: Number(c0.tmin ?? 21),
        tmax: Number(c0.tmax ?? 26),
        humin: Number(c0.humin ?? 80),
        humax: Number(c0.humax ?? 96),
        tomorrow_desc: String(c1.weather_desc ?? "Berawan"),
        tomorrow_tmin: Number(c1.tmin ?? 21),
        tomorrow_tmax: Number(c1.tmax ?? 28),
      };
    });
  } catch {
    return fallback;
  }
}

function classifyNewsCategory(title: string): BeritaAcaraCategory {
  const lower = title.toLowerCase();
  if (lower.includes("longsor") || lower.includes("jalan") || lower.includes("jembatan")) {
    return "Longsor & Infrastruktur";
  }
  if (lower.includes("banjir") || lower.includes("genangan") || lower.includes("tanggul")) {
    return "Banjir & Hidrometeorologi";
  }
  if (lower.includes("siaga darurat") || lower.includes("bpbd") || lower.includes("bnpb")) {
    return "Siaga Darurat Bencana";
  }
  return "Cuaca Ekstrem BMKG";
}

function detectJabarRegion(title: string): { region: string; adm2: string } {
  const lower = title.toLowerCase();
  const mapping: Array<{ kw: string; region: string; adm2: string }> = [
    { kw: "bandung barat", region: "Kab. Bandung Barat (32.17)", adm2: "32.17" },
    { kw: "bandung", region: "Bandung Raya (32.73 / 32.04)", adm2: "32.73" },
    { kw: "bogor", region: "Bogor (32.01 / 32.71)", adm2: "32.01" },
    { kw: "sukabumi", region: "Sukabumi (32.02 / 32.72)", adm2: "32.02" },
    { kw: "cianjur", region: "Kab. Cianjur (32.03)", adm2: "32.03" },
    { kw: "garut", region: "Kab. Garut (32.05)", adm2: "32.05" },
    { kw: "tasikmalaya", region: "Tasikmalaya (32.06 / 32.78)", adm2: "32.06" },
    { kw: "ciamis", region: "Kab. Ciamis (32.07)", adm2: "32.07" },
    { kw: "kuningan", region: "Kab. Kuningan (32.08)", adm2: "32.08" },
    { kw: "cirebon", region: "Cirebon (32.09 / 32.74)", adm2: "32.09" },
    { kw: "majalengka", region: "Kab. Majalengka (32.10)", adm2: "32.10" },
    { kw: "sumedang", region: "Kab. Sumedang (32.11)", adm2: "32.11" },
    { kw: "indramayu", region: "Kab. Indramayu (32.12)", adm2: "32.12" },
    { kw: "subang", region: "Kab. Subang (32.13)", adm2: "32.13" },
    { kw: "purwakarta", region: "Kab. Purwakarta (32.14)", adm2: "32.14" },
    { kw: "karawang", region: "Kab. Karawang (32.15)", adm2: "32.15" },
    { kw: "bekasi", region: "Bekasi (32.16 / 32.75)", adm2: "32.16" },
    { kw: "depok", region: "Kota Depok (32.76)", adm2: "32.76" },
    { kw: "cimahi", region: "Kota Cimahi (32.77)", adm2: "32.77" },
    { kw: "banjar", region: "Kota Banjar (32.79)", adm2: "32.79" },
    { kw: "pangandaran", region: "Kab. Pangandaran (32.18)", adm2: "32.18" },
  ];
  for (const m of mapping) {
    if (lower.includes(m.kw)) return { region: m.region, adm2: m.adm2 };
  }
  return { region: "Provinsi Jawa Barat (Kode 32)", adm2: "32.73" };
}

async function fetchLiveBeritaAcaraJabar(): Promise<BeritaAcaraItem[]> {
  try {
    const rssUrl =
      "https://news.google.com/rss/search?q=(cuaca+OR+banjir+OR+longsor+OR+BMKG+OR+BPBD)+%22Jawa+Barat%22&hl=id&gl=ID&ceid=ID:id";
    const res = await fetch(rssUrl, { next: { revalidate: 300 } });
    if (!res.ok) return INITIAL_BERITA_ACARA_JABAR;
    const xml = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const liveItems: BeritaAcaraItem[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = itemRegex.exec(xml)) !== null && idx < 8) {
      const block = match[1];
      const rawTitle = (block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "")
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .trim();
      const link = (block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "").trim();
      const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "").trim();
      const srcMatch = block.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/);
      const sourceDomainUrl = srcMatch?.[1] || "https://www.bmkg.go.id";
      const sourceName = (srcMatch?.[2] || "Portal Berita Nasional").replace(/&amp;/g, "&").trim();

      if (!rawTitle || !link) continue;
      const cleanTitle = rawTitle.includes(" - ")
        ? rawTitle.slice(0, rawTitle.lastIndexOf(" - "))
        : rawTitle;
      const { region, adm2 } = detectJabarRegion(cleanTitle);
      const category = classifyNewsCategory(cleanTitle);
      idx += 1;

      const parsedPub = pubDate ? new Date(pubDate) : new Date();
      const formattedPub = !isNaN(parsedPub.getTime())
        ? new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(parsedPub)
        : new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date());

      liveItems.push({
        id: `ba-live-0${idx}`,
        docNumber: `Laporan #${idx}`,
        category,
        title: cleanTitle,
        summary: `Laporan resmi berita cuaca & kebencanaan Jawa Barat dari ${sourceName}.`,
        region,
        adm2,
        sourceName,
        sourceDomainUrl,
        articleUrl: link,
        publishedAt: formattedPub,
        isLiveFeed: true,
      });
    }

    return liveItems.length >= 4 ? liveItems : INITIAL_BERITA_ACARA_JABAR;
  } catch {
    return INITIAL_BERITA_ACARA_JABAR;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adm2 = searchParams.get("adm2") || "32.73";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const [bmkgMap, kecamatanList, beritaAcara] = await Promise.all([
    fetchLiveBMKGJabar32(),
    fetchLiveBMKGKecamatanByAdm2(adm2),
    fetchLiveBeritaAcaraJabar(),
  ]);

  let realtime: {
    temperature_c?: number;
    feels_like_c?: number;
    humidity_pct?: number;
    wind_speed_kmh?: number;
    pressure_hpa?: number;
    precipitation_mm?: number;
    weather_code?: number;
    condition_label?: string;
    observed_at?: string;
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
    source?: string;
  } | null = null;

  if (lat && lon) {
    try {
      const omWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
        lat
      )}&longitude=${encodeURIComponent(
        lon
      )}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure&timezone=Asia%2FJakarta`;

      const omAirUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${encodeURIComponent(
        lat
      )}&longitude=${encodeURIComponent(
        lon
      )}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index&timezone=Asia%2FJakarta`;

      const [omRes, airRes] = await Promise.all([
        fetch(omWeatherUrl, { next: { revalidate: 180 } }),
        fetch(omAirUrl, { next: { revalidate: 180 } }),
      ]);

      let airData: {
        us_aqi?: number;
        pm25?: number;
        pm10?: number;
        no2?: number;
        o3?: number;
        co?: number;
        so2?: number | null;
        uv_index?: number;
      } = {};

      if (airRes.ok) {
        const airJson = (await airRes.json()) as {
          current?: {
            us_aqi?: number;
            pm2_5?: number;
            pm10?: number;
            nitrogen_dioxide?: number;
            ozone?: number;
            carbon_monoxide?: number;
            sulphur_dioxide?: number | null;
            uv_index?: number;
          };
        };
        if (airJson.current) {
          airData = {
            us_aqi: airJson.current.us_aqi,
            pm25: airJson.current.pm2_5,
            pm10: airJson.current.pm10,
            no2: airJson.current.nitrogen_dioxide,
            o3: airJson.current.ozone,
            co: airJson.current.carbon_monoxide,
            so2: airJson.current.sulphur_dioxide ?? null,
            uv_index: airJson.current.uv_index,
          };
        }
      }

      if (omRes.ok) {
        const omJson = (await omRes.json()) as {
          current?: {
            time?: string;
            temperature_2m?: number;
            apparent_temperature?: number;
            relative_humidity_2m?: number;
            wind_speed_10m?: number;
            surface_pressure?: number;
            precipitation?: number;
            weather_code?: number;
          };
        };
        if (omJson.current && typeof omJson.current.temperature_2m === "number") {
          realtime = {
            temperature_c: omJson.current.temperature_2m,
            feels_like_c: omJson.current.apparent_temperature,
            humidity_pct: omJson.current.relative_humidity_2m,
            wind_speed_kmh: omJson.current.wind_speed_10m,
            pressure_hpa: omJson.current.surface_pressure
              ? Math.round(omJson.current.surface_pressure)
              : undefined,
            precipitation_mm: omJson.current.precipitation,
            weather_code: omJson.current.weather_code,
            condition_label: mapWMOToIndonesian(omJson.current.weather_code),
            observed_at: omJson.current.time,
            aqi: airData,
            source: "BMKG Provinsi 32 + Open-Meteo Telemetry",
          };
        }
      }
    } catch {
      /* fallback to BMKG snapshot values */
    }
  }

  return NextResponse.json({
    province_code: "32",
    province_name: "Jawa Barat",
    source_url: BMKG_PROV_32_URL,
    adm2_url: `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${adm2}`,
    total_regions: Object.keys(bmkgMap).length,
    selected_adm2: bmkgMap[adm2] || null,
    kecamatan_count: kecamatanList.length,
    kecamatan_list: kecamatanList,
    berita_acara: beritaAcara,
    realtime,
    regions: bmkgMap,
  });
}
