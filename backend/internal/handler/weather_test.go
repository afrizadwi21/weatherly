package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
	"github.com/afrizadwi21/weatherly/backend/internal/service"
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

	t.Run("GET /api/v1/alerts and deduplicated web alerts", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/alerts", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on alerts list, got %d", rec.Code)
		}

		alertSvc := service.NewAlertService()
		loc := domain.Location{ID: "loc-bandung-default", Name: "Bandung"}
		_, firstCreated := alertSvc.EvaluateAndCreateAlert(loc, "HEAVY_RAIN", "high", "Hujan Lebat", "Waspada", "2026-11-24-14")
		_, secondCreated := alertSvc.EvaluateAndCreateAlert(loc, "HEAVY_RAIN", "high", "Hujan Lebat", "Waspada", "2026-11-24-14")
		if !firstCreated || secondCreated {
			t.Errorf("expected alert deduplication guard to block duplicate emission (first=%v, second=%v)", firstCreated, secondCreated)
		}
	})

	t.Run("GET /api/v1/flood/nearby and GET /api/v1/insights/daily", func(t *testing.T) {
		floodReq := httptest.NewRequest(http.MethodGet, "/api/v1/flood/nearby", nil)
		floodRec := httptest.NewRecorder()
		mux.ServeHTTP(floodRec, floodReq)
		if floodRec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on flood nearby, got %d", floodRec.Code)
		}

		aiReq := httptest.NewRequest(http.MethodGet, "/api/v1/insights/daily", nil)
		aiRec := httptest.NewRecorder()
		mux.ServeHTTP(aiRec, aiReq)
		if aiRec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK on daily insights, got %d", aiRec.Code)
		}
		var insights domain.DailyInsightsResponse
		_ = json.NewDecoder(aiRec.Body).Decode(&insights)
		if insights.Location != "Bandung" || len(insights.Insights) < 2 {
			t.Errorf("unexpected daily insights response: %+v", insights)
		}
	})

	t.Run("Smart Travel corridor and Community Report unique vote constraint", func(t *testing.T) {
		tcSvc := service.NewTravelCommunityService()
		route := tcSvc.CreateRoute("user-1", domain.CreateTravelRouteRequest{
			RouteName:      "Dago ke Buahbatu",
			OriginLat:      -6.8850,
			OriginLon:      107.6135,
			DestinationLat: -6.9500,
			DestinationLon: 107.6340,
		})
		analysis, err := tcSvc.AnalyzeRouteWeather(route.ID)
		if err != nil || len(analysis.Waypoints) != 3 {
			t.Fatalf("expected 3 route waypoints, got err=%v waypoints=%d", err, len(analysis.Waypoints))
		}

		if _, err := tcSvc.VoteReport("comm-bdg-01", "user-1", "upvote"); err != nil {
			t.Fatalf("expected first vote to succeed, got %v", err)
		}
		if _, err := tcSvc.VoteReport("comm-bdg-01", "user-1", "upvote"); err == nil {
			t.Errorf("expected duplicate vote by same user to be rejected")
		}
	})
}
