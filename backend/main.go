package main

import (
	"attendance/config"
	"attendance/database"
	"attendance/routes"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	for i := 0; i < 10; i++ {
		config.ConnectDatabase()
		if config.DB != nil {
			break
		}
		time.Sleep(3 * time.Second)
	}

	database.SeedDatabase()

	r := gin.Default()

	routes.SetupRoutes(r)

	r.Run(":8080")
}
