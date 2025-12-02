package postgres

import (
	"anomaly-go/database"
	"anomaly-go/log"
	"anomaly-go/model/postgres"

	"go.uber.org/zap"
)

// BootstrapSchema creates necessary tables and indexes using GORM AutoMigrate.
func BootstrapSchema(db *database.DBStore) error {
	log.WriteLog.Debug("Initializing database schema")

	// AutoMigrate creates tables based on model definitions
	err := db.DB.AutoMigrate(
		&postgres.Threshold{},
		&postgres.Transaction{},
		&postgres.DeviceHealth{},
		&postgres.BlScore{},
	)
	if err != nil {
		log.WriteLog.Error("Failed to auto-migrate tables", zap.Error(err))
		return err
	}

	// Create indexes for performance
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_anomaly_results_device_id ON anomaly_results (device_id)",
		"CREATE INDEX IF NOT EXISTS idx_anomaly_results_label ON anomaly_results (label)",
		"CREATE INDEX IF NOT EXISTS idx_battery_health_device_id ON battery_health (device_id)",
		"CREATE INDEX IF NOT EXISTS idx_battery_health_is_anomaly ON battery_health (is_anomaly)",
	}
	for _, idx := range indexes {
		if err := db.DB.Exec(idx).Error; err != nil {
			log.WriteLog.Error("Failed to create index", zap.String("index", idx), zap.Error(err))
			return err
		}
	}

	log.WriteLog.Info("✅ Database schema initialized with indexes")
	return nil
}