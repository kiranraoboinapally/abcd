package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// AppConfig holds all configuration for the application.
type AppConfig struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	ServerPort string
}

// Load loads configuration from a .env file into the AppConfig struct.
func Load() (*AppConfig, error) {
	if err := godotenv.Load(); err != nil {
		// Don't fail if .env is not present, it might be set in the environment
		fmt.Println("Warning: .env file not found, relying on environment variables.")
	}

	cfg := &AppConfig{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		JWTSecret:  os.Getenv("JWT_SECRET"),
		ServerPort: os.Getenv("SERVER_PORT"),
	}

	if cfg.ServerPort == "" {
		cfg.ServerPort = "8080" // Default port
	}

	if cfg.DBHost == "" || cfg.DBUser == "" || cfg.DBName == "" {
		return nil, fmt.Errorf("database configuration is incomplete")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET must be set in environment")
	}

	return cfg, nil
}