package domain

import "time"

// CurrentWeather represents normalized live weather observation at a location.
// Optional sensor metrics use pointer *float64 to preserve honest NULL values.
type CurrentWeather struct {
	LocationID      string    `json:"location_id"`
	LocationName    string    `json:"location_name"`
	Latitude        float64   `json:"latitude"`
	Longitude       float64   `json:"longitude"`
	TemperatureC    float64   `json:"temperature_c"`
	FeelsLikeC      *float64  `json:"feels_like_c"`
	HumidityPct     *float64  `json:"humidity_pct"`
	WindSpeedKmh    *float64  `json:"wind_speed_kmh"`
	WindDirection   *int      `json:"wind_direction_deg"`
	PrecipitationMm float64   `json:"precipitation_mm"`
	ConditionCode   string    `json:"condition_code"`
	ConditionLabel  string    `json:"condition_label"`
	Provider        string    `json:"provider"`
	ObservedAt      time.Time `json:"observed_at"`
}

// ForecastPoint represents a normalized hourly or daily weather forecast entry.
type ForecastPoint struct {
	TargetTime      time.Time `json:"target_time"`
	TemperatureC    float64   `json:"temperature_c"`
	RainProbability float64   `json:"rain_probability"`
	PrecipitationMm float64   `json:"precipitation_mm"`
	HumidityPct     *float64  `json:"humidity_pct,omitempty"`
	WindSpeedKmh    *float64  `json:"wind_speed_kmh,omitempty"`
	ConditionCode   string    `json:"condition_code"`
	ConditionLabel  string    `json:"condition_label"`
}

// WeatherForecastResponse represents the contract for GET /api/v1/weather/forecast.
type WeatherForecastResponse struct {
	LocationID   string          `json:"location_id"`
	LocationName string          `json:"location_name"`
	Granularity  string          `json:"granularity"`
	Provider     string          `json:"provider"`
	FetchedAt    time.Time       `json:"fetched_at"`
	Forecasts    []ForecastPoint `json:"forecasts"`
}

// MinutelyPoint represents a 10-60 minute short-term precipitation interval.
type MinutelyPoint struct {
	TargetTime      time.Time `json:"target_time"`
	MinutesAhead    int       `json:"minutes_ahead"`
	PrecipitationMm float64   `json:"precipitation_mm"`
	RainProbability float64   `json:"rain_probability"`
	IntensityLevel  string    `json:"intensity_level"`
}

// MinutelyWeatherResponse represents GET /api/v1/weather/minutely.
type MinutelyWeatherResponse struct {
	LocationID   string          `json:"location_id"`
	LocationName string          `json:"location_name"`
	Provider     string          `json:"provider"`
	GeneratedAt  time.Time       `json:"generated_at"`
	Timeline     []MinutelyPoint `json:"timeline"`
}

// RadarLayerResponse represents GET /api/v1/weather/radar metadata for Indonesia.
type RadarLayerResponse struct {
	Region        string    `json:"region"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	ZoomLevel     int       `json:"zoom_level"`
	TileURLFormat string    `json:"tile_url_format"`
	Attribution   string    `json:"attribution"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// RainPredictionResponse represents GET /api/v1/rain/prediction (Core Flagship Module).
type RainPredictionResponse struct {
	LocationID            string          `json:"location_id"`
	LocationName          string          `json:"location_name"`
	WillRainSoon          bool            `json:"will_rain_soon"`
	EstimatedArrivalMins  *int            `json:"estimated_arrival_minutes"`
	EstimatedArrivalTime  *time.Time      `json:"estimated_arrival_time"`
	PeakIntensityMmPerHr  float64         `json:"peak_intensity_mm_per_hr"`
	IntensityCategory     string          `json:"intensity_category"`
	ConfidenceProbability float64         `json:"confidence_probability"`
	AlertMessage          string          `json:"alert_message"`
	Provider              string          `json:"provider"`
	GeneratedAt           time.Time       `json:"generated_at"`
	Curve                 []MinutelyPoint `json:"curve"`
}
