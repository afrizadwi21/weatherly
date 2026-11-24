package domain

import "time"

// TravelRoute represents a saved origin-destination corridor for Smart Travel weather checks.
type TravelRoute struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	RouteName      string    `json:"route_name"`
	OriginLat      float64   `json:"origin_lat"`
	OriginLon      float64   `json:"origin_lon"`
	DestinationLat float64   `json:"destination_lat"`
	DestinationLon float64   `json:"destination_lon"`
	CreatedAt      time.Time `json:"created_at"`
}

// CreateTravelRouteRequest defines POST /api/v1/travel/routes payload.
type CreateTravelRouteRequest struct {
	RouteName      string  `json:"route_name"`
	OriginLat      float64 `json:"origin_lat"`
	OriginLon      float64 `json:"origin_lon"`
	DestinationLat float64 `json:"destination_lat"`
	DestinationLon float64 `json:"destination_lon"`
}

// RouteWaypointWeather represents weather risk at a checkpoint along a travel corridor.
type RouteWaypointWeather struct {
	CheckpointName   string    `json:"checkpoint_name"`
	Latitude         float64   `json:"latitude"`
	Longitude        float64   `json:"longitude"`
	WeatherCondition string    `json:"weather_condition"`
	RainProbability  float64   `json:"rain_probability"`
	EstimatedAt      time.Time `json:"estimated_at"`
}

// RouteWeatherResponse represents GET /api/v1/travel/{id}/weather.
type RouteWeatherResponse struct {
	Route                TravelRoute            `json:"route"`
	OverallRainRisk      string                 `json:"overall_rain_risk"`
	DepartureAdvice      string                 `json:"departure_advice"`
	Waypoints            []RouteWaypointWeather `json:"waypoints"`
	GeneratedAt          time.Time              `json:"generated_at"`
}

// CommunityReport represents a user-submitted local weather or hazard report.
type CommunityReport struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"user_id"`
	ReportType         string    `json:"report_type"` // "local_rain" | "flood_puddle" | "fallen_tree" | "strong_wind"
	Description        string    `json:"description"`
	Latitude           float64   `json:"latitude"`
	Longitude          float64   `json:"longitude"`
	ImageURL           string    `json:"image_url,omitempty"`
	VerificationStatus string    `json:"verification_status"`
	Upvotes            int       `json:"upvotes"`
	Downvotes          int       `json:"downvotes"`
	CreatedAt          time.Time `json:"created_at"`
}

// CreateCommunityReportRequest defines POST /api/v1/community/reports payload.
type CreateCommunityReportRequest struct {
	ReportType  string  `json:"report_type"`
	Description string  `json:"description"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	ImageURL    string  `json:"image_url,omitempty"`
}

// VoteReportRequest defines POST /api/v1/community/reports/{id}/vote payload.
type VoteReportRequest struct {
	VoteType string `json:"vote_type"` // "upvote" | "downvote"
}
