package domain

import "time"

// AirQualityObservation represents normalized air quality metrics for a location.
// Unavailable pollutant parameters remain nil (marshaled as JSON null, never guessed).
type AirQualityObservation struct {
	LocationID            string    `json:"location_id"`
	LocationName          string    `json:"location_name"`
	AQI                   int       `json:"aqi"`
	Category              string    `json:"category"`
	PM25                  *float64  `json:"pm25"`
	PM10                  *float64  `json:"pm10"`
	NO2                   *float64  `json:"no2"`
	O3                    *float64  `json:"o3"`
	CO                    *float64  `json:"co"`
	SO2                   *float64  `json:"so2"`
	OutdoorRecommendation string    `json:"outdoor_recommendation"`
	Provider              string    `json:"provider"`
	ObservedAt            time.Time `json:"observed_at"`
}

// AirQualityHistoryResponse represents GET /api/v1/air-quality/history.
type AirQualityHistoryResponse struct {
	LocationID   string                  `json:"location_id"`
	LocationName string                  `json:"location_name"`
	Observations []AirQualityObservation `json:"observations"`
}

// UVObservation represents normalized UV index and skin protection recommendation.
type UVObservation struct {
	LocationID           string    `json:"location_id"`
	LocationName         string    `json:"location_name"`
	UVIndex              float64   `json:"uv_index"`
	UVCategory           string    `json:"uv_category"`
	PeakHoursWindow      string    `json:"peak_hours_window"`
	ProtectionAdvice     string    `json:"protection_advice"`
	RecommendedSPF       int       `json:"recommended_spf"`
	Provider             string    `json:"provider"`
	ObservedAt           time.Time `json:"observed_at"`
}

// UVForecastPoint represents an hourly UV index forecast entry.
type UVForecastPoint struct {
	TargetTime time.Time `json:"target_time"`
	UVIndex    float64   `json:"uv_index"`
	UVCategory string    `json:"uv_category"`
}

// UVForecastResponse represents GET /api/v1/uv/forecast.
type UVForecastResponse struct {
	LocationID   string            `json:"location_id"`
	LocationName string            `json:"location_name"`
	Provider     string            `json:"provider"`
	Forecasts    []UVForecastPoint `json:"forecasts"`
}
