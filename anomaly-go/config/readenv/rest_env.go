package readenv

import (
	"anomaly-go/log"
	"os"

	"github.com/spf13/viper"
	"go.uber.org/zap"
)

var GinConfigVar GinConfiguration

func ReadRestConfiguration() bool {

	PRODUCTION_ENVIRONMENT = false
	status = false
	if _, err := os.Stat(REST_VAR_ENV_FILENAME); err != nil {
		log.WriteLog.Error("Env file not found", zap.Error(err))
		return false
	}
	viper.SetConfigFile(REST_VAR_ENV_FILENAME)

	// Read all the configs from Viper
	err := viper.ReadInConfig()
	if err != nil {
		log.WriteLog.Error("Failed to read from the file", zap.Error(err))
		return false
	}
	status = readWebRestConfiguration()

	if !status {
		return status
	}
	return true
}
func readWebRestConfiguration() bool {
	// Gin Information for Devices
	_, GinConfigVar.GinData.PublicServerPort = ReadENVValueInt32(PRODUCTION_ENVIRONMENT, GIN_VAR_REST_SERVER_EXTERNAL_PORT)

	log.LogSecretsInInt32(PRODUCTION_ENVIRONMENT, "GinConfigVar.GinData.PublicServerPort", GinConfigVar.GinData.PublicServerPort)
	status, GinConfigVar.V1BasePath = ReadENVValueString(PRODUCTION_ENVIRONMENT, GIN_VAR_REST_BASE_PATH)
	if !status {
		log.WriteLog.Error("Error with the configuration, GinConfigVar.V1BasePath is not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "GinConfigVar.V1BasePath", GinConfigVar.V1BasePath)
	status, tokenKey := ReadENVValueString(PRODUCTION_ENVIRONMENT, GIN_VAR_REST_WEB_JWT_PASSKEY)
	if !status {
		log.WriteLog.Error("Error with the configuration, GinConfigVar.GinWebVar.WebJWTTokenKey is not present")
		return false
	}

	log.LogSecretsInString(PRODUCTION_ENVIRONMENT, "GinConfigVar.GinWebVar.WebJWTTokenKey", tokenKey)

	GinConfigVar.GinWebVar.WebJWTTokenKey = []byte(tokenKey)
	return true
}

type GinConfiguration struct {
	V1BasePath string
	GinData    GinDataConfiguration
	GinWebVar  GinWebServiceConfiguration
}

type GinDataConfiguration struct {
	PublicServerPort int32
}
type GinWebServiceConfiguration struct {
	WebJWTTokenKey []byte
}
