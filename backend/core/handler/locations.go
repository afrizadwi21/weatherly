package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/afrizadwi21/weatherly/backend/core/config"
	"github.com/afrizadwi21/weatherly/backend/core/domain"
	"github.com/afrizadwi21/weatherly/backend/core/repository"
)

// LocationHandler manages GPS and favorite monitoring location endpoints.
type LocationHandler struct {
	cfg   *config.Config
	store *repository.Store
}

func NewLocationHandler(cfg *config.Config, store *repository.Store) *LocationHandler {
	return &LocationHandler{cfg: cfg, store: store}
}

// List handles GET /api/v1/locations.
func (h *LocationHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := "anonymous"
	if claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey); err == nil {
		userID = claims.UserID
	}
	locations := h.store.ListLocations(userID)
	writeJSON(w, http.StatusOK, map[string]any{"locations": locations})
}

// Create handles POST /api/v1/locations.
func (h *LocationHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	var req domain.CreateLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(req.Name) == "" || req.Latitude < -90 || req.Latitude > 90 || req.Longitude < -180 || req.Longitude > 180 {
		writeJSONError(w, http.StatusBadRequest, "valid location name and coordinates are required")
		return
	}

	loc := h.store.CreateLocation(claims.UserID, req)
	writeJSON(w, http.StatusCreated, loc)
}

// Update handles PATCH /api/v1/locations/{id}.
func (h *LocationHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	locID := r.PathValue("id")
	var req domain.UpdateLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	updated, err := h.store.UpdateLocation(locID, claims.UserID, req)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}
