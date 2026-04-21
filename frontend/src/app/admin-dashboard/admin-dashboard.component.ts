import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService, Attendance, User } from '../services/attendance.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-dashboard">
      <div class="filter-section card">
        <h3>筛选条件</h3>
        <div class="filter-form">
          <div class="form-group">
            <label>开始日期</label>
            <input type="date" [(ngModel)]="startDate" class="form-input" />
          </div>
          <div class="form-group">
            <label>结束日期</label>
            <input type="date" [(ngModel)]="endDate" class="form-input" />
          </div>
          <div class="form-group">
            <label>员工姓名</label>
            <input type="text" [(ngModel)]="employeeName" class="form-input" placeholder="输入员工姓名" />
          </div>
          <div class="form-group actions">
            <button (click)="search()" class="btn-primary">查询</button>
            <button (click)="reset()" class="btn-secondary">重置</button>
            <button (click)="export()" class="btn-export" [disabled]="exporting">
              {{ exporting ? '导出中...' : '导出当月汇总' }}
            </button>
          </div>
        </div>
      </div>

      <div class="table-section card">
        <h3>考勤记录列表</h3>
        <div class="table-container">
          <table class="attendance-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>员工姓名</th>
                <th>上班打卡时间</th>
                <th>上班状态</th>
                <th>下班打卡时间</th>
                <th>下班状态</th>
                <th>整体状态</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let record of attendanceRecords">
                <td>{{ record.date }}</td>
                <td>{{ record.user?.name }}</td>
                <td>{{ formatTime(record.check_in_time) }}</td>
                <td>
                  <span class="status-badge"
                        [class.status-normal]="record.check_in_status === 'normal'"
                        [class.status-late]="record.check_in_status === 'late'"
                        [class.status-severe]="record.check_in_status === 'severe_late'">
                    {{ getStatusLabel(record.check_in_status) }}
                  </span>
                </td>
                <td>{{ formatTime(record.check_out_time) }}</td>
                <td>
                  <span class="status-badge"
                        [class.status-normal]="record.check_out_status === 'normal'"
                        [class.status-early]="record.check_out_status === 'early_leave'">
                    {{ getStatusLabel(record.check_out_status) }}
                  </span>
                </td>
                <td>
                  <span class="status-badge"
                        [class.status-normal]="record.overall_status === 'normal'"
                        [class.status-late]="record.overall_status === 'late'"
                        [class.status-severe]="record.overall_status === 'severe_late'"
                        [class.status-early]="record.overall_status === 'early_leave'"
                        [class.status-absent]="record.overall_status === 'absent'">
                    {{ getStatusLabel(record.overall_status) }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="attendanceRecords.length === 0 && !loading">
                <td colspan="7" class="no-data">暂无数据</td>
              </tr>
              <tr *ngIf="loading">
                <td colspan="7" class="loading">加载中...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="stats-section card">
        <h3>员工统计概览</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-value">{{ totalEmployees }}</p>
            <p class="stat-label">员工总数</p>
          </div>
          <div class="stat-card normal">
            <p class="stat-value">{{ getStatusCount('normal') }}</p>
            <p class="stat-label">正常出勤</p>
          </div>
          <div class="stat-card late">
            <p class="stat-value">{{ getStatusCount('late') + getStatusCount('severe_late') }}</p>
            <p class="stat-label">迟到次数</p>
          </div>
          <div class="stat-card early">
            <p class="stat-value">{{ getStatusCount('early_leave') }}</p>
            <p class="stat-label">早退次数</p>
          </div>
          <div class="stat-card absent">
            <p class="stat-value">{{ getStatusCount('absent') }}</p>
            <p class="stat-label">缺勤次数</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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
    .filter-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .filter-section h3 {
      color: white;
    }
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 150px;
    }
    .form-group label {
      font-weight: 500;
      font-size: 0.875rem;
    }
    .form-input {
      padding: 0.75rem 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .form-input:focus {
      outline: none;
      border-color: white;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
    }
    .form-input::placeholder {
      color: #999;
    }
    .form-group.actions {
      flex: none;
      display: flex;
      gap: 0.75rem;
    }
    .btn-primary, .btn-secondary, .btn-export {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary {
      background: #28a745;
      color: white;
    }
    .btn-primary:hover {
      background: #218838;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .btn-export {
      background: #ffc107;
      color: #333;
    }
    .btn-export:hover:not(:disabled) {
      background: #e0a800;
      transform: translateY(-1px);
    }
    .btn-export:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .table-container {
      overflow-x: auto;
    }
    .attendance-table {
      width: 100%;
      border-collapse: collapse;
    }
    .attendance-table th,
    .attendance-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .attendance-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
      font-size: 0.875rem;
    }
    .attendance-table td {
      font-size: 0.875rem;
      color: #555;
    }
    .attendance-table tr:hover td {
      background: #f8f9fa;
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
    .status-badge.status-absent {
      background: #fee;
      color: #c00;
    }
    .no-data, .loading {
      text-align: center;
      color: #999;
      padding: 2rem !important;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      text-align: center;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 10px;
    }
    .stat-card .stat-value {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: #333;
    }
    .stat-card .stat-label {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }
    .stat-card.normal .stat-value {
      color: #28a745;
    }
    .stat-card.late .stat-value {
      color: #ffc107;
    }
    .stat-card.early .stat-value {
      color: #fd7e14;
    }
    .stat-card.absent .stat-value {
      color: #dc3545;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  startDate = '';
  endDate = '';
  employeeName = '';
  attendanceRecords: Attendance[] = [];
  employees: User[] = [];
  loading = false;
  exporting = false;
  totalEmployees = 0;

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadEmployees();
    this.search();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(today);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadEmployees(): void {
    this.attendanceService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.totalEmployees = data.length;
      },
      error: () => {}
    });
  }

  search(): void {
    this.loading = true;
    this.attendanceService.getAllAttendance(this.startDate, this.endDate, this.employeeName).subscribe({
      next: (data) => {
        this.attendanceRecords = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  reset(): void {
    this.employeeName = '';
    this.setDefaultDates();
    this.search();
  }

  export(): void {
    this.exporting = true;
    this.attendanceService.exportMonthlySummary().subscribe({
      next: (data) => {
        this.exporting = false;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        a.download = `attendance_summary_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.exporting = false;
        alert('导出失败，请重试');
      }
    });
  }

  getStatusCount(status: string): number {
    return this.attendanceRecords.filter(r => r.overall_status === status).length;
  }

  formatTime(timeStr: string | null): string {
    if (!timeStr) return '--:--:--';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'normal': '正常',
      'late': '迟到',
      'severe_late': '严重迟到',
      'early_leave': '早退',
      'absent': '缺勤'
    };
    return labels[status] || status;
  }
}
