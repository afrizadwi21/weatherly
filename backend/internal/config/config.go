package config

import (
	"os"
	"strconv"
)

// Config holds the runtime configuration for the Weatherly Golang backend.
type Config struct {
	AppName               string
	AppEnv                string
	AppPort               string
	AppTimezone           string
	DatabaseURL           string
	RedisAddr             string
	JWTSecretKey          string
	JWTAccessExpiryMins   int
	JWTRefreshExpiryHours int
	DefaultRegionName     string
	DefaultLatitude       float64
	DefaultLongitude      float64
	BMKGBaseURL           string
	OpenMeteoBaseURL      string
	OpenWeatherAPIKey     string
}

// Load reads configuration from environment variables with safe development defaults.
func Load() *Config {
	return &Config{
		AppName:               getEnv("APP_NAME", "weatherly-platform"),
		AppEnv:                getEnv("APP_ENV", "development"),
		AppPort:               getEnv("APP_PORT", "8080"),
		AppTimezone:           getEnv("APP_TIMEZONE", "Asia/Jakarta"),
		DatabaseURL:           getEnv("DATABASE_URL", "postgres://weatherly:weatherly_secret_password@localhost:5432/weatherly_db?sslmode=disable"),
		RedisAddr:             getEnv("REDIS_ADDR", "localhost:6379"),
		JWTSecretKey:          getEnv("JWT_SECRET_KEY", "dev-secret-key-change-in-production"),
		JWTAccessExpiryMins:   getEnvInt("JWT_ACCESS_EXPIRY_MINUTES", 30),
		JWTRefreshExpiryHours: getEnvInt("JWT_REFRESH_EXPIRY_HOURS", 168),
		DefaultRegionName:     getEnv("DEFAULT_REGION_NAME", "Bandung"),
		DefaultLatitude:       getEnvFloat("DEFAULT_LATITUDE", -6.9175),
		DefaultLongitude:      getEnvFloat("DEFAULT_LONGITUDE", 107.6191),
		BMKGBaseURL:           getEnv("BMKG_BASE_URL", "https://api.bmkg.go.id/publik"),
		OpenMeteoBaseURL:      getEnv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1"),
		OpenWeatherAPIKey:     getEnv("OPENWEATHER_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		if parsed, err := strconv.Atoi(val); err == nil {
			return parsed
		}
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		if parsed, err := strconv.ParseFloat(val, 64); err == nil {
			return parsed
		}
	}
	return fallback
}
