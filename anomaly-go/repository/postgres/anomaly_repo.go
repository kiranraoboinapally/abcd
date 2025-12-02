package postgres

import (
	"fmt"
	"strings"
	"time"

	model "anomaly-go/model/postgres"

	"gorm.io/gorm"
)

// Repository handles database operations via GORM.
type Repository struct {
	DB *gorm.DB
}

// NewRepository creates a new GORM repository instance.
func NewRepository(db *gorm.DB) *Repository {
	return &Repository{DB: db}
}
func (r *Repository) GetConfidenceThreshold() (float64, bool, error) {
	var threshold model.Threshold

	// Attempt to find the first record. Since we're assuming a single threshold,
	// using First() is appropriate.
	err := r.DB.First(&threshold).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// No record found, return default or handle as not found
			return 0, false, nil
		}
		return 0, false, err
	}

	return threshold.ThresholdValue, true, nil
}

// UpdateConfidenceThreshold updates the confidence threshold.
func (r *Repository) UpdateConfidenceThreshold(threshold int) (int64, error) {
	// Assuming there's only one row to update in the thresholds table.
	// Use a more specific WHERE clause if needed, e.g., .Where("id = ?", 1)
	res := r.DB.Model(&model.Threshold{}).Where("1=1").Update("threshold_value", threshold)
	return res.RowsAffected, res.Error
}

// FetchTransactions retrieves transactions with filters.
func (r *Repository) FetchTransactions(timeFilter, anomalyCheck, deviceID, searchTerm string) ([]model.Transaction, error) {
	var transactions []model.Transaction
	tx := r.DB.Model(&model.Transaction{})

	tx = applyTransactionFilters(tx, timeFilter, anomalyCheck, deviceID, searchTerm)

	err := tx.Find(&transactions).Error
	return transactions, err
}

// CountTransactionMetrics counts anomaly metrics based on filters.
type metricsResult struct {
	TotalReviewRequired   int
	TotalAnomalyDetected  int
	TotalFraud            int
	TotalNullAnomalyCheck int
}

func (r *Repository) CountTransactionMetrics(timeFilter, anomalyCheck, deviceID, searchTerm string) (int, int, int, int, error) {
	var result metricsResult
	tx := r.DB.Model(&model.Transaction{})

	tx = applyTransactionFilters(tx, timeFilter, anomalyCheck, deviceID, searchTerm)

	err := tx.Select(`
		COALESCE(SUM(CASE WHEN LOWER(label) = 'review required' THEN 1 ELSE 0 END), 0) as total_review_required,
		COALESCE(SUM(CASE WHEN LOWER(label) = 'anomaly detected' THEN 1 ELSE 0 END), 0) as total_anomaly_detected,
		COALESCE(SUM(CASE WHEN LOWER(label) = 'yes' THEN 1 ELSE 0 END), 0) as total_fraud,
		COALESCE(SUM(CASE WHEN label IS NULL THEN 1 ELSE 0 END), 0) as total_null_anomaly_check`).
		Scan(&result).Error

	if err != nil {
		return 0, 0, 0, 0, err
	}

	return result.TotalReviewRequired, result.TotalAnomalyDetected, result.TotalFraud, result.TotalNullAnomalyCheck, nil
}

// GetAllDeviceIds fetches unique device IDs from anomaly_results.
func (r *Repository) GetAllDeviceIds() ([]int64, error) {
	var ids []int64
	err := r.DB.Model(&model.Transaction{}).Distinct().Order("device_id ASC").Pluck("device_id", &ids).Error
	return ids, err
}

// GetDeviceHealthIds fetches unique device IDs from battery_health.
func (r *Repository) GetDeviceHealthIds() ([]int64, error) {
	var ids []int64
	err := r.DB.Model(&model.DeviceHealth{}).Distinct().Order("device_id ASC").Pluck("device_id", &ids).Error
	return ids, err
}

// UpdateReview updates the review status for a transaction.
func (r *Repository) UpdateReview(txnID, review string) (int64, error) {
	res := r.DB.Model(&model.Transaction{}).Where("txn_id = ?", txnID).Update("review", review)
	return res.RowsAffected, res.Error
}

// GetDeviceHealthData fetches battery health data with filters.
func (r *Repository) GetDeviceHealthData(deviceIDStr, chargingStatus, isAnomaly, searchTerm string) ([]model.DeviceHealth, error) {
	var data []model.DeviceHealth
	tx := r.DB.Model(&model.DeviceHealth{})

	if deviceIDStr != "" && deviceIDStr != "all" {
		tx = tx.Where("device_id = ?", deviceIDStr)
	}
	if chargingStatus != "" && strings.ToLower(chargingStatus) != "all" {
		var cs int
		switch strings.ToLower(chargingStatus) {
		case "charging":
			cs = 1
		case "discharging":
			cs = 2
		case "unknown":
			cs = 0
		default:
			return nil, fmt.Errorf("invalid charging_status")
		}
		tx = tx.Where("CS = ?", cs)
	}
	if isAnomaly != "" && strings.ToLower(isAnomaly) != "all" {
		var anomalyInt int
		switch strings.ToLower(isAnomaly) {
		case "yes":
			anomalyInt = 1
		case "no":
			anomalyInt = 0
		default:
			return nil, fmt.Errorf("invalid is_anomaly")
		}
		tx = tx.Where("is_anomaly = ?", anomalyInt)
	}
	if searchTerm != "" {
		searchPattern := "%" + strings.ToLower(searchTerm) + "%"
		tx = tx.Where("CAST(device_id AS TEXT) ILIKE ?", searchPattern)
	}

	err := tx.Order("block ASC").Find(&data).Error
	return data, err
}

