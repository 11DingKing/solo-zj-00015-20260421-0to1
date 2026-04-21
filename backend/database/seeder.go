package database

import (
	"fmt"
	"math/rand"
	"time"

	"attendance/config"
	"attendance/models"

	"gorm.io/gorm"
)

func SeedDatabase() {
	var count int64
	config.DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		fmt.Println("Database already seeded, skipping...")
		return
	}

	fmt.Println("Seeding database...")

	admin := &models.User{
		Username: "admin",
		Name:     "系统管理员",
		Role:     models.RoleAdmin,
	}
	admin.HashPassword("admin123")
	config.DB.Create(admin)

	employees := []*models.User{
		{Username: "zhangsan", Name: "张三", Role: models.RoleEmployee},
		{Username: "lisi", Name: "李四", Role: models.RoleEmployee},
		{Username: "wangwu", Name: "王五", Role: models.RoleEmployee},
	}

	for _, emp := range employees {
		emp.HashPassword("123456")
		config.DB.Create(emp)
	}

	rand.Seed(time.Now().UnixNano())

	for _, emp := range employees {
		generateAttendanceHistory(emp.ID)
	}

	fmt.Println("Database seeded successfully!")
}

func generateAttendanceHistory(userID uint) {
	now := time.Now()
	startDate := now.AddDate(0, -1, 0)

	for d := startDate; d.Before(now); d = d.AddDate(0, 0, 1) {
		if d.Weekday() == time.Saturday || d.Weekday() == time.Sunday {
			continue
		}

		dateStr := d.Format("2006-01-02")

		attendance := &models.Attendance{
			UserID: userID,
			Date:   dateStr,
		}

		absentChance := rand.Intn(100)
		if absentChance < 5 {
			attendance.OverallStatus = models.StatusAbsent
			config.DB.Create(attendance)
			continue
		}

		checkInHour := 8 + rand.Intn(3)
		checkInMinute := rand.Intn(60)
		if checkInHour == 8 {
			checkInMinute = rand.Intn(30) + 30
		}

		checkInTime := time.Date(d.Year(), d.Month(), d.Day(), checkInHour, checkInMinute, 0, 0, time.Local)
		attendance.CheckInTime = &checkInTime
		attendance.CheckInIP = "192.168.1." + string(rune(100+rand.Intn(100)))

		checkOutChance := rand.Intn(100)
		if checkOutChance < 10 {
			checkOutHour := 16 + rand.Intn(2)
			checkOutMinute := rand.Intn(60)
			checkOutTime := time.Date(d.Year(), d.Month(), d.Day(), checkOutHour, checkOutMinute, 0, 0, time.Local)
			attendance.CheckOutTime = &checkOutTime
			attendance.CheckOutIP = "192.168.1." + string(rune(100+rand.Intn(100)))
		} else {
			checkOutHour := 18 + rand.Intn(2)
			checkOutMinute := rand.Intn(60)
			checkOutTime := time.Date(d.Year(), d.Month(), d.Day(), checkOutHour, checkOutMinute, 0, 0, time.Local)
			attendance.CheckOutTime = &checkOutTime
			attendance.CheckOutIP = "192.168.1." + string(rune(100+rand.Intn(100)))
		}

		attendance.CalculateStatus()

		config.DB.Create(attendance)
	}
}
