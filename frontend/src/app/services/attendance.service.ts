import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  check_in_time: string | null;
  check_in_ip: string;
  check_in_status: string;
  check_out_time: string | null;
  check_out_ip: string;
  check_out_status: string;
  overall_status: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyStats {
  total_days: number;
  present_days: number;
  late_days: number;
  early_leave_days: number;
  absent_days: number;
}

export interface CheckInResponse {
  message: string;
  attendance: Attendance;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  checkIn(type: 'morning' | 'evening'): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${this.apiUrl}/check-in`, { type });
  }

  getTodayAttendance(): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.apiUrl}/attendance/today`);
  }

  getMyAttendance(startDate?: string, endDate?: string): Observable<Attendance[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<Attendance[]>(`${this.apiUrl}/attendance/my`, { params });
  }

  getMyMonthlyStats(): Observable<MonthlyStats> {
    return this.http.get<MonthlyStats>(`${this.apiUrl}/attendance/my/stats`);
  }

  getAllAttendance(startDate?: string, endDate?: string, employeeName?: string): Observable<Attendance[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    if (employeeName) params = params.set('employee_name', employeeName);
    return this.http.get<Attendance[]>(`${this.apiUrl}/admin/attendance`, { params });
  }

  getAllEmployees(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/employees`);
  }

  exportMonthlySummary(year?: number, month?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.get<any>(`${this.apiUrl}/admin/attendance/export`, { params, responseType: 'json' });
  }

  getEmployeeAttendance(employeeId: number, startDate?: string, endDate?: string): Observable<Attendance[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<Attendance[]>(`${this.apiUrl}/admin/employees/${employeeId}/attendance`, { params });
  }
}
