package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"anomaly-go/internal/api"
	"anomaly-go/internal/config"
	"anomaly-go/internal/database"
)

func main() {
	// 1. Load Configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Could not load configuration: %v", err)
	}

	// 2. Connect to Database
	db, err := database.NewDBStore(cfg)
	if err != nil {
		log.Fatalf("❌ Could not connect to the database: %v", err)
	}
	defer db.Close()

	// 3. Setup API Dependencies and Router
	apiInstance := &api.API{DB: db, Cfg: cfg}
	router := apiInstance.SetupRouter()

	// 4. Create and Configure HTTP Server
	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: router,
	}

	// 5. Start Server with Graceful Shutdown in a Goroutine
	go func() {
		log.Printf("✅ Server starting on port %s", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for an interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🚦 Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the requests it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("❌ Server forced to shutdown:", err)
	}

	log.Println("✅ Server exiting gracefully.")
}