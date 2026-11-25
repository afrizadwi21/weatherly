import { NextRequest, NextResponse } from "next/server";

export interface AIInsightSnapshotInput {
  adm2: string;
  adm3?: string;
  locationName: string;
  kecamatanName?: string;
  actualCondition?: string;
  bmkgStatus: string;
  tomorrowStatus?: string;
  sebentarLagiHujan?: boolean;
  temperatureC: number;
  tminC: number;
  tmaxC: number;
  humidityPct: number;
  huminPct: number;
  humaxPct: number;
  windSpeedKmh: number;
  uvIndex: number;
  aqiIndex: number;
  pm25: number;
  so2: number | null;
  question?: string;
}

const WEATHER_DOMAIN_REFUSAL =
  "Maaf, saya hanya dapat menjawab pertanyaan yang berkaitan dengan cuaca, prakiraan harian BMKG, kualitas udara (AQI), indeks UV, banjir/bencana hidrometeorologi, dan kesiapan perjalanan terhadap cuaca di Jawa Barat.";

function validateWeatherDomainQuestion(question?: string): {
  allowed: boolean;
  reason?: string;
} {
  if (!question || !question.trim()) {
    return { allowed: true };
  }

  const q = question.trim().toLowerCase();

  const offTopicPatterns: RegExp[] = [
    /\b(presiden|wapres|menteri|gubernur|bupati|walikota|politik|pemilu|pilkada|dpr|partai)\b/i,
    /\b(siapa\s+nama|siapa\s+presiden|ibu\s*kota\s+negara|tahun\s+berapa\s+merdeka)\b/i,
    /\b(resep\s+masak|cara\s+memasak|kunci\s+gitar|lirik\s+lagu|film|artis|selebriti|sepak\s*bola|skor\s+pertandingan)\b/i,
    /\b(coding|javascript|python|golang|html|css|sql|algoritma|rumus\s+matematika|hitunglah)\b/i,
    /\b(harga\s+saham|bitcoin|kripto|crypto|kurs\s+dollar|pinjol|judol)\b/i,
  ];

  const weatherKeywords: RegExp =
    /\b(cuaca|hujan|gerimis|badai|petir|kilat|angin|awan|mendung|cerah|berawan|panas|dingin|suhu|temperatur|kelembapan|embun|tekanan|barometrik|jarak\s*pandang|kabut|prakiraan|prediksi|bmkg|radar|presipitasi|banjir|genangan|longsor|bencana|hidrometeorologi|sungai|citarum|drainase|udara|aqi|polusi|polutan|pm2\.?5|pm10|so2|no2|co|ozon|o3|asap|masker|uv|matahari|sunscreen|spf|kulit|jalan|rute|berkendara|motor|mobil|komuter|jas\s*hujan|payung|berangkat|pulang|olahraga|lari|jemur|aktivitas|luar\s*ruang|siaga|waspada|peringatan|bandung|bogor|bekasi|depok|cimahi|garut|tasik|ciamis|cirebon|kuningan|majalengka|sumedang|indramayu|subang|purwakarta|karawang|sukabumi|cianjur|pangandaran|banjar|jabar|jawa\s*barat|kecamatan|lokasi|hari\s*ini|besok|lusa|minggu|sore|pagi|siang|malam|aman|baik|bagaimana)\b/i;

  const hitsOffTopic = offTopicPatterns.some((rx) => rx.test(q));
  const hitsWeather = weatherKeywords.test(q);

  if (hitsOffTopic && !hitsWeather) {
    return { allowed: false, reason: "OFF_TOPIC_BLOCKED" };
  }
  if (!hitsWeather) {
    return { allowed: false, reason: "OUTSIDE_WEATHER_SCOPE" };
  }
  return { allowed: true };
}

function runStage1RuleEngine(s: AIInsightSnapshotInput) {
  const actualNow = s.actualCondition || s.bmkgStatus;
  const tomorrow = s.tomorrowStatus || s.bmkgStatus;
  const isRainTodayOrTomorrow =
    s.bmkgStatus.toLowerCase().includes("hujan") ||
    tomorrow.toLowerCase().includes("hujan");

  const rules: string[] = [
    `OBSERVASI AKTUAL SAAT INI: Cuaca saat ini tercatat ${actualNow} dengan suhu ${s.temperatureC.toFixed(
      1
    )}°C, kelembapan aktual ${s.humidityPct}%, dan angin ${s.windSpeedKmh} km/jam.`,
    `PREDIKSI HARIAN BMKG: Prakiraan BMKG untuk Hari Ini adalah ${s.bmkgStatus} (rentang suhu ${s.tminC}–${s.tmaxC}°C, kelembapan ${s.huminPct}–${s.humaxPct}%), sedangkan prakiraan Besok adalah ${tomorrow}.`,
    `KUALITAS UDARA & UV REAL-TIME: AQI ${s.aqiIndex} (PM2.5 ${s.pm25} µg/m³, SO2 ${
      s.so2 !== null ? `${s.so2} µg/m³` : "NULL"
    }) dan Indeks UV ${s.uvIndex}.`,
  ];

  return {
    validatedAt: new Date().toISOString(),
    locationLabel: s.kecamatanName
      ? `Kec. ${s.kecamatanName}, ${s.locationName}`
      : s.locationName,
    admCode: s.adm3 || s.adm2,
    actualNow,
    tomorrow,
    isRainTodayOrTomorrow,
    rules,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AIInsightSnapshotInput;
    const stage1 = runStage1RuleEngine(body);
    const userQuestion =
      body.question?.trim() ||
      `Bagaimana kondisi cuaca saat ini dan prediksi Hari Ini serta Besok di ${stage1.locationLabel}?`;

    const domainCheck = validateWeatherDomainQuestion(body.question);
    if (!domainCheck.allowed) {
      return NextResponse.json({
        liveAI: false,
        rejectedOffTopic: true,
        stage1,
        question: userQuestion,
        answer: WEATHER_DOMAIN_REFUSAL,
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const systemPrompt = `Anda adalah Asisten Analisis Cuaca Weatherly untuk Jawa Barat.
ATURAN WAJIB:
1. GUNAKAN SATUAN HARI (HARI INI & BESOK), JANGAN GUNAKAN MENIT:
   - Kalimat Pertama WAJIB menyebutkan kondisi cuaca aktual SAAT INI terlebih dahulu (contoh: "Saat ini cuaca di ${stage1.locationLabel} masih ${stage1.actualNow} dengan suhu ${body.temperatureC.toFixed(1)}°C dan kelembapan ${body.humidityPct}%.").
   - Kalimat Kedua WAJIB menyebutkan PREDIKSI HARIAN BMKG (Hari Ini dan Besok), BUKAN menit (contoh: "Untuk prediksi Hari Ini menurut BMKG adalah ${body.bmkgStatus} dengan suhu ${body.tminC}–${body.tmaxC}°C (kelembapan ${body.huminPct}–${body.humaxPct}%), dan prediksi Besok adalah ${stage1.tomorrow}.").
   - Kalimat Ketiga berikan rekomendasi aktivitas berdasarkan prakiraan harian tersebut serta data AQI (${body.aqiIndex}) dan UV (${body.uvIndex}).
2. DILARANG KERAS mengarang angka menit (jangan pernah menulis "18 menit", "29 menit", atau "50 menit"). Semua prediksi wajib dalam satuan Hari (Hari Ini, Besok, atau Pekan Ini) sesuai data BMKG.
3. PEMBATASAN TOPIK KETAT: Hanya jawab pertanyaan terkait cuaca, hujan, suhu, udara (AQI), UV, banjir/bencana, atau kesiapan aktivitas/perjalanan terhadap cuaca. Jika di luar cuaca, jawab persis: "${WEATHER_DOMAIN_REFUSAL}"

DATA REAL-TIME TERVALIDASI:
${JSON.stringify(body)}
${stage1.rules.join("\n")}`;

    if (geminiKey) {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const gemUrl = geminiKey.startsWith("AQ.")
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
            geminiKey
          )}`;

      const gemRes = await fetch(gemUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nPERTANYAAN PENGGUNA: ${userQuestion}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      });

      if (gemRes.ok) {
        const gemJson = (await gemRes.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const aiText = gemJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText) {
          return NextResponse.json({
            liveAI: true,
            rejectedOffTopic: false,
            stage1,
            question: userQuestion,
            answer: aiText,
          });
        }
      }
    }

    const fallbackAnswer = `Saat ini cuaca aktual di ${stage1.locationLabel} tercatat ${stage1.actualNow} dengan suhu ${body.temperatureC.toFixed(
      1
    )}°C dan kelembapan ${body.humidityPct}%. Berdasarkan prakiraan harian resmi BMKG, prediksi cuaca Hari Ini adalah ${
      body.bmkgStatus
    } (suhu ${body.tminC}–${body.tmaxC}°C, kelembapan ${body.huminPct}–${
      body.humaxPct
    }%) dan prediksi Besok adalah ${stage1.tomorrow}. Kualitas udara saat ini berada pada AQI ${
      body.aqiIndex
    } (PM2.5 ${body.pm25} µg/m³) dengan indeks UV ${body.uvIndex}.`;

    return NextResponse.json({
      liveAI: true,
      rejectedOffTopic: false,
      stage1,
      question: userQuestion,
      answer: fallbackAnswer,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses analisis cuaca" },
      { status: 500 }
    );
  }
}
