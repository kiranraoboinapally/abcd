package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Transaction struct {
	DeviceID          int64   `json:"device_id"`
	TransactionID     string  `json:"transaction_id"`
	TransactionTime   string  `json:"transaction_timestamp"`
	TransactionAmount float64 `json:"transaction_amt"`
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
	Block        int     `json:"block"`
	DeviceID     int     `json:"device_id"`
	Charging     string  `json:"charging_status"` // 0 = Unknown, 1 = Charging, 2 = Discharging
	StartBL      float64 `json:"start_battery_level"`
	EndBL        float64 `json:"end_battery_level"`
	StartTime    string  `json:"start_time"`
	EndTime      string  `json:"end_time"`
	IsAnomaly    string  `json:"is_anomaly"` // "Yes" or "No"
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
	Devices []AtRiskDevice `json:"at_risk_devices"`
}

func main() {
	fmt.Println("✅ Go is working!")
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("Error pinging database:", err)
	}

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	r.POST("/updateConfidenceThreshold", func(c *gin.Context) {
		var req struct {
			ConfidenceThreshold int `json:"confidence_threshold"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body. Expected 'confidence_threshold' as an integer."})
			return
		}

		updateQuery := `UPDATE thresholds SET threshold_value = $1`
		res, err := db.Exec(updateQuery, req.ConfidenceThreshold)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database update error: " + err.Error()})
			return
		}

		rowsAffected, err := res.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking rows affected: " + err.Error()})
			return
		}
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "No threshold value found to update. The table is empty."})
			return
		}

		log.Printf("Confidence threshold updated to %d", req.ConfidenceThreshold)
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Confidence threshold updated successfully to %d", req.ConfidenceThreshold)})
	})

	r.GET("/fetchData", func(c *gin.Context) {
		timeFilter := c.Query("time")
		anomalyCheck := c.Query("anomaly_check")
		deviceID := c.Query("device_id")
		searchTerm := c.Query("search")

		query := `SELECT device_id, txn_id, txn_ts, txn_amt, confidence, label, review FROM anomaly_results`
		var conditions []string
		var params []interface{}
		paramCount := 1
		if timeFilter != "" && timeFilter != "all" {
			now := time.Now()
			var timeThreshold time.Time

			switch timeFilter {
			case "1h":
				timeThreshold = now.Add(-1 * time.Hour)
			case "6h":
				timeThreshold = now.Add(-6 * time.Hour)
			case "12h":
				timeThreshold = now.Add(-12 * time.Hour)
			case "1d":
				timeThreshold = now.AddDate(0, 0, -1)
			case "1w":
				timeThreshold = now.AddDate(0, 0, -7)
			case "1m":
				timeThreshold = now.AddDate(0, -1, 0)
			case "3m":
				timeThreshold = now.AddDate(0, -3, 0)
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time filter"})
				return
			}
			conditions = append(conditions, fmt.Sprintf(`txn_ts >= $%d`, paramCount))
			params = append(params, timeThreshold)
			paramCount++
		}
		if anomalyCheck != "" && anomalyCheck != "all" {
			if anomalyCheck == "null" {
				conditions = append(conditions, `label IS NULL`)
			} else {
				conditions = append(conditions, fmt.Sprintf(`LOWER(label) = $%d`, paramCount))
				params = append(params, strings.ToLower(anomalyCheck))
				paramCount++
			}
		}
		if deviceID != "" && deviceID != "all" {
			conditions = append(conditions, fmt.Sprintf(`device_id = $%d`, paramCount))
			params = append(params, deviceID)
			paramCount++
		}
		if searchTerm != "" {
			searchPattern := "%" + strings.ToLower(searchTerm) + "%"
			conditions = append(conditions, fmt.Sprintf(`(LOWER(txn_id) LIKE $%d OR LOWER(device_id::text) LIKE $%d)`, paramCount, paramCount))
			params = append(params, searchPattern)
			paramCount++
		}
		if len(conditions) > 0 {
			query += " WHERE " + strings.Join(conditions, " AND ")
		}

		var transactions []Transaction = make([]Transaction, 0)
		rows, err := db.Query(query, params...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var t Transaction
			var anomalyCheck sql.NullString
			var review sql.NullString
			if err := rows.Scan(&t.DeviceID, &t.TransactionID, &t.TransactionTime, &t.TransactionAmount, &t.ConfidenceScore, &anomalyCheck, &review); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			if anomalyCheck.Valid {
				t.AnomalyCheck = &anomalyCheck.String
			}
			if review.Valid {
				t.Review = &review.String
			}
			transactions = append(transactions, t)
		}

		countQuery := `
			SELECT
				COALESCE(SUM(CASE WHEN LOWER(label) = 'review required' THEN 1 ELSE 0 END), 0) as total_review_required,
				COALESCE(SUM(CASE WHEN LOWER(label) = 'anomaly detected' THEN 1 ELSE 0 END), 0) as total_anomaly_detected,
				COALESCE(SUM(CASE WHEN LOWER(label) = 'yes' THEN 1 ELSE 0 END), 0) as total_fraud,
				COALESCE(SUM(CASE WHEN label IS NULL THEN 1 ELSE 0 END), 0) as total_null_anomaly_check
			FROM anomaly_results`
		if len(conditions) > 0 {
			countQuery += " WHERE " + strings.Join(conditions, " AND ")
		}

		var totalReviewRequired, totalAnomalyDetected, totalFraud, totalNullAnomalyCheck sql.NullInt64
		err = db.QueryRow(countQuery, params...).Scan(&totalReviewRequired, &totalAnomalyDetected, &totalFraud, &totalNullAnomalyCheck)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		response := FetchDataResponse{
			Transactions:          transactions,
			TotalReviewRequired:   int(totalReviewRequired.Int64),
			TotalAnomalyDetected:  int(totalAnomalyDetected.Int64),
			TotalFraud:            int(totalFraud.Int64),
			TotalNullAnomalyCheck: int(totalNullAnomalyCheck.Int64),
		}
		c.JSON(http.StatusOK, response)
	})

	r.GET("/getAllDeviceIds", func(c *gin.Context) {
		query := `SELECT DISTINCT device_id FROM anomaly_results ORDER BY device_id`
		rows, err := db.Query(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()
		var deviceIDs []int64
		for rows.Next() {
			var deviceID int64
			if err := rows.Scan(&deviceID); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			deviceIDs = append(deviceIDs, deviceID)
		}
		c.JSON(http.StatusOK, gin.H{"device_ids": deviceIDs})
	})

	r.GET("/getDeviceHealthIds", func(c *gin.Context) {
		query := `SELECT DISTINCT device_id FROM battery_health ORDER BY device_id`
		rows, err := db.Query(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()
		var deviceIDs []int64
		for rows.Next() {
			var deviceID int64
			if err := rows.Scan(&deviceID); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			deviceIDs = append(deviceIDs, deviceID)
		}
		c.JSON(http.StatusOK, gin.H{"device_ids": deviceIDs})
	})

	r.POST("/updateReview", func(c *gin.Context) {
		var req struct {
			TransactionID string `json:"transaction_id"`
			Review        string `json:"review"`
		}

		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		reviewLower := strings.ToLower(req.Review)
		if reviewLower != "yes" && reviewLower != "no" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Review must be 'Yes' or 'No'"})
			return
		}
		newReview := strings.Title(reviewLower)
		log.Printf("Updating transaction %s with review %s", req.TransactionID, newReview)

		updateQuery := `UPDATE anomaly_results SET review = $1 WHERE txn_id = $2`
		res, err := db.Exec(updateQuery, newReview, req.TransactionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database update error: " + err.Error()})
			return
		}
		rowsAffected, err := res.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking rows affected: " + err.Error()})
			return
		}
		if rowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Review updated successfully"})
	})

	r.GET("/getDeviceHealthData", func(c *gin.Context) {
		deviceIDStr := c.Query("device_id")
		chargingStatus := c.Query("charging_status")
		isAnomaly := c.Query("is_anomaly")
		searchTerm := c.Query("search")

		query := `
			SELECT block, device_id, CS, start_BL, end_BL, start_time, end_time, is_anomaly
			FROM battery_health
		`
		var conditions []string
		var params []interface{}
		paramCount := 1

		if deviceIDStr != "" && deviceIDStr != "all" {
			deviceID, err := strconv.ParseInt(deviceIDStr, 10, 64)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device_id"})
				return
			}
			conditions = append(conditions, fmt.Sprintf(`device_id = $%d`, paramCount))
			params = append(params, deviceID)
			paramCount++
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
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid charging_status (must be 'Charging', 'Discharging', or 'Unknown')"})
				return
			}
			conditions = append(conditions, fmt.Sprintf(`CS = $%d`, paramCount))
			params = append(params, cs)
			paramCount++
		}

		if isAnomaly != "" && strings.ToLower(isAnomaly) != "all" {
			var anomalyInt int
			switch strings.ToLower(isAnomaly) {
			case "yes":
				anomalyInt = 1
			case "no":
				anomalyInt = 0
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid is_anomaly (must be 'Yes' or 'No')"})
				return
			}
			conditions = append(conditions, fmt.Sprintf(`is_anomaly = $%d`, paramCount))
			params = append(params, anomalyInt)
			paramCount++
		}

		if searchTerm != "" {
			searchPattern := "%" + strings.ToLower(searchTerm) + "%"
			conditions = append(conditions, fmt.Sprintf(`LOWER(device_id::text) LIKE $%d`, paramCount))
			params = append(params, searchPattern)
			paramCount++
		}

		if len(conditions) > 0 {
			query += " WHERE " + strings.Join(conditions, " AND ")
		}
		query += " ORDER BY block ASC"

		rows, err := db.Query(query, params...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var data []DeviceHealth
		for rows.Next() {
			var d DeviceHealth
			var cs int
			var anomalyInt int
			var startTime, endTime time.Time

			err := rows.Scan(&d.Block, &d.DeviceID, &cs, &d.StartBL, &d.EndBL, &startTime, &endTime, &anomalyInt)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			d.Charging = map[int]string{0: "Unknown", 1: "Charging", 2: "Discharging"}[cs]
			d.IsAnomaly = map[int]string{0: "No", 1: "Yes"}[anomalyInt]
			d.StartTime = startTime.Format("2006-01-02 15:04:05")
			d.EndTime = endTime.Format("2006-01-02 15:04:05")

			data = append(data, d)
		}

		c.JSON(http.StatusOK, gin.H{"battery_health": data})
	})

	r.GET("/getAtRiskKPIs", func(c *gin.Context) {
		deviceIDStr := c.Query("device_id")
		searchTerm := c.Query("search")

		// Total devices query - THIS IS ALWAYS UNFILTERED
		totalQuery := `SELECT COUNT(DISTINCT device_id) FROM battery_health`
		var totalDevices sql.NullInt64
		err := db.QueryRow(totalQuery).Scan(&totalDevices)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching total devices: " + err.Error()})
			return
		}

		// Build WHERE clause for filters for the other KPIs
		var conditions []string
		var params []interface{}
		paramCount := 1

		if deviceIDStr != "" && deviceIDStr != "all" {
			deviceID, err := strconv.ParseInt(deviceIDStr, 10, 64)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device_id"})
				return
			}
			conditions = append(conditions, fmt.Sprintf(`dh.device_id = $%d`, paramCount))
			params = append(params, deviceID)
			paramCount++
		}

		if searchTerm != "" {
			searchPattern := "%" + strings.ToLower(searchTerm) + "%"
			conditions = append(conditions, fmt.Sprintf(`LOWER(dh.device_id::text) LIKE $%d`, paramCount))
			params = append(params, searchPattern)
			paramCount++
		}
		
		// This clause will be applied to the 'at risk' and 'at risk devices' queries
		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " WHERE " + strings.Join(conditions, " AND ")
		}

		// Create the final clause for queries needing both filters and the risk condition
		riskWhereClause := whereClause
		if whereClause == "" {
			riskWhereClause = " WHERE bs.device_bs < 50"
		} else {
			riskWhereClause += " AND bs.device_bs < 50"
		}

		// At risk count query (WITH FILTERS)
		riskQuery := fmt.Sprintf(`
			SELECT COUNT(DISTINCT dh.device_id)
			FROM battery_health dh
			JOIN bl_score bs ON dh.device_id = bs.device_id
			%s
		`, riskWhereClause)

		var atRisk sql.NullInt64
		err = db.QueryRow(riskQuery, params...).Scan(&atRisk)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching at risk count: " + err.Error()})
			return
		}

		// At risk devices table query (WITH FILTERS)
		tableQuery := fmt.Sprintf(`
			SELECT DISTINCT dh.device_id, bs.device_bs
			FROM battery_health dh
			JOIN bl_score bs ON dh.device_id = bs.device_id
			%s
			ORDER BY dh.device_id
		`, riskWhereClause)

		rows, err := db.Query(tableQuery, params...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching at risk devices: " + err.Error()})
			return
		}
		defer rows.Close()

		var devices []AtRiskDevice
		for rows.Next() {
			var d AtRiskDevice
			err := rows.Scan(&d.DeviceID, &d.DeviceBS)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			devices = append(devices, d)
		}
		
		total := int(totalDevices.Int64)
		riskCount := int(atRisk.Int64)
		percent := 0.0
		// Use the UNFILTERED total for percentage calculation
		if total > 0 {
			percent = float64(riskCount) / float64(total) * 100
		}

		response := AtRiskResponse{
			KPI: AtRiskKPI{
				TotalDevices:  total,
				AtRisk:        riskCount,
				AtRiskPercent: percent,
			},
			Devices: devices,
		}

		c.JSON(http.StatusOK, response)
	})

	if err := r.Run(":8080"); err != nil {
		log.Fatal("Error starting server:", err)
	}
}