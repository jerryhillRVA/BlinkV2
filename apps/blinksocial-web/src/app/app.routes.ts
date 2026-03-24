import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'new-workspace',
    loadComponent: () =>
      import('./pages/new-workspace/new-workspace.component').then(
        (m) => m.NewWorkspaceComponent
      ),
  },
  {
    path: 'profile-settings',
    loadComponent: () =>
      import('./pages/profile-settings/profile-settings.component').then(
        (m) => m.ProfileSettingsComponent
      ),
  },
  {
    path: 'workspace/:id/settings',
    loadComponent: () =>
      import('./pages/workspace-settings/workspace-settings.component').then(
        (m) => m.WorkspaceSettingsComponent
      ),
  },
];
