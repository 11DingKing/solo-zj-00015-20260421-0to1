import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <header *ngIf="authService.isLoggedIn()" class="header">
        <div class="header-content">
          <h1 class="title">员工考勤系统</h1>
          <div class="user-info">
            <span>欢迎, {{ authService.getCurrentUser()?.name }}</span>
            <span class="role-badge">{{ getRoleLabel() }}</span>
            <button (click)="logout()" class="logout-btn">退出登录</button>
          </div>
        </div>
      </header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .header {
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .role-badge:contains(管理员) {
      background: #ffc107;
      color: #333;
    }
    .role-badge:contains(员工) {
      background: #17a2b8;
      color: white;
    }
    .logout-btn {
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .logout-btn:hover {
      background: #c82333;
    }
    .main-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService, private router: Router) {}

  getRoleLabel(): string {
    const role = this.authService.getCurrentUser()?.role;
    if (role === 'admin') return '管理员';
    return '员工';
  }

  logout(): void {
    this.authService.logout();
  }
}
