// File: util/httputils/response/response.go

package response

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AppError is a custom error type that includes an HTTP status code and an optional underlying error.
// This provides a structured way to handle application-specific errors that need to be sent to the client.
type AppError struct {
	StatusCode int
	Message    string
	Err        error // Optional: For logging the original underlying error
}

// Error makes AppError conform to the standard Go `error` interface.
// This allows it to be used just like any other error.
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

// NewAppError is a constructor function to easily create a new AppError.
func NewAppError(statusCode int, message string, originalErr error) *AppError {
	return &AppError{
		StatusCode: statusCode,
		Message:    message,
		Err:        originalErr,
	}
}

// HandleError inspects an error and sends the appropriate JSON response using Gin.
// It specifically checks if the error is an `AppError` to use its status code and message.
// If it's any other type of error, it defaults to a 500 Internal Server Error.
func HandleError(c *gin.Context, err error) {
	if err == nil {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   nil,
		})
		return
	}

	// Check if the error is our custom AppError type.
	if appErr, ok := err.(*AppError); ok {
		c.JSON(appErr.StatusCode, gin.H{
			"status":  "error",
			"message": appErr.Message,
		})
		return
	}

	// If it's a generic, unexpected error, send a default 500 response.
	c.JSON(http.StatusInternalServerError, gin.H{
		"status":  "error",
		"message": "An unexpected server error occurred.",
	})
}

// HandleSuccess sends a structured JSON success response.
func HandleSuccess(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, gin.H{
		"status": "success",
		"data":   data,
	})
}