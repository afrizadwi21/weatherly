import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface DBUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  createdAt: string;
}

export interface DBSavedLocation {
  id: string;
  userId: string;
  adm2: string;
  adm3?: string;
  name: string;
  kecamatanName?: string;
  lat: number;
  lon: number;
  alertEnabled: boolean;
  createdAt: string;
}

export interface DBTravelRoute {
  id: string;
  userId: string;
  routeName: string;
  originAdm2: string;
  originName: string;
  midAdm2?: string;
  midName?: string;
  destAdm2: string;
  destName: string;
  createdAt: string;
}

export interface DBCommunityReport {
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
  reportDate: string;
  verified: boolean;
  upvotes: number;
  voterIds: string[];
  createdAt: string;
}

export interface DBSavedAIInsight {
  id: string;
  userId: string;
  locationName: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface WeatherlyDatabaseSchema {
  users: DBUser[];
  locations: DBSavedLocation[];
  travel_routes: DBTravelRoute[];
  community_reports: DBCommunityReport[];
  ai_insights: DBSavedAIInsight[];
  updatedAt: string;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "weatherly_db.json");

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(`weatherly_salt_${pw}`).digest("hex");
}

function getInitialDatabase(): WeatherlyDatabaseSchema {
  return {
    users: [],
    locations: [],
    travel_routes: [],
    community_reports: [],
    ai_insights: [],
    updatedAt: new Date().toISOString(),
  };
}

function readDB(): WeatherlyDatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const init = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2), "utf-8");
      return init;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as WeatherlyDatabaseSchema;
    return {
      users: parsed.users || [],
      locations: parsed.locations || [],
      travel_routes: parsed.travel_routes || [],
      community_reports: parsed.community_reports || [],
      ai_insights: parsed.ai_insights || [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return getInitialDatabase();
  }
}

