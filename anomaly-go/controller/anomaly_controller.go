// File: controller/anomaly_controller.go

package controller

import (
	"fmt"
	"net/http"

	"anomaly-go/log"
	anomaly "anomaly-go/service/anomaly"
	"anomaly-go/util/httputils/response"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// API holds dependencies for handlers.
type API struct {
	Service *anomaly.Service
}

// NewAPI creates a new API instance with dependencies.
func NewAPI(service *anomaly.Service) *API {
	return &API{Service: service}
}

// LoginHandler handles user login and issues a JWT.
func (a *API) LoginHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		// UPDATED: Use the new response handling
		appErr := response.NewAppError(http.StatusBadRequest, "Invalid request, 'username' and 'password' are required", err)
		response.HandleError(c, appErr)
		return
	}

	// Note: Hardcoded credentials should be replaced for production environments.
	if req.Username != "admin" || req.Password != "password" {
		// UPDATED: Use the new response handling
		appErr := response.NewAppError(http.StatusUnauthorized, "Invalid credentials", nil)
		response.HandleError(c, appErr)
		return
	}

	token, err := a.Service.GenerateToken(req.Username)
	if err != nil {
		log.WriteLog.Error("Failed to generate token", zap.Error(err))
		// UPDATED: Pass the original error to the handler
		response.HandleError(c, err)
		return
	}

	log.WriteLog.Info("User logged in", zap.String("username", req.Username))
	// UPDATED: Use the new HandleSuccess function
	response.HandleSuccess(c, http.StatusOK, gin.H{"message": "Login successful", "token": token})
}
func (a *API) GetConfidenceThresholdHandler(c *gin.Context) {
	threshold, err := a.Service.GetConfidenceThreshold()
	if err != nil {
		log.WriteLog.Error("Failed to fetch confidence threshold", zap.Error(err))
		// The service function now returns a 404-like error if not found.
		response.HandleError(c, err)
		return
	}

	log.WriteLog.Info("Confidence threshold fetched", zap.Float64("threshold", threshold))
	response.HandleSuccess(c, http.StatusOK, gin.H{"confidence_threshold": threshold})
}

// UpdateConfidenceThresholdHandler updates the confidence threshold.
func (a *API) UpdateConfidenceThresholdHandler(c *gin.Context) {
	var req struct {
		ConfidenceThreshold int `json:"confidence_threshold"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		appErr := response.NewAppError(http.StatusBadRequest, "Invalid request body. Expected 'confidence_threshold' as an integer", err)
		response.HandleError(c, appErr)
		return
	}

	rowsAffected, err := a.Service.UpdateConfidenceThreshold(req.ConfidenceThreshold)
	if err != nil {
		log.WriteLog.Error("Database update error", zap.Error(err))
		response.HandleError(c, err)
		return
	}

	if rowsAffected == 0 {
		appErr := response.NewAppError(http.StatusNotFound, "No threshold value found to update", nil)
		response.HandleError(c, appErr)
		return
	}

	log.WriteLog.Info("Confidence threshold updated", zap.Int("new_threshold", req.ConfidenceThreshold))
	response.HandleSuccess(c, http.StatusOK, gin.H{
		"message": fmt.Sprintf("Confidence threshold updated successfully to %d", req.ConfidenceThreshold),
	})
}

// FetchDataHandler fetches transaction data with filtering.
func (a *API) FetchDataHandler(c *gin.Context) {
	timeFilter := c.Query("time")
	anomalyCheck := c.Query("anomaly_check")
	deviceID := c.Query("device_id")
	searchTerm := c.Query("search")

	resp, err := a.Service.FetchData(timeFilter, anomalyCheck, deviceID, searchTerm)
	if err != nil {
		log.WriteLog.Error("Fetch data error", zap.Error(err))
		response.HandleError(c, err)
		return
	}

	log.WriteLog.Info("Fetched data successfully", zap.Int("result_count", len(resp.Transactions)))
	response.HandleSuccess(c, http.StatusOK, resp)
}

// GetAllDeviceIdsHandler fetches all unique device IDs.
func (a *API) GetAllDeviceIdsHandler(c *gin.Context) {
	ids, err := a.Service.GetAllDeviceIds()
	if err != nil {
		log.WriteLog.Error("Get device IDs error", zap.Error(err))
		response.HandleError(c, err)
		return
	}

	log.WriteLog.Info("Fetched all device IDs", zap.Int("count", len(ids)))
	response.HandleSuccess(c, http.StatusOK, gin.H{"device_ids": ids})
}

// GetDeviceHealthIdsHandler fetches unique device IDs from battery_health.
func (a *API) GetDeviceHealthIdsHandler(c *gin.Context) {
	ids, err := a.Service.GetDeviceHealthIds()
	if err != nil {
		log.WriteLog.Error("Get device health IDs error", zap.Error(err))
		response.HandleError(c, err)
		return
	}

	log.WriteLog.Info("Fetched device health IDs", zap.Int("count", len(ids)))
	response.HandleSuccess(c, http.StatusOK, gin.H{"device_ids": ids})
}

// UpdateReviewHandler updates the review status for a transaction.
func (a *API) UpdateReviewHandler(c *gin.Context) {
	var req struct {
		TransactionID string `json:"transaction_id" binding:"required"`
		Review        string `json:"review"        binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		appErr := response.NewAppError(http.StatusBadRequest, "Invalid request body. Expected 'transaction_id' and 'review'", err)
		response.HandleError(c, appErr)
		return
	}

	rowsAffected, err := a.Service.UpdateReview(req.TransactionID, req.Review)
	if err != nil {
		log.WriteLog.Error("Update review error", zap.Error(err))
		response.HandleError(c, err)
		return
	}

	if rowsAffected == 0 {
		appErr := response.NewAppError(http.StatusNotFound, "No transaction found to update", nil)
		response.HandleError(c, appErr)
		return
	}

	log.WriteLog.Info("Review updated",
		zap.String("transaction_id", req.TransactionID),
		zap.String("review", req.Review),
	)
	response.HandleSuccess(c, http.StatusOK, gin.H{"message": "Review status updated successfully"})
}

// GetDeviceHealthDataHandler fetches device health data with filters.
func (a *API) GetDeviceHealthDataHandler(c *gin.Context) {
	deviceID := c.Query("device_id")
	chargingStatus := c.Query("charging_status")
	isAnomaly := c.Query("is_anomaly")
	searchTerm := c.Query("search")

	data, err := a.Service.GetDeviceHealthData(deviceID, chargingStatus, isAnomaly, searchTerm)
	if err != nil {
		log.WriteLog.Error("Get device health data error", zap.Error(err))
		response.HandleError(c, err)
		return
	}

	log.WriteLog.Info("Fetched battery health data", zap.Int("record_count", len(data)))
	response.HandleSuccess(c, http.StatusOK, gin.H{"battery_health": data})
}

// GetAtRiskKPIsHandler fetches at-risk device KPIs and details.
func (a *API) GetAtRiskKPIsHandler(c *gin.Context) {
	deviceID := c.Query("device_id")
	searchTerm := c.Query("search")

	resp, err := a.Service.GetAtRiskKPIs(deviceID, searchTerm)
	if err != nil {
		log.WriteLog.Error("Get at-risk KPIs error", zap.Error(err))
		response.HandleError(c, err)
		return
	}

	log.WriteLog.Info("Fetched at-risk KPIs", zap.Int("count", len(resp.Devices)))
	response.HandleSuccess(c, http.StatusOK, resp)
}
