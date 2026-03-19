export type ComponentCategory = 'client' | 'server' | 'identity' | 'data';

export type ComponentType =
  | 'browser'
  | 'spa'
  | 'mobile'
  | 'web-api'
  | 'idp'
  | 'database'
  | 'external-api';

export interface ComponentDef {
  type: ComponentType;
  label: string;
  shortLabel: string;
  icon: string;
  category: ComponentCategory;
  color: string;          // Tailwind color class base, e.g. 'blue'
  accentColor: string;    // CSS hex
  glowColor: string;      // rgba string
  description: string;
  oauthRole: string;
  rfcNote?: string;
}

export const COMPONENT_DEFS: Record<ComponentType, ComponentDef> = {
  browser: {
    type: 'browser',
    label: 'Browser / User',
    shortLabel: 'Browser',
    icon: '🌐',
    category: 'client',
    color: 'cyan',
    accentColor: '#22d3ee',
    glowColor: 'rgba(34,211,238,0.4)',
    description: 'The end-user operating a web browser. The Resource Owner in OAuth2 terminology.',
    oauthRole: 'Resource Owner',
    rfcNote: 'RFC 6749 §1.1',
  },
  spa: {
    type: 'spa',
    label: 'SPA',
    shortLabel: 'SPA',
    icon: '⚛️',
    category: 'client',
    color: 'blue',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56,189,248,0.4)',
    description: 'A Single-Page Application running in the browser (React, Angular, Vue). A public client — cannot hold secrets.',
    oauthRole: 'Public Client',
    rfcNote: 'RFC 6749 §2.1',
  },
  mobile: {
    type: 'mobile',
    label: 'Mobile App',
    shortLabel: 'Mobile',
    icon: '📱',
    category: 'client',
    color: 'purple',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.4)',
    description: 'A native mobile application (iOS/Android). A public client, typically uses Auth Code + PKCE.',
    oauthRole: 'Public Client',
    rfcNote: 'RFC 8252 (OAuth for Native Apps)',
  },
  'web-api': {
    type: 'web-api',
    label: 'Web API',
    shortLabel: 'API',
    icon: '🔌',
    category: 'server',
    color: 'orange',
    accentColor: '#fb923c',
    glowColor: 'rgba(251,146,60,0.4)',
    description: 'A backend HTTP API. In OAuth2, this is the Resource Server — it accepts and validates access tokens.',
    oauthRole: 'Resource Server',
    rfcNote: 'RFC 6749 §1.1',
  },
  idp: {
    type: 'idp',
    label: 'Identity Provider',
    shortLabel: 'IdP',
    icon: '🔑',
    category: 'identity',
    color: 'yellow',
    accentColor: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.4)',
    description: 'The Authorization Server / Identity Provider (Azure AD, Okta, Auth0, Ping). Issues tokens and authenticates users.',
    oauthRole: 'Authorization Server',
    rfcNote: 'RFC 6749 §1.1, OpenID Connect Core §3',
  },
  database: {
    type: 'database',
    label: 'Database',
    shortLabel: 'DB',
    icon: '🗄️',
    category: 'data',
    color: 'slate',
    accentColor: '#94a3b8',
    glowColor: 'rgba(148,163,184,0.3)',
    description: 'A data store (SQL/NoSQL). Holds application data protected behind the Web API.',
    oauthRole: 'Protected Resource (Downstream)',
  },
  'external-api': {
    type: 'external-api',
    label: 'External API',
    shortLabel: 'Ext. API',
    icon: '🌍',
    category: 'data',
    color: 'pink',
    accentColor: '#f472b6',
    glowColor: 'rgba(244,114,182,0.4)',
    description: 'A third-party API (e.g. Microsoft Graph, Stripe). Protected by its own access tokens, often requiring the On-Behalf-Of flow.',
    oauthRole: 'Resource Server (External)',
    rfcNote: 'RFC 8693 (Token Exchange)',
  },
};

export const PALETTE_GROUPS: { label: string; types: ComponentType[] }[] = [
  { label: 'Clients', types: ['browser', 'spa', 'mobile'] },
  { label: 'Servers', types: ['web-api'] },
  { label: 'Identity', types: ['idp'] },
  { label: 'Data', types: ['database', 'external-api'] },
];
