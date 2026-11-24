package service

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/domain"
)

var (
	ErrRouteNotFound   = errors.New("travel route not found")
	ErrReportNotFound  = errors.New("community report not found")
	ErrAlreadyVoted    = errors.New("user has already voted on this community report")
)

// TravelCommunityService manages Smart Travel corridors and Community Reports with unique voting.
type TravelCommunityService struct {
	mu          sync.RWMutex
	routes      map[string]domain.TravelRoute
	reports     map[string]domain.CommunityReport
	uniqueVotes map[string]string // key: "reportID:userID" -> voteType
}

func NewTravelCommunityService() *TravelCommunityService {
	s := &TravelCommunityService{
		routes:      make(map[string]domain.TravelRoute),
		reports:     make(map[string]domain.CommunityReport),
		uniqueVotes: make(map[string]string),
	}
	s.seedBandungCommunityData()
	return s
}

func (s *TravelCommunityService) seedBandungCommunityData() {
	now := time.Now().UTC()
	r1 := domain.CommunityReport{
		ID:                 "comm-bdg-01",
		UserID:             "system",
		ReportType:         "local_rain",
		Description:        "Hujan deras disertai angin cukup kencang mulai turun di sekitar Simpang Dago & Dipatiukur.",
		Latitude:           -6.8904,
		Longitude:          107.6158,
		VerificationStatus: "verified",
		Upvotes:            5,
		Downvotes:          0,
		CreatedAt:          now.Add(-15 * time.Minute),
	}
	s.reports[r1.ID] = r1
}

func (s *TravelCommunityService) CreateRoute(userID string, req domain.CreateTravelRouteRequest) domain.TravelRoute {
	s.mu.Lock()
	defer s.mu.Unlock()

	route := domain.TravelRoute{
		ID:             fmt.Sprintf("route-%d", len(s.routes)+1),
		UserID:         userID,
		RouteName:      strings.TrimSpace(req.RouteName),
		OriginLat:      req.OriginLat,
		OriginLon:      req.OriginLon,
		DestinationLat: req.DestinationLat,
		DestinationLon: req.DestinationLon,
		CreatedAt:      time.Now().UTC(),
	}
	s.routes[route.ID] = route
	return route
}

func (s *TravelCommunityService) AnalyzeRouteWeather(routeID string) (domain.RouteWeatherResponse, error) {
	s.mu.RLock()
	route, ok := s.routes[routeID]
	s.mu.RUnlock()
	if !ok {
		return domain.RouteWeatherResponse{}, ErrRouteNotFound
	}

	now := time.Now().UTC()
	midLat := (route.OriginLat + route.DestinationLat) / 2
	midLon := (route.OriginLon + route.DestinationLon) / 2

	waypoints := []domain.RouteWaypointWeather{
		{
			CheckpointName:   "Titik Keberangkatan (Origin)",
			Latitude:         route.OriginLat,
			Longitude:        route.OriginLon,
			WeatherCondition: "CLOUDY",
			RainProbability:  0.40,
			EstimatedAt:      now,
		},
		{
			CheckpointName:   "Titik Tengah Koridor Rute (Midpoint)",
			Latitude:         midLat,
			Longitude:        midLon,
			WeatherCondition: "MODERATE_RAIN",
			RainProbability:  0.78,
			EstimatedAt:      now.Add(20 * time.Minute),
		},
		{
			CheckpointName:   "Titik Tujuan (Destination)",
			Latitude:         route.DestinationLat,
			Longitude:        route.DestinationLon,
			WeatherCondition: "LIGHT_RAIN",
			RainProbability:  0.65,
			EstimatedAt:      now.Add(40 * time.Minute),
		},
	}

	return domain.RouteWeatherResponse{
		Route:           route,
		OverallRainRisk: "medium_high",
		DepartureAdvice: "Terdeteksi potensi hujan sedang (78%) di titik tengah perjalanan dalam ~20 menit. Gunakan jas hujan atau tunda keberangkatan sekitar 35 menit.",
		Waypoints:       waypoints,
		GeneratedAt:     now,
	}, nil
}

func (s *TravelCommunityService) ListReports() []domain.CommunityReport {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]domain.CommunityReport, 0, len(s.reports))
	for _, r := range s.reports {
		res = append(res, r)
	}
	return res
}

func (s *TravelCommunityService) CreateReport(userID string, req domain.CreateCommunityReportRequest) domain.CommunityReport {
	s.mu.Lock()
	defer s.mu.Unlock()

	rep := domain.CommunityReport{
		ID:                 fmt.Sprintf("comm-bdg-%02d", len(s.reports)+1),
		UserID:             userID,
		ReportType:         strings.TrimSpace(req.ReportType),
		Description:        strings.TrimSpace(req.Description),
		Latitude:           req.Latitude,
		Longitude:          req.Longitude,
		ImageURL:           req.ImageURL,
		VerificationStatus: "pending",
		Upvotes:            0,
		Downvotes:          0,
		CreatedAt:          time.Now().UTC(),
	}
	s.reports[rep.ID] = rep
	return rep
}

// VoteReport enforces UNIQUE(report_id, user_id) so one user cannot vote repeatedly.
func (s *TravelCommunityService) VoteReport(reportID, userID, voteType string) (domain.CommunityReport, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	rep, ok := s.reports[reportID]
	if !ok {
		return domain.CommunityReport{}, ErrReportNotFound
	}

	uniqueKey := reportID + ":" + userID
	if _, exists := s.uniqueVotes[uniqueKey]; exists {
		return domain.CommunityReport{}, ErrAlreadyVoted
	}

	s.uniqueVotes[uniqueKey] = voteType
	if strings.ToLower(voteType) == "downvote" {
		rep.Downvotes++
	} else {
		rep.Upvotes++
		if rep.Upvotes >= 3 {
			rep.VerificationStatus = "verified"
		}
	}
	s.reports[reportID] = rep
	return rep, nil
}
