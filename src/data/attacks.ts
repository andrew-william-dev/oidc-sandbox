import type { ComponentType } from './components';

export type AttackSeverity = 'critical' | 'high' | 'medium';

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  detailedExplanation: string;
  severity: AttackSeverity;
  affectedTypes: ComponentType[];
  affectedArchitectures: string[];   // architecture IDs
  vulnerableIfConfig?: {
    tokenStorage?: string;
    flowType?: string;
  };
  mitigation: string;
  mitigationSteps: string[];
}

export const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'xss-token-theft',
    name: 'XSS Token Theft from localStorage',
    description: 'An attacker injects malicious JS that reads tokens directly from localStorage.',
    detailedExplanation: `localStorage is accessible to any JavaScript on the page, including injected scripts (XSS). An attacker who exploits an XSS vulnerability (e.g., through an unsanitized user input, a compromised npm package, or a browser extension) can call localStorage.getItem('access_token') and exfiltrate the token to a remote server. The attacker then has a fully valid access token they can use to call your API.`,
    severity: 'critical',
    affectedTypes: ['spa', 'web-api'],
    affectedArchitectures: ['auth-code-pkce-spa', 'implicit-flow', 'ropc'],
    vulnerableIfConfig: { tokenStorage: 'localStorage' },
    mitigation: 'Store tokens in memory only, or use the BFF pattern',
    mitigationSteps: [
      'Keep access tokens in JavaScript memory (module-level variable), not localStorage/sessionStorage',
      'Use refresh tokens (HttpOnly cookie) for session persistence — store only the refresh token server-side or in a secure cookie',
      'Alternatively, adopt the BFF pattern to eliminate token exposure to JavaScript entirely',
      'Implement a strict Content Security Policy (CSP) to limit script sources',
    ],
  },
  {
    id: 'implicit-flow-deprecated',
    name: 'Token Leakage — Implicit Flow',
    description: 'The Implicit flow returns access tokens in the URL fragment, exposing them to the browser history and referrer headers.',
    detailedExplanation: `The Implicit flow was designed before CORS was widely available. It returns the access_token directly in the URL fragment (response_type=token). This means the token appears in browser history, server logs (if the token appears in a query param), and can leak via the Referer header. RFC 9700 deprecated the Implicit flow entirely. No new applications should use it.`,
    severity: 'high',
    affectedTypes: ['spa', 'idp'],
    affectedArchitectures: ['auth-code-pkce-spa', 'implicit-flow'],
    vulnerableIfConfig: { flowType: 'implicit' },
    mitigation: 'Use Auth Code + PKCE instead — it is now supported everywhere',
    mitigationSteps: [
      'Replace response_type=token with response_type=code',
      'Add PKCE parameters (code_challenge, code_challenge_method=S256)',
      'Exchange the code at the token endpoint — never use response_type=token',
      'Update your IdP application registration to disallow the implicit grant',
    ],
  },
  {
    id: 'csrf-missing-state',
    name: 'CSRF via Missing state Parameter',
    description: 'Without the state parameter, an attacker can trick a user into completing a login flow with the attacker\'s account.',
    detailedExplanation: `The OAuth2 state parameter is a random nonce that ties the authorization request to the callback. Without it, an attacker can craft an authorization URL, have the victim click it, and when the victim is redirected back with the code, the attacker's code would be used — linking the victim's session to the attacker's account (account fixation / login CSRF). The state parameter must be cryptographically random and validated on return.`,
    severity: 'high',
    affectedTypes: ['spa', 'web-api', 'idp'],
    affectedArchitectures: ['auth-code-pkce-spa', 'auth-code-bff', 'implicit-flow'],
    mitigation: 'Always generate, send, and validate the state parameter',
    mitigationSteps: [
      'Generate a cryptographically random state value (e.g., 32 bytes from crypto.getRandomValues)',
      'Store it in sessionStorage before redirect',
      'On callback, validate the returned state matches the stored value',
      'Reject the callback if state is missing or mismatched',
    ],
  },
  {
    id: 'token-replay',
    name: 'Access Token Replay Attack',
    description: 'A stolen access token is used by an attacker to call the API as the original user.',
    detailedExplanation: `Bearer tokens are like cash — whoever holds them can use them. If an access token is intercepted (via network sniffing, log files, browser history, or XSS), the attacker can replay it against the resource server. The API has no way to distinguish the original request from the replayed one. Mitigation strategies include short token lifetimes, sender-constrained tokens (DPoP), and token binding.`,
    severity: 'high',
    affectedTypes: ['spa', 'web-api', 'browser'],
    affectedArchitectures: ['auth-code-pkce-spa', 'auth-code-bff', 'implicit-flow', 'ropc'],
    mitigation: 'Short-lived tokens, HTTPS everywhere, consider DPoP for sender-constrained tokens',
    mitigationSteps: [
      'Set short access token lifetimes (5–15 minutes)',
      'Always use HTTPS — never send tokens over plain HTTP',
      'Implement refresh token rotation (invalidate old refresh tokens on use)',
      'Consider DPoP (Demonstrating Proof of Possession, RFC 9449) to bind tokens to the client',
      'Enable token revocation capability at the IdP',
    ],
  },
];
