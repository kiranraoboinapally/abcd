// File: middleware/auth/auth_middleware.go

package auth

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"anomaly-go/log"
	"anomaly-go/util/httputils/response"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

// JWTClaims defines the expected claims inside our JWT.
type JWTClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateToken creates a new JWT for a given username.
func GenerateToken(username, secretKey string) (string, error) {
	claims := JWTClaims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		log.WriteLog.Error("Failed to sign JWT token", zap.Error(err))
		return "", fmt.Errorf("could not sign token: %w", err)
	}

	log.WriteLog.Debug("JWT token generated successfully", zap.String("username", username))
	return tokenString, nil
}

// JWTMiddleware validates the JWT token and extracts claims.
func JWTMiddleware(secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.WriteLog.Warn("Missing Authorization header")
			response.HandleError(c, response.NewAppError(http.StatusUnauthorized, "Missing Authorization header", nil))
			c.Abort()
			return
		}

		// Expect "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			log.WriteLog.Warn("Invalid Authorization header format", zap.String("header", authHeader))
			response.HandleError(c, response.NewAppError(http.StatusUnauthorized, "Invalid token format. Expected 'Bearer <token>'", nil))
			c.Abort()
			return
		}

		// Parse and validate the JWT
		claims, err := validateToken(tokenString, secretKey)
		if err != nil {
			log.WriteLog.Error("JWT validation failed", zap.Error(err))
			response.HandleError(c, response.NewAppError(http.StatusUnauthorized, err.Error(), err))
			c.Abort()
			return
		}

		// Store claims in context for downstream handlers
		c.Set("username", claims.Username)
		log.WriteLog.Debug("JWT validated successfully", zap.String("username", claims.Username))

		c.Next()
	}
}

// validateToken parses and validates the JWT token.
func validateToken(tokenString, secretKey string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid or malformed token")
	}

	// Check expiration manually (optional redundancy)
	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return claims, nil
}
