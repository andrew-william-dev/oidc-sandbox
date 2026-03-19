import { create } from 'zustand';

export type TokenStorage = 'memory' | 'localStorage' | 'sessionStorage' | 'cookie' | 'httpOnly';
export type IdProvider = 'azure-ad' | 'auth0' | 'okta' | 'ping' | 'generic';

export interface ValidationWarning {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  message: string;
  recommendation: string;
}

interface ConfigStore {
  tokenStorage: TokenStorage;
  idpProvider: IdProvider;
  selectedScopes: string[];
  enableRefreshToken: boolean;
  useHttpOnlyCookies: boolean;
  warnings: ValidationWarning[];

  setTokenStorage: (storage: TokenStorage) => void;
  setIdpProvider: (provider: IdProvider) => void;
  toggleScope: (scope: string) => void;
  setEnableRefreshToken: (val: boolean) => void;
  setUseHttpOnlyCookies: (val: boolean) => void;
  validateConfig: () => void;
}

function computeWarnings(state: Omit<ConfigStore, 'warnings' | 'validateConfig' | 'setTokenStorage' | 'setIdpProvider' | 'toggleScope' | 'setEnableRefreshToken' | 'setUseHttpOnlyCookies'>): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (state.tokenStorage === 'localStorage') {
    warnings.push({
      id: 'ls-xss',
      severity: 'critical',
      field: 'tokenStorage',
      message: 'localStorage is accessible to any JavaScript on the page',
      recommendation: 'Store tokens in memory or use the BFF pattern with HttpOnly cookies',
    });
  }

  if (state.tokenStorage === 'sessionStorage') {
    warnings.push({
      id: 'ss-xss',
      severity: 'high',
      field: 'tokenStorage',
      message: 'sessionStorage is also accessible to XSS — slightly better than localStorage but still exposed',
      recommendation: 'Prefer in-memory storage for access tokens',
    });
  }

  if (!state.enableRefreshToken && state.tokenStorage === 'memory') {
    warnings.push({
      id: 'no-refresh',
      severity: 'medium',
      field: 'enableRefreshToken',
      message: 'Without a refresh token, users lose their session on page refresh',
      recommendation: 'Enable refresh token rotation with a secure HttpOnly cookie storing the refresh token',
    });
  }

  const hasWideScopes = state.selectedScopes.includes('offline_access') && state.selectedScopes.length > 4;
  if (hasWideScopes) {
    warnings.push({
      id: 'wide-scopes',
      severity: 'low',
      field: 'scopes',
      message: 'Requesting many scopes increases the blast radius if a token is compromised',
      recommendation: 'Follow the principle of least privilege — request only the scopes you need',
    });
  }

  return warnings;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  tokenStorage: 'memory',
  idpProvider: 'generic',
  selectedScopes: ['openid', 'profile', 'email'],
  enableRefreshToken: true,
  useHttpOnlyCookies: false,
  warnings: [],

  setTokenStorage: (storage) => {
    set({ tokenStorage: storage });
    get().validateConfig();
  },
  setIdpProvider: (provider) => set({ idpProvider: provider }),
  toggleScope: (scope) => {
    const current = get().selectedScopes;
    set({
      selectedScopes: current.includes(scope)
        ? current.filter(s => s !== scope)
        : [...current, scope],
    });
    get().validateConfig();
  },
  setEnableRefreshToken: (val) => {
    set({ enableRefreshToken: val });
    get().validateConfig();
  },
  setUseHttpOnlyCookies: (val) => set({ useHttpOnlyCookies: val }),
  validateConfig: () => {
    const state = get();
    set({ warnings: computeWarnings(state) });
  },
}));

export const AVAILABLE_SCOPES = [
  { id: 'openid', label: 'openid', description: 'Required for OIDC — identifies this as an OIDC request' },
  { id: 'profile', label: 'profile', description: 'Access to name, picture, and other profile info' },
  { id: 'email', label: 'email', description: 'Access to the user\'s email address' },
  { id: 'offline_access', label: 'offline_access', description: 'Request a refresh token for long-lived sessions' },
  { id: 'api.read', label: 'api.read', description: 'Read access to the protected API' },
  { id: 'api.write', label: 'api.write', description: 'Write access to the protected API' },
];

export const IDP_PROVIDERS: { id: IdProvider; label: string; domain: string }[] = [
  { id: 'azure-ad', label: 'Microsoft Entra ID (Azure AD)', domain: 'login.microsoftonline.com' },
  { id: 'auth0', label: 'Auth0', domain: 'your-tenant.auth0.com' },
  { id: 'okta', label: 'Okta', domain: 'your-domain.okta.com' },
  { id: 'ping', label: 'PingFederate / PingOne', domain: 'auth.pingone.com' },
  { id: 'generic', label: 'Generic OIDC', domain: 'your-idp.example.com' },
];
