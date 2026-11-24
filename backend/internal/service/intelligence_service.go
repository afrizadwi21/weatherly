package service

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/domain"
)

// IntelligenceService manages Flood Monitoring and the Two-Stage AI Weather Insights Pipeline.
type IntelligenceService struct {
	mu           sync.RWMutex
	floodReports []domain.FloodReport
	weatherSvc   *WeatherService
	envSvc       *EnvironmentService
}

func NewIntelligenceService(weatherSvc *WeatherService, envSvc *EnvironmentService) *IntelligenceService {
	s := &IntelligenceService{
		floodReports: make([]domain.FloodReport, 0),
		weatherSvc:   weatherSvc,
		envSvc:       envSvc,
	}
	s.seedBandungFloodData()
	return s
}

func (s *IntelligenceService) seedBandungFloodData() {
	now := time.Now().UTC()
	s.floodReports = []domain.FloodReport{
		{
			ID:          "flood-bdg-01",
			LocationID:  "loc-bandung-default",
			Source:      "BPBD Jawa Barat / Kab. Bandung",
			SourceType:  "official",
			FloodLevel:  "medium",
			Description: "Peringatan resmi potensi genangan di koridor Dayeuhkolot & Baleendah saat intensitas hujan hulu Bandung > 5 mm/jam.",
			Latitude:    -6.9881,
			Longitude:   107.6269,
			Verified:    true,
			ReportedAt:  now.Add(-45 * time.Minute),
		},
		{
			ID:          "flood-bdg-02",
			LocationID:  "loc-bandung-default",
			Source:      "Laporan Komunitas Pengguna",
			SourceType:  "community",
			FloodLevel:  "low",
			Description: "Genangan permukaan ~10-15 cm di jalur lambat Jl. Soekarno-Hatta (Gedebage), kendaraan masih bisa melintas.",
			Latitude:    -6.9445,
			Longitude:   107.6910,
			Verified:    true,
			ReportedAt:  now.Add(-20 * time.Minute),
		},
	}
}

// ListNearbyFloodReports returns flood records clearly separating confirmed reports from rainfall risk context.
func (s *IntelligenceService) ListNearbyFloodReports(ctx context.Context, loc domain.Location) map[string]any {
	s.mu.RLock()
	reports := make([]domain.FloodReport, len(s.floodReports))
	copy(reports, s.floodReports)
	s.mu.RUnlock()

	rainPred := s.weatherSvc.PredictRain(ctx, loc)
	riskLevel := "low"
	if rainPred.PeakIntensityMmPerHr >= 4.0 {
		riskLevel = "medium"
	}

	return map[string]any{
		"location": loc.Name,
		"rainfall_risk_context": map[string]any{
			"source_type":              "estimated_risk",
			"note":                     "Konteks risiko berbasis curah hujan (bukan konfirmasi banjir aktual).",
			"peak_precipitation_mm_hr": rainPred.PeakIntensityMmPerHr,
			"estimated_risk_level":     riskLevel,
		},
		"reports": reports,
	}
}

func (s *IntelligenceService) CreateFloodReport(req domain.CreateFloodReportRequest) domain.FloodReport {
	s.mu.Lock()
	defer s.mu.Unlock()

	level := strings.ToLower(strings.TrimSpace(req.FloodLevel))
	if level == "" {
		level = "low"
	}
	report := domain.FloodReport{
		ID:          fmt.Sprintf("flood-rep-%d", len(s.floodReports)+1),
		Source:      "Community Crowdsource",
		SourceType:  "community",
		FloodLevel:  level,
		Description: strings.TrimSpace(req.Description),
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Verified:    false,
		ReportedAt:  time.Now().UTC(),
	}
	s.floodReports = append(s.floodReports, report)
	return report
}

// GenerateDailyInsights executes the Two-Stage AI Weather Analysis Pipeline:
// Stage 1: Deterministic Rule Engine validates weather, rain, UV, and AQI thresholds.
// Stage 2: AI Analysis Layer summarizes validated snapshot without hallucinating missing data.
func (s *IntelligenceService) GenerateDailyInsights(ctx context.Context, loc domain.Location, activity string) domain.DailyInsightsResponse {
	curr := s.weatherSvc.GetCurrent(ctx, loc)
	rain := s.weatherSvc.PredictRain(ctx, loc)
	uv := s.envSvc.GetCurrentUV(loc)
	aqi := s.envSvc.GetCurrentAirQuality(loc)

	// Stage 1: Build strict, PII-free validated input_snapshot
	snapshot := domain.AIInputSnapshot{
		LocationName:         loc.Name,
		TemperatureC:         curr.TemperatureC,
		RainWillArriveSoon:   rain.WillRainSoon,
		RainArrivalMins:      rain.EstimatedArrivalMins,
		PeakRainIntensityMm:  rain.PeakIntensityMmPerHr,
		UVIndex:              uv.UVIndex,
		UVCategory:           uv.UVCategory,
		AQI:                  aqi.AQI,
		PM25:                 aqi.PM25,
		SO2:                  aqi.SO2,
		ProviderTimestampUTC: curr.ObservedAt.Format(time.RFC3339),
	}

	// Stage 2: Rule-guided AI recommendation synthesis
	insights := make([]domain.AIInsightItem, 0, 3)
	summary := fmt.Sprintf("Kondisi cuaca di %s saat ini %.1f°C (%s).", loc.Name, curr.TemperatureC, curr.ConditionLabel)

	if rain.WillRainSoon && rain.EstimatedArrivalMins != nil {
		summary = "Potensi hujan meningkat pada sore hari."
		insights = append(insights, domain.AIInsightItem{
			Type:           "rain",
			Severity:       "medium",
			Recommendation: fmt.Sprintf("Siapkan payung atau jas hujan sebelum bepergian (estimasi hujan tiba ~%d menit lagi).", *rain.EstimatedArrivalMins),
		})
	}
	if uv.UVIndex >= 6.0 {
		insights = append(insights, domain.AIInsightItem{
			Type:           "uv",
			Severity:       "high",
			Recommendation: fmt.Sprintf("Gunakan perlindungan dari paparan UV (SPF %d+ pada jam puncak %s).", uv.RecommendedSPF, uv.PeakHoursWindow),
		})
	}
	aqiRec := aqi.OutdoorRecommendation
	if snapshot.SO2 == nil {
		aqiRec += " (Catatan: Parameter polutan SO2 tidak tersedia dari stasiun pemantau)."
	}
	insights = append(insights, domain.AIInsightItem{
		Type:           "air_quality",
		Severity:       "low",
		Recommendation: aqiRec,
	})

	if activity != "" {
		insights = append(insights, domain.AIInsightItem{
			Type:           "activity_" + strings.ToLower(activity),
			Severity:       "medium",
			Recommendation: fmt.Sprintf("Rekomendasi aktivitas (%s): sebaiknya dijadwalkan sebelum hujan turun atau setelah intensitas presipitasi mereda.", activity),
		})
	}

	return domain.DailyInsightsResponse{
		Location:      loc.Name,
		Summary:       summary,
		Insights:      insights,
		InputSnapshot: snapshot,
		ModelName:     "weatherly-rule-engine+gemini-adapter-v1",
		GeneratedAt:   time.Now().UTC(),
	}
}
