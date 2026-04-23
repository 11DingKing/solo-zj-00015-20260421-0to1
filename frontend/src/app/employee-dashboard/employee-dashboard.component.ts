import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AttendanceService, Attendance, MonthlyStats } from '../services/attendance.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('checkInAnimation', [
      state('idle', style({
        transform: 'scale(1)'
      })),
      state('success', style({
        transform: 'scale(1.1)',
        backgroundColor: '#28a745'
      })),
      transition('idle => success', [
        animate('0.3s ease-out')
      ]),
      transition('success => idle', [
        animate('0.3s ease-in')
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.3s ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('pulse', [
      state('idle', style({ transform: 'scale(1)' })),
      state('pulsing', style({ transform: 'scale(1.05)' })),
      transition('idle <=> pulsing', [
        animate('0.5s ease-in-out')
      ])
    ])
  ],
  template: `
    <div class="dashboard">
      <div *ngIf="successMessage" [@fadeInOut] class="success-alert">
        <span class="check-icon">✓</span>
        {{ successMessage }}
      </div>

      <div class="dashboard-grid">
        <div class="card checkin-card">
          <h3>今日打卡</h3>
          <div class="checkin-section">
            <div class="checkin-time">
              <p class="time-label">上班打卡</p>
              <p class="time-value" [class.late]="isCheckInLate">
                {{ formatTime(todayAttendance?.check_in_time) }}
              </p>
              <p *ngIf="todayAttendance && todayAttendance.check_in_status" 
                 class="status-badge"
                 [class.status-normal]="todayAttendance.check_in_status === 'normal'"
                 [class.status-late]="todayAttendance.check_in_status === 'late'"
                 [class.status-severe]="todayAttendance.check_in_status === 'severe_late'">
                {{ getStatusLabel(todayAttendance.check_in_status) }}
              </p>
            </div>
            
            <button 
              (click)="checkIn('morning')"
              [disabled]="todayAttendance?.check_in_time || loading"
              [@checkInAnimation]="checkInAnimationState"
              class="checkin-btn morning"
            >
              {{ loading && loadingType === 'morning' ? '打卡中...' : '上班打卡' }}
            </button>
          </div>

          <div class="divider"></div>

          <div class="checkin-section">
            <div class="checkin-time">
              <p class="time-label">下班打卡</p>
              <p class="time-value" [class.early]="isCheckOutEarly">
                {{ formatTime(todayAttendance?.check_out_time) }}
              </p>
              <p *ngIf="todayAttendance && todayAttendance.check_out_status" 
                 class="status-badge"
                 [class.status-normal]="todayAttendance.check_out_status === 'normal'"
                 [class.status-early]="todayAttendance.check_out_status === 'early_leave'">
                {{ getStatusLabel(todayAttendance.check_out_status) }}
              </p>
            </div>
            
            <button 
              (click)="checkIn('evening')"
              [disabled]="!todayAttendance?.check_in_time || todayAttendance?.check_out_time || loading"
              [@checkInAnimation]="checkOutAnimationState"
              class="checkin-btn evening"
            >
              {{ loading && loadingType === 'evening' ? '打卡中...' : '下班打卡' }}
            </button>
          </div>
        </div>

        <div class="card stats-card">
          <h3>本月考勤统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <p class="stat-value">{{ monthlyStats?.present_days || 0 }}</p>
              <p class="stat-label">出勤天数</p>
            </div>
            <div class="stat-item late">
              <p class="stat-value">{{ monthlyStats?.late_days || 0 }}</p>
              <p class="stat-label">迟到次数</p>
            </div>
            <div class="stat-item early">
              <p class="stat-value">{{ monthlyStats?.early_leave_days || 0 }}</p>
              <p class="stat-label">早退次数</p>
            </div>
            <div class="stat-item absent">
              <p class="stat-value">{{ monthlyStats?.absent_days || 0 }}</p>
              <p class="stat-label">缺勤天数</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card calendar-card">
        <div class="calendar-header">
          <button (click)="prevMonth()" class="nav-btn">←</button>
          <h3>{{ currentYear }}年{{ currentMonth + 1 }}月</h3>
          <button (click)="nextMonth()" class="nav-btn">→</button>
        </div>
        <div class="calendar">
          <div class="calendar-weekday" *ngFor="let day of weekDays">{{ day }}</div>
          <ng-container *ngFor="let day of calendarDays">
            <div 
              class="calendar-day"
              [class.is-today]="isToday(day)"
              [class.is-weekend]="isWeekend(day)"
              [class.status-normal]="getDayStatus(day) === 'normal'"
              [class.status-late]="getDayStatus(day) === 'late'"
              [class.status-severe]="getDayStatus(day) === 'severe_late'"
              [class.status-early]="getDayStatus(day) === 'early_leave'"
              [class.status-absent]="getDayStatus(day) === 'absent'"
              [class.other-month]="!isCurrentMonth(day)"
            >
              {{ day.getDate() }}
            </div>
          </ng-container>
        </div>
        <div class="calendar-legend">
          <span class="legend-item normal">正常</span>
          <span class="legend-item late">迟到</span>
          <span class="legend-item severe">严重迟到</span>
          <span class="legend-item early">早退</span>
          <span class="legend-item absent">缺勤</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .success-alert {
      background: #d4edda;
      color: #155724;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
    }
    .check-icon {
      width: 24px;
      height: 24px;
      background: #28a745;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: white;
      border-radius: 15px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .card h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.25rem;
    }
    .checkin-card {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .checkin-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
    }
    .divider {
      height: 1px;
      background: #e0e0e0;
      margin: 0.5rem 0;
    }
    .checkin-time {
      text-align: center;
    }
    .time-label {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.875rem;
    }
    .time-value {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }
    .time-value.late {
      color: #ffc107;
    }
    .time-value.early {
      color: #fd7e14;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-badge.status-normal {
      background: #d4edda;
      color: #155724;
    }
    .status-badge.status-late {
      background: #fff3cd;
      color: #856404;
    }
    .status-badge.status-severe {
      background: #f8d7da;
      color: #721c24;
    }
    .status-badge.status-early {
      background: #fff3e0;
      color: #e65100;
    }
    .checkin-btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      min-width: 120px;
    }
    .checkin-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .checkin-btn.morning:not(:disabled) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .checkin-btn.morning:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    .checkin-btn.evening:not(:disabled) {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
    }
    .checkin-btn.evening:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(56, 239, 125, 0.4);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .stat-item {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .stat-value {
      margin: 0 0 0.25rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }
    .stat-label {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }
    .stat-item.late .stat-value {
      color: #ffc107;
    }
    .stat-item.early .stat-value {
      color: #fd7e14;
    }
    .stat-item.absent .stat-value {
      color: #dc3545;
    }
    .calendar-card {
      overflow-x: auto;
    }
    .calendar-header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .calendar-header h3 {
      margin: 0;
    }
    .nav-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #667eea;
      color: white;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-btn:hover {
      background: #5a67d8;
    }
    .calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    .calendar-weekday {
      text-align: center;
      padding: 0.5rem;
      font-weight: 600;
      color: #666;
      font-size: 0.875rem;
    }
    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.2s;
      position: relative;
      font-size: 0.875rem;
    }
    .calendar-day:hover {
      transform: scale(1.05);
    }
    .calendar-day.other-month {
      color: #ccc;
      background: transparent !important;
    }
    .calendar-day.is-today {
      border: 2px solid #667eea;
    }
    .calendar-day.is-weekend {
      background: #f8f9fa;
      color: #999;
    }
    .calendar-day.status-normal:not(.is-weekend) {
      background: #d4edda;
      color: #155724;
    }
    .calendar-day.status-late:not(.is-weekend) {
      background: #fff3cd;
      color: #856404;
    }
    .calendar-day.status-severe:not(.is-weekend) {
      background: #f8d7da;
      color: #721c24;
    }
    .calendar-day.status-early:not(.is-weekend) {
      background: #fff3e0;
      color: #e65100;
    }
    .calendar-day.status-absent:not(.is-weekend) {
      background: #fee;
      color: #c00;
    }
    .calendar-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }
    .legend-item {
      padding: 0.25rem 0.75rem;
      border-radius: 5px;
      font-size: 0.75rem;
    }
    .legend-item.normal {
      background: #d4edda;
      color: #155724;
    }
    .legend-item.late {
      background: #fff3cd;
      color: #856404;
    }
    .legend-item.severe {
      background: #f8d7da;
      color: #721c24;
    }
    .legend-item.early {
      background: #fff3e0;
      color: #e65100;
    }
    .legend-item.absent {
      background: #fee;
      color: #c00;
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  todayAttendance: Attendance | null = null;
  monthlyStats: MonthlyStats | null = null;
  attendanceRecords: Attendance[] = [];
  loading = false;
  loadingType: 'morning' | 'evening' | null = null;
  successMessage = '';
  checkInAnimationState = 'idle';
  checkOutAnimationState = 'idle';

  currentYear: number;
  currentMonth: number;
  calendarDays: Date[] = [];
  weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
  }

  ngOnInit(): void {
    this.loadTodayAttendance();
    this.loadMonthlyStats();
    this.loadMonthAttendance();
    this.generateCalendar();
  }

  loadTodayAttendance(): void {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => {
        this.todayAttendance = data;
        if (data.date) {
          this.isCheckInLate = data.check_in_status === 'late' || data.check_in_status === 'severe_late';
          this.isCheckOutEarly = data.check_out_status === 'early_leave';
        }
      },
      error: () => {}
    });
  }

  loadMonthlyStats(): void {
    this.attendanceService.getMyMonthlyStats().subscribe({
      next: (data) => {
        this.monthlyStats = data;
      },
      error: () => {}
    });
  }

  loadMonthAttendance(): void {
    const startDate = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const endDate = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${lastDay}`;

    this.attendanceService.getMyAttendance(startDate, endDate).subscribe({
      next: (data) => {
        this.attendanceRecords = data;
      },
      error: () => {}
    });
  }

  checkIn(type: 'morning' | 'evening'): void {
    this.loading = true;
    this.loadingType = type;
    this.successMessage = '';

    this.attendanceService.checkIn(type).subscribe({
      next: (response) => {
        this.loading = false;
        this.loadingType = null;
        
        if (type === 'morning') {
          this.checkInAnimationState = 'success';
          setTimeout(() => this.checkInAnimationState = 'idle', 500);
        } else {
          this.checkOutAnimationState = 'success';
          setTimeout(() => this.checkOutAnimationState = 'idle', 500);
        }

        this.successMessage = type === 'morning' ? '上班打卡成功！' : '下班打卡成功！';
        setTimeout(() => this.successMessage = '', 3000);

        this.loadTodayAttendance();
        this.loadMonthlyStats();
        this.loadMonthAttendance();
      },
      error: (err) => {
        this.loading = false;
        this.loadingType = null;
        alert(err.error?.error || '打卡失败，请重试');
      }
    });
  }

  generateCalendar(): void {
    this.calendarDays = [];
    
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
      this.calendarDays.push(new Date(this.currentYear, this.currentMonth - 1, prevMonthLastDay - i));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      this.calendarDays.push(new Date(this.currentYear, this.currentMonth, i));
    }

    const remainingDays = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push(new Date(this.currentYear, this.currentMonth + 1, i));
    }
  }

  prevMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
    this.loadMonthAttendance();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
    this.loadMonthAttendance();
  }

  isToday(day: Date): boolean {
    const today = new Date();
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear();
  }

  isWeekend(day: Date): boolean {
    const dayOfWeek = day.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  isCurrentMonth(day: Date): boolean {
    return day.getMonth() === this.currentMonth && day.getFullYear() === this.currentYear;
  }

  getDayStatus(day: Date): string {
    if (!this.isCurrentMonth(day)) return '';
    
    const dateStr = day.toISOString().split('T')[0];
    const record = this.attendanceRecords.find(r => r.date === dateStr);
    
    if (!record) return '';
    return record.overall_status || '';
  }

  formatTime(timeStr: string | null | undefined): string {
    if (!timeStr) return '--:--:--';
    if (timeStr.length === 8 && timeStr.includes(':')) {
      return timeStr;
    }
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    return timeStr;
  }

  getStatusLabel(status: string | null | undefined): string {
    if (!status) return '';
    const labels: Record<string, string> = {
      'normal': '正常',
      'late': '迟到',
      'severe_late': '严重迟到',
      'early_leave': '早退',
      'absent': '缺勤'
    };
    return labels[status] || status;
  }

  isCheckInLate = false;
  isCheckOutEarly = false;
}
