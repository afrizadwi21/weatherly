package domain

import "time"

// FloodReport represents a flood/inundation record with explicit source_type classification.
// Blueprint rule: never confuse rainfall risk estimate with confirmed official flood event.
type FloodReport struct {
	ID          string    `json:"id"`
	LocationID  string    `json:"location_id,omitempty"`
	Source      string    `json:"source"`
	SourceType  string    `json:"source_type"` // "official" | "community" | "estimated_risk"
	FloodLevel  string    `json:"flood_level"` // "low" | "medium" | "high"
	Description string    `json:"description"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Verified    bool      `json:"verified"`
	ReportedAt  time.Time `json:"reported_at"`
}

// CreateFloodReportRequest defines POST /api/v1/flood/reports payload.
type CreateFloodReportRequest struct {
	FloodLevel  string  `json:"flood_level"`
	Description string  `json:"description"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

// AIInsightItem represents a single structured recommendation card matching the blueprint API contract.
type AIInsightItem struct {
	Type           string `json:"type"`
	Severity       string `json:"severity"`
	Recommendation string `json:"recommendation"`
}

// AIInputSnapshot stores the validated, PII-free weather snapshot used by Stage 2 AI Layer.
type AIInputSnapshot struct {
	LocationName         string   `json:"location_name"`
	TemperatureC         float64  `json:"temperature_c"`
	RainWillArriveSoon   bool     `json:"rain_will_arrive_soon"`
	RainArrivalMins      *int     `json:"rain_arrival_minutes"`
	PeakRainIntensityMm  float64  `json:"peak_rain_intensity_mm_hr"`
	UVIndex              float64  `json:"uv_index"`
	UVCategory           string   `json:"uv_category"`
	AQI                  int      `json:"aqi"`
	PM25                 *float64 `json:"pm25"`
	SO2                  *float64 `json:"so2"`
	ProviderTimestampUTC string   `json:"provider_timestamp_utc"`
}

// DailyInsightsResponse matches the exact blueprint contract for GET /api/v1/insights/daily.
type DailyInsightsResponse struct {
	Location      string          `json:"location"`
	Summary       string          `json:"summary"`
	Insights      []AIInsightItem `json:"insights"`
	InputSnapshot AIInputSnapshot `json:"input_snapshot"`
	ModelName     string          `json:"model_name"`
	GeneratedAt   time.Time       `json:"generated_at"`
}

// GenerateInsightRequest defines POST /api/v1/insights/generate payload.
type GenerateInsightRequest struct {
	LocationName string  `json:"location_name,omitempty"`
	Latitude     float64 `json:"latitude,omitempty"`
	Longitude    float64 `json:"longitude,omitempty"`
	ActivityType string  `json:"activity_type,omitempty"`
}
