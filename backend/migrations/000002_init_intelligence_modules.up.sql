-- 8. Air Quality Observations (Nullable pollutant fields when provider omits data)
CREATE TABLE IF NOT EXISTS air_quality_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    aqi INTEGER,
    pm25 DOUBLE PRECISION,
    pm10 DOUBLE PRECISION,
    no2 DOUBLE PRECISION,
    o3 DOUBLE PRECISION,
    co DOUBLE PRECISION,
    so2 DOUBLE PRECISION,
    provider VARCHAR(50) NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aqi_obs_loc_time ON air_quality_observations(location_id, observed_at DESC);

-- 9. UV Observations
CREATE TABLE IF NOT EXISTS uv_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    uv_index DOUBLE PRECISION NOT NULL,
    uv_category VARCHAR(32) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uv_obs_loc_time ON uv_observations(location_id, observed_at DESC);

-- 10. Flood Reports (Explicit source_type: official, community, estimated_risk)
CREATE TABLE IF NOT EXISTS flood_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    source VARCHAR(100) NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    flood_level VARCHAR(32) NOT NULL,
    description TEXT,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Community Reports & 12. Community Report Votes
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    image_url TEXT,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_report_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES community_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (report_id, user_id)
);

-- 13. Travel Routes & 14. Route Weather Checks
CREATE TABLE IF NOT EXISTS travel_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_name VARCHAR(150) NOT NULL,
    origin_lat NUMERIC(9, 6) NOT NULL,
    origin_lon NUMERIC(9, 6) NOT NULL,
    destination_lat NUMERIC(9, 6) NOT NULL,
    destination_lon NUMERIC(9, 6) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_weather_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES travel_routes(id) ON DELETE CASCADE,
    weather_condition VARCHAR(64) NOT NULL,
    rain_probability DOUBLE PRECISION,
    estimated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AI Insights (Structured input_snapshot & recommendation JSONB)
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    input_snapshot JSONB NOT NULL,
    analysis_result TEXT NOT NULL,
    recommendation JSONB NOT NULL,
    model_name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
