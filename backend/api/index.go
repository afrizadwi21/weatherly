package handler

import (
	"net/http"
	"sync"

	"github.com/afrizadwi21/weatherly/backend/internal/config"
	"github.com/afrizadwi21/weatherly/backend/internal/handler"
)

var (
	once sync.Once
	mux  *http.ServeMux
)

// Handler is the Vercel Serverless Function entrypoint for the Golang backend (/api/v1/*).
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() {
		cfg := config.Load()
		mux = handler.NewMux(cfg)
	})
	mux.ServeHTTP(w, r)
}
