package json

// CommonWebRespJSON is the generic structure for all API responses.
type CommonWebRespJSON struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Existing JSON models from your original code
type Transaction struct {
	DeviceID          int64   `json:"device_id"`
	TransactionID     string  `json:"transaction_id"`
	TransactionTime   string  `json:"transaction_time"`
	TransactionAmount float64 `json:"transaction_amount"`
	ConfidenceScore   float64 `json:"confidence_score"`
	AnomalyCheck      *string `json:"anomaly_check"`
	Review            *string `json:"review"`
}

type FetchDataResponse struct {
	Transactions          []Transaction `json:"transactions"`
	TotalReviewRequired   int           `json:"total_review_required"`
	TotalAnomalyDetected  int           `json:"total_anomaly_detected"`
	TotalFraud            int           `json:"total_fraud"`
	TotalNullAnomalyCheck int           `json:"total_null_anomaly_check"`
}

type DeviceHealth struct {
	Block     int    `json:"block"`
	DeviceID  int    `json:"device_id"`
	Charging  string `json:"charging"`
	StartBL   float64 `json:"start_bl"`
	EndBL     float64 `json:"end_bl"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	IsAnomaly string `json:"is_anomaly"`
}

type AtRiskKPI struct {
	TotalDevices  int     `json:"total_devices"`
	AtRisk        int     `json:"at_risk"`
	AtRiskPercent float64 `json:"at_risk_percent"`
}

type AtRiskDevice struct {
	DeviceID int     `json:"device_id"`
	DeviceBS float64 `json:"device_bs"`
}

type AtRiskResponse struct {
	KPI     AtRiskKPI      `json:"kpi"`
	Devices []AtRiskDevice `json:"devices"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type UpdateReviewRequest struct {
	TxnID  string `json:"txn_id" binding:"required"`
	Review string `json:"review" binding:"required"`
}

type UpdateConfidenceRequest struct {
	Threshold int `json:"threshold" binding:"required"`
}