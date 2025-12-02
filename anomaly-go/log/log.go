package log

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var WriteLog *zap.Logger
var WriteSecretLog *zap.Logger

// -----------------------------------------------------------------------------
// Initialize both loggers and store logs inside ./logs/
// -----------------------------------------------------------------------------
func InitLogs() error {
	// ensure logs folder exists
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("failed to create log directory: %v", err)
	}

	ok, mainLogger := LogInFile(filepath.Join(logDir, "app.log"), true, true, 7)
	if !ok {
		return fmt.Errorf("failed to init main logger")
	}
	WriteLog = mainLogger

	ok, secretLogger := LogInFile(filepath.Join(logDir, "secrets.log"), true, false, 7)
	if !ok {
		return fmt.Errorf("failed to init secret logger")
	}
	WriteSecretLog = secretLogger

	WriteLog.Info("Loggers initialized successfully", zap.String("directory", logDir))
	return nil
}

// -----------------------------------------------------------------------------
// Safe Secret Logging Helpers (with nil check)
// -----------------------------------------------------------------------------
func safeSecretLog() *zap.Logger {
	if WriteSecretLog == nil {
		fmt.Println("[WARN] Secret logger not initialized, skipping log")
		return nil
	}
	return WriteSecretLog
}

func LogSecretsInString(isProd bool, secretkey, secretVal string) {
	if !isProd {
		logger := safeSecretLog()
		if logger != nil {
			logger.Debug("Read value from environments", zap.String(secretkey, secretVal))
		}
	}
}

func LogSecretsInBool(isProd bool, secretkey string, secretVal bool) {
	if !isProd {
		logger := safeSecretLog()
		if logger != nil {
			logger.Debug("Read value from environments", zap.Bool(secretkey, secretVal))
		}
	}
}

func LogSecretsInInt(isProd bool, secretkey string, secretVal int) {
	if !isProd {
		logger := safeSecretLog()
		if logger != nil {
			logger.Debug("Read value from environments", zap.Int(secretkey, secretVal))
		}
	}
}

func LogSecretsInInt32(isProd bool, secretkey string, secretVal int32) {
	if !isProd {
		logger := safeSecretLog()
		if logger != nil {
			logger.Debug("Read value from environments", zap.Int32(secretkey, secretVal))
		}
	}
}

func LogSecretsInInt64(isProd bool, secretkey string, secretVal int64) {
	if !isProd {
		logger := safeSecretLog()
		if logger != nil {
			logger.Debug("Read value from environments", zap.Int64(secretkey, secretVal))
		}
	}
}

func LogSecretsInUint(isProd bool, secretkey string, secretVal uint) {
	if !isProd {
		logger := safeSecretLog()
		if logger != nil {
			logger.Debug("Read value from environments", zap.Uint(secretkey, secretVal))
		}
	}
}

// -----------------------------------------------------------------------------
// Log Level Conversion
// -----------------------------------------------------------------------------
func convertLogLevelToString(logLevel int) string {
	switch logLevel {
	case 0, 1:
		fmt.Println("Log level Fatal")
		return "FATAL"
	case 2:
		fmt.Println("Log level Panic")
		return "PANIC"
	case 3:
		fmt.Println("Log level DPanic")
		return "DPANIC"
	case 4:
		fmt.Println("Log level Error")
		return "ERROR"
	case 5:
		fmt.Println("Log level Warn")
		return "WARN"
	case 6:
		fmt.Println("Log level Info")
		return "INFO"
	case 7:
		fmt.Println("Log level Debug")
		return "DEBUG"
	default:
		fmt.Println("Defaulting to Error level")
		return "ERROR"
	}
}

// -----------------------------------------------------------------------------
// Zap Setup — Local Time for All Logs
// -----------------------------------------------------------------------------
func LogInFile(filename string, enableFile bool, enableConsole bool, level int) (bool, *zap.Logger) {
	if !enableConsole && !enableFile {
		level = 0
	}

	config := zap.NewProductionEncoderConfig()
	config.StacktraceKey = ""

	// ✅ Use local system time for all logs
	config.EncodeTime = func(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
		localTime := t.Local()
		enc.AppendString(localTime.Format(time.RFC3339))
	}

	fileEncoder := zapcore.NewJSONEncoder(config)
	consoleEncoder := zapcore.NewConsoleEncoder(config)

	var writer zapcore.WriteSyncer
	var core zapcore.Core

	logLevelStr := convertLogLevelToString(level)
	defaultLogLevel, err := zapcore.ParseLevel(logLevelStr)
	if err != nil {
		return false, nil
	}

	if enableFile {
		logFile, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0640)
		if err == nil {
			writer = zapcore.AddSync(logFile)
		} else {
			fmt.Println("Unable to write into file:", filename, "Error:", err)
			enableFile = false
		}
	}

	fmt.Println("Loglevel is set to", level)

	if enableConsole && enableFile {
		fmt.Println("Logs printing in Console and File")
		core = zapcore.NewTee(
			zapcore.NewCore(fileEncoder, writer, defaultLogLevel),
			zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), defaultLogLevel),
		)
	} else if enableFile {
		fmt.Println("Logs printing in File only")
		core = zapcore.NewCore(fileEncoder, writer, defaultLogLevel)
	} else {
		fmt.Println("Logs printing in Console only")
		core = zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), defaultLogLevel)
	}

	logger := zap.New(core, zap.AddCaller())
	return true, logger
}
