import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';
import { Component } from '@angular/core';

@Component({ template: '' })
class DummyComponent {}

describe('LoginComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<LoginComponent>>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: DummyComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render brand icon and text', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.brand-icon')).toBeTruthy();
    expect(el.querySelector('.brand-text')?.textContent?.trim()).toBe('BLINK');
  });

  it('should render login form with email and password inputs', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('should render Sign In button', () => {
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.login-btn');
    expect(btn?.textContent?.trim()).toContain('Sign In');
  });

  it('should not show bootstrap hint by default', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.bootstrap-hint')).toBeNull();
  });

  it('should show bootstrap hint when needsBootstrap is true', () => {
    const authService = TestBed.inject(AuthService);
    authService.needsBootstrap.set(true);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.bootstrap-hint')).toBeTruthy();
  });

  it('should show error when submitting empty form', async () => {
    const component = fixture.componentInstance;
    await component.onSubmit();
    fixture.detectChanges();
    expect(component.error()).toBe('Email and password are required');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.error-message')).toBeTruthy();
  });

  it('should call login on submit', async () => {
    const component = fixture.componentInstance;
    component.email = 'test@test.com';
    component.password = 'password';
    const promise = component.onSubmit();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({
      user: { id: 'u1', email: 'test@test.com', displayName: 'Test', workspaces: [] },
      message: 'Login successful',
    });
    await promise;

    expect(component.loading()).toBe(false);
  });

  it('should show error on failed login', async () => {
    const component = fixture.componentInstance;
    component.email = 'test@test.com';
    component.password = 'wrong';
    const promise = component.onSubmit();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });
    await promise;

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('should bind email and password inputs via ngModel', async () => {
    const el: HTMLElement = fixture.nativeElement;
    const emailInput = el.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = el.querySelector('input[type="password"]') as HTMLInputElement;

    emailInput.value = 'user@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'secret123';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.email).toBe('user@example.com');
    expect(fixture.componentInstance.password).toBe('secret123');
  });

  it('should show loading state during login', () => {
    const component = fixture.componentInstance;
    component.email = 'test@test.com';
    component.password = 'password';
    component.onSubmit(); // Don't await
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.login-btn')?.textContent?.trim()).toContain('Signing in');

    // Flush the request
    httpMock.expectOne('/api/auth/login').flush({
      user: { id: 'u1', email: 'test@test.com', displayName: 'Test', workspaces: [] },
      message: 'ok',
    });
  });
});
