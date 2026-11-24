package service

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/domain"
)

// AlertService manages extreme weather alerts, deduplication keys, and FCM device logs.
type AlertService struct {
	mu          sync.RWMutex
	alerts      map[string]domain.WeatherAlert
	byDedupKey  map[string]string
	devices     map[string]domain.NotificationDevice
	logs        []domain.NotificationLog
	sentPairKey map[string]bool
}

func NewAlertService() *AlertService {
	s := &AlertService{
		alerts:      make(map[string]domain.WeatherAlert),
		byDedupKey:  make(map[string]string),
		devices:     make(map[string]domain.NotificationDevice),
		logs:        make([]domain.NotificationLog, 0),
		sentPairKey: make(map[string]bool),
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
		Description: "BMKG & Rain Engine mendeteksi pertumbuhan awan konvektif aktif di wilayah Bandung Utara dan Pusat. Potensi hujan sedang-lebat disertai kilat/petir dan angin kencang dalam 20–45 menit ke depan.",
		Source:      "BMKG Warning + Weatherly Rain Engine",
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
		Source:      "Weatherly Automated Alert Engine",
		DedupKey:    dedupKey,
		StartsAt:    now,
		ExpiresAt:   now.Add(90 * time.Minute),
		CreatedAt:   now,
	}
	s.alerts[alert.ID] = alert
	s.byDedupKey[dedupKey] = alert.ID
	s.dispatchToRegisteredDevicesLocked(alert)
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

// RegisterDevice registers or updates a user's FCM token and dispatches active alerts once.
func (s *AlertService) RegisterDevice(userID string, req domain.RegisterDeviceRequest) domain.NotificationDevice {
	s.mu.Lock()
	defer s.mu.Unlock()

	platform := strings.ToLower(strings.TrimSpace(req.Platform))
	if platform == "" {
		platform = "android"
	}
	dev := domain.NotificationDevice{
		ID:           fmt.Sprintf("dev-%d", len(s.devices)+1),
		UserID:       userID,
		FCMToken:     strings.TrimSpace(req.FCMToken),
		Platform:     platform,
		IsActive:     true,
		RegisteredAt: time.Now().UTC(),
	}
	s.devices[dev.FCMToken] = dev
	for _, alert := range s.alerts {
		s.sendAlertToDeviceLocked(alert, dev)
	}
	return dev
}

func (s *AlertService) ListNotifications(userID string) []domain.NotificationLog {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]domain.NotificationLog, 0)
	for _, l := range s.logs {
		if l.UserID == userID {
			res = append(res, l)
		}
	}
	return res
}

func (s *AlertService) dispatchToRegisteredDevicesLocked(alert domain.WeatherAlert) {
	for _, dev := range s.devices {
		s.sendAlertToDeviceLocked(alert, dev)
	}
}

func (s *AlertService) sendAlertToDeviceLocked(alert domain.WeatherAlert, dev domain.NotificationDevice) {
	pairKey := alert.ID + ":" + dev.ID
	if s.sentPairKey[pairKey] {
		return // Deduplication Guard: never send duplicate push for same (alert_id, device_id)
	}
	s.sentPairKey[pairKey] = true
	s.logs = append(s.logs, domain.NotificationLog{
		ID:       fmt.Sprintf("notif-%d", len(s.logs)+1),
		AlertID:  alert.ID,
		DeviceID: dev.ID,
		UserID:   dev.UserID,
		Title:    alert.Title,
		Body:     alert.Description,
		Status:   "delivered",
		SentAt:   time.Now().UTC(),
	})
}
