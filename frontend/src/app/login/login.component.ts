import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>员工考勤系统</h2>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username"
              class="form-input"
              [class.error]="submitted && loginForm.get('username')?.invalid"
              placeholder="请输入用户名"
            />
            <div *ngIf="submitted && loginForm.get('username')?.invalid" class="error-message">
              请输入用户名
            </div>
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              class="form-input"
              [class.error]="submitted && loginForm.get('password')?.invalid"
              placeholder="请输入密码"
            />
            <div *ngIf="submitted && loginForm.get('password')?.invalid" class="error-message">
              请输入密码
            </div>
          </div>
          
          <div *ngIf="errorMessage" class="error-message alert">
            {{ errorMessage }}
          </div>
          
          <button type="submit" class="login-btn" [disabled]="loading">
            <span *ngIf="!loading">登录</span>
            <span *ngIf="loading">登录中...</span>
          </button>
        </form>
        
        <div class="test-accounts">
          <h4>测试账号：</h4>
          <p>管理员: admin / admin123</p>
          <p>员工: zhangsan / 123456</p>
          <p>员工: lisi / 123456</p>
          <p>员工: wangwu / 123456</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .login-card {
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      padding: 2.5rem;
      width: 100%;
      max-width: 450px;
    }
    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 2rem;
      font-size: 1.8rem;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    label {
      font-weight: 500;
      color: #555;
    }
    .form-input {
      padding: 0.875rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .form-input.error {
      border-color: #dc3545;
    }
    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
    }
    .error-message.alert {
      background: #f8d7da;
      padding: 0.75rem;
      border-radius: 5px;
      text-align: center;
    }
    .login-btn {
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    .login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .test-accounts {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 0.875rem;
    }
    .test-accounts h4 {
      color: #333;
      margin-bottom: 0.5rem;
    }
    .test-accounts p {
      margin: 0.25rem 0;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/employee']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || '登录失败，请检查用户名和密码';
      }
    });
  }
}
