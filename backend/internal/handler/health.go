package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/provider"
	"github.com/afrizadwi21/weatherly/backend/internal/repository"
	"github.com/afrizadwi21/weatherly/backend/internal/service"
)

// HealthResponse represents the JSON contract for /api/v1/health.
type HealthResponse struct {
	Status      string    `json:"status"`
	Service     string    `json:"service"`
	Environment string    `json:"environment"`
	Region      string    `json:"default_region"`
	Timestamp   time.Time `json:"timestamp"`
}

// NewMux registers the core API v1 routes on a standard Go 1.22+ ServeMux.
func NewMux(cfg *config.Config) *http.ServeMux {
	store := repository.NewStore()
	weatherClient := provider.NewWeatherClient(cfg.OpenMeteoBaseURL)
	weatherSvc := service.NewWeatherService(weatherClient)
	envSvc := service.NewEnvironmentService()
	alertSvc := service.NewAlertService()
	intelSvc := service.NewIntelligenceService(weatherSvc, envSvc)
	travelCommSvc := service.NewTravelCommunityService()

	authHandler := NewAuthHandler(cfg, store)
	locHandler := NewLocationHandler(cfg, store)
	weatherHandler := NewWeatherHandler(cfg, store, weatherSvc)
	envHandler := NewEnvironmentHandler(weatherHandler, envSvc)
	alertHandler := NewAlertHandler(cfg, alertSvc)
	intelHandler := NewIntelligenceHandler(weatherHandler, intelSvc)
	travelCommHandler := NewTravelCommunityHandler(cfg, travelCommSvc)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", HealthHandler(cfg))
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/v1/auth/me", authHandler.Me)
	mux.HandleFunc("GET /api/v1/locations", locHandler.List)
	mux.HandleFunc("POST /api/v1/locations", locHandler.Create)
	mux.HandleFunc("PATCH /api/v1/locations/{id}", locHandler.Update)

	mux.HandleFunc("GET /api/v1/weather/current", weatherHandler.Current)
	mux.HandleFunc("GET /api/v1/weather/forecast", weatherHandler.Forecast)
	mux.HandleFunc("GET /api/v1/weather/minutely", weatherHandler.Minutely)
	mux.HandleFunc("GET /api/v1/weather/radar", weatherHandler.Radar)
	mux.HandleFunc("GET /api/v1/rain/prediction", weatherHandler.RainPrediction)
	mux.HandleFunc("GET /api/v1/rain/history", weatherHandler.RainHistory)

	mux.HandleFunc("GET /api/v1/air-quality/current", envHandler.AirQualityCurrent)
	mux.HandleFunc("GET /api/v1/air-quality/history", envHandler.AirQualityHistory)
	mux.HandleFunc("GET /api/v1/uv/current", envHandler.UVCurrent)
	mux.HandleFunc("GET /api/v1/uv/forecast", envHandler.UVForecast)

	mux.HandleFunc("GET /api/v1/alerts", alertHandler.ListAlerts)
	mux.HandleFunc("GET /api/v1/alerts/{id}", alertHandler.GetAlert)
	mux.HandleFunc("POST /api/v1/devices/register", alertHandler.RegisterDevice)
	mux.HandleFunc("GET /api/v1/notifications", alertHandler.ListNotifications)

	mux.HandleFunc("GET /api/v1/flood/nearby", intelHandler.FloodNearby)
	mux.HandleFunc("POST /api/v1/flood/reports", intelHandler.CreateFloodReport)
	mux.HandleFunc("GET /api/v1/insights/daily", intelHandler.DailyInsights)
	mux.HandleFunc("POST /api/v1/insights/generate", intelHandler.GenerateInsights)

	mux.HandleFunc("POST /api/v1/travel/routes", travelCommHandler.CreateRoute)
	mux.HandleFunc("GET /api/v1/travel/{id}/weather", travelCommHandler.GetRouteWeather)
	mux.HandleFunc("GET /api/v1/community/reports", travelCommHandler.ListCommunityReports)
	mux.HandleFunc("POST /api/v1/community/reports", travelCommHandler.CreateCommunityReport)
	mux.HandleFunc("POST /api/v1/community/reports/{id}/vote", travelCommHandler.VoteCommunityReport)
	return mux
}

// HealthHandler returns an HTTP handler reporting service readiness.
func HealthHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)

		resp := HealthResponse{
			Status:      "ok",
			Service:     cfg.AppName,
			Environment: cfg.AppEnv,
			Region:      cfg.DefaultRegionName,
			Timestamp:   time.Now().UTC(),
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}
