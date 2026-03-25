import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'new-workspace',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/new-workspace/new-workspace.component').then(
        (m) => m.NewWorkspaceComponent
      ),
  },
  {
    path: 'profile-settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile-settings/profile-settings.component').then(
        (m) => m.ProfileSettingsComponent
      ),
  },
  {
    path: 'workspace/:id/settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/workspace-settings/workspace-settings.component').then(
        (m) => m.WorkspaceSettingsComponent
      ),
  },
];
