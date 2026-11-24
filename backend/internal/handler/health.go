package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/repository"
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
	authHandler := NewAuthHandler(cfg, store)
	locHandler := NewLocationHandler(cfg, store)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/health", HealthHandler(cfg))
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/v1/auth/me", authHandler.Me)
	mux.HandleFunc("GET /api/v1/locations", locHandler.List)
	mux.HandleFunc("POST /api/v1/locations", locHandler.Create)
	mux.HandleFunc("PATCH /api/v1/locations/{id}", locHandler.Update)
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
