package database

import (
	"fmt"
	"math/rand"
	"time"

	"attendance/config"
	"attendance/models"
	"attendance/utils"
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
	now := utils.Now()
	startDate := now.AddDate(0, -1, 0)

	for d := startDate; d.Before(now); d = d.AddDate(0, 0, 1) {
		if d.Weekday() == time.Saturday || d.Weekday() == time.Sunday {
			continue
		}

		dateStr := utils.FormatDate(d)

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

		lateChance := rand.Intn(100)
		var checkInHour, checkInMinute int
		
		if lateChance < 10 {
			checkInHour = 7
			checkInMinute = 30 + rand.Intn(30)
		} else if lateChance < 70 {
			checkInHour = 8
			checkInMinute = 30 + rand.Intn(30)
		} else if lateChance < 85 {
			checkInHour = 9
			checkInMinute = 0 + rand.Intn(30)
		} else {
			checkInHour = 9
			checkInMinute = 35 + rand.Intn(30)
		}

		checkInTime := utils.ChinaDate(d.Year(), d.Month(), d.Day(), checkInHour, checkInMinute, 0)
		attendance.CheckInTime = &checkInTime
		attendance.CheckInIP = fmt.Sprintf("192.168.1.%d", 100+rand.Intn(100))

		checkOutChance := rand.Intn(100)
		var checkOutHour, checkOutMinute int
		if checkOutChance < 10 {
			checkOutHour = 16 + rand.Intn(2)
			checkOutMinute = rand.Intn(60)
		} else if checkOutChance < 80 {
			checkOutHour = 17
			checkOutMinute = 30 + rand.Intn(30)
		} else {
			checkOutHour = 18
			checkOutMinute = 0 + rand.Intn(30)
		}
		
		checkOutTime := utils.ChinaDate(d.Year(), d.Month(), d.Day(), checkOutHour, checkOutMinute, 0)
		attendance.CheckOutTime = &checkOutTime
		attendance.CheckOutIP = fmt.Sprintf("192.168.1.%d", 100+rand.Intn(100))

		attendance.CalculateStatus()

		config.DB.Create(attendance)
	}
}
