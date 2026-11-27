package repository

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/afrizadwi21/weatherly/backend/core/domain"
)

var (
	ErrUserAlreadyExists = errors.New("email is already registered")
	ErrUserNotFound      = errors.New("user not found")
	ErrLocationNotFound  = errors.New("location not found")
)

// Store provides thread-safe persistence for Users and Locations.
type Store struct {
	mu        sync.RWMutex
	users     map[string]domain.User
	byEmail   map[string]string
	locations map[string]domain.Location
}

// NewStore initializes a Store pre-seeded with the default Bandung monitoring location.
func NewStore() *Store {
	s := &Store{
		users:     make(map[string]domain.User),
		byEmail:   make(map[string]string),
		locations: make(map[string]domain.Location),
	}
	defaultLoc := domain.Location{
		ID:         "loc-bandung-default",
		UserID:     "system",
		Name:       "Bandung",
		RegionCode: "32.73.01.1001",
		Latitude:   -6.9175,
		Longitude:  107.6191,
		IsFavorite: true,
		CreatedAt:  time.Now().UTC(),
	}
	s.locations[defaultLoc.ID] = defaultLoc
	return s
}

func (s *Store) CreateUser(email, passwordHash, fullName string) (domain.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	normEmail := strings.ToLower(strings.TrimSpace(email))
	if _, exists := s.byEmail[normEmail]; exists {
		return domain.User{}, ErrUserAlreadyExists
	}
	user := domain.User{
		ID:           newUUID(),
		Email:        normEmail,
		PasswordHash: passwordHash,
		FullName:     strings.TrimSpace(fullName),
		CreatedAt:    time.Now().UTC(),
	}
	s.users[user.ID] = user
	s.byEmail[normEmail] = user.ID
	return user, nil
}

func (s *Store) GetUserByEmail(email string) (domain.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	id, ok := s.byEmail[strings.ToLower(strings.TrimSpace(email))]
	if !ok {
		return domain.User{}, ErrUserNotFound
	}
	return s.users[id], nil
}

func (s *Store) GetUserByID(id string) (domain.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	u, ok := s.users[id]
	if !ok {
		return domain.User{}, ErrUserNotFound
	}
	return u, nil
}

func (s *Store) CreateLocation(userID string, req domain.CreateLocationRequest) domain.Location {
	s.mu.Lock()
	defer s.mu.Unlock()

	loc := domain.Location{
		ID:         newUUID(),
		UserID:     userID,
		Name:       strings.TrimSpace(req.Name),
		RegionCode: req.RegionCode,
		Latitude:   req.Latitude,
		Longitude:  req.Longitude,
		IsFavorite: req.IsFavorite,
		CreatedAt:  time.Now().UTC(),
	}
	s.locations[loc.ID] = loc
	return loc
}

func (s *Store) ListLocations(userID string) []domain.Location {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]domain.Location, 0, len(s.locations))
	for _, loc := range s.locations {
		if loc.UserID == "system" || loc.UserID == userID {
			result = append(result, loc)
		}
	}
	return result
}

func (s *Store) UpdateLocation(id, userID string, req domain.UpdateLocationRequest) (domain.Location, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	loc, ok := s.locations[id]
	if !ok || (loc.UserID != userID && loc.UserID != "system") {
		return domain.Location{}, ErrLocationNotFound
	}
	if req.Name != nil && strings.TrimSpace(*req.Name) != "" {
		loc.Name = strings.TrimSpace(*req.Name)
	}
	if req.IsFavorite != nil {
		loc.IsFavorite = *req.IsFavorite
	}
	s.locations[id] = loc
	return loc, nil
}

func newUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return fmt.Sprintf("%s-%s-%s-%s-%s",
		hex.EncodeToString(b[0:4]),
		hex.EncodeToString(b[4:6]),
		hex.EncodeToString(b[6:8]),
		hex.EncodeToString(b[8:10]),
		hex.EncodeToString(b[10:16]))
}
