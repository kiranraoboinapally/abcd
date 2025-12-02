// File: middleware/auth/cors_middleware.go

package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware handles CORS configuration manually (like in demoServer).
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// CORS headers
		c.Header("Access-Control-Allow-Origin", "*") // ⚠️ Use specific domain in production
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Content-Type", "application/json")

		// Handle preflight OPTIONS request
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusOK)
			return
		}

		c.Next()
	}
}
