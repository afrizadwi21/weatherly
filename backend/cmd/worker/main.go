package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/domain"
	"github.com/afrizadwi21/weatherly/backend/internal/provider"
	"github.com/afrizadwi21/weatherly/backend/internal/service"
)

func main() {
	cfg := config.Load()
	weatherClient := provider.NewWeatherClient(cfg.OpenMeteoBaseURL)
	weatherSvc := service.NewWeatherService(weatherClient)
	alertSvc := service.NewAlertService()

	defaultLoc := domain.Location{
		ID:        "loc-bandung-default",
		Name:      cfg.DefaultRegionName,
		Latitude:  cfg.DefaultLatitude,
		Longitude: cfg.DefaultLongitude,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Printf("[weatherly-worker] starting proactive rain & extreme weather scheduler (region=%s)", cfg.DefaultRegionName)
	runEvaluationCycle(ctx, weatherSvc, alertSvc, defaultLoc)

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("[weatherly-worker] shutting down gracefully")
			return
		case <-ticker.C:
			runEvaluationCycle(ctx, weatherSvc, alertSvc, defaultLoc)
		}
	}
}

func runEvaluationCycle(ctx context.Context, weatherSvc *service.WeatherService, alertSvc *service.AlertService, loc domain.Location) {
	pred := weatherSvc.PredictRain(ctx, loc)
	if pred.WillRainSoon && pred.EstimatedArrivalMins != nil {
		bucket := time.Now().UTC().Format("2006-01-02-15")
		alert, created := alertSvc.EvaluateAndCreateAlert(
			loc,
			"RAIN_ARRIVAL_NOWCAST",
			"medium",
			"Peringatan Hujan Segera Tiba — "+loc.Name,
			pred.AlertMessage,
			bucket,
		)
		if created {
			log.Printf("[weatherly-worker] emitted new proactive alert id=%s dedup_key=%s", alert.ID, alert.DedupKey)
		}
	}
}
