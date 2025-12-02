package postgres

import (
	"strings"
)

// BuildWhereClause constructs a WHERE clause from conditions and parameters.
func BuildWhereClause(conditions []string, params []interface{}, paramCount *int) (string, []interface{}) {
	if len(conditions) == 0 {
		return "", params
	}
	return " WHERE " + strings.Join(conditions, " AND "), params
}