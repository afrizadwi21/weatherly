package handler

import (
	"net/http"

	"github.com/afrizadwi21/weatherly/backend/core/service"
)

// EnvironmentHandler exposes Air Quality (/api/v1/air-quality/*) and UV (/api/v1/uv/*) endpoints.
type EnvironmentHandler struct {
	weatherHandler *WeatherHandler
	svc            *service.EnvironmentService
}

func NewEnvironmentHandler(wh *WeatherHandler, svc *service.EnvironmentService) *EnvironmentHandler {
	return &EnvironmentHandler{weatherHandler: wh, svc: svc}
}

// AirQualityCurrent handles GET /api/v1/air-quality/current.
func (h *EnvironmentHandler) AirQualityCurrent(w http.ResponseWriter, r *http.Request) {
	loc := h.weatherHandler.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.GetCurrentAirQuality(loc))
}

// AirQualityHistory handles GET /api/v1/air-quality/history.
func (h *EnvironmentHandler) AirQualityHistory(w http.ResponseWriter, r *http.Request) {
	loc := h.weatherHandler.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.GetAirQualityHistory(loc))
}

// UVCurrent handles GET /api/v1/uv/current.
func (h *EnvironmentHandler) UVCurrent(w http.ResponseWriter, r *http.Request) {
	loc := h.weatherHandler.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.GetCurrentUV(loc))
}

// UVForecast handles GET /api/v1/uv/forecast.
func (h *EnvironmentHandler) UVForecast(w http.ResponseWriter, r *http.Request) {
	loc := h.weatherHandler.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.GetUVForecast(loc))
}
