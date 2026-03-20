export interface ActiveSessionContract {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface ApiKeyContract {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsed?: string;
}

export interface LoginHistoryEntryContract {
  timestamp: string;
  ip: string;
  device: string;
  location: string;
  success: boolean;
}

export interface SecuritySettingsContract {
  twoFactorEnabled: boolean;
  activeSessions: ActiveSessionContract[];
  apiKeys: ApiKeyContract[];
  loginHistory: LoginHistoryEntryContract[];
}
