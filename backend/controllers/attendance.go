package controllers

import (
	"fmt"
	"net/http"
	"time"

	"attendance/config"
	"attendance/models"

	"github.com/gin-gonic/gin"
)

type CheckInRequest struct {
	Type models.CheckInType `json:"type" binding:"required"`
}

type MonthlyStats struct {
	TotalDays      int `json:"total_days"`
	PresentDays    int `json:"present_days"`
	LateDays       int `json:"late_days"`
	EarlyLeaveDays int `json:"early_leave_days"`
	AbsentDays     int `json:"absent_days"`
}

func CheckIn(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req CheckInRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	today := time.Now().Format("2006-01-02")
	clientIP := c.ClientIP()

	var attendance models.Attendance
	result := config.DB.Where("user_id = ? AND date = ?", userID, today).First(&attendance)

	if result.Error != nil {
		attendance = models.Attendance{
			UserID: userID,
			Date:   today,
		}
	}

	now := time.Now()

	if req.Type == models.CheckInTypeMorning {
		if attendance.CheckInTime != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You have already checked in today"})
			return
		}
		attendance.CheckInTime = &now
		attendance.CheckInIP = clientIP
	} else if req.Type == models.CheckInTypeEvening {
		if attendance.CheckOutTime != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You have already checked out today"})
			return
		}
		if attendance.CheckInTime == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You must check in first before checking out"})
			return
		}
		attendance.CheckOutTime = &now
		attendance.CheckOutIP = clientIP
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid check-in type"})
		return
	}

	attendance.CalculateStatus()

	if result.Error != nil {
		config.DB.Create(&attendance)
	} else {
		config.DB.Save(&attendance)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    fmt.Sprintf("%s check-in successful", req.Type),
		"attendance": attendance,
	})
}

func GetTodayAttendance(c *gin.Context) {
	userID := c.GetUint("user_id")
	today := time.Now().Format("2006-01-02")

	var attendance models.Attendance
	result := config.DB.Where("user_id = ? AND date = ?", userID, today).First(&attendance)

	if result.Error != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "No attendance record for today",
			"date":    today,
		})
		return
	}

	c.JSON(http.StatusOK, attendance)
}

func GetMyAttendanceRecords(c *gin.Context) {
	userID := c.GetUint("user_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := config.DB.Where("user_id = ?", userID)

	if startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	var attendances []models.Attendance
	query.Order("date DESC").Find(&attendances)

	c.JSON(http.StatusOK, attendances)
}

func GetMyMonthlyStats(c *gin.Context) {
	userID := c.GetUint("user_id")
	now := time.Now()
	year, month, _ := now.Date()

	startDate := fmt.Sprintf("%d-%02d-01", year, month)
	endDate := fmt.Sprintf("%d-%02d-%02d", year, month, daysInMonth(year, month))

	var attendances []models.Attendance
	config.DB.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).Find(&attendances)

	stats := MonthlyStats{}
	stats.TotalDays = len(attendances)

	for _, a := range attendances {
		switch a.OverallStatus {
		case models.StatusNormal:
			stats.PresentDays++
		case models.StatusLate:
			stats.LateDays++
			stats.PresentDays++
		case models.StatusSevereLate:
			stats.LateDays++
			stats.PresentDays++
		case models.StatusEarlyLeave:
			stats.EarlyLeaveDays++
			stats.PresentDays++
		case models.StatusAbsent:
			stats.AbsentDays++
		}
	}

	c.JSON(http.StatusOK, stats)
}

func daysInMonth(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, time.Local).Day()
}
