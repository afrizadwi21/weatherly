import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
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

let memFallbackDB: WeatherlyDatabaseSchema = getInitialDatabase();
let neonSchemaInitialized = false;

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

function getNeonUrl(): string | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("postgres://") ||
    trimmed.startsWith("postgresql://")
  ) {
    return trimmed;
  }
  return null;
}

async function getNeonClient() {
  const url = getNeonUrl();
  if (!url) return null;
  const sql = neon(url);
  if (!neonSchemaInitialized) {
    await sql`
      CREATE TABLE IF NOT EXISTS weatherly_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS weatherly_locations (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        adm2 VARCHAR(16) NOT NULL,
        adm3 VARCHAR(24),
        name VARCHAR(150) NOT NULL,
        kecamatan_name VARCHAR(150),
        lat DOUBLE PRECISION NOT NULL,
        lon DOUBLE PRECISION NOT NULL,
        alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS weatherly_travel_routes (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        route_name VARCHAR(150) NOT NULL,
        origin_adm2 VARCHAR(16) NOT NULL,
        origin_name VARCHAR(150) NOT NULL,
        mid_adm2 VARCHAR(16),
        mid_name VARCHAR(150),
        dest_adm2 VARCHAR(16) NOT NULL,
        dest_name VARCHAR(150) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS weatherly_community_reports (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        author VARCHAR(150) NOT NULL,
        location_name VARCHAR(200) NOT NULL,
        adm2 VARCHAR(16) NOT NULL,
        report_type VARCHAR(64) NOT NULL,
        description TEXT NOT NULL,
        coords VARCHAR(64) NOT NULL,
        image_url TEXT NOT NULL,
        time_ago VARCHAR(100) NOT NULL,
        report_date VARCHAR(100) NOT NULL,
        verified BOOLEAN NOT NULL DEFAULT FALSE,
        upvotes INTEGER NOT NULL DEFAULT 1,
        voter_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS weatherly_ai_insights (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        location_name VARCHAR(200) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    neonSchemaInitialized = true;
  }
  return sql;
}

function mapLocationRow(row: Record<string, unknown>): DBSavedLocation {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    adm2: String(row.adm2),
    adm3: row.adm3 ? String(row.adm3) : undefined,
    name: String(row.name),
    kecamatanName: row.kecamatan_name ? String(row.kecamatan_name) : undefined,
    lat: Number(row.lat),
    lon: Number(row.lon),
    alertEnabled: Boolean(row.alert_enabled),
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  };
}

function mapRouteRow(row: Record<string, unknown>): DBTravelRoute {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    routeName: String(row.route_name),
    originAdm2: String(row.origin_adm2),
    originName: String(row.origin_name),
    midAdm2: row.mid_adm2 ? String(row.mid_adm2) : undefined,
    midName: row.mid_name ? String(row.mid_name) : undefined,
    destAdm2: String(row.dest_adm2),
    destName: String(row.dest_name),
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  };
}

function mapReportRow(row: Record<string, unknown>): DBCommunityReport {
  const voterIdsRaw = row.voter_ids;
  const voterIds = Array.isArray(voterIdsRaw)
    ? voterIdsRaw.map(String)
    : typeof voterIdsRaw === "string"
    ? (JSON.parse(voterIdsRaw) as string[])
    : [];
  return {
    id: String(row.id),
    userId: String(row.user_id),
    author: String(row.author),
    locationName: String(row.location_name),
    adm2: String(row.adm2),
    reportType: String(row.report_type) as DBCommunityReport["reportType"],
    description: String(row.description),
    coords: String(row.coords),
    imageUrl: String(row.image_url),
    timeAgo: String(row.time_ago),
    reportDate: String(row.report_date),
    verified: Boolean(row.verified),
    upvotes: Number(row.upvotes || 1),
    voterIds,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  };
}

function mapInsightRow(row: Record<string, unknown>): DBSavedAIInsight {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    locationName: String(row.location_name),
    question: String(row.question),
    answer: String(row.answer),
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  };
}

function readLocalDB(): WeatherlyDatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const init = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2), "utf-8");
      memFallbackDB = init;
      return init;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as WeatherlyDatabaseSchema;
    const loaded: WeatherlyDatabaseSchema = {
      users: parsed.users || [],
      locations: parsed.locations || [],
      travel_routes: parsed.travel_routes || [],
      community_reports: parsed.community_reports || [],
      ai_insights: parsed.ai_insights || [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    memFallbackDB = loaded;
    return loaded;
  } catch {
    return memFallbackDB;
  }
}

function writeLocalDB(db: WeatherlyDatabaseSchema) {
  db.updatedAt = new Date().toISOString();
  memFallbackDB = db;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // On read-only serverless file systems without DATABASE_URL, keep in-memory state
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const sql = await getNeonClient();
    if (sql) {
      const [locRows, routeRows, reportRows, insightRows, userCountRows] = await Promise.all([
        userId
          ? sql`SELECT * FROM weatherly_locations WHERE user_id = ${userId} ORDER BY created_at DESC`
          : sql`SELECT * FROM weatherly_locations ORDER BY created_at DESC`,
        userId
          ? sql`SELECT * FROM weatherly_travel_routes WHERE user_id = ${userId} ORDER BY created_at DESC`
          : sql`SELECT * FROM weatherly_travel_routes ORDER BY created_at DESC`,
        sql`SELECT * FROM weatherly_community_reports ORDER BY created_at DESC`,
        userId
          ? sql`SELECT * FROM weatherly_ai_insights WHERE user_id = ${userId} ORDER BY created_at DESC`
          : sql`SELECT * FROM weatherly_ai_insights ORDER BY created_at DESC`,
        sql`SELECT COUNT(*)::int AS cnt FROM weatherly_users`,
      ]);

      const locations = locRows.map((r) => mapLocationRow(r as Record<string, unknown>));
      const travel_routes = routeRows.map((r) => mapRouteRow(r as Record<string, unknown>));
      const community_reports = reportRows.map((r) => mapReportRow(r as Record<string, unknown>));
      const ai_insights = insightRows.map((r) => mapInsightRow(r as Record<string, unknown>));
      const usersCount = Number((userCountRows[0] as Record<string, unknown>)?.cnt || 0);

      return NextResponse.json({
        engine: "Neon Serverless PostgreSQL (@neondatabase/serverless)",
        updatedAt: new Date().toISOString(),
        audit: {
          users_count: usersCount,
          locations_count: locations.length,
          travel_routes_count: travel_routes.length,
          community_reports_count: community_reports.length,
          ai_insights_count: ai_insights.length,
        },
        locations,
        travel_routes,
        community_reports,
        ai_insights,
      });
    }
  } catch (err) {
    console.error("[Weatherly Neon DB GET Error]:", err);
  }

  const db = readLocalDB();
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
    engine: "Weatherly Local Database (Set DATABASE_URL for Neon PostgreSQL)",
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
    const sql = await getNeonClient();

    // =========================================================================
    // NEON SERVERLESS POSTGRESQL BRANCH (WHEN DATABASE_URL IS CONFIGURED)
    // =========================================================================
    if (sql) {
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

        const existing = await sql`SELECT id FROM weatherly_users WHERE email = ${email} LIMIT 1`;
        if (existing.length > 0) {
          return NextResponse.json(
            { error: "Email tersebut sudah terdaftar. Silakan gunakan menu Masuk." },
            { status: 409 }
          );
        }

        const newId = `usr-${Date.now()}`;
        const pwHash = hashPassword(password);
        await sql`
          INSERT INTO weatherly_users (id, email, password_hash, full_name)
          VALUES (${newId}, ${email}, ${pwHash}, ${fullName})
        `;

        return NextResponse.json({
          user: { id: newId, email, name: fullName },
          locations: [],
          travel_routes: [],
          ai_insights: [],
        });
      }

      // 2. LOGIN EXISTING USER
      if (action === "login") {
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const pwHash = hashPassword(password);

        const rows = await sql`
          SELECT id, email, password_hash, full_name
          FROM weatherly_users
          WHERE email = ${email}
          LIMIT 1
        `;
        const found = rows[0] as Record<string, unknown> | undefined;
        if (!found || String(found.password_hash) !== pwHash) {
          return NextResponse.json(
            {
              error:
                "Email atau kata sandi tidak cocok. Silakan daftar akun baru jika belum memiliki akun.",
            },
            { status: 401 }
          );
        }

        const uid = String(found.id);
        const [locRows, routeRows, insightRows] = await Promise.all([
          sql`SELECT * FROM weatherly_locations WHERE user_id = ${uid} ORDER BY created_at DESC`,
          sql`SELECT * FROM weatherly_travel_routes WHERE user_id = ${uid} ORDER BY created_at DESC`,
          sql`SELECT * FROM weatherly_ai_insights WHERE user_id = ${uid} ORDER BY created_at DESC`,
        ]);

        return NextResponse.json({
          user: {
            id: uid,
            email: String(found.email),
            name: String(found.full_name),
          },
          locations: locRows.map((r) => mapLocationRow(r as Record<string, unknown>)),
          travel_routes: routeRows.map((r) => mapRouteRow(r as Record<string, unknown>)),
          ai_insights: insightRows.map((r) => mapInsightRow(r as Record<string, unknown>)),
        });
      }

      // 3. TOGGLE / SAVE FAVORITE LOCATION FOR REAL-TIME RAIN ALERTS
      if (action === "toggle_location") {
        const userId = String(body.userId || "");
        const adm2 = String(body.adm2 || "");
        const adm3 = body.adm3 ? String(body.adm3) : null;
        const name = String(body.name || "");
        const kecamatanName = body.kecamatanName ? String(body.kecamatanName) : null;
        const lat = Number(body.lat || -6.9175);
        const lon = Number(body.lon || 107.6191);

        if (!userId || !adm2) {
          return NextResponse.json({ error: "userId dan adm2 wajib diisi" }, { status: 400 });
        }

        const existing = await sql`
          SELECT id FROM weatherly_locations
          WHERE user_id = ${userId}
            AND adm2 = ${adm2}
            AND COALESCE(adm3, '') = COALESCE(${adm3}, '')
          LIMIT 1
        `;

        if (existing.length > 0) {
          const delId = String((existing[0] as Record<string, unknown>).id);
          await sql`DELETE FROM weatherly_locations WHERE id = ${delId}`;
        } else {
          const newId = `loc-${Date.now()}`;
          await sql`
            INSERT INTO weatherly_locations (id, user_id, adm2, adm3, name, kecamatan_name, lat, lon, alert_enabled)
            VALUES (${newId}, ${userId}, ${adm2}, ${adm3}, ${name}, ${kecamatanName}, ${lat}, ${lon}, true)
          `;
        }

        const locRows = await sql`
          SELECT * FROM weatherly_locations WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return NextResponse.json({
          locations: locRows.map((r) => mapLocationRow(r as Record<string, unknown>)),
        });
      }

      // 4. ADD USER-DEFINED SMART TRAVEL ROUTE
      if (action === "add_route") {
        const userId = String(body.userId || "guest");
        const originAdm2 = String(body.originAdm2 || "");
        const originName = String(body.originName || "");
        const midAdm2 = body.midAdm2 ? String(body.midAdm2) : null;
        const midName = body.midName ? String(body.midName) : null;
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
        const newId = `route-${Date.now()}`;

        await sql`
          INSERT INTO weatherly_travel_routes (
            id, user_id, route_name, origin_adm2, origin_name, mid_adm2, mid_name, dest_adm2, dest_name
          ) VALUES (
            ${newId}, ${userId}, ${routeName}, ${originAdm2}, ${originName}, ${midAdm2}, ${midName}, ${destAdm2}, ${destName}
          )
        `;

        const routeRows = await sql`
          SELECT * FROM weatherly_travel_routes WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        const mapped = routeRows.map((r) => mapRouteRow(r as Record<string, unknown>));
        return NextResponse.json({
          route: mapped.find((r) => r.id === newId) || mapped[0],
          travel_routes: mapped,
        });
      }

      // 5. DELETE USER SMART TRAVEL ROUTE
      if (action === "delete_route") {
        const userId = String(body.userId || "guest");
        const routeId = String(body.routeId || "");
        await sql`
          DELETE FROM weatherly_travel_routes WHERE id = ${routeId} AND user_id = ${userId}
        `;
        const routeRows = await sql`
          SELECT * FROM weatherly_travel_routes WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return NextResponse.json({
          travel_routes: routeRows.map((r) => mapRouteRow(r as Record<string, unknown>)),
        });
      }

      // 6. CREATE COMMUNITY REPORT (MANDATORY PHOTO PROOF!)
      if (action === "add_community_report") {
        const userId = String(body.userId || "");
        const author = String(body.author || "Warga Terdaftar");
        const locationName = String(body.locationName || "");
        const adm2 = String(body.adm2 || "32.73");
        const reportType = String(body.reportType || "Hujan Lokal") as DBCommunityReport["reportType"];
        const description = String(body.description || "").trim();
        const coords = String(body.coords || "");
        const imageUrl = String(body.imageUrl || "").trim();

        if (!userId) {
          return NextResponse.json(
            { error: "Silakan masuk terlebih dahulu untuk mengirim laporan komunitas." },
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
        const formattedReportDate =
          new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(now) + " WIB";
        const newId = `comm-${Date.now()}`;
        const initialVoters = JSON.stringify([userId]);

        await sql`
          INSERT INTO weatherly_community_reports (
            id, user_id, author, location_name, adm2, report_type, description,
            coords, image_url, time_ago, report_date, verified, upvotes, voter_ids
          ) VALUES (
            ${newId}, ${userId}, ${author}, ${locationName}, ${adm2}, ${reportType}, ${description},
            ${coords}, ${imageUrl}, ${formattedReportDate}, ${formattedReportDate}, false, 1, ${initialVoters}::jsonb
          )
        `;

        const reportRows = await sql`
          SELECT * FROM weatherly_community_reports ORDER BY created_at DESC
        `;
        const mapped = reportRows.map((r) => mapReportRow(r as Record<string, unknown>));
        return NextResponse.json({
          report: mapped.find((r) => r.id === newId) || mapped[0],
          community_reports: mapped,
        });
      }

      // 7. VOTE COMMUNITY REPORT (UNIQUE(report_id, user_id))
      if (action === "vote_community_report") {
        const userId = String(body.userId || "");
        const reportId = String(body.reportId || "");
        const rows = await sql`
          SELECT * FROM weatherly_community_reports WHERE id = ${reportId} LIMIT 1
        `;
        if (rows.length === 0 || !userId) {
          return NextResponse.json(
            { error: "Laporan atau pengguna tidak ditemukan." },
            { status: 404 }
          );
        }
        const rep = mapReportRow(rows[0] as Record<string, unknown>);
        if (!rep.voterIds.includes(userId)) {
          const nextVoters = [...rep.voterIds, userId];
          const nextUpvotes = rep.upvotes + 1;
          const nextVerified = nextUpvotes >= 5;
          await sql`
            UPDATE weatherly_community_reports
            SET upvotes = ${nextUpvotes},
                verified = ${nextVerified},
                voter_ids = ${JSON.stringify(nextVoters)}::jsonb
            WHERE id = ${reportId}
          `;
        }
        const reportRows = await sql`
          SELECT * FROM weatherly_community_reports ORDER BY created_at DESC
        `;
        return NextResponse.json({
          community_reports: reportRows.map((r) => mapReportRow(r as Record<string, unknown>)),
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
        const newId = `ai-${Date.now()}`;
        await sql`
          INSERT INTO weatherly_ai_insights (id, user_id, location_name, question, answer)
          VALUES (${newId}, ${userId}, ${locationName}, ${question}, ${answer})
        `;
        const insightRows = await sql`
          SELECT * FROM weatherly_ai_insights WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return NextResponse.json({
          ai_insights: insightRows.map((r) => mapInsightRow(r as Record<string, unknown>)),
        });
      }

      return NextResponse.json({ error: "Action tidak dikenali" }, { status: 400 });
    }

    // =========================================================================
    // LOCAL DEVELOPMENT FALLBACK BRANCH (WHEN DATABASE_URL IS NOT SET)
    // =========================================================================
    const db = readLocalDB();

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
          { error: "Email tersebut sudah terdaftar. Silakan gunakan menu Masuk." },
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
      writeLocalDB(db);

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
      writeLocalDB(db);
      return NextResponse.json({
        locations: db.locations.filter((l) => l.userId === userId),
      });
    }

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
      writeLocalDB(db);

      return NextResponse.json({
        route: newRoute,
        travel_routes: db.travel_routes.filter((r) => r.userId === userId),
      });
    }

    if (action === "delete_route") {
      const userId = String(body.userId || "guest");
      const routeId = String(body.routeId || "");
      db.travel_routes = db.travel_routes.filter(
        (r) => !(r.id === routeId && r.userId === userId)
      );
      writeLocalDB(db);
      return NextResponse.json({
        travel_routes: db.travel_routes.filter((r) => r.userId === userId),
      });
    }

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
          { error: "Silakan masuk terlebih dahulu untuk mengirim laporan komunitas." },
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
      const formattedReportDate =
        new Intl.DateTimeFormat("id-ID", {
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
      writeLocalDB(db);

      return NextResponse.json({
        report: newReport,
        community_reports: db.community_reports,
      });
    }

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
        writeLocalDB(db);
      }
      return NextResponse.json({
        community_reports: db.community_reports,
      });
    }

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
      writeLocalDB(db);
      return NextResponse.json({
        ai_insights: db.ai_insights.filter((a) => a.userId === userId),
      });
    }

    return NextResponse.json({ error: "Action tidak dikenali" }, { status: 400 });
  } catch (err) {
    console.error("[Weatherly DB POST Error]:", err);
    return NextResponse.json({ error: "Gagal memproses operasi database" }, { status: 500 });
  }
}
