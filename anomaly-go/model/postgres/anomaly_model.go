package postgres

import (
	"database/sql"
	"time"

	"gorm.io/gorm"
)

// Transaction maps to the 'anomaly_results' table.
type Transaction struct {
    DeviceID          int64          `gorm:"column:device_id;primaryKey"`
    TransactionID     string         `gorm:"column:txn_id;primaryKey"`
    TransactionTime   time.Time      `gorm:"column:txn_ts"`
    TransactionAmount float64        `gorm:"column:txn_amt"`
    ConfidenceScore   float64        `gorm:"column:confidence"`
    AnomalyCheck      sql.NullString `gorm:"column:label"`
    Review            sql.NullString `gorm:"column:review"`
}


func (Transaction) TableName() string {
	return "anomaly_results"
}

// DeviceHealth maps to the 'battery_health' table.
type DeviceHealth struct {
    Block     int       `gorm:"column:block;primaryKey"`
    DeviceID  int       `gorm:"column:device_id;primaryKey"`
    CS        int       `gorm:"column:CS"`
    StartBL   float64   `gorm:"column:start_BL"`
    EndBL     float64   `gorm:"column:end_BL"`
    StartTime time.Time `gorm:"column:start_time"`
    EndTime   time.Time `gorm:"column:end_time"`
    IsAnomaly int       `gorm:"column:is_anomaly"`
}

func (DeviceHealth) TableName() string {
	return "battery_health"
}

// AtRiskDevice is a projection for at-risk devices query.
type AtRiskDevice struct {
	DeviceID int     `gorm:"column:device_id"`
	DeviceBS float64 `gorm:"column:device_bs"`
}

// BlScore maps to the 'bl_score' table, used for joins.
type BlScore struct {
	DeviceID int     `gorm:"column:device_id;primaryKey"`
	DeviceBS float64 `gorm:"column:device_bs"`
}

func (BlScore) TableName() string {
	return "bl_score"
}

// Threshold maps to the 'thresholds' table.
type Threshold struct {
	ID             uint    `gorm:"primaryKey"`
	ThresholdValue float64 `gorm:"column:threshold_value"`
}

func (Threshold) TableName() string {
	return "thresholds"
}

// PostgresRepositoryParameter is a helper model to send generic arguments to repository functions.
type PostgresRepositoryParameter struct {
	DB             *gorm.DB
	SelectFields   []string
	DistinctFields []string
	WhereString    string
	WhereValues    []interface{}
	HavingString   string
	HavingValues   []interface{}
	SortQuery      string
	Limit          int
	Offset         int
}