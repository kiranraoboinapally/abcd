// File: database/postgres.go

package database

import (
	"fmt"

	"anomaly-go/config/readenv"
	"anomaly-go/log"

	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DBStore now holds the GORM database instance.
type DBStore struct {
	// This is the correct GORM DB object that the rest of your app expects.
	// The field is named 'DB' and is exported (capital 'D').
	DB *gorm.DB
}

// NewDBStore connects to the PostgreSQL database using GORM.
func NewDBStore(cfg *readenv.PostgresDBConfiguration) (*DBStore, error) {
	if len(cfg.DBDataVal) == 0 {
		return nil, fmt.Errorf("no database host configuration found in DBDataVal")
	}
	dbHost := cfg.DBDataVal[0].DBHostName
	dbPort := cfg.DBDataVal[0].DBPort

	// Create the Data Source Name (DSN) for GORM
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	log.WriteLog.Info("Attempting database connection with GORM",
		zap.String("host", dbHost),
		zap.Int("port", dbPort),
		zap.String("user", cfg.DBUser),
		zap.String("database", cfg.DBName),
	)

	// Open the database connection using GORM's Postgres driver
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.WriteLog.Error("Failed to connect to database using GORM", zap.Error(err))
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	log.WriteLog.Info("✅ GORM database connection established")

	// Return the new DBStore containing the GORM DB instance
	return &DBStore{DB: db}, nil
}