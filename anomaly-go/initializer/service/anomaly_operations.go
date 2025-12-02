package service

import (
	"anomaly-go/log"
	"anomaly-go/service/anomaly"
)

// InitializeAnomalyService sets up the anomaly service.
// Add any service-specific initialization here (e.g., loading ML models).
func InitializeAnomalyService(service *anomaly.Service) error {
	log.WriteLog.Info("✅ Anomaly service initialized")
	return nil
}