package models

// Transaction defines the structure for transaction data.
type Transaction struct {
	DeviceID          int64   `json:"device_id"`
	TransactionID     string  `json:"transaction_id"`
	TransactionTime   string  `json:"transaction_timestamp"`
	TransactionAmount float64 `json:"transaction_amt"`
	ConfidenceScore   float64 `json:"confidence_score"`
	AnomalyCheck      *string `json:"anomaly_check"`
	Review            *string `json:"review"`
}

// FetchDataResponse is the response structure for the fetchData endpoint.
type FetchDataResponse struct {
	Transactions          []Transaction `json:"transactions"`
	TotalReviewRequired   int           `json:"total_review_required"`
	TotalAnomalyDetected  int           `json:"total_anomaly_detected"`
	TotalFraud            int           `json:"total_fraud"`
	TotalNullAnomalyCheck int           `json:"total_null_anomaly_check"`
}

// DeviceHealth defines the structure for device battery health data.
type DeviceHealth struct {
	Block        int     `json:"block"`
	DeviceID     int     `json:"device_id"`
	Charging     string  `json:"charging_status"` // Unknown, Charging, Discharging
	StartBL      float64 `json:"start_battery_level"`
	EndBL        float64 `json:"end_battery_level"`
	StartTime    string  `json:"start_time"`
	EndTime      string  `json:"end_time"`
	IsAnomaly    string  `json:"is_anomaly"` // "Yes" or "No"
}

// AtRiskKPI holds the key performance indicators for at-risk devices.
type AtRiskKPI struct {
	TotalDevices  int     `json:"total_devices"`
	AtRisk        int     `json:"at_risk"`
	AtRiskPercent float64 `json:"at_risk_percent"`
}

// AtRiskDevice represents a single at-risk device.
type AtRiskDevice struct {
	DeviceID int     `json:"device_id"`
	DeviceBS float64 `json:"device_bs"`
}

// AtRiskResponse is the response structure for the at-risk KPIs endpoint.
type AtRiskResponse struct {
	KPI     AtRiskKPI      `json:"kpi"`
	Devices []AtRiskDevice `json:"at_risk_devices"`
}