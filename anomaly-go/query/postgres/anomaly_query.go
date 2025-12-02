package postgres

//this totally setup done in anomaly_repo of using gorm based queries

// const (
// 	// UpdateConfidenceThreshold updates the threshold value.
// 	UpdateConfidenceThreshold = `UPDATE thresholds SET threshold_value = $1`

// 	// FetchTransactions fetches anomaly results with dynamic conditions.
// 	FetchTransactions = `SELECT device_id, txn_id, txn_ts, txn_amt, confidence, label, review FROM anomaly_results`

// 	// CountTransactionMetrics counts anomaly metrics.
// 	CountTransactionMetrics = `
// 		SELECT
// 			COALESCE(SUM(CASE WHEN LOWER(label) = 'review required' THEN 1 ELSE 0 END), 0) as total_review_required,
// 			COALESCE(SUM(CASE WHEN LOWER(label) = 'anomaly detected' THEN 1 ELSE 0 END), 0) as total_anomaly_detected,
// 			COALESCE(SUM(CASE WHEN LOWER(label) = 'yes' THEN 1 ELSE 0 END), 0) as total_fraud,
// 			COALESCE(SUM(CASE WHEN label IS NULL THEN 1 ELSE 0 END), 0) as total_null_anomaly_check
// 		FROM anomaly_results`

// 	// GetAllDeviceIds fetches unique device IDs from anomaly_results.
// 	GetAllDeviceIds = `SELECT DISTINCT device_id FROM anomaly_results ORDER BY device_id`

// 	// GetDeviceHealthIds fetches unique device IDs from battery_health.
// 	GetDeviceHealthIds = `SELECT DISTINCT device_id FROM battery_health ORDER BY device_id`

// 	// UpdateReview updates the review status for a transaction.
// 	UpdateReview = `UPDATE anomaly_results SET review = $1 WHERE txn_id = $2`

// 	// GetDeviceHealthData fetches battery health data.
// 	GetDeviceHealthData = `
// 		SELECT block, device_id, CS, start_BL, end_BL, start_time, end_time, is_anomaly
// 		FROM battery_health`

// 	// GetTotalDevices counts unique devices in battery_health.
// 	GetTotalDevices = `SELECT COUNT(DISTINCT device_id) FROM battery_health`

// 	// GetAtRiskCount counts devices with low battery score.
// 	GetAtRiskCount = `
// 		SELECT COUNT(DISTINCT dh.device_id)
// 		FROM battery_health dh
// 		JOIN bl_score bs ON dh.device_id = bs.device_id`

// 	// GetAtRiskDevices fetches at-risk devices with their battery scores.
// 	GetAtRiskDevices = `
// 		SELECT DISTINCT dh.device_id, bs.device_bs
// 		FROM battery_health dh
// 		JOIN bl_score bs ON dh.device_id = bs.device_id`
// )