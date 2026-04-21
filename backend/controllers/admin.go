package controllers

import (
	"fmt"
	"net/http"
	"time"

	"attendance/config"
	"attendance/models"

	"github.com/gin-gonic/gin"
)

func GetAllAttendanceRecords(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	employeeName := c.Query("employee_name")

	query := config.DB.Model(&models.Attendance{}).Preload("User")

	if startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("date <= ?", endDate)
	}
	if employeeName != "" {
		query = query.Joins("JOIN users ON users.id = attendances.user_id").
			Where("users.name LIKE ?", "%"+employeeName+"%")
	}

	var attendances []models.Attendance
	query.Order("date DESC").Find(&attendances)

	c.JSON(http.StatusOK, attendances)
}

func GetAllEmployees(c *gin.Context) {
	var users []models.User
	config.DB.Where("role = ?", models.RoleEmployee).Find(&users)
	c.JSON(http.StatusOK, users)
}

func ExportMonthlySummary(c *gin.Context) {
	now := time.Now()
	year := now.Year()
	month := int(now.Month())

	if yearParam := c.Query("year"); yearParam != "" {
		fmt.Sscanf(yearParam, "%d", &year)
	}
	if monthParam := c.Query("month"); monthParam != "" {
		fmt.Sscanf(monthParam, "%d", &month)
	}

	startDate := fmt.Sprintf("%d-%02d-01", year, month)
	lastDay := daysInMonth(year, time.Month(month))
	endDate := fmt.Sprintf("%d-%02d-%02d", year, month, lastDay)

	var attendances []models.Attendance
	config.DB.Where("date >= ? AND date <= ?", startDate, endDate).
		Preload("User").
		Order("date ASC").
		Find(&attendances)

	type EmployeeSummary struct {
		EmployeeID   uint                `json:"employee_id"`
		EmployeeName string              `json:"employee_name"`
		TotalDays    int                 `json:"total_days"`
		PresentDays  int                 `json:"present_days"`
		LateDays     int                 `json:"late_days"`
		SevereLate   int                 `json:"severe_late_days"`
		EarlyLeave   int                 `json:"early_leave_days"`
		AbsentDays   int                 `json:"absent_days"`
		DailyRecords []models.Attendance `json:"daily_records"`
	}

	employeeMap := make(map[uint]*EmployeeSummary)

	for _, a := range attendances {
		if a.User.Role != models.RoleEmployee {
			continue
		}

		summary, exists := employeeMap[a.UserID]
		if !exists {
			summary = &EmployeeSummary{
				EmployeeID:   a.UserID,
				EmployeeName: a.User.Name,
				DailyRecords: []models.Attendance{},
			}
			employeeMap[a.UserID] = summary
		}

		summary.TotalDays++
		summary.DailyRecords = append(summary.DailyRecords, a)

		switch a.OverallStatus {
		case models.StatusNormal:
			summary.PresentDays++
		case models.StatusLate:
			summary.LateDays++
			summary.PresentDays++
		case models.StatusSevereLate:
			summary.SevereLate++
			summary.LateDays++
			summary.PresentDays++
		case models.StatusEarlyLeave:
			summary.EarlyLeave++
			summary.PresentDays++
		case models.StatusAbsent:
			summary.AbsentDays++
		}
	}

	var summaries []EmployeeSummary
	for _, s := range employeeMap {
		summaries = append(summaries, *s)
	}

	exportData := gin.H{
		"year":     year,
		"month":    month,
		"exported_at": time.Now().Format("2006-01-02 15:04:05"),
		"employees": summaries,
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=attendance_summary_%d_%02d.json", year, month))
	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, exportData)
}

func GetEmployeeAttendance(c *gin.Context) {
	employeeID := c.Param("id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := config.DB.Where("user_id = ?", employeeID)

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
