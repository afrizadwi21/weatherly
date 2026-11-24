package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
	"github.com/afrizadwi21/weatherly/backend/internal/service"
)

// TravelCommunityHandler exposes Smart Travel (/api/v1/travel/*) and Community Reports (/api/v1/community/*) endpoints.
type TravelCommunityHandler struct {
	cfg *config.Config
	svc *service.TravelCommunityService
}

func NewTravelCommunityHandler(cfg *config.Config, svc *service.TravelCommunityService) *TravelCommunityHandler {
	return &TravelCommunityHandler{cfg: cfg, svc: svc}
}

// CreateRoute handles POST /api/v1/travel/routes.
func (h *TravelCommunityHandler) CreateRoute(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req domain.CreateTravelRouteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.RouteName) == "" {
		writeJSONError(w, http.StatusBadRequest, "valid route_name and coordinates are required")
		return
	}

	route := h.svc.CreateRoute(claims.UserID, req)
	writeJSON(w, http.StatusCreated, route)
}

// GetRouteWeather handles GET /api/v1/travel/{id}/weather.
func (h *TravelCommunityHandler) GetRouteWeather(w http.ResponseWriter, r *http.Request) {
	routeID := r.PathValue("id")
	resp, err := h.svc.AnalyzeRouteWeather(routeID)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

// ListCommunityReports handles GET /api/v1/community/reports.
func (h *TravelCommunityHandler) ListCommunityReports(w http.ResponseWriter, r *http.Request) {
	reports := h.svc.ListReports()
	writeJSON(w, http.StatusOK, map[string]any{"reports": reports})
}

// CreateCommunityReport handles POST /api/v1/community/reports.
func (h *TravelCommunityHandler) CreateCommunityReport(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req domain.CreateCommunityReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Description) == "" {
		writeJSONError(w, http.StatusBadRequest, "valid report_type, description, and coordinates are required")
		return
	}

	report := h.svc.CreateReport(claims.UserID, req)
	writeJSON(w, http.StatusCreated, report)
}

// VoteCommunityReport handles POST /api/v1/community/reports/{id}/vote.
func (h *TravelCommunityHandler) VoteCommunityReport(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	reportID := r.PathValue("id")
	var req domain.VoteReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.svc.VoteReport(reportID, claims.UserID, req.VoteType)
	if err != nil {
		if errors.Is(err, service.ErrAlreadyVoted) {
			writeJSONError(w, http.StatusConflict, err.Error())
			return
		}
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}
