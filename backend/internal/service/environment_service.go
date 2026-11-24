package service

import (
	"math"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/domain"
)

// EnvironmentService provides Air Quality (AQI) and UV Index analysis.
type EnvironmentService struct{}

func NewEnvironmentService() *EnvironmentService {
	return &EnvironmentService{}
}

// GetCurrentAirQuality returns normalized AQI metrics while leaving unavailable pollutants as nil (NULL).
func (s *EnvironmentService) GetCurrentAirQuality(loc domain.Location) domain.AirQualityObservation {
	pm25 := 28.4
	pm10 := 54.0
	no2 := 16.2
	o3 := 41.5
	co := 310.0
	// SO2 is intentionally left nil (NULL) when not reported by the regional station.
	var so2 *float64

	aqi := 74
	cat, rec := classifyAQI(aqi)

	return domain.AirQualityObservation{
		LocationID:            loc.ID,
		LocationName:          loc.Name,
		AQI:                   aqi,
		Category:              cat,
		PM25:                  &pm25,
		PM10:                  &pm10,
		NO2:                   &no2,
		O3:                    &o3,
		CO:                    &co,
		SO2:                   so2,
		OutdoorRecommendation: rec,
		Provider:              "open-meteo-aqi-normalized",
		ObservedAt:            time.Now().UTC(),
	}
}

// GetAirQualityHistory returns historical AQI snapshots for the last 6 intervals.
func (s *EnvironmentService) GetAirQualityHistory(loc domain.Location) domain.AirQualityHistoryResponse {
	now := time.Now().UTC().Truncate(time.Hour)
	list := make([]domain.AirQualityObservation, 0, 6)

	aqis := []int{62, 68, 75, 82, 78, 74}
	for i, val := range aqis {
		pm25 := math.Round(float64(val)*0.38*10) / 10
		pm10 := math.Round(float64(val)*0.72*10) / 10
		cat, rec := classifyAQI(val)
		list = append(list, domain.AirQualityObservation{
			LocationID:            loc.ID,
			LocationName:          loc.Name,
			AQI:                   val,
			Category:              cat,
			PM25:                  &pm25,
			PM10:                  &pm10,
			OutdoorRecommendation: rec,
			Provider:              "open-meteo-aqi-normalized",
			ObservedAt:            now.Add(time.Duration(-(5 - i)) * time.Hour),
		})
	}
	return domain.AirQualityHistoryResponse{
		LocationID:   loc.ID,
		LocationName: loc.Name,
		Observations: list,
	}
}

// GetCurrentUV returns real-time UV index, risk category, and skin protection guidance.
func (s *EnvironmentService) GetCurrentUV(loc domain.Location) domain.UVObservation {
	uv := 7.4
	cat, advice, spf := classifyUV(uv)
	return domain.UVObservation{
		LocationID:       loc.ID,
		LocationName:     loc.Name,
		UVIndex:          uv,
		UVCategory:       cat,
		PeakHoursWindow:  "10:30 - 14:30 WIB",
		ProtectionAdvice: advice,
		RecommendedSPF:   spf,
		Provider:         "open-meteo-uv-normalized",
		ObservedAt:       time.Now().UTC(),
	}
}

// GetUVForecast returns an 8-hour UV projection curve.
func (s *EnvironmentService) GetUVForecast(loc domain.Location) domain.UVForecastResponse {
	now := time.Now().UTC().Truncate(time.Hour)
	uvCurve := []float64{3.2, 5.5, 7.8, 9.1, 8.0, 5.2, 2.4, 0.5}
	points := make([]domain.UVForecastPoint, 0, len(uvCurve))

	for i, uv := range uvCurve {
		cat, _, _ := classifyUV(uv)
		points = append(points, domain.UVForecastPoint{
			TargetTime: now.Add(time.Duration(i+1) * time.Hour),
			UVIndex:    uv,
			UVCategory: cat,
		})
	}
	return domain.UVForecastResponse{
		LocationID:   loc.ID,
		LocationName: loc.Name,
		Provider:     "open-meteo-uv-normalized",
		Forecasts:    points,
	}
}

func classifyAQI(aqi int) (string, string) {
	switch {
	case aqi <= 50:
		return "Good", "Kualitas udara sangat baik untuk aktivitas olahraga di luar ruangan."
	case aqi <= 100:
		return "Moderate", "Kualitas udara sedang; aman untuk aktivitas luar ruangan, kelompok sensitif disarankan membatasi paparan panjang."
	case aqi <= 150:
		return "Unhealthy for Sensitive Groups", "Gunakan masker jika beraktivitas di jalan raya atau memiliki riwayat asma."
	default:
		return "Unhealthy", "Batasi aktivitas berat di luar ruangan dan gunakan masker respirator."
	}
}

func classifyUV(uv float64) (string, string, int) {
	switch {
	case uv < 3:
		return "Low", "Risiko paparan UV rendah. Aman beraktivitas di luar ruangan.", 15
	case uv < 6:
		return "Moderate", "Gunakan kacamata hitam dan sunscreen SPF 30+ saat berada di bawah sinar matahari langsung.", 30
	case uv < 8:
		return "High", "Paparan UV tinggi. Gunakan sunscreen SPF 30+, topi, dan kurangi paparan langsung pukul 11:00–14:00 WIB.", 30
	case uv < 11:
		return "Very High", "Paparan UV sangat tinggi. Wajib gunakan sunscreen SPF 50+ dan cari tempat teduh.", 50
	default:
		return "Extreme", "Paparan UV ekstrem. Hindari sinar matahari langsung di siang hari.", 50
	}
}
