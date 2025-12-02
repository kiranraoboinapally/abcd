package service

import (
	"fmt"

	"anomaly-go/config/readenv"
	"anomaly-go/log"
	"anomaly-go/middleware/auth"
	jsonmodel "anomaly-go/model/json"
	repo "anomaly-go/repository/postgres"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Service handles business logic for anomaly detection.
type Service struct {
	Repo   *repo.Repository
	Config *readenv.AppConfig
}

// NewService creates a new anomaly service.
func NewService(db *gorm.DB, cfg *readenv.AppConfig) *Service {
	return &Service{
		Repo:   repo.NewRepository(db),
		Config: cfg,
	}
}

// GenerateToken creates a JWT for a user.
func (s *Service) GenerateToken(username string) (string, error) {
	token, err := auth.GenerateToken(username, string(s.Config.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("500:failed to generate token: %w", err)
	}
	return token, nil
}
func (s *Service) GetConfidenceThreshold() (float64, error) {
	threshold, found, err := s.Repo.GetConfidenceThreshold()
	if err != nil {
		return 0, fmt.Errorf("500:database error on fetch threshold: %w", err)
	}
	if !found {
		// As requested, if no record is found, we should reflect that to the user.
		// Using a 404-like domain error here to indicate absence.
		return 0, fmt.Errorf("404:confidence threshold not set in database")
	}
	return threshold, nil
}

// UpdateConfidenceThreshold updates the confidence threshold.
func (s *Service) UpdateConfidenceThreshold(threshold int) (int64, error) {
	rowsAffected, err := s.Repo.UpdateConfidenceThreshold(threshold)
	if err != nil {
		return 0, fmt.Errorf("500:database error on update: %w", err)
	}
	return rowsAffected, nil
}

// FetchData retrieves transactions and metrics with filters.
func (s *Service) FetchData(timeFilter, anomalyCheck, deviceID, searchTerm string) (jsonmodel.FetchDataResponse, error) {
	transactions, err := s.Repo.FetchTransactions(timeFilter, anomalyCheck, deviceID, searchTerm)
	if err != nil {
		log.WriteLog.Error("Failed to fetch transactions", zap.Error(err))
		return jsonmodel.FetchDataResponse{}, fmt.Errorf("500:could not fetch transaction data: %w", err)
	}

	reviewRequired, anomalyDetected, fraud, nullAnomaly, err := s.Repo.CountTransactionMetrics(timeFilter, anomalyCheck, deviceID, searchTerm)
	if err != nil {
		log.WriteLog.Error("Failed to count transaction metrics", zap.Error(err))
		return jsonmodel.FetchDataResponse{}, fmt.Errorf("500:could not fetch transaction metrics: %w", err)
	}

	// Convert DB transactions to JSON model
	var jsonTransactions []jsonmodel.Transaction
	for _, t := range transactions {
		jsonT := jsonmodel.Transaction{
			DeviceID:          t.DeviceID,
			TransactionID:     t.TransactionID,
			TransactionTime:   t.TransactionTime.Format("2006-01-02 15:04:05"),
			TransactionAmount: t.TransactionAmount,
			ConfidenceScore:   t.ConfidenceScore,
		}
		if t.AnomalyCheck.Valid {
			jsonT.AnomalyCheck = &t.AnomalyCheck.String
		}
		if t.Review.Valid {
			jsonT.Review = &t.Review.String
		}
		jsonTransactions = append(jsonTransactions, jsonT)
	}

	return jsonmodel.FetchDataResponse{
		Transactions:          jsonTransactions,
		TotalReviewRequired:   reviewRequired,
		TotalAnomalyDetected:  anomalyDetected,
		TotalFraud:            fraud,
		TotalNullAnomalyCheck: nullAnomaly,
	}, nil
}

// GetAllDeviceIds fetches unique device IDs from anomaly_results.
func (s *Service) GetAllDeviceIds() ([]int64, error) {
	ids, err := s.Repo.GetAllDeviceIds()
	if err != nil {
		return nil, fmt.Errorf("500:could not fetch device IDs: %w", err)
	}
	return ids, nil
}

// GetDeviceHealthIds fetches unique device IDs from battery_health.
func (s *Service) GetDeviceHealthIds() ([]int64, error) {
	ids, err := s.Repo.GetDeviceHealthIds()
	if err != nil {
		return nil, fmt.Errorf("500:could not fetch device health IDs: %w", err)
	}
	return ids, nil
}

// UpdateReview updates the review status for a transaction.
func (s *Service) UpdateReview(txnID, review string) (int64, error) {
	rowsAffected, err := s.Repo.UpdateReview(txnID, review)
	if err != nil {
		return 0, fmt.Errorf("500:database error on update review: %w", err)
	}
	if rowsAffected == 0 {
		return 0, fmt.Errorf("404:transaction with ID '%s' not found", txnID)
	}
	return rowsAffected, nil
}

// GetDeviceHealthData fetches battery health data with filters.
func (s *Service) GetDeviceHealthData(deviceIDStr, chargingStatus, isAnomaly, searchTerm string) ([]jsonmodel.DeviceHealth, error) {
	data, err := s.Repo.GetDeviceHealthData(deviceIDStr, chargingStatus, isAnomaly, searchTerm)
	if err != nil {
		log.WriteLog.Error("Failed to fetch device health data", zap.Error(err))
		return nil, fmt.Errorf("500:could not fetch device health data: %w", err)
	}

	var jsonData []jsonmodel.DeviceHealth
	for _, d := range data {
		jsonD := jsonmodel.DeviceHealth{
			Block:     d.Block,
			DeviceID:  d.DeviceID,
			StartBL:   d.StartBL,
			EndBL:     d.EndBL,
			StartTime: d.StartTime.Format("2006-01-02 15:04:05"),
			EndTime:   d.EndTime.Format("2006-01-02 15:04:05"),
			Charging:  map[int]string{0: "Unknown", 1: "Charging", 2: "Discharging"}[d.CS],
			IsAnomaly: map[int]string{0: "No", 1: "Yes"}[d.IsAnomaly],
		}
		jsonData = append(jsonData, jsonD)
	}
	return jsonData, nil
}

// GetAtRiskKPIs fetches at-risk KPIs and devices.
func (s *Service) GetAtRiskKPIs(deviceIDStr, searchTerm string) (jsonmodel.AtRiskResponse, error) {
	totalDevices, devices, err := s.Repo.GetAtRiskKPIs(deviceIDStr, searchTerm)
	if err != nil {
		log.WriteLog.Error("Failed to fetch at-risk KPIs", zap.Error(err))
		return jsonmodel.AtRiskResponse{}, fmt.Errorf("500:could not fetch at-risk KPIs: %w", err)
	}

	var jsonDevices []jsonmodel.AtRiskDevice
	for _, d := range devices {
		jsonDevices = append(jsonDevices, jsonmodel.AtRiskDevice{
			DeviceID: d.DeviceID,
			DeviceBS: d.DeviceBS,
		})
	}

	riskCount := len(devices)
	percent := 0.0
	if totalDevices > 0 {
		percent = (float64(riskCount) / float64(totalDevices)) * 100
	}

	return jsonmodel.AtRiskResponse{
		KPI: jsonmodel.AtRiskKPI{
			TotalDevices:  totalDevices,
			AtRisk:        riskCount,
			AtRiskPercent: percent,
		},
		Devices: jsonDevices,
	}, nil
}
