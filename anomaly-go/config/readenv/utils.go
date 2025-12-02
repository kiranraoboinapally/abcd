package readenv

import "github.com/spf13/viper"

// Helper function read configurations from either File / OS ENV
func ReadENVValueInt(productionEnv bool, configName string) (bool, int) {

	// Get the Data
	value := viper.GetInt(configName)

	return true, value
}

// Helper function read configurations from either File / OS ENV
func ReadENVValueString(productionEnv bool, configName string) (bool, string) {

	// Get the Data
	value := viper.GetString(configName)

	if value == "" {
		return false, ""
	}

	return true, value
}

// Helper function read configurations from either File / OS ENV
func ReadENVValueUInt16(productionEnv bool, configName string) (bool, uint16) {

	if productionEnv {
		viper.BindEnv(configName)
	}

	// Get the Data
	value := viper.GetUint16(configName)

	return true, value
}

func ReadENVValueInt32(productionEnv bool, configName string) (bool, int32) {

	if productionEnv {
		viper.BindEnv(configName)
	}

	// Get the Data
	value := viper.GetInt32(configName)

	return true, value
}

// Helper function read configurations from either File / OS ENV
func ReadENVValueBool(productionEnv bool, configName string) (bool, bool) {

	if productionEnv {
		viper.BindEnv(configName)
	}

	// Get the Data
	value := viper.GetBool(configName)

	return true, value
}
