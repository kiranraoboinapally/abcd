package api

import (
	"anomaly-go/internal/auth"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter configures the Gin router with all routes and middleware.
func (a *API) SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS Configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true // In production, you should restrict this to your frontend's domain.
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Public Routes
	r.POST("/login", a.LoginHandler)

	// Protected Routes (require JWT)
	protected := r.Group("/")
	protected.Use(auth.JWTMiddleware(a.Cfg.JWTSecret))
	{
		protected.POST("/updateConfidenceThreshold", a.UpdateConfidenceThresholdHandler)
		protected.GET("/fetchData", a.FetchDataHandler)
		protected.GET("/getAllDeviceIds", a.GetAllDeviceIdsHandler)
		protected.GET("/getDeviceHealthIds", a.GetDeviceHealthIdsHandler)
		protected.POST("/updateReview", a.UpdateReviewHandler)
		protected.GET("/getDeviceHealthData", a.GetDeviceHealthDataHandler)
		protected.GET("/getAtRiskKPIs", a.GetAtRiskKPIsHandler)
	}

	return r
}