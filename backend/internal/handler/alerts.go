package handler

import (
	"net/http"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/service"
)

// AlertHandler exposes Extreme Weather Alerts (/api/v1/alerts*) endpoints for the Web platform.
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
