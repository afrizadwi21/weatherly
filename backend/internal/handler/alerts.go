package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
	"github.com/afrizadwi21/weatherly/backend/internal/service"
)

// AlertHandler exposes Extreme Weather Alerts (/api/v1/alerts*) and Push Notification (/api/v1/devices*, /notifications) endpoints.
type AlertHandler struct {
	cfg *config.Config
	svc *service.AlertService
}

func NewAlertHandler(cfg *config.Config, svc *service.AlertService) *AlertHandler {
	return &AlertHandler{cfg: cfg, svc: svc}
}

// ListAlerts handles GET /api/v1/alerts.
func (h *AlertHandler) ListAlerts(w http.ResponseWriter, r *http.Request) {
	alerts := h.svc.ListAlerts()
	writeJSON(w, http.StatusOK, map[string]any{"alerts": alerts})
}

// GetAlert handles GET /api/v1/alerts/{id}.
func (h *AlertHandler) GetAlert(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	alert, ok := h.svc.GetAlertByID(id)
	if !ok {
		writeJSONError(w, http.StatusNotFound, "weather alert not found")
		return
	}
	writeJSON(w, http.StatusOK, alert)
}

// RegisterDevice handles POST /api/v1/devices/register.
func (h *AlertHandler) RegisterDevice(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req domain.RegisterDeviceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.FCMToken) == "" {
		writeJSONError(w, http.StatusBadRequest, "valid fcm_token is required")
		return
	}

	dev := h.svc.RegisterDevice(claims.UserID, req)
	writeJSON(w, http.StatusCreated, dev)
}

// ListNotifications handles GET /api/v1/notifications.
func (h *AlertHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	logs := h.svc.ListNotifications(claims.UserID)
	writeJSON(w, http.StatusOK, map[string]any{"notifications": logs})
}
