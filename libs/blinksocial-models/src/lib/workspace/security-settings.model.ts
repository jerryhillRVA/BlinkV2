import type {
  ActiveSessionContract,
  ApiKeyContract,
  LoginHistoryEntryContract,
  SecuritySettingsContract,
} from '@blinksocial/contracts';

export class ActiveSession implements ActiveSessionContract {
  readonly id: string;
  readonly device: string;
  readonly browser: string;
  readonly location: string;
  readonly lastActive: string;
  readonly isCurrent: boolean;

  constructor(data: ActiveSessionContract) {
    this.id = data.id;
    this.device = data.device;
    this.browser = data.browser;
    this.location = data.location;
    this.lastActive = data.lastActive;
    this.isCurrent = data.isCurrent;
  }
}

export class ApiKey implements ApiKeyContract {
  readonly id: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly createdAt: string;
  readonly lastUsed?: string;

  constructor(data: ApiKeyContract) {
    this.id = data.id;
    this.name = data.name;
    this.keyPrefix = data.keyPrefix;
    this.createdAt = data.createdAt;
    this.lastUsed = data.lastUsed;
  }
}

export class LoginHistoryEntry implements LoginHistoryEntryContract {
  readonly timestamp: string;
  readonly ip: string;
  readonly device: string;
  readonly location: string;
  readonly success: boolean;

  constructor(data: LoginHistoryEntryContract) {
    this.timestamp = data.timestamp;
    this.ip = data.ip;
    this.device = data.device;
    this.location = data.location;
    this.success = data.success;
  }
}

export class SecuritySettings implements SecuritySettingsContract {
  readonly twoFactorEnabled: boolean;
  readonly activeSessions: ActiveSession[];
  readonly apiKeys: ApiKey[];
  readonly loginHistory: LoginHistoryEntry[];

  constructor(data: SecuritySettingsContract) {
    this.twoFactorEnabled = data.twoFactorEnabled;
    this.activeSessions = data.activeSessions.map(
      (s: ActiveSessionContract) => new ActiveSession(s)
    );
    this.apiKeys = data.apiKeys.map((k: ApiKeyContract) => new ApiKey(k));
    this.loginHistory = data.loginHistory.map(
      (e: LoginHistoryEntryContract) => new LoginHistoryEntry(e)
    );
  }
}
