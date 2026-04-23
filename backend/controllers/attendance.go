package controllers

import (
	"fmt"
	"net/http"
	"time"

	"attendance/config"
	"attendance/models"
	"attendance/utils"

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

	now := utils.Now()
	today := utils.FormatDate(now)
	clientIP := c.ClientIP()

	var attendance models.Attendance
	result := config.DB.Where("user_id = ? AND date = ?", userID, today).First(&attendance)

	if result.Error != nil {
		attendance = models.Attendance{
			UserID: userID,
			Date:   today,
		}
	}

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
		"message":         fmt.Sprintf("%s check-in successful", req.Type),
		"attendance":      formatAttendance(attendance),
		"check_in_time":   formatTimeStr(attendance.CheckInTime),
		"check_out_time":  formatTimeStr(attendance.CheckOutTime),
	})
}

func GetTodayAttendance(c *gin.Context) {
	userID := c.GetUint("user_id")
	today := utils.FormatDate(utils.Now())

	var attendance models.Attendance
	result := config.DB.Where("user_id = ? AND date = ?", userID, today).First(&attendance)

	if result.Error != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "No attendance record for today",
			"date":    today,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":               attendance.ID,
		"user_id":          attendance.UserID,
		"date":             attendance.Date,
		"check_in_time":    formatTimeStr(attendance.CheckInTime),
		"check_in_ip":      attendance.CheckInIP,
		"check_in_status":  attendance.CheckInStatus,
		"check_out_time":   formatTimeStr(attendance.CheckOutTime),
		"check_out_ip":     attendance.CheckOutIP,
		"check_out_status": attendance.CheckOutStatus,
		"overall_status":   attendance.OverallStatus,
	})
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

	result := make([]map[string]interface{}, 0)
	for _, a := range attendances {
		result = append(result, formatAttendance(a))
	}

	c.JSON(http.StatusOK, result)
}

func GetMyMonthlyStats(c *gin.Context) {
	userID := c.GetUint("user_id")
	now := utils.Now()
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
	return time.Date(year, month+1, 0, 0, 0, 0, 0, utils.ChinaLocation).Day()
}

func formatTimeStr(t *time.Time) string {
	if t == nil {
		return ""
	}
	return utils.FormatTime(*t)
}

func formatAttendance(a models.Attendance) map[string]interface{} {
	return map[string]interface{}{
		"id":               a.ID,
		"user_id":          a.UserID,
		"date":             a.Date,
		"check_in_time":    formatTimeStr(a.CheckInTime),
		"check_in_ip":      a.CheckInIP,
		"check_in_status":  a.CheckInStatus,
		"check_out_time":   formatTimeStr(a.CheckOutTime),
		"check_out_ip":     a.CheckOutIP,
		"check_out_status": a.CheckOutStatus,
		"overall_status":   a.OverallStatus,
		"created_at":       utils.FormatDateTime(a.CreatedAt),
	}
}
