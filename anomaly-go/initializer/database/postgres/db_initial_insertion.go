package postgres

import (
	"anomaly-go/database"
	"anomaly-go/log"
)

// InsertInitialData adds initial data (e.g., default threshold) using GORM.
func InsertInitialData(db *database.DBStore) error {
	log.WriteLog.Info("✅ Database setup checks complete (no default threshold inserted)")
	return nil
}
