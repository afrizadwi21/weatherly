package security

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

const hashIterations = 15000

// HashPassword generates a salted iterative SHA-256 password hash.
func HashPassword(password string) (string, error) {
	if len(password) < 6 {
		return "", errors.New("password must be at least 6 characters")
	}
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	dk := deriveKey([]byte(password), salt, hashIterations)
	return fmt.Sprintf("sha256$%d$%s$%s", hashIterations, hex.EncodeToString(salt), hex.EncodeToString(dk)), nil
}

// VerifyPassword compares a plaintext password with a stored salted hash in constant time.
func VerifyPassword(password, encodedHash string) bool {
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 4 || parts[0] != "sha256" {
		return false
	}
	salt, err := hex.DecodeString(parts[2])
	if err != nil {
		return false
	}
	expected, err := hex.DecodeString(parts[3])
	if err != nil {
		return false
	}
	actual := deriveKey([]byte(password), salt, hashIterations)
	return subtle.ConstantTimeCompare(actual, expected) == 1
}

func deriveKey(password, salt []byte, iterations int) []byte {
	mac := hmac.New(sha256.New, password)
	mac.Write(salt)
	digest := mac.Sum(nil)
	for i := 1; i < iterations; i++ {
		mac.Reset()
		mac.Write(digest)
		digest = mac.Sum(nil)
	}
	return digest
}

// Claims represents the JWT payload for authenticated Weatherly users.
type Claims struct {
	UserID    string `json:"sub"`
	Email     string `json:"email"`
	ExpiresAt int64  `json:"exp"`
	IssuedAt  int64  `json:"iat"`
}

// GenerateJWT creates an HS256 signed JWT token string.
func GenerateJWT(userID, email, secret string, expiryMinutes int) (string, error) {
	headerJSON := `{"alg":"HS256","typ":"JWT"}`
	now := time.Now().UTC()
	claims := Claims{
		UserID:    userID,
		Email:     email,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(time.Duration(expiryMinutes) * time.Minute).Unix(),
	}
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	unsigned := encodeSegment([]byte(headerJSON)) + "." + encodeSegment(claimsBytes)
	sig := signHS256(unsigned, secret)
	return unsigned + "." + encodeSegment(sig), nil
}

// ValidateJWT verifies the HS256 signature and expiration of a JWT token string.
func ValidateJWT(tokenStr, secret string) (*Claims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}
	unsigned := parts[0] + "." + parts[1]
	sig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || !hmac.Equal(sig, signHS256(unsigned, secret)) {
		return nil, errors.New("invalid token signature")
	}
	claimsBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid token payload")
	}
	var claims Claims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return nil, err
	}
	if time.Now().UTC().Unix() > claims.ExpiresAt {
		return nil, errors.New("token has expired")
	}
	return &claims, nil
}

func encodeSegment(b []byte) string { return base64.RawURLEncoding.EncodeToString(b) }

func signHS256(unsigned, secret string) []byte {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(unsigned))
	return mac.Sum(nil)
}
