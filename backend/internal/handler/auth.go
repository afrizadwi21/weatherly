package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
	"github.com/afrizadwi21/weatherly/backend/internal/repository"
	"github.com/afrizadwi21/weatherly/backend/pkg/security"
)

// AuthHandler manages user registration, login, and profile retrieval endpoints.
type AuthHandler struct {
	cfg   *config.Config
	store *repository.Store
}

func NewAuthHandler(cfg *config.Config, store *repository.Store) *AuthHandler {
	return &AuthHandler{cfg: cfg, store: store}
}

// Register handles POST /api/v1/auth/register.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req domain.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if !strings.Contains(req.Email, "@") || strings.TrimSpace(req.FullName) == "" {
		writeJSONError(w, http.StatusBadRequest, "valid email and full_name are required")
		return
	}

	hash, err := security.HashPassword(req.Password)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.store.CreateUser(req.Email, hash, req.FullName)
	if err != nil {
		if errors.Is(err, repository.ErrUserAlreadyExists) {
			writeJSONError(w, http.StatusConflict, err.Error())
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	h.respondWithToken(w, http.StatusCreated, user)
}

// Login handles POST /api/v1/auth/login.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req domain.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.store.GetUserByEmail(req.Email)
	if err != nil || !security.VerifyPassword(req.Password, user.PasswordHash) {
		writeJSONError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	h.respondWithToken(w, http.StatusOK, user)
}

// Me handles GET /api/v1/auth/me.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, err := extractBearerClaims(r, h.cfg.JWTSecretKey)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, err.Error())
		return
	}

	user, err := h.store.GetUserByID(claims.UserID)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) respondWithToken(w http.ResponseWriter, status int, user domain.User) {
	token, err := security.GenerateJWT(user.ID, user.Email, h.cfg.JWTSecretKey, h.cfg.JWTAccessExpiryMins)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "failed to generate access token")
		return
	}
	writeJSON(w, status, domain.AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   h.cfg.JWTAccessExpiryMins * 60,
		User:        user,
	})
}

func extractBearerClaims(r *http.Request, secret string) (*security.Claims, error) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, errors.New("missing or invalid Authorization Bearer header")
	}
	return security.ValidateJWT(strings.TrimPrefix(authHeader, "Bearer "), secret)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
