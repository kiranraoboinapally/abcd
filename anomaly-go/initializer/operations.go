// Package initializer handles the setup and initialization of application components.
// It centralizes the creation of database connections, service layers, and other
// dependencies required for the application to run.
package initializer

import (
	// Internal project packages
	"anomaly-go/config/readenv"
	"anomaly-go/database"
	"anomaly-go/initializer/database/postgres"
	"anomaly-go/log"
	anomaly "anomaly-go/service/anomaly"

	"go.uber.org/zap" // FIX: Added zap import for structured fields
)

// App is a struct that holds all the core dependencies of the application,
// such as the database connection and the main service layer. This allows for
// clean dependency injection throughout the application.
type App struct {
	DB      *database.DBStore
	Service *anomaly.Service
}

// InitializeApp sets up the entire application with all its dependencies.
func InitializeApp(cfg *readenv.AppConfig) (*App, error) {
	// FIX: Use correct logger variable 'log.WriteLog' and proper zap syntax.
	log.WriteLog.Info("Starting application initialization...")

	// 1. Initialize database connection
	log.WriteLog.Info("Initializing database connection...")
	// FIX: Pass the correct DBConfig sub-struct to NewDBStore.
	db, err := database.NewDBStore(&cfg.DBConfig)
	if err != nil {
		// FIX: Use correct logger variable and syntax.
		log.WriteLog.Error("Failed to initialize database store", zap.Error(err))
		return nil, err
	}
	log.WriteLog.Info("Database connection successful.")

	// 2. Bootstrap database schema
	log.WriteLog.Info("Bootstrapping database schema...")
	if err := postgres.BootstrapSchema(db); err != nil {
		// FIX: Use correct logger variable and syntax.
		log.WriteLog.Error("Failed to bootstrap database schema", zap.Error(err))
		return nil, err
	}
	log.WriteLog.Info("Database schema bootstrapped.")

	// 3. Insert initial data
	log.WriteLog.Info("Inserting initial data...")
	if err := postgres.InsertInitialData(db); err != nil {
		// FIX: Use correct logger variable and syntax.
		log.WriteLog.Error("Failed to insert initial data", zap.Error(err))
		return nil, err
	}
	log.WriteLog.Info("Initial data inserted.")

	// 4. Initialize service layer
	log.WriteLog.Info("Initializing services...")
	service := anomaly.NewService(db.DB, cfg)
	log.WriteLog.Info("Services initialized.")

	// Return the fully initialized App struct
	log.WriteLog.Info("✅ Application initialized successfully")
	return &App{
		DB:      db,
		Service: service,
	}, nil
}
