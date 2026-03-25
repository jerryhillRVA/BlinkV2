import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: class {} as never }]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null user', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should not be authenticated initially', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should start loading', () => {
    expect(service.isLoading()).toBe(true);
  });

  describe('checkStatus', () => {
    it('should set user on successful check', async () => {
      const promise = service.checkStatus();
      const req = httpMock.expectOne('/api/auth/status');
      req.flush({
        authenticated: true,
        needsBootstrap: false,
        user: { id: 'u1', email: 'a@b.com', displayName: 'Test', workspaces: [] },
      });
      await promise;
      expect(service.currentUser()).toBeTruthy();
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should set null user on unauthenticated check', async () => {
      const promise = service.checkStatus();
      const req = httpMock.expectOne('/api/auth/status');
      req.flush({ authenticated: false, needsBootstrap: true, user: null });
      await promise;
      expect(service.currentUser()).toBeNull();
      expect(service.needsBootstrap()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should handle error gracefully', async () => {
      const promise = service.checkStatus();
      const req = httpMock.expectOne('/api/auth/status');
      req.error(new ProgressEvent('error'));
      await promise;
      expect(service.currentUser()).toBeNull();
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user on successful login', async () => {
      const promise = service.login('a@b.com', 'pass');
      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.body).toEqual({ email: 'a@b.com', password: 'pass' });
      req.flush({
        user: { id: 'u1', email: 'a@b.com', displayName: 'Test', workspaces: [] },
        message: 'Login successful',
      });
      const result = await promise;
      expect(result.success).toBe(true);
      expect(service.currentUser()).toBeTruthy();
    });

    it('should return error on failed login', async () => {
      const promise = service.login('a@b.com', 'wrong');
      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('changePassword', () => {
    it('should call change password endpoint', async () => {
      const promise = service.changePassword('old', 'new');
      const req = httpMock.expectOne('/api/account/password');
      expect(req.request.body).toEqual({ currentPassword: 'old', newPassword: 'new' });
      req.flush({ message: 'Password changed successfully' });
      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('should handle change password error', async () => {
      const promise = service.changePassword('wrong', 'new');
      const req = httpMock.expectOne('/api/account/password');
      req.flush({ message: 'Current password is incorrect' }, { status: 400, statusText: 'Bad Request' });
      const result = await promise;
      expect(result.success).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user is admin in workspace', () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Test',
        workspaces: [{ workspaceId: 'ws1', role: 'Admin' }],
      });
      expect(service.isAdmin('ws1')).toBe(true);
    });

    it('should return false when user is not admin', () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Test',
        workspaces: [{ workspaceId: 'ws1', role: 'Viewer' }],
      });
      expect(service.isAdmin('ws1')).toBe(false);
    });

    it('should return false when not in workspace', () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Test',
        workspaces: [],
      });
      expect(service.isAdmin('ws1')).toBe(false);
    });

    it('should return false when no user', () => {
      expect(service.isAdmin('ws1')).toBe(false);
    });
  });

  describe('getWorkspaceRole', () => {
    it('should return role for workspace', () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Test',
        workspaces: [{ workspaceId: 'ws1', role: 'Editor' }],
      });
      expect(service.getWorkspaceRole('ws1')).toBe('Editor');
    });

    it('should return null for unknown workspace', () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Test',
        workspaces: [],
      });
      expect(service.getWorkspaceRole('ws1')).toBeNull();
    });
  });

  describe('getUserInitials', () => {
    it('should return initials from two-word name', () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Brett Lewis',
        workspaces: [],
      });
      expect(service.getUserInitials()).toBe('BL');
    });

    it('should return first two chars for single-word name', () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Brett',
        workspaces: [],
      });
      expect(service.getUserInitials()).toBe('BR');
    });

    it('should return ? for no user', () => {
      expect(service.getUserInitials()).toBe('?');
    });
  });

  describe('logout', () => {
    it('should clear user on logout', async () => {
      service.currentUser.set({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Test',
        workspaces: [],
      });
      const promise = service.logout();
      const req = httpMock.expectOne('/api/auth/logout');
      req.flush({ message: 'Logged out' });
      await promise;
      expect(service.currentUser()).toBeNull();
    });
  });
});
