package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/afrizadwi21/weatherly/backend/core/domain"
	"github.com/afrizadwi21/weatherly/backend/core/service"
)

// IntelligenceHandler exposes Flood Monitoring (/api/v1/flood/*) and AI Insights (/api/v1/insights/*) endpoints.
type IntelligenceHandler struct {
	weatherHandler *WeatherHandler
	svc            *service.IntelligenceService
}

func NewIntelligenceHandler(wh *WeatherHandler, svc *service.IntelligenceService) *IntelligenceHandler {
	return &IntelligenceHandler{weatherHandler: wh, svc: svc}
}

// FloodNearby handles GET /api/v1/flood/nearby.
func (h *IntelligenceHandler) FloodNearby(w http.ResponseWriter, r *http.Request) {
	loc := h.weatherHandler.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.ListNearbyFloodReports(r.Context(), loc))
}

// CreateFloodReport handles POST /api/v1/flood/reports.
func (h *IntelligenceHandler) CreateFloodReport(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateFloodReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Description) == "" {
		writeJSONError(w, http.StatusBadRequest, "valid flood description and coordinates are required")
		return
	}
	report := h.svc.CreateFloodReport(req)
	writeJSON(w, http.StatusCreated, report)
}

// DailyInsights handles GET /api/v1/insights/daily.
func (h *IntelligenceHandler) DailyInsights(w http.ResponseWriter, r *http.Request) {
	loc := h.weatherHandler.resolveLocation(r)
	resp := h.svc.GenerateDailyInsights(r.Context(), loc, "")
	writeJSON(w, http.StatusOK, resp)
}

// GenerateInsights handles POST /api/v1/insights/generate.
func (h *IntelligenceHandler) GenerateInsights(w http.ResponseWriter, r *http.Request) {
	loc := h.weatherHandler.resolveLocation(r)
	var req domain.GenerateInsightRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	if strings.TrimSpace(req.LocationName) != "" {
		loc.Name = strings.TrimSpace(req.LocationName)
	}
	resp := h.svc.GenerateDailyInsights(r.Context(), loc, req.ActivityType)
	writeJSON(w, http.StatusOK, resp)
}
