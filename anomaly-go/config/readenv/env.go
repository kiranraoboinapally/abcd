package readenv

import "anomaly-go/log"

func ReadENVData() bool {
	status := ReadLoggingConfiguration()
	if !status {
		// Putting default Values
		LogVar.LoggingLevel = 7
		LogVar.EnableConsoleLogging = true
		LogVar.EnableFileLogging = true
		LogVar.FileLoggingLocation = "/tmp/CWDBMED.log"
	}

	// Initializing zap log
	_, log.WriteLog = log.LogInFile(LogVar.FileLoggingLocation, LogVar.EnableFileLogging, LogVar.EnableConsoleLogging, LogVar.LoggingLevel)

	// Intialize zap log for printing secrets
	_, log.WriteSecretLog = log.LogInFile(LogVar.FileLoggingLocation, LogVar.EnableFileLogging, LogVar.EnableConsoleLogging, LogVar.LoggingLevel)

	if !ReadRestConfiguration() {
		log.WriteLog.Error("REST Configuration ENVs problem")
		return false
	}

	// DBCOMM Configuration
	if !ReadDBCOMConfiguration() {
		log.WriteLog.Error("DBCOM Configuration ENVs problem")
		return false
	}
	return true
}
