package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
)

func TestWeatherAndRainEndpoints(t *testing.T) {
	cfg := config.Load()
	cfg.OpenMeteoBaseURL = "http://127.0.0.1:1" // Force fast deterministic Bandung fallback in unit tests
	mux := NewMux(cfg)

	t.Run("GET /api/v1/weather/current", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/weather/current", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rec.Code)
		}
		var curr domain.CurrentWeather
		if err := json.NewDecoder(rec.Body).Decode(&curr); err != nil {
			t.Fatalf("decode error: %v", err)
		}
		if curr.LocationName != "Bandung" || curr.HumidityPct == nil {
			t.Errorf("unexpected current weather response: %+v", curr)
		}
	})

	t.Run("GET /api/v1/weather/forecast", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/weather/forecast", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rec.Code)
		}
		var fc domain.WeatherForecastResponse
		_ = json.NewDecoder(rec.Body).Decode(&fc)
		if len(fc.Forecasts) != 12 {
			t.Errorf("expected 12 hourly forecast points, got %d", len(fc.Forecasts))
		}
	})

	t.Run("GET /api/v1/rain/prediction", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/rain/prediction?name=Dago&lat=-6.885&lon=107.613", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rec.Code)
		}
		var pred domain.RainPredictionResponse
		_ = json.NewDecoder(rec.Body).Decode(&pred)
		if !pred.WillRainSoon || pred.EstimatedArrivalMins == nil || len(pred.Curve) != 6 {
			t.Errorf("expected rain prediction with 6 minutely points and arrival time, got %+v", pred)
		}
	})

	t.Run("GET /api/v1/air-quality/current preserves NULL for missing SO2", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/air-quality/current", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rec.Code)
		}
		var aqi domain.AirQualityObservation
		_ = json.NewDecoder(rec.Body).Decode(&aqi)
		if aqi.AQI <= 0 || aqi.PM25 == nil || aqi.SO2 != nil {
			t.Errorf("expected non-null PM25 and nil SO2, got %+v", aqi)
		}
	})

	t.Run("GET /api/v1/uv/current and /uv/forecast", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/uv/current", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rec.Code)
		}
		var uv domain.UVObservation
		_ = json.NewDecoder(rec.Body).Decode(&uv)
		if uv.UVIndex <= 0 || uv.UVCategory == "" {
			t.Errorf("unexpected UV observation: %+v", uv)
		}
	})
}
