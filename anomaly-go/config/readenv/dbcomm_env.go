package readenv

import (
	"anomaly-go/log"
	"fmt"
	"os"

	"github.com/spf13/viper"
	"go.uber.org/zap"
)

var DBDropTables bool

// DB Variables
type PostgresDBConfiguration struct {
	DBReplicaCount           int
	DBDataVal                []DBData
	DBUser                   string
	DBPassword               string
	DBName                   string
	DBCleanup                bool
	DBLogLevel               int
	DBSuperAdminEmail        string
	DBWithoutEmail           bool
	DBSuperAdminPassword     string
	DBUniqueMerchantEmailId  bool
	DBUniqueMerchantMobileNo bool
	DBUniqueEmployeeCode     bool
}

// DB Data
type DBData struct {
	DBHostName string
	DBPort     int
}

// for database configurations
var PostgresDBVar PostgresDBConfiguration

func ReadDBCOMConfiguration() bool {

	// Check if the env file exists
	if _, err := os.Stat(DBCOMM_VAR_ENV_FILENAME); err != nil {
		log.WriteLog.Error("Env file not found", zap.Error(err))
		return false
	}
	// Set configuration file details
	viper.SetConfigFile(DBCOMM_VAR_ENV_FILENAME)

	// Read all the configs from Viper
	err := viper.ReadInConfig()
	if err != nil {
		log.WriteLog.Error("Failed to read from the file", zap.Error(err))
		return false
	}

	/////////////////// DB Configuration ///////////////////
	// Process DB Data
	_, PostgresDBVar.DBReplicaCount = ReadENVValueInt(PRODUCTION_ENVIRONMENT, DBCOM_VAR_SERVER_COUNT)

	// Check whether the configs are present
	if PostgresDBVar.DBReplicaCount == 0 {
		// Panic and return back
		log.WriteLog.Error("Error with the configuration, PostgresDBVar.DBReplicaCount is not present")
		return false
	}

	log.LogSecretsInInt(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBReplicaCount", PostgresDBVar.DBReplicaCount)

	for i := 0; i < PostgresDBVar.DBReplicaCount; i++ {

		var dbdata DBData
		hostname := fmt.Sprintf(DBCOM_VAR_SERVER_HOST_COUNT+"%d", i)
		status, dbdata.DBHostName = ReadENVValueString(PRODUCTION_ENVIRONMENT, hostname)
		if !status {
			// Panic and return back
			log.WriteLog.Error("Error with the configuration, dbdata.DBHostName is not present")
			return false
		}

		log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "dbdata.DBHostName", dbdata.DBHostName)

		portNumber := fmt.Sprintf(DBCOM_VAR_SERVER_PORT_COUNT+"%d", i)
		_, dbdata.DBPort = ReadENVValueInt(PRODUCTION_ENVIRONMENT, portNumber)

		log.LogSecretsInInt(PRODUCTION_ENVIRONMENT, "dbdata.DBPort", dbdata.DBPort)

		if dbdata.DBPort == 0 {
			// Panic and return back
			log.WriteLog.Error("Error with the configuration, dbdata.DBPort is not present")
			return false
		}

		log.WriteLog.Info("DBConfiguration", zap.String(hostname, dbdata.DBHostName), zap.Int(portNumber, dbdata.DBPort))

		PostgresDBVar.DBDataVal = append(PostgresDBVar.DBDataVal, dbdata)
	}

	status, PostgresDBVar.DBName = ReadENVValueString(PRODUCTION_ENVIRONMENT, DBCOM_VAR_DB_NAME)
	if !status {
		// Panic and return back
		log.WriteLog.Error("Error with the configuration, PostgresDBVar.DBName are not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBName", PostgresDBVar.DBName)

	status, PostgresDBVar.DBUser = ReadENVValueString(PRODUCTION_ENVIRONMENT, DBCOM_VAR_DB_USERNAME)
	if !status {
		// Panic and return back
		log.WriteLog.Error("Error with the configuration, PostgresDBVar.DBUser are not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBUser", PostgresDBVar.DBUser)

	status, PostgresDBVar.DBPassword = ReadENVValueString(PRODUCTION_ENVIRONMENT, DBCOM_VAR_DB_PASSWORD)
	if !status {
		// Panic and return back
		log.WriteLog.Error("Error with the configuration, PostgresDBVar.DBPassword are not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBPassword", PostgresDBVar.DBPassword)

	_, PostgresDBVar.DBLogLevel = ReadENVValueInt(PRODUCTION_ENVIRONMENT, DBCOM_VAR_DB_LOG_LEVEL)

	log.LogSecretsInInt(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBLogLevel", PostgresDBVar.DBLogLevel)

	// Check whether they are not empty for Bootstrap
	log.WriteLog.Info("Postgres DBConfiguration", zap.String("DBName", PostgresDBVar.DBName), zap.String("DBUser", PostgresDBVar.DBUser), zap.Bool("DROP_TABLES", DBDropTables))

	return true
}

func readCommonDBConfiguration() bool {

	/////////////////// DB Configuration ///////////////////
	// Process DB Data

	// Check whether the configs are present

	status, PostgresDBVar.DBName = ReadENVValueString(PRODUCTION_ENVIRONMENT, DBCOM_VAR_DB_NAME)
	if !status {
		// Panic and return back
		log.WriteLog.Error("Error with the configuration, PostgresDBVar.DBName are not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBName", PostgresDBVar.DBName)

	status, PostgresDBVar.DBUser = ReadENVValueString(PRODUCTION_ENVIRONMENT, DBCOM_VAR_DB_USERNAME)
	if !status {
		// Panic and return back
		log.WriteLog.Error("Error with the configuration, PostgresDBVar.DBUser are not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBUser", PostgresDBVar.DBUser)

	status, PostgresDBVar.DBPassword = ReadENVValueString(PRODUCTION_ENVIRONMENT, DBCOM_VAR_DB_PASSWORD)
	if !status {
		// Panic and return back
		log.WriteLog.Error("Error with the configuration, PostgresDBVar.DBPassword are not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "PostgresDBVar.DBPassword", PostgresDBVar.DBPassword)

	return true
}
