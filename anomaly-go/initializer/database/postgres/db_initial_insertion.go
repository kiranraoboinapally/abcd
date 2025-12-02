package postgres

import (
	"anomaly-go/database"
	"anomaly-go/log"
	"anomaly-go/model/postgres"

	"go.uber.org/zap"
)

// InsertInitialData adds initial data (e.g., default threshold) using GORM.
func InsertInitialData(db *database.DBStore) error {
	var count int64
	if err := db.DB.Model(&postgres.Threshold{}).Count(&count).Error; err != nil {
		log.WriteLog.Error("Failed to check existing thresholds", zap.Error(err))
		return err
	}

	if count == 0 {
		threshold := postgres.Threshold{ThresholdValue: 50}
		if err := db.DB.Create(&threshold).Error; err != nil {
			log.WriteLog.Error("Failed to insert initial threshold", zap.Error(err))
			return err
		}
	}

	log.WriteLog.Info("✅ Initial data inserted")
	return nil
}