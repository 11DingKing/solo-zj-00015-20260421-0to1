package utils

import (
	"time"
)

var ChinaLocation *time.Location

func init() {
	var err error
	ChinaLocation, err = time.LoadLocation("Asia/Shanghai")
	if err != nil {
		ChinaLocation = time.FixedZone("CST", 8*3600)
	}
}

func Now() time.Time {
	return time.Now().In(ChinaLocation)
}

func ToChinaTime(t time.Time) time.Time {
	return t.In(ChinaLocation)
}

func FormatDate(t time.Time) string {
	return t.In(ChinaLocation).Format("2006-01-02")
}

func FormatTime(t time.Time) string {
	return t.In(ChinaLocation).Format("15:04:05")
}

func FormatDateTime(t time.Time) string {
	return t.In(ChinaLocation).Format("2006-01-02 15:04:05")
}

func ChinaDate(year int, month time.Month, day, hour, min, sec int) time.Time {
	return time.Date(year, month, day, hour, min, sec, 0, ChinaLocation)
}

func GetChinaHour(t time.Time) int {
	return t.In(ChinaLocation).Hour()
}

func GetChinaMinute(t time.Time) int {
	return t.In(ChinaLocation).Minute()
}
