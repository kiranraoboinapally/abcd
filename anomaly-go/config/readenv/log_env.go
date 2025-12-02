package readenv

import (
	"errors"
	"fmt"
	"os"

	"github.com/spf13/viper"
)

// Logging Variables
type LoggingVariables struct {
	LoggingLevel         int
	EnableConsoleLogging bool
	EnableFileLogging    bool
	FileLoggingLocation  string
}

var LogVar LoggingVariables

var PRODUCTION_ENVIRONMENT bool = false
var status bool = false

// Helper function to load Logging Configuration from Either ENV or file
// To be called first
func ReadLoggingConfiguration() bool {

	// Set configuration file details
	viper.SetEnvPrefix(ENV_VAR_PREFIX)

	PRODUCTION_ENVIRONMENT = false

	if _, err := os.Stat(LOG_VAR_ENV_FILENAME); errors.Is(err, os.ErrNotExist) {
		PRODUCTION_ENVIRONMENT = true
	}

	// If not production read config from file
	if !PRODUCTION_ENVIRONMENT {
		// Set configuration file details
		viper.SetConfigFile(LOG_VAR_ENV_FILENAME)

		// Read all the configs from Viper
		err := viper.ReadInConfig()
		if err != nil {
			fmt.Println("Failed to read from the file ", err)
			return false
		}
	}

	// Logging
	_, LogVar.LoggingLevel = ReadENVValueInt(PRODUCTION_ENVIRONMENT, CWD_VAR_LOG_LEVEL)
	_, LogVar.EnableFileLogging = ReadENVValueBool(PRODUCTION_ENVIRONMENT, CWD_VAR_LOG_FILE_ENABLED)
	_, LogVar.EnableConsoleLogging = ReadENVValueBool(PRODUCTION_ENVIRONMENT, CWD_VAR_LOG_CONSOLE_ENABLED)

	if LogVar.EnableFileLogging {
		status, LogVar.FileLoggingLocation = ReadENVValueString(PRODUCTION_ENVIRONMENT, CWD_VAR_LOG_FILE_LOCATION)
	}

	return status
}
