package database

import (
	dbpkg "anomaly-go/database" // alias to avoid conflict
	"anomaly-go/initializer/database/postgres"
)

// BootstrapDB initializes database schema and data.
func BootstrapDB(db *dbpkg.DBStore) error {
	if err := postgres.BootstrapSchema(db); err != nil {
		return err
	}
	if err := postgres.InsertInitialData(db); err != nil {
		return err
	}
	return nil
}
