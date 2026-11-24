package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
)

func TestHealthHandler(t *testing.T) {
	cfg := config.Load()
	mux := NewMux(cfg)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d", rec.Code)
	}

	var body HealthResponse
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response JSON: %v", err)
	}

	if body.Status != "ok" {
		t.Errorf("expected status 'ok', got %q", body.Status)
	}
	if body.Region != "Bandung" {
		t.Errorf("expected default region 'Bandung', got %q", body.Region)
	}
}

func TestAuthAndLocationFlow(t *testing.T) {
	cfg := config.Load()
	mux := NewMux(cfg)

	regPayload := []byte(`{"email":"afriza@weatherly.id","password":"Password123!","full_name":"Afriza Dwi"}`)
	regReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(regPayload))
	regRec := httptest.NewRecorder()
	mux.ServeHTTP(regRec, regReq)

	if regRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created on register, got %d: %s", regRec.Code, regRec.Body.String())
	}

	var authResp domain.AuthResponse
	_ = json.NewDecoder(regRec.Body).Decode(&authResp)

	locPayload := []byte(`{"name":"Dago Bandung","latitude":-6.8850,"longitude":107.6135,"is_favorite":true}`)
	locReq := httptest.NewRequest(http.MethodPost, "/api/v1/locations", bytes.NewReader(locPayload))
	locReq.Header.Set("Authorization", "Bearer "+authResp.AccessToken)
	locRec := httptest.NewRecorder()
	mux.ServeHTTP(locRec, locReq)

	if locRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created on location create, got %d: %s", locRec.Code, locRec.Body.String())
	}
}
