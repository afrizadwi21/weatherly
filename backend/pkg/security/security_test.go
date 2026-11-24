package security

import (
	"testing"
)

func TestPasswordHashAndVerify(t *testing.T) {
	hash, err := HashPassword("WeatherlyBandung2026!")
	if err != nil {
		t.Fatalf("unexpected error hashing password: %v", err)
	}
	if !VerifyPassword("WeatherlyBandung2026!", hash) {
		t.Errorf("expected password verification to succeed")
	}
	if VerifyPassword("WrongPassword", hash) {
		t.Errorf("expected wrong password verification to fail")
	}
}

func TestGenerateAndValidateJWT(t *testing.T) {
	secret := "test-jwt-secret-key-weatherly"
	token, err := GenerateJWT("user-uuid-1", "afriza@weatherly.id", secret, 30)
	if err != nil {
		t.Fatalf("unexpected error generating JWT: %v", err)
	}

	claims, err := ValidateJWT(token, secret)
	if err != nil {
		t.Fatalf("unexpected error validating JWT: %v", err)
	}
	if claims.UserID != "user-uuid-1" || claims.Email != "afriza@weatherly.id" {
		t.Errorf("unexpected claims: %+v", claims)
	}

	if _, err := ValidateJWT(token, "wrong-secret"); err == nil {
		t.Errorf("expected signature validation failure with wrong secret")
	}
}
