package routes

import (
	"attendance/controllers"
	"attendance/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.POST("/api/login", controllers.Login)

	auth := r.Group("/api")
	auth.Use(middlewares.JWTAuth())
	{
		auth.GET("/me", controllers.GetCurrentUser)

		employee := auth.Group("")
		employee.Use(middlewares.EmployeeOnly())
		{
			employee.POST("/check-in", controllers.CheckIn)
			employee.GET("/attendance/today", controllers.GetTodayAttendance)
			employee.GET("/attendance/my", controllers.GetMyAttendanceRecords)
			employee.GET("/attendance/my/stats", controllers.GetMyMonthlyStats)
		}

		admin := auth.Group("/admin")
		admin.Use(middlewares.AdminOnly())
		{
			admin.GET("/attendance", controllers.GetAllAttendanceRecords)
			admin.GET("/employees", controllers.GetAllEmployees)
			admin.GET("/attendance/export", controllers.ExportMonthlySummary)
			admin.GET("/employees/:id/attendance", controllers.GetEmployeeAttendance)
		}
	}
}
