package main

import (
	"anomaly-go/router"
)

func main() {
    // initialize router, start server, etc.
    r := router.SetupRouter()
    r.Run() // or whatever your entry point is
}