function writeDB(db: WeatherlyDatabaseSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const db = readDB();

  const userLocations = userId
    ? db.locations.filter((l) => l.userId === userId)
    : db.locations;
  const userRoutes = userId
    ? db.travel_routes.filter((r) => r.userId === userId)
    : db.travel_routes;
  const userInsights = userId
    ? db.ai_insights.filter((a) => a.userId === userId)
    : db.ai_insights;

  return NextResponse.json({
    engine: "Weatherly Persistent Disk Database (data/weatherly_db.json + PostGIS Schema Aligned)",
    dbPath: "apps/web/data/weatherly_db.json",
    updatedAt: db.updatedAt,
    audit: {
      users_count: db.users.length,
      locations_count: db.locations.length,
      travel_routes_count: db.travel_routes.length,
      community_reports_count: db.community_reports.length,
      ai_insights_count: db.ai_insights.length,
    },
    locations: userLocations,
    travel_routes: userRoutes,
    community_reports: db.community_reports,
    ai_insights: userInsights,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;
    const db = readDB();

    // 1. REGISTER NEW USER
    if (action === "register") {
      const email = String(body.email || "").trim().toLowerCase();
      const fullName = String(body.fullName || "").trim();
      const password = String(body.password || "");

      if (!email.includes("@") || fullName.length < 2) {
        return NextResponse.json(
          { error: "Nama lengkap dan alamat email yang valid wajib diisi." },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi minimal 6 karakter." },
          { status: 400 }
        );
      }
      if (db.users.some((u) => u.email === email)) {
        return NextResponse.json(
          { error: "Email tersebut sudah terdaftar. Silakan gunakan menu Masuk (Login)." },
          { status: 409 }
        );
      }

      const newUser: DBUser = {
        id: `usr-${Date.now()}`,
        email,
        passwordHash: hashPassword(password),
        fullName,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      writeDB(db);

      return NextResponse.json({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.fullName,
        },
        locations: [],
        travel_routes: [],
        ai_insights: [],
      });
    }

    // 2. LOGIN EXISTING USER
    if (action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const found = db.users.find((u) => u.email === email);

      if (!found || found.passwordHash !== hashPassword(password)) {
        return NextResponse.json(
          { error: "Email atau kata sandi tidak cocok. Silakan daftar akun baru jika belum memiliki akun." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: {
          id: found.id,
          email: found.email,
          name: found.fullName,
        },
        locations: db.locations.filter((l) => l.userId === found.id),
        travel_routes: db.travel_routes.filter((r) => r.userId === found.id),
        ai_insights: db.ai_insights.filter((a) => a.userId === found.id),
      });
    }

    // 3. TOGGLE / SAVE FAVORITE LOCATION FOR REAL-TIME RAIN ALERTS
    if (action === "toggle_location") {
      const userId = String(body.userId || "");
      const adm2 = String(body.adm2 || "");
      const adm3 = body.adm3 ? String(body.adm3) : undefined;
      const name = String(body.name || "");
      const kecamatanName = body.kecamatanName ? String(body.kecamatanName) : undefined;
      const lat = Number(body.lat || -6.9175);
      const lon = Number(body.lon || 107.6191);

      if (!userId || !adm2) {
        return NextResponse.json({ error: "userId dan adm2 wajib diisi" }, { status: 400 });
      }

      const matchIdx = db.locations.findIndex(
        (l) => l.userId === userId && l.adm2 === adm2 && (l.adm3 || "") === (adm3 || "")
      );

      if (matchIdx >= 0) {
        db.locations.splice(matchIdx, 1);
      } else {
        db.locations.push({
          id: `loc-${Date.now()}`,
          userId,
          adm2,
          adm3,
          name,
          kecamatanName,
          lat,
          lon,
          alertEnabled: true,
          createdAt: new Date().toISOString(),
        });
      }
      writeDB(db);
      return NextResponse.json({
        locations: db.locations.filter((l) => l.userId === userId),
      });
    }

    // 4. ADD USER-DEFINED SMART TRAVEL ROUTE
    if (action === "add_route") {
      const userId = String(body.userId || "guest");
      const originAdm2 = String(body.originAdm2 || "");
      const originName = String(body.originName || "");
      const midAdm2 = body.midAdm2 ? String(body.midAdm2) : undefined;
      const midName = body.midName ? String(body.midName) : undefined;
      const destAdm2 = String(body.destAdm2 || "");
      const destName = String(body.destName || "");
      const customName = String(body.routeName || "").trim();

      if (!originAdm2 || !destAdm2) {
        return NextResponse.json(
          { error: "Titik asal dan titik tujuan wajib dipilih." },
          { status: 400 }
        );
      }

      const routeName =
        customName ||
        (midName ? `${originName} → ${midName} → ${destName}` : `${originName} → ${destName}`);

      const newRoute: DBTravelRoute = {
        id: `route-${Date.now()}`,
        userId,
        routeName,
        originAdm2,
        originName,
        midAdm2,
        midName,
        destAdm2,
        destName,
        createdAt: new Date().toISOString(),
      };
      db.travel_routes.push(newRoute);
      writeDB(db);

      return NextResponse.json({
        route: newRoute,
        travel_routes: db.travel_routes.filter((r) => r.userId === userId),
      });
    }

    // 5. DELETE USER SMART TRAVEL ROUTE
    if (action === "delete_route") {
      const userId = String(body.userId || "guest");
      const routeId = String(body.routeId || "");
      db.travel_routes = db.travel_routes.filter(
        (r) => !(r.id === routeId && r.userId === userId)
      );
      writeDB(db);
      return NextResponse.json({
        travel_routes: db.travel_routes.filter((r) => r.userId === userId),
      });
    }

    // 6. CREATE COMMUNITY REPORT (MANDATORY PHOTO PROOF!)
    if (action === "add_community_report") {
      const userId = String(body.userId || "");
      const author = String(body.author || "Warga Terdaftar");
      const locationName = String(body.locationName || "");
      const adm2 = String(body.adm2 || "32.73");
      const reportType = body.reportType as DBCommunityReport["reportType"];
      const description = String(body.description || "").trim();
      const coords = String(body.coords || "");
      const imageUrl = String(body.imageUrl || "").trim();

      if (!userId) {
        return NextResponse.json(
          { error: "Silakan masuk (login) terlebih dahulu untuk mengirim laporan komunitas." },
          { status: 401 }
        );
      }
      if (!description) {
        return NextResponse.json(
          { error: "Deskripsi kondisi cuaca/lapangan wajib diisi." },
          { status: 400 }
        );
      }
      if (!imageUrl || !imageUrl.startsWith("data:image/")) {
        return NextResponse.json(
          {
            error:
              "Wajib menyertakan foto bukti kondisi cuaca/lapangan agar laporan valid dan tidak mengada-ada.",
          },
          { status: 400 }
        );
      }

      const now = new Date();
      const formattedReportDate = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(now) + " WIB";

      const newReport: DBCommunityReport = {
        id: `comm-${Date.now()}`,
        userId,
        author,
        locationName,
        adm2,
        reportType,
        description,
        coords,
        imageUrl,
        timeAgo: formattedReportDate,
        reportDate: formattedReportDate,
        verified: false,
        upvotes: 1,
        voterIds: [userId],
        createdAt: now.toISOString(),
      };
      db.community_reports.unshift(newReport);
      writeDB(db);

      return NextResponse.json({
        report: newReport,
        community_reports: db.community_reports,
      });
    }

    // 7. VOTE COMMUNITY REPORT (UNIQUE(report_id, user_id))
    if (action === "vote_community_report") {
      const userId = String(body.userId || "");
      const reportId = String(body.reportId || "");
      const rep = db.community_reports.find((r) => r.id === reportId);
      if (!rep || !userId) {
        return NextResponse.json({ error: "Laporan atau pengguna tidak ditemukan." }, { status: 404 });
      }
      if (!rep.voterIds.includes(userId)) {
        rep.voterIds.push(userId);
        rep.upvotes += 1;
        rep.verified = rep.upvotes >= 5;
        writeDB(db);
      }
      return NextResponse.json({
        community_reports: db.community_reports,
      });
    }

    // 8. SAVE AI INSIGHT TO DATABASE
    if (action === "save_ai_insight") {
      const userId = String(body.userId || "");
      const locationName = String(body.locationName || "");
      const question = String(body.question || "");
      const answer = String(body.answer || "");
      if (!userId || !question) {
        return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
      }
      db.ai_insights.unshift({
        id: `ai-${Date.now()}`,
        userId,
        locationName,
        question,
        answer,
        createdAt: new Date().toISOString(),
      });
      writeDB(db);
      return NextResponse.json({
        ai_insights: db.ai_insights.filter((a) => a.userId === userId),
      });
    }

    return NextResponse.json({ error: "Action tidak dikenali" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Gagal memproses operasi database" }, { status: 500 });
  }
}
