// File: main.go

package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"anomaly-go/config/readenv"
	"anomaly-go/controller"
	"anomaly-go/initializer"
	"anomaly-go/log"
	"anomaly-go/router"

	"go.uber.org/zap"
)

func main() {
	// --- Initialize all loggers first ---
	if err := log.InitLogs(); err != nil {
		fmt.Printf("Failed to initialize loggers: %v\n", err)
		os.Exit(1)
	}

	// --- Load configuration ---
	cfg, err := readenv.Load()
	if err != nil {
		fmt.Printf("Could not load configuration: %v\n", err)
		os.Exit(1)
	}

	// --- Initialize dependencies (DB, Service, etc.) ---
	app, err := initializer.InitializeApp(cfg)
	if err != nil {
		log.WriteLog.Fatal("Initialization failed", zap.Error(err))
	}
	// REMOVED: defer app.DB.Close() is not needed with GORM v2.

	// --- Create the API controller ---
	// UPDATED: Create the API controller using the initialized service.
	apiController := controller.NewAPI(app.Service)

	// --- Setup router ---
	// UPDATED: Pass the controller and the secret key to the router.
	r := router.SetupRouter(apiController, string(cfg.JWTSecret))

	serverAddr := fmt.Sprintf(":%d", cfg.RestConfig.GinData.PublicServerPort)

	// --- Create and configure HTTP server ---
	srv := &http.Server{
		Addr:    serverAddr,
		Handler: r,
	}

	// --- Start server in a goroutine ---
	go func() {
		log.WriteLog.Info("Server starting", zap.String("port", serverAddr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.WriteLog.Fatal("Server listen error", zap.Error(err))
		}
	}()

	// --- Graceful shutdown ---
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.WriteLog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.WriteLog.Fatal("Server forced to shutdown", zap.Error(err))
	}

	log.WriteLog.Info("Server exiting gracefully")
}
