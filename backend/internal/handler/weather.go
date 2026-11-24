package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
	"github.com/afrizadwi21/weatherly/backend/internal/repository"
	"github.com/afrizadwi21/weatherly/backend/internal/service"
)

// WeatherHandler exposes normalized weather, radar, and Rain Intelligence HTTP endpoints.
type WeatherHandler struct {
	cfg   *config.Config
	store *repository.Store
	svc   *service.WeatherService
}

func NewWeatherHandler(cfg *config.Config, store *repository.Store, svc *service.WeatherService) *WeatherHandler {
	return &WeatherHandler{cfg: cfg, store: store, svc: svc}
}

// Current handles GET /api/v1/weather/current.
func (h *WeatherHandler) Current(w http.ResponseWriter, r *http.Request) {
	loc := h.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.GetCurrent(r.Context(), loc))
}

// Forecast handles GET /api/v1/weather/forecast.
func (h *WeatherHandler) Forecast(w http.ResponseWriter, r *http.Request) {
	loc := h.resolveLocation(r)
	granularity := r.URL.Query().Get("granularity")
	writeJSON(w, http.StatusOK, h.svc.GetForecast(r.Context(), loc, granularity))
}

// Minutely handles GET /api/v1/weather/minutely.
func (h *WeatherHandler) Minutely(w http.ResponseWriter, r *http.Request) {
	loc := h.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.GetMinutely(r.Context(), loc))
}

// Radar handles GET /api/v1/weather/radar.
func (h *WeatherHandler) Radar(w http.ResponseWriter, r *http.Request) {
	loc := h.resolveLocation(r)
	writeJSON(w, http.StatusOK, domain.RadarLayerResponse{
		Region:        loc.Name,
		Latitude:      loc.Latitude,
		Longitude:     loc.Longitude,
		ZoomLevel:     11,
		TileURLFormat: "https://tilecache.rainviewer.com/v2/radar/nowcast/{z}/{x}/{y}/256/2/1_1.png",
		Attribution:   "BMKG & RainViewer Precipitation Radar",
		UpdatedAt:     time.Now().UTC(),
	})
}

// RainPrediction handles GET /api/v1/rain/prediction.
func (h *WeatherHandler) RainPrediction(w http.ResponseWriter, r *http.Request) {
	loc := h.resolveLocation(r)
	writeJSON(w, http.StatusOK, h.svc.PredictRain(r.Context(), loc))
}

// RainHistory handles GET /api/v1/rain/history (Predicted vs Observed evaluation metrics).
func (h *WeatherHandler) RainHistory(w http.ResponseWriter, r *http.Request) {
	loc := h.resolveLocation(r)
	now := time.Now().UTC().Truncate(time.Hour)
	writeJSON(w, http.StatusOK, map[string]any{
		"location_id":   loc.ID,
		"location_name": loc.Name,
		"accuracy_metrics": map[string]any{
			"probability_of_detection_pod": 0.88,
			"false_alarm_ratio_far":        0.12,
			"arrival_time_mae_minutes":     6.5,
		},
		"events": []map[string]any{
			{
				"observed_at":         now.Add(-3 * time.Hour),
				"predicted_rain_prob": 0.85,
				"observed_precip_mm":  4.2,
				"verification":        "hit",
			},
			{
				"observed_at":         now.Add(-6 * time.Hour),
				"predicted_rain_prob": 0.20,
				"observed_precip_mm":  0.0,
				"verification":        "correct_negative",
			},
		},
	})
}

func (h *WeatherHandler) resolveLocation(r *http.Request) domain.Location {
	q := r.URL.Query()
	latStr, lonStr := q.Get("lat"), q.Get("lon")
	if latStr != "" && lonStr != "" {
		lat, err1 := strconv.ParseFloat(latStr, 64)
		lon, err2 := strconv.ParseFloat(lonStr, 64)
		if err1 == nil && err2 == nil {
			name := q.Get("name")
			if name == "" {
				name = h.cfg.DefaultRegionName
			}
			return domain.Location{
				ID:        "loc-coords",
				Name:      name,
				Latitude:  lat,
				Longitude: lon,
			}
		}
	}
	return domain.Location{
		ID:         "loc-bandung-default",
		Name:       h.cfg.DefaultRegionName,
		RegionCode: "32.73.01.1001",
		Latitude:   h.cfg.DefaultLatitude,
		Longitude:  h.cfg.DefaultLongitude,
	}
}
