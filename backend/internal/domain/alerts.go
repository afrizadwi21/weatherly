package domain

import "time"

// WeatherAlert represents an active or historical extreme weather / rain warning.
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

// NotificationDevice represents a user's registered FCM push device.
type NotificationDevice struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	FCMToken     string    `json:"fcm_token"`
	Platform     string    `json:"platform"`
	IsActive     bool      `json:"is_active"`
	RegisteredAt time.Time `json:"registered_at"`
}

// RegisterDeviceRequest defines POST /api/v1/devices/register payload.
type RegisterDeviceRequest struct {
	FCMToken string `json:"fcm_token"`
	Platform string `json:"platform"`
}

// NotificationLog represents a deduplicated push notification dispatch record.
type NotificationLog struct {
	ID        string    `json:"id"`
	AlertID   string    `json:"alert_id"`
	DeviceID  string    `json:"device_id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Status    string    `json:"status"`
	SentAt    time.Time `json:"sent_at"`
}
