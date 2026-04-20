import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

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
    path: 'onboard',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/onboard/onboard.component').then(
        (m) => m.OnboardComponent
      ),
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
  {
    path: 'workspace/:id/strategy',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/strategy-research/strategy-research.component').then(
        (m) => m.StrategyResearchComponent
      ),
  },
  {
    path: 'workspace/:id/content',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/content/content.component').then(
        (m) => m.ContentComponent
      ),
  },
  {
    path: 'workspace/:id/content/:itemId',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './pages/content/views/content-detail/content-detail-page.component'
      ).then((m) => m.ContentDetailPageComponent),
  },
];
