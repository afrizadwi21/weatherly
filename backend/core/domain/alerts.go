package domain

import "time"

// WeatherAlert represents an active or historical extreme weather / rain warning for Web Dashboard & Saved Locations.
type WeatherAlert struct {
	ID          string    `json:"id"`
	LocationID  string    `json:"location_id"`
	Location    string    `json:"location_name"`
	AlertType   string    `json:"alert_type"`
	Severity    string    `json:"severity"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Source      string    `json:"source"`
	DedupKey    string    `json:"dedup_key"`
	StartsAt    time.Time `json:"starts_at"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
}
