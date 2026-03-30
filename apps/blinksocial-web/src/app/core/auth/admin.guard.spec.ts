import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
  });

  it('should allow access for admin users', async () => {
    authService['currentUser'].set({
      id: '1',
      email: 'admin@test.com',
      displayName: 'Admin',
      workspaces: [{ workspaceId: 'ws-1', role: 'Admin' }],
    });
    authService['isLoading'].set(false);

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should allow access for bootstrap user (no workspaces)', async () => {
    authService['currentUser'].set({
      id: '1',
      email: 'admin@test.com',
      displayName: 'Admin',
      workspaces: [],
    });
    authService['isLoading'].set(false);

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should deny access for non-admin users', async () => {
    authService['currentUser'].set({
      id: '1',
      email: 'viewer@test.com',
      displayName: 'Viewer',
      workspaces: [{ workspaceId: 'ws-1', role: 'Viewer' }],
    });
    authService['isLoading'].set(false);

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('should deny access when not authenticated', async () => {
    authService['currentUser'].set(null);
    authService['isLoading'].set(false);

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBeInstanceOf(UrlTree);
  });

  it('should wait for auth status check if loading', async () => {
    authService['isLoading'].set(true);
    const checkSpy = vi.spyOn(authService, 'checkStatus').mockImplementation(async () => {
      authService['currentUser'].set({
        id: '1',
        email: 'admin@test.com',
        displayName: 'Admin',
        workspaces: [{ workspaceId: 'ws-1', role: 'Admin' }],
      });
      authService['isLoading'].set(false);
    });

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(checkSpy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should deny editor-only users', async () => {
    authService['currentUser'].set({
      id: '1',
      email: 'editor@test.com',
      displayName: 'Editor',
      workspaces: [{ workspaceId: 'ws-1', role: 'Editor' }],
    });
    authService['isLoading'].set(false);

    const result = await TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBeInstanceOf(UrlTree);
  });
});
