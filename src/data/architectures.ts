import type { ComponentType } from './components';

export type SecurityLevel = 'high' | 'medium' | 'low';
export type FlowColor = 'blue' | 'orange' | 'green' | 'red' | 'purple';

export interface ArchitectureStep {
  id: string;
  from: ComponentType;
  to: ComponentType;
  label: string;
  description: string;
  color: FlowColor;
  httpMethod?: string;
  httpPath?: string;
  httpHeaders?: Record<string, string>;
  httpBody?: string;
  isHighRisk?: boolean;
  isReturn?: boolean; // response direction
}

export interface Architecture {
  id: string;
  name: string;
  shortName: string;
  description: string;
  detailedDescription: string;
  requiredTypes: ComponentType[][];  // Each inner array is an edge pair [from, to]
  forbiddenTypes?: ComponentType[];  // If any of these are present, reject this architecture
  securityLevel: SecurityLevel;
  pros: string[];
  cons: string[];
  steps: ArchitectureStep[];
  tags: string[];
  recommendedFor?: string;
  docsUrl?: string;
  isMatch?: (nodes: ComponentType[], edges: { source: ComponentType; target: ComponentType }[]) => boolean;
}

export const ARCHITECTURES: Architecture[] = [
  // ─── SPA + IdP + Web API: Auth Code + PKCE ───────────────────────────
  {
    id: 'auth-code-pkce-spa',
    name: 'Authorization Code + PKCE',
    shortName: 'Auth Code + PKCE',
    description: 'SPA obtains tokens directly from IdP using PKCE. Access token stored in memory, sent to API as Bearer token.',
    detailedDescription: `The Authorization Code flow with PKCE (Proof Key for Code Exchange) is the recommended flow for SPAs and mobile apps. The client generates a random code_verifier, hashes it to produce the code_challenge, and includes it in the authorization request. When exchanging the code, it sends the original verifier — proving it initiated the request. This prevents authorization code interception attacks. Tokens are received by the SPA and should be stored in memory (not localStorage) to minimize XSS exposure.`,
    requiredTypes: [['browser', 'spa'], ['spa', 'idp'], ['spa', 'web-api']],
    securityLevel: 'high',
    pros: [
      'No client secret required (public client)',
      'PKCE prevents code interception',
      'Standard, widely supported',
      'Works with any OIDC-compliant IdP',
    ],
    cons: [
      'Access token exposed to SPA (JavaScript)',
      'Token stored in memory — lost on page refresh',
      'Requires refresh token rotation for long sessions',
    ],
    tags: ['OIDC', 'OAuth2', 'PKCE', 'SPA', 'Recommended'],
    recommendedFor: 'SPAs, Mobile Apps that call APIs directly',
    docsUrl: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.1',
    steps: [
      {
        id: 'pkce-1',
        from: 'browser', to: 'spa',
        label: 'User visits app',
        description: 'The user navigates to the SPA. The SPA detects no session and initiates login.',
        color: 'blue',
      },
      {
        id: 'pkce-2',
        from: 'spa', to: 'idp',
        label: 'Authorization Request',
        description: 'The SPA generates a code_verifier (random string) and code_challenge (SHA-256 hash of verifier). It redirects the browser to the IdP authorization endpoint.',
        color: 'blue',
        httpMethod: 'GET',
        httpPath: '/authorize',
        httpHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpBody: 'response_type=code\n&client_id=my-spa\n&redirect_uri=https://app.example.com/callback\n&scope=openid profile email\n&state=xyz123\n&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM\n&code_challenge_method=S256',
      },
      {
        id: 'pkce-3',
        from: 'idp', to: 'browser',
        label: 'Authentication UI',
        description: 'The IdP presents login UI (username/password, MFA). The user authenticates.',
        color: 'blue',
        isReturn: true,
      },
      {
        id: 'pkce-4',
        from: 'idp', to: 'spa',
        label: 'Authorization Code',
        description: 'After successful authentication, the IdP redirects back to the SPA\'s redirect_uri with a short-lived authorization code and the state parameter.',
        color: 'blue',
        httpMethod: 'GET',
        httpPath: '/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz123',
        isReturn: true,
      },
      {
        id: 'pkce-5',
        from: 'spa', to: 'idp',
        label: 'Token Request (Code Exchange)',
        description: 'The SPA exchanges the authorization code for tokens by POSTing to the token endpoint. It includes the original code_verifier — the IdP hashes it and compares with the stored code_challenge.',
        color: 'orange',
        httpMethod: 'POST',
        httpPath: '/token',
        httpHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpBody: 'grant_type=authorization_code\n&code=SplxlOBeZQQYbYS6WxSbIA\n&redirect_uri=https://app.example.com/callback\n&client_id=my-spa\n&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      },
      {
        id: 'pkce-6',
        from: 'idp', to: 'spa',
        label: 'Token Response',
        description: 'The IdP returns an access_token, id_token (JWT), and optionally a refresh_token. The SPA stores these in memory (JavaScript variables).',
        color: 'green',
        httpMethod: '200 OK',
        httpHeaders: { 'Content-Type': 'application/json' },
        httpBody: '{\n  "access_token": "eyJhbG...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "id_token": "eyJhbG...",\n  "refresh_token": "8xLOxBtZp8"\n}',
        isReturn: true,
      },
      {
        id: 'pkce-7',
        from: 'spa', to: 'web-api',
        label: 'API Call with Bearer Token',
        description: 'The SPA calls the Web API, including the access_token as a Bearer token in the Authorization header.',
        color: 'orange',
        httpMethod: 'GET',
        httpPath: '/api/data',
        httpHeaders: { Authorization: 'Bearer eyJhbG...' },
      },
      {
        id: 'pkce-8',
        from: 'web-api', to: 'idp',
        label: 'JWT Validation (local)',
        description: 'The API validates the JWT signature using the IdP\'s public keys (fetched once from JWKS endpoint and cached). No network call needed per-request.',
        color: 'blue',
        httpMethod: 'GET',
        httpPath: '/.well-known/jwks.json',
      },
      {
        id: 'pkce-9',
        from: 'web-api', to: 'spa',
        label: 'API Response',
        description: 'Token is valid — the API returns the requested data.',
        color: 'green',
        httpMethod: '200 OK',
        httpBody: '{ "data": [...] }',
        isReturn: true,
      },
    ],
  },

  // ─── Implicit Flow (Deprecated) ──────────────────────────────────────
  {
    id: 'implicit-flow',
    name: 'Implicit Flow (Deprecated)',
    shortName: 'Implicit Flow',
    description: 'Deprecated legacy flow. The SPA receives the access token directly in the URL fragment. Highly vulnerable to token leakage.',
    detailedDescription: `The Implicit flow was originally designed for SPAs before CORS was widely supported. Instead of returning an authorization code, the IdP returns the access_token directly in the redirect URI fragment (e.g., #access_token=...). This exposes the token to browser history, referrer headers, and any JavaScript on the page instantly, making XSS attacks trivial. It is officially deprecated by OAuth 2.1 best practices in favor of Auth Code + PKCE or BFF.`,
    requiredTypes: [['browser', 'spa'], ['spa', 'idp'], ['spa', 'web-api']],
    securityLevel: 'low',
    pros: [
      'Fewer network hops (no separate token exchange)',
      'Legacy compatibility',
    ],
    cons: [
      'Access token exposed in URL fragment',
      'Vulnerable to token leakage via Referer header or browser history',
      'No refresh tokens allowed (RFC 6749)',
      'Officially deprecated (OAuth 2.1 / BCP)',
    ],
    tags: ['Legacy', 'OAuth2', 'Deprecated', 'Vulnerable'],
    recommendedFor: 'DO NOT USE. Educational purposes only.',
    docsUrl: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.2',
    steps: [
      {
        id: 'imp-1',
        from: 'browser', to: 'spa',
        label: 'User visits app',
        description: 'The user navigates to the SPA. The SPA initiates the implicit login flow.',
        color: 'blue',
      },
      {
        id: 'imp-2',
        from: 'spa', to: 'idp',
        label: 'Authorization Request (response_type=token)',
        description: 'The SPA redirects to the IdP requesting a token immediately in the response, rather than a code.',
        color: 'blue',
        httpMethod: 'GET',
        httpPath: '/authorize',
        httpBody: 'response_type=token\n&client_id=my-legacy-spa\n&redirect_uri=https://app.example.com/callback\n&scope=openid profile\n&nonce=xyz123',
      },
      {
        id: 'imp-3',
        from: 'idp', to: 'browser',
        label: 'Authentication UI',
        description: 'The IdP presents the login form to the user.',
        color: 'blue',
        isReturn: true,
      },
      {
        id: 'imp-4',
        from: 'idp', to: 'spa',
        label: 'Token in URL Fragment',
        description: 'DANGER: The IdP redirects back to the SPA, passing the access token directly in the URL hash (#). Any script on the page can read window.location.hash.',
        color: 'red',
        httpMethod: 'GET',
        httpPath: '/callback#access_token=eyJhbG...&expires_in=3600',
        isHighRisk: true,
        isReturn: true,
      },
      {
        id: 'imp-5',
        from: 'spa', to: 'web-api',
        label: 'API Call with Bearer Token',
        description: 'The SPA extracts the token from the URL and uses it to call the Web API.',
        color: 'orange',
        httpMethod: 'GET',
        httpPath: '/api/data',
        httpHeaders: { Authorization: 'Bearer eyJhbG...' },
      },
      {
        id: 'imp-6',
        from: 'web-api', to: 'spa',
        label: 'API Response',
        description: 'The API returns the requested data.',
        color: 'green',
        httpMethod: '200 OK',
        httpBody: '{ "data": [...] }',
        isReturn: true,
      },
    ],
  },

  // ─── Resource Owner Password Credentials (ROPC) ─────────────────
  {
    id: 'ropc',
    name: 'Resource Owner Password Credentials',
    shortName: 'Password Grant',
    description: 'Deprecated legacy flow. The SPA directly collects the username and password from the user and hands them to the IdP.',
    detailedDescription: `The Resource Owner Password Credentials (ROPC) grant involves the client directly collecting the user's raw credentials (username and password) and exchanging them for tokens. This violates the core OAuth principle of delegated access without sharing credentials. It trains users to enter passwords into third-party interfaces, enabling phishing. It also entirely breaks Modern Auth (MFA, WebAuthn, federation) because the client UI cannot handle those complex flows. It is officially deprecated.`,
    requiredTypes: [['browser', 'spa'], ['spa', 'idp'], ['spa', 'web-api']],
    securityLevel: 'low',
    pros: [
      'No browser redirects required',
      'Fully custom native UI for login forms',
    ],
    cons: [
      'Breaks MFA, SSO, and federated identity',
      'Trains users to be phished (entering passwords anywhere)',
      'Client sees and processes raw passwords',
      'Officially deprecated (OAuth 2.1 / BCP)',
    ],
    tags: ['Legacy', 'OAuth2', 'Deprecated', 'Anti-Pattern'],
    recommendedFor: 'DO NOT USE. Educational purposes only.',
    docsUrl: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.3',
    steps: [
      {
        id: 'ropc-1',
        from: 'browser', to: 'spa',
        label: 'User visits app',
        description: 'The user opens the SPA.',
        color: 'blue',
      },
      {
        id: 'ropc-2',
        from: 'browser', to: 'spa',
        label: 'User enters raw credentials',
        description: 'DANGER: The SPA renders its own HTML form asking for the username and password, which the user types directly into the client application.',
        color: 'red',
        isHighRisk: true,
      },
      {
        id: 'ropc-3',
        from: 'spa', to: 'idp',
        label: 'Token Request (grant_type=password)',
        description: 'The SPA transmits the raw username and password to the IdP token endpoint to exchange for an access token.',
        color: 'orange',
        httpMethod: 'POST',
        httpPath: '/token',
        httpBody: 'grant_type=password\n&username=alice@example.com\n&password=MySuperSecretPassword\n&client_id=my-legacy-spa',
      },
      {
        id: 'ropc-4',
        from: 'idp', to: 'spa',
        label: 'Token Response',
        description: 'The IdP validates the password and returns the tokens.',
        color: 'green',
        httpBody: '{\n  "access_token": "eyJhbG...",\n  "token_type": "Bearer",\n  "expires_in": 3600\n}',
        isReturn: true,
      },
      {
        id: 'ropc-5',
        from: 'spa', to: 'web-api',
        label: 'API Call with Bearer Token',
        description: 'The SPA calls the API using the newly acquired access token.',
        color: 'orange',
        httpMethod: 'GET',
        httpPath: '/api/data',
        httpHeaders: { Authorization: 'Bearer eyJhbG...' },
      },
      {
        id: 'ropc-6',
        from: 'web-api', to: 'spa',
        label: 'API Response',
        description: 'The API returns the requested data.',
        color: 'green',
        httpBody: '{ "data": [...] }',
        isReturn: true,
      },
    ],
  },
  
  // ─── BFF Flow ────────────────────────────────────────────────────────
  {
    id: 'auth-code-bff',
    name: 'Auth Code + PKCE via BFF',
    shortName: 'BFF Pattern',
    description: 'A Web API acts as a Backend For Frontend, handling the OAuth2 flow server-side. Tokens never reach the browser — the SPA uses secure session cookies.',
    detailedDescription: `The Backend For Frontend (BFF) pattern keeps tokens entirely on the server. The SPA communicates with a dedicated Web API (the BFF) using secure, HttpOnly session cookies. The BFF holds the access token and refresh token in server-side session storage. When the SPA needs data, the BFF proxies the request, attaching the token server-side. This eliminates XSS token theft risk entirely. The BFF must be a confidential client (has a client_secret). This is the OWASP-recommended approach for SPAs handling sensitive data.`,
    requiredTypes: [['browser', 'spa'], ['spa', 'web-api'], ['web-api', 'idp']],
    securityLevel: 'high',
    pros: [
      'Tokens never exposed to JavaScript',
      'Immune to XSS token theft',
      'Secure HttpOnly cookies prevent JS access',
      'Confidential client — has client_secret',
      'OWASP-recommended for sensitive SPAs',
    ],
    cons: [
      'More infrastructure (BFF proxy endpoint required)',
      'CSRF protection needed on BFF endpoints',
      'Slightly higher latency (SPA → BFF → API)',
      'BFF is a single point of failure',
    ],
    tags: ['OIDC', 'OAuth2', 'BFF', 'Secure', 'OWASP'],
    recommendedFor: 'SPAs dealing with sensitive user data or financial/medical domains',
    docsUrl: 'https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps-15#name-backend-for-frontend-bff',
    steps: [
      {
        id: 'bff-1',
        from: 'browser', to: 'spa',
        label: 'User visits app',
        description: 'User opens the SPA. No tokens in the browser.',
        color: 'blue',
      },
      {
        id: 'bff-2',
        from: 'spa', to: 'web-api',
        label: 'Login Request',
        description: 'SPA calls the Web API (BFF) /login endpoint. No auth parameters at this layer.',
        color: 'blue',
        httpMethod: 'GET',
        httpPath: '/bff/login',
      },
      {
        id: 'bff-3',
        from: 'web-api', to: 'idp',
        label: 'Authorization Request (server-side)',
        description: 'BFF Web API generates PKCE parameters and redirects the browser to the IdP. As a confidential client, it will also present a client_secret during code exchange.',
        color: 'blue',
        httpMethod: 'GET',
        httpPath: '/authorize?response_type=code&client_id=bff-client&...',
      },
      {
        id: 'bff-4',
        from: 'idp', to: 'web-api',
        label: 'Authorization Code (to BFF)',
        description: 'After user authenticates, IdP redirects back to the Web API\'s redirect_uri (not the SPA\'s). The code lands server-side.',
        color: 'blue',
        httpMethod: 'GET',
        httpPath: '/bff/callback?code=SplxlO...',
        isReturn: true,
      },
      {
        id: 'bff-5',
        from: 'web-api', to: 'idp',
        label: 'Token Exchange (confidential)',
        description: 'Web API BFF exchanges the code for tokens, authenticating with client_id + client_secret. Tokens are returned to the server.',
        color: 'orange',
        httpMethod: 'POST',
        httpPath: '/token',
        httpBody: 'grant_type=authorization_code\n&code=SplxlO...\n&client_id=bff-client\n&client_secret=s3cr3t\n&code_verifier=...',
      },
      {
        id: 'bff-6',
        from: 'web-api', to: 'spa',
        label: 'Set Session Cookie',
        description: 'BFF stores tokens in server-side session. It sets a secure, HttpOnly, SameSite=Strict session cookie in the browser. No tokens reach JavaScript.',
        color: 'green',
        httpHeaders: { 'Set-Cookie': 'session=abc123; HttpOnly; Secure; SameSite=Strict' },
        isReturn: true,
      },
      {
        id: 'bff-7',
        from: 'spa', to: 'web-api',
        label: 'API Request (with cookie)',
        description: 'SPA makes a request to a BFF proxy endpoint. The browser automatically sends the HttpOnly session cookie. No JS-accessible token involved.',
        color: 'orange',
        httpMethod: 'GET',
        httpPath: '/bff/api/data',
        httpHeaders: { Cookie: 'session=abc123' },
      },
      {
        id: 'bff-8',
        from: 'web-api', to: 'spa',
        label: 'API Response (via BFF)',
        description: 'Web API validates the session cookie, acts on the data, and returns the response payload back to the SPA. End-to-end: the browser never held any access token.',
        color: 'green',
        isReturn: true,
      },
    ],
  },

  // ─── Client Credentials ────────────────────────────────────────────
  {
    id: 'client-credentials',
    name: 'Client Credentials',
    shortName: 'Client Credentials',
    description: 'Machine-to-machine flow. One API authenticates as itself (not as a user) to call another API.',
    detailedDescription: `The Client Credentials grant is for machine-to-machine scenarios where there is no human user involved. A backend service authenticates with its own client_id and client_secret to get an access token representing the service identity (not a user). This is common for scheduled jobs, microservices calling each other, or daemons. The token has no sub claim (no user identity). Scopes represent service-level permissions, not user delegated access.`,
    requiredTypes: [['web-api', 'idp'], ['web-api', 'external-api']],
    securityLevel: 'high',
    pros: [
      'Simple, stateless M2M auth',
      'No user interaction required',
      'Standard, widely supported',
    ],
    cons: [
      'No user context — not suitable for user-delegated access',
      'Client secret must be kept secure (use managed identity or cert)',
    ],
    tags: ['OAuth2', 'M2M', 'Service Account'],
    recommendedFor: 'Microservices, daemon jobs, API-to-API communication',
    docsUrl: 'https://datatracker.ietf.org/doc/html/rfc6749#section-4.4',
    isMatch: (nodes: ComponentType[], edges: { source: ComponentType; target: ComponentType }[]) => {
      // E.g. Web API -> IdP
      // Or Web API -> External API
      const hasWebApi = nodes.includes('web-api');
      const hasIdp = nodes.includes('idp');
      const hasExternal = nodes.includes('external-api');
      
      const s2sIdiomatic = edges.some(e => 
        (e.source === 'web-api' && e.target === 'idp') ||
        (e.source === 'web-api' && e.target === 'external-api')
      );

      // We allow this even if there are user agents in the subgraph
      // because the backend might serve an SPA but also have M2M legs to external APIs
      return hasWebApi && (hasIdp || hasExternal) && s2sIdiomatic;
    },
    steps: [
      {
        id: 'cc-1',
        from: 'web-api', to: 'idp',
        label: 'Token Request (Client Credentials)',
        description: 'The API requests an access token using its own credentials. No user is involved.',
        color: 'orange',
        httpMethod: 'POST',
        httpPath: '/token',
        httpBody: 'grant_type=client_credentials\n&client_id=my-service\n&client_secret=s3cr3t\n&scope=api://target-api/.default',
      },
      {
        id: 'cc-2',
        from: 'idp', to: 'web-api',
        label: 'Access Token (no user)',
        description: 'IdP issues an access token. The token has no sub (user) claim — it represents the service identity.',
        color: 'green',
        httpBody: '{\n  "access_token": "eyJhbG...",\n  "token_type": "Bearer",\n  "expires_in": 3600\n}',
        isReturn: true,
      },
      {
        id: 'cc-3',
        from: 'web-api', to: 'external-api',
        label: 'API Call (service-to-service)',
        description: 'The service calls the target API using the Bearer token.',
        color: 'orange',
        httpMethod: 'GET',
        httpPath: '/external/resource',
        httpHeaders: { Authorization: 'Bearer eyJhbG...' },
      },
      {
        id: 'cc-4',
        from: 'external-api', to: 'web-api',
        label: 'API Response',
        description: 'External API validates the token and returns the resource.',
        color: 'green',
        httpBody: '{ "result": "..." }',
        isReturn: true,
      },
    ],
  },

  // ─── Device Code Flow ────────────────────────────────────────────────
  {
    id: 'device-code',
    name: 'Device Code Flow',
    shortName: 'Device Code',
    description: 'For devices with no browser (CLI, TV, IoT). The user authenticates on a separate device using a code.',
    detailedDescription: `The Device Authorization Grant (RFC 8628) is used when a device cannot open a browser (e.g., CLI tools, smart TVs, game consoles). The device displays a code and a URL. The user opens the URL on their phone or computer and enters the code. The device polls the token endpoint until it gets a response. This is how the Azure CLI and GitHub CLI authenticate users.`,
    requiredTypes: [['browser', 'idp'], ['mobile', 'idp']],
    securityLevel: 'medium',
    pros: [
      'Works on browserless devices',
      'User authenticates on a trusted device',
    ],
    cons: [
      'Polling required (network overhead)',
      'User must switch devices',
    ],
    tags: ['OAuth2', 'Device', 'CLI', 'IoT', 'RFC 8628'],
    recommendedFor: 'CLI tools, smart TVs, IoT devices',
    steps: [
      {
        id: 'dc-1',
        from: 'mobile', to: 'idp',
        label: 'Device Authorization Request',
        description: 'Device requests a device_code and user_code from the IdP.',
        color: 'blue',
        httpMethod: 'POST',
        httpPath: '/deviceauthorization',
        httpBody: 'client_id=my-device-app\n&scope=openid profile',
      },
      {
        id: 'dc-2',
        from: 'idp', to: 'mobile',
        label: 'Device + User Codes',
        description: 'IdP returns: user_code (short), verification_uri, device_code, and an expiry.',
        color: 'blue',
        httpBody: '{\n  "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",\n  "user_code": "WDJB-MJHT",\n  "verification_uri": "https://aka.ms/devicelogin",\n  "expires_in": 900,\n  "interval": 5\n}',
        isReturn: true,
      },
      {
        id: 'dc-3',
        from: 'browser', to: 'idp',
        label: 'User enters code (other device)',
        description: 'On a separate device (phone/laptop), the user visits verification_uri and enters the user_code WDJB-MJHT.',
        color: 'blue',
        httpMethod: 'POST',
        httpPath: '/devicelogin',
        httpBody: 'otc=WDJB-MJHT',
      },
      {
        id: 'dc-4',
        from: 'mobile', to: 'idp',
        label: 'Polling Token Endpoint',
        description: 'Device polls the token endpoint with device_code every 5 seconds while waiting for user.',
        color: 'orange',
        httpMethod: 'POST',
        httpPath: '/token',
        httpBody: 'grant_type=urn:ietf:params:oauth:grant-type:device_code\n&client_id=my-device-app\n&device_code=GmRhmhcxh...',
      },
      {
        id: 'dc-5',
        from: 'idp', to: 'mobile',
        label: 'Tokens Issued',
        description: 'Once user authenticates, the next poll returns tokens.',
        color: 'green',
        httpBody: '{\n  "access_token": "eyJhbG...",\n  "id_token": "eyJhbG...",\n  "refresh_token": "...",\n  "token_type": "Bearer"\n}',
        isReturn: true,
      },
    ],
  },
];

export function detectArchitectures(
  nodeTypes: ComponentType[],
  edges: { source: ComponentType; target: ComponentType }[]
): Architecture[] {
  return ARCHITECTURES.filter(arch => {
    // 1. Immediately reject if any forbidden components exist on the canvas
    if (arch.forbiddenTypes && arch.forbiddenTypes.some(t => nodeTypes.includes(t))) {
      return false;
    }

    // 2. Otherwise verify required types
    return arch.requiredTypes.every(([from, to]) =>
      edges.some(e =>
        (e.source === from && e.target === to) ||
        (e.source === to && e.target === from)
      )
    );
  });
}