// GetAtRiskKPIs fetches at-risk KPIs and devices.
func (r *Repository) GetAtRiskKPIs(deviceIDStr, searchTerm string) (int, []model.AtRiskDevice, error) {
	var totalDevices int64
	// Total devices (unfiltered)
	err := r.DB.Model(&model.DeviceHealth{}).Distinct("device_id").Count(&totalDevices).Error
	if err != nil {
		return 0, nil, err
	}

	// At-risk devices
	var devices []model.AtRiskDevice
	tx := r.DB.Model(&model.DeviceHealth{}).
		Select("DISTINCT battery_health.device_id, bl_score.device_bs").
		Joins("JOIN bl_score ON battery_health.device_id = bl_score.device_id").
		Where("bl_score.device_bs <= 100")

	if deviceIDStr != "" && deviceIDStr != "all" {
		tx = tx.Where("battery_health.device_id = ?", deviceIDStr)
	}
	if searchTerm != "" {
		searchPattern := "%" + strings.ToLower(searchTerm) + "%"
		tx = tx.Where("CAST(battery_health.device_id AS TEXT) ILIKE ?", searchPattern)
	}

	err = tx.Order("battery_health.device_id ASC").Scan(&devices).Error
	if err != nil {
		return 0, nil, err
	}

	return int(totalDevices), devices, nil
}

// --- Helper Functions ---

// applyTransactionFilters applies common query conditions for transactions.
func applyTransactionFilters(db *gorm.DB, timeFilter, anomalyCheck, deviceID, searchTerm string) *gorm.DB {
	if timeFilter != "" && timeFilter != "all" {
		if timeThreshold, err := getTimeThreshold(timeFilter); err == nil {
			db = db.Where("txn_ts >= ?", timeThreshold)
		}
	}
	if anomalyCheck != "" && anomalyCheck != "all" {
		if anomalyCheck == "null" {
			db = db.Where("label IS NULL")
		} else {
			db = db.Where("LOWER(label) = ?", strings.ToLower(anomalyCheck))
		}
	}
	if deviceID != "" && deviceID != "all" {
		db = db.Where("device_id = ?", deviceID)
	}
	if searchTerm != "" {
		searchPattern := "%" + strings.ToLower(searchTerm) + "%"
		db = db.Where("LOWER(txn_id) LIKE ? OR LOWER(CAST(device_id AS TEXT)) LIKE ?", searchPattern, searchPattern)
	}
	return db
}

// getTimeThreshold calculates the time threshold based on the filter string.
func getTimeThreshold(filter string) (time.Time, error) {
	now := time.Now()
	switch filter {
	case "1h":
		return now.Add(-1 * time.Hour), nil
	case "6h":
		return now.Add(-6 * time.Hour), nil
	case "12h":
		return now.Add(-12 * time.Hour), nil
	case "1d":
		return now.AddDate(0, 0, -1), nil
	case "1w":
		return now.AddDate(0, 0, -7), nil
	case "1m":
		return now.AddDate(0, -1, 0), nil
	case "3m":
		return now.AddDate(0, -3, 0), nil
	default:
		return time.Time{}, fmt.Errorf("invalid time filter")
	}
}

// Find is a generic function that builds a GORM query from the PostgresRepositoryParameter struct.
// While implemented as requested, using specific functions (like FetchTransactions above) is often
// clearer and more type-safe for complex applications.
func (r *Repository) Find(params *model.PostgresRepositoryParameter, dest interface{}) error {
	tx := r.DB.Model(dest)

	if len(params.SelectFields) > 0 {
		tx = tx.Select(params.SelectFields)
	}
	if len(params.DistinctFields) > 0 {
		tx = tx.Distinct(params.DistinctFields)
	}
	if params.WhereString != "" {
		tx = tx.Where(params.WhereString, params.WhereValues...)
	}
	if params.HavingString != "" {
		tx = tx.Having(params.HavingString, params.HavingValues...)
	}
	if params.SortQuery != "" {
		tx = tx.Order(params.SortQuery)
	}
	if params.Limit > 0 {
		tx = tx.Limit(params.Limit)
	}
	if params.Offset > 0 {
		tx = tx.Offset(params.Offset)
	}

	return tx.Find(dest).Error
}
