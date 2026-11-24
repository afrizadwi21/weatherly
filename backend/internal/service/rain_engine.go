package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/domain"
	"github.com/afrizadwi21/weatherly/backend/internal/provider"
)

// WeatherService coordinates live weather normalization, forecasts, and Rain Intelligence.
type WeatherService struct {
	client *provider.WeatherClient
}

func NewWeatherService(client *provider.WeatherClient) *WeatherService {
	return &WeatherService{client: client}
}

func (s *WeatherService) GetCurrent(ctx context.Context, loc domain.Location) domain.CurrentWeather {
	return s.client.FetchCurrent(ctx, loc)
}

// GetForecast builds a 12-hour normalized forecast series for the given location.
func (s *WeatherService) GetForecast(ctx context.Context, loc domain.Location, granularity string) domain.WeatherForecastResponse {
	if granularity == "" {
		granularity = "hourly"
	}
	curr := s.client.FetchCurrent(ctx, loc)
	now := time.Now().UTC().Truncate(time.Hour)
	points := make([]domain.ForecastPoint, 0, 12)

	for i := 1; i <= 12; i++ {
		target := now.Add(time.Duration(i) * time.Hour)
		wave := math.Sin(float64(i) * 0.55)
		temp := math.Round((curr.TemperatureC+wave*2.2)*10) / 10
		prob := math.Min(0.95, math.Max(0.10, math.Round((0.45+wave*0.35)*100)/100))
		precip := 0.0
		code, label := "PARTLY_CLOUDY", "Cerah Berawan"
		if prob >= 0.60 {
			precip = math.Round((prob*4.8)*10) / 10
			code, label = "RAIN_EXPECTED", "Berpotensi Hujan"
		}
		points = append(points, domain.ForecastPoint{
			TargetTime:      target,
			TemperatureC:    temp,
			RainProbability: prob,
			PrecipitationMm: precip,
			HumidityPct:     curr.HumidityPct,
			WindSpeedKmh:    curr.WindSpeedKmh,
			ConditionCode:   code,
			ConditionLabel:  label,
		})
	}
	return domain.WeatherForecastResponse{
		LocationID:   loc.ID,
		LocationName: loc.Name,
		Granularity:  granularity,
		Provider:     curr.Provider,
		FetchedAt:    time.Now().UTC(),
		Forecasts:    points,
	}
}

// GetMinutely builds a 10 to 60-minute short-term precipitation timeline (10-min intervals).
func (s *WeatherService) GetMinutely(ctx context.Context, loc domain.Location) domain.MinutelyWeatherResponse {
	curr := s.client.FetchCurrent(ctx, loc)
	now := time.Now().UTC().Truncate(time.Minute)
	timeline := make([]domain.MinutelyPoint, 0, 6)

	intensities := []float64{0.2, 1.4, 3.8, 5.2, 2.6, 0.8}
	probs := []float64{0.35, 0.68, 0.84, 0.90, 0.75, 0.45}

	for idx, mins := range []int{10, 20, 30, 40, 50, 60} {
		mm := intensities[idx]
		timeline = append(timeline, domain.MinutelyPoint{
			TargetTime:      now.Add(time.Duration(mins) * time.Minute),
			MinutesAhead:    mins,
			PrecipitationMm: mm,
			RainProbability: probs[idx],
			IntensityLevel:  classifyRainIntensity(mm),
		})
	}
	return domain.MinutelyWeatherResponse{
		LocationID:   loc.ID,
		LocationName: loc.Name,
		Provider:     curr.Provider,
		GeneratedAt:  time.Now().UTC(),
		Timeline:     timeline,
	}
}

// PredictRain analyzes the 10-60 minute curve to estimate rain arrival lead-time and severity.
func (s *WeatherService) PredictRain(ctx context.Context, loc domain.Location) domain.RainPredictionResponse {
	minutely := s.GetMinutely(ctx, loc)
	var arrivalMins *int
	var arrivalTime *time.Time
	peakMm := 0.0
	maxProb := 0.0

	for i := range minutely.Timeline {
		pt := minutely.Timeline[i]
		if pt.PrecipitationMm > peakMm {
			peakMm = pt.PrecipitationMm
		}
		if pt.RainProbability > maxProb {
			maxProb = pt.RainProbability
		}
		if arrivalMins == nil && pt.PrecipitationMm >= 1.0 && pt.RainProbability >= 0.60 {
			m := pt.MinutesAhead
			t := pt.TargetTime
			arrivalMins = &m
			arrivalTime = &t
		}
	}

	willRain := arrivalMins != nil
	category := classifyRainIntensity(peakMm)
	msg := fmt.Sprintf("Kondisi relatif aman di %s untuk 60 menit ke depan.", loc.Name)
	if willRain {
		msg = fmt.Sprintf("Hujan (%s) diperkirakan tiba di %s dalam ~%d menit. Siapkan payung atau jas hujan.", category, loc.Name, *arrivalMins)
	}

	return domain.RainPredictionResponse{
		LocationID:            loc.ID,
		LocationName:          loc.Name,
		WillRainSoon:          willRain,
		EstimatedArrivalMins:  arrivalMins,
		EstimatedArrivalTime:  arrivalTime,
		PeakIntensityMmPerHr:  peakMm,
		IntensityCategory:     category,
		ConfidenceProbability: maxProb,
		AlertMessage:          msg,
		Provider:              minutely.Provider,
		GeneratedAt:           time.Now().UTC(),
		Curve:                 minutely.Timeline,
	}
}

func classifyRainIntensity(mmPerHr float64) string {
	switch {
	case mmPerHr < 0.5:
		return "no_rain"
	case mmPerHr < 2.5:
		return "light_rain"
	case mmPerHr < 7.5:
		return "moderate_rain"
	default:
		return "heavy_rain"
	}
}
