package models

import (
	"time"

	"gorm.io/gorm"
)

type AttendanceStatus string

const (
	StatusNormal      AttendanceStatus = "normal"
	StatusLate        AttendanceStatus = "late"
	StatusSevereLate  AttendanceStatus = "severe_late"
	StatusEarlyLeave  AttendanceStatus = "early_leave"
	StatusAbsent      AttendanceStatus = "absent"
)

type CheckInType string

const (
	CheckInTypeMorning CheckInType = "morning"
	CheckInTypeEvening CheckInType = "evening"
)

type Attendance struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	UserID          uint           `json:"user_id" gorm:"index;not null"`
	Date            string         `json:"date" gorm:"type:date;not null;index"`
	CheckInTime     *time.Time     `json:"check_in_time"`
	CheckInIP       string         `json:"check_in_ip" gorm:"size:50"`
	CheckInStatus   AttendanceStatus `json:"check_in_status" gorm:"size:20"`
	CheckOutTime    *time.Time     `json:"check_out_time"`
	CheckOutIP      string         `json:"check_out_ip" gorm:"size:50"`
	CheckOutStatus  AttendanceStatus `json:"check_out_status" gorm:"size:20"`
	OverallStatus   AttendanceStatus `json:"overall_status" gorm:"size:20"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
	
	User            User           `json:"user" gorm:"foreignKey:UserID"`
}

func (a *Attendance) CalculateStatus() {
	workStartHour := 9
	workEndHour := 18
	severeLateMinutes := 30

	// Check in status
	if a.CheckInTime != nil {
		checkInHour := a.CheckInTime.Hour()
		checkInMinute := a.CheckInTime.Minute()
		
		if checkInHour > workStartHour || (checkInHour == workStartHour && checkInMinute > 0) {
			lateMinutes := (checkInHour - workStartHour) * 60 + checkInMinute
			if lateMinutes > severeLateMinutes {
				a.CheckInStatus = StatusSevereLate
			} else {
				a.CheckInStatus = StatusLate
			}
		} else {
			a.CheckInStatus = StatusNormal
		}
	}

	// Check out status
	if a.CheckOutTime != nil {
		checkOutHour := a.CheckOutTime.Hour()
		checkOutMinute := a.CheckOutTime.Minute()
		
		if checkOutHour < workEndHour || (checkOutHour == workEndHour && checkOutMinute < 0) {
			a.CheckOutStatus = StatusEarlyLeave
		} else {
			a.CheckOutStatus = StatusNormal
		}
	}

	// Overall status
	if a.CheckInTime == nil && a.CheckOutTime == nil {
		a.OverallStatus = StatusAbsent
	} else if a.CheckInStatus == StatusSevereLate || a.CheckOutStatus == StatusEarlyLeave {
		if a.CheckInStatus == StatusSevereLate {
			a.OverallStatus = StatusSevereLate
		} else {
			a.OverallStatus = StatusEarlyLeave
		}
	} else if a.CheckInStatus == StatusLate {
		a.OverallStatus = StatusLate
	} else {
		a.OverallStatus = StatusNormal
	}
}
