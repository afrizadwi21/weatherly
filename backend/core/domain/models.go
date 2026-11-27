package domain

import "time"

// User represents a registered Weatherly platform user.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	CreatedAt    time.Time `json:"created_at"`
}

// Location represents a monitored geographical point (PostGIS 4326 compatible).
type Location struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Name       string    `json:"name"`
	RegionCode string    `json:"region_code,omitempty"`
	Latitude   float64   `json:"latitude"`
	Longitude  float64   `json:"longitude"`
	IsFavorite bool      `json:"is_favorite"`
	CreatedAt  time.Time `json:"created_at"`
}

// RegisterRequest defines the payload for POST /api/v1/auth/register.
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

// LoginRequest defines the payload for POST /api/v1/auth/login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse defines the response returned on successful registration or login.
type AuthResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	User        User   `json:"user"`
}

// CreateLocationRequest defines the payload for POST /api/v1/locations.
type CreateLocationRequest struct {
	Name       string  `json:"name"`
	RegionCode string  `json:"region_code,omitempty"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	IsFavorite bool    `json:"is_favorite"`
}

// UpdateLocationRequest defines the payload for PATCH /api/v1/locations/{id}.
type UpdateLocationRequest struct {
	Name       *string `json:"name,omitempty"`
	IsFavorite *bool   `json:"is_favorite,omitempty"`
}
