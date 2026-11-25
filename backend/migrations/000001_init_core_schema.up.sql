-- Enable UUID and PostGIS Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Locations Table (Saved Locations for Real-Time Web Weather Alerts)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    region_code VARCHAR(50),
    coordinates GEOGRAPHY(Point, 4326) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST(coordinates);

-- 3. Weather Observations Table (Actual Observed Conditions)
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    temperature_c DOUBLE PRECISION NOT NULL,
    humidity_pct DOUBLE PRECISION,
    wind_speed_kmh DOUBLE PRECISION,
    precipitation_mm DOUBLE PRECISION,
    condition_code VARCHAR(64) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weather_obs_loc_time ON weather_observations(location_id, observed_at DESC);

-- 4. Weather Forecasts Table (Daily & Multi-Day BMKG Predictions)
CREATE TABLE IF NOT EXISTS weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    granularity VARCHAR(32) NOT NULL,
    temp_c DOUBLE PRECISION,
    rain_probability DOUBLE PRECISION,
    precipitation_mm DOUBLE PRECISION,
    condition_code VARCHAR(64),
    provider VARCHAR(50) NOT NULL,
    target_time TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weather_fc_loc_target ON weather_forecasts(location_id, granularity, target_time);

-- 5. Weather Alerts Table (Web Real-Time Weather Alerts with Deduplication Key)
CREATE TABLE IF NOT EXISTS weather_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    alert_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    dedup_key VARCHAR(190) NOT NULL UNIQUE,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_loc_exp ON weather_alerts(location_id, expires_at DESC);
