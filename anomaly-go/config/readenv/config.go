package readenv

import (
	"anomaly-go/log"
	"fmt"
)

// AppConfig holds all application configurations.
type AppConfig struct {
	DBConfig   PostgresDBConfiguration
	RestConfig GinConfiguration
	JWTSecret  []byte // Centralized for easy access
}

// Load reads all environment files and returns a single AppConfig struct.
func Load() (*AppConfig, error) {
	// 1. Load logging first to initialize the logger.
	if !ReadLoggingConfiguration() {
		// Use default values if loading fails.
		LogVar.LoggingLevel = 7
		LogVar.EnableConsoleLogging = true
		LogVar.EnableFileLogging = true
		LogVar.FileLoggingLocation = "/tmp/app.log"
	}

	// Initialize the logger.
	_, log.WriteLog = log.LogInFile(LogVar.FileLoggingLocation, LogVar.EnableFileLogging, LogVar.EnableConsoleLogging, LogVar.LoggingLevel)

	// 2. Load other configurations.
	if !ReadDBCOMConfiguration() {
		log.WriteLog.Error("Failed to read database configuration")
		return nil, fmt.Errorf("database configuration error")
	}

	if !ReadRestConfiguration() {
		log.WriteLog.Error("Failed to read REST configuration")
		return nil, fmt.Errorf("rest configuration error")
	}

	// 3. Assemble the final config struct.
	config := &AppConfig{
		DBConfig:   PostgresDBVar,
		RestConfig: GinConfigVar,
		JWTSecret:  GinConfigVar.GinWebVar.WebJWTTokenKey,
	}

	return config, nil
}