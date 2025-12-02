// File: router/router.go

package router

import (
	"anomaly-go/controller"
	"anomaly-go/log"
	"anomaly-go/middleware/auth"
	"anomaly-go/util/constants"
	"anomaly-go/util/httputils/response"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// SetupRouter configures the Gin router with routes and middleware.
func SetupRouter(api *controller.API, jwtSecret string) *gin.Engine {
	// Create Gin engine
	r := gin.Default()

	// Apply global middlewares
	r.Use(auth.CORSMiddleware())

	// -----------------------------
	// PUBLIC ROUTES
	// -----------------------------
	public := r.Group("/")
	{
		// Login endpoint (public)
		public.POST("/login", api.LoginHandler)

		// Version endpoint (public)
		public.GET("/version", func(c *gin.Context) {
			response.HandleSuccess(c, http.StatusOK, gin.H{
				"version": constants.ApplicationVersion,
				"service": "humanAI",
			})
		})
	}

	log.WriteLog.Info("Registered public routes", zap.String("group", "/"))

	// -----------------------------
	// PROTECTED ROUTES (JWT REQUIRED)
	// -----------------------------
	protected := r.Group("/").
		Use(auth.JWTMiddleware(jwtSecret))
	{
		protected.POST("/updateConfidenceThreshold", api.UpdateConfidenceThresholdHandler)
		protected.GET("/fetchData", api.FetchDataHandler)
		protected.GET("/getAllDeviceIds", api.GetAllDeviceIdsHandler)
		protected.GET("/getDeviceHealthIds", api.GetDeviceHealthIdsHandler)
		protected.POST("/updateReview", api.UpdateReviewHandler)
		protected.GET("/getDeviceHealthData", api.GetDeviceHealthDataHandler)
		protected.GET("/getAtRiskKPIs", api.GetAtRiskKPIsHandler)
	}

	log.WriteLog.Info("Registered protected routes (JWT required)", zap.String("group", "/"))

	// -----------------------------
	// DEFAULT HEALTH CHECK (optional)
	// -----------------------------
	r.GET("/health", func(c *gin.Context) {
		response.HandleSuccess(c, http.StatusOK, gin.H{
			"status":  "ok",
			"service": "humanAI",
		})
	})

	return r
}
