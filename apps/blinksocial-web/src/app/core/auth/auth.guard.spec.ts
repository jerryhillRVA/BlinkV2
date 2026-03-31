import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';
import { Component } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Component({ template: '' })
class DummyComponent {}

describe('authGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: DummyComponent },
          { path: '', component: DummyComponent },
        ]),
      ],
    });
    authService = TestBed.inject(AuthService);
  });

  it('should allow access when authenticated', async () => {
    authService.isLoading.set(false);
    authService.currentUser.set({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Test',
      workspaces: [],
    });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(true);
  });

  it('should redirect to login when not authenticated', async () => {
    authService.isLoading.set(false);
    authService.currentUser.set(null);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).not.toBe(true);
  });

  it('should wait for status check when still loading', async () => {
    authService.isLoading.set(true);
    // checkStatus will resolve and then the guard checks authentication
    const checkStatusSpy = vi.spyOn(authService, 'checkStatus').mockResolvedValue();
    authService.currentUser.set({
      id: 'u1',
      email: 'a@b.com',
      displayName: 'Test',
      workspaces: [],
    });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(checkStatusSpy).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
