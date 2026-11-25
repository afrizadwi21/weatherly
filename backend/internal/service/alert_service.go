package service

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/domain"
)

// AlertService manages extreme weather alerts and deduplication keys for Web saved-location alerts.
type AlertService struct {
	mu         sync.RWMutex
	alerts     map[string]domain.WeatherAlert
	byDedupKey map[string]string
}

func NewAlertService() *AlertService {
	s := &AlertService{
		alerts:     make(map[string]domain.WeatherAlert),
		byDedupKey: make(map[string]string),
	}
	s.seedBandungAlerts()
	return s
}

func (s *AlertService) seedBandungAlerts() {
	now := time.Now().UTC()
	a1 := domain.WeatherAlert{
		ID:          "alert-bandung-rain-01",
		LocationID:  "loc-bandung-default",
		Location:    "Bandung",
		AlertType:   "HEAVY_RAIN_THUNDERSTORM",
		Severity:    "high",
		Title:       "Peringatan Dini Hujan Lebat & Petir — Bandung",
		Description: "BMKG Jawa Barat (Kode 32) mendeteksi pertumbuhan awan konvektif aktif di wilayah Bandung Raya. Potensi hujan sedang-lebat disertai kilat/petir dan angin kencang.",
		Source:      "BMKG Provinsi Jawa Barat (Kode 32)",
		DedupKey:    fmt.Sprintf("bandung:heavy_rain:%s", now.Format("2006-01-02-15")),
		StartsAt:    now,
		ExpiresAt:   now.Add(2 * time.Hour),
		CreatedAt:   now,
	}
	s.alerts[a1.ID] = a1
	s.byDedupKey[a1.DedupKey] = a1.ID
}

// EvaluateAndCreateAlert creates an alert only if its deterministic dedup_key has not been emitted.
func (s *AlertService) EvaluateAndCreateAlert(loc domain.Location, alertType, severity, title, desc, timeBucket string) (domain.WeatherAlert, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	dedupKey := fmt.Sprintf("%s:%s:%s", loc.ID, strings.ToLower(alertType), timeBucket)
	if existingID, exists := s.byDedupKey[dedupKey]; exists {
		return s.alerts[existingID], false
	}

	now := time.Now().UTC()
	alert := domain.WeatherAlert{
		ID:          fmt.Sprintf("alert-%d", len(s.alerts)+1),
		LocationID:  loc.ID,
		Location:    loc.Name,
		AlertType:   alertType,
		Severity:    severity,
		Title:       title,
		Description: desc,
		Source:      "Weatherly Web Alert Engine",
		DedupKey:    dedupKey,
		StartsAt:    now,
		ExpiresAt:   now.Add(90 * time.Minute),
		CreatedAt:   now,
	}
	s.alerts[alert.ID] = alert
	s.byDedupKey[dedupKey] = alert.ID
	return alert, true
}

func (s *AlertService) ListAlerts() []domain.WeatherAlert {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]domain.WeatherAlert, 0, len(s.alerts))
	for _, a := range s.alerts {
		res = append(res, a)
	}
	return res
}

func (s *AlertService) GetAlertByID(id string) (domain.WeatherAlert, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	a, ok := s.alerts[id]
	return a, ok
}
