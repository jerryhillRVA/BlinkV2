import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  /* v8 ignore next — signal() default-value branch unreachable from TestBed */
  error = signal<string | null>(null);
  /* v8 ignore next — signal() default-value branch unreachable from TestBed */
  loading = signal(false);

  readonly needsBootstrap = this.authService.needsBootstrap;

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Email and password are required');
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    const result = await this.authService.login(this.email, this.password);

    this.loading.set(false);

    if (result.success) {
      this.router.navigate(['/']);
    } else {
      this.error.set(result.error ?? 'Login failed');
    }
  }
}
