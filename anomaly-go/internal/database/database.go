package database

import (
	"database/sql"
	"fmt"
	"log"

	"anomaly-go/internal/config"

	_ "github.com/lib/pq"
)

// DBStore holds the database connection pool.
type DBStore struct {
	*sql.DB
}

// NewDBStore connects to the database and returns a store.
func NewDBStore(cfg *config.AppConfig) (*DBStore, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error preparing database connection: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("error pinging database: %w", err)
	}

	log.Println("✅ Database connection established.")
	return &DBStore{db}, nil
}