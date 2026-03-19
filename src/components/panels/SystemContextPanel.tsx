import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ShieldAlert, ShieldCheck, ChevronRight, BookOpen, ExternalLink, Activity, Settings2 } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { useCanvasStore } from '../../store/canvasStore';
import { COMPONENT_DEFS } from '../../data/components';
import type { ComponentType } from '../../data/components';
import type { Architecture } from '../../data/architectures';

const SECURITY_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  high: { icon: ShieldCheck, color: '#4ade80', label: 'High Security' },
  medium: { icon: Shield, color: '#fbbf24', label: 'Medium Security' },
  low: { icon: ShieldAlert, color: '#f87171', label: 'Lower Security' },
};

function ArchCard({ arch, onSelect, isSelected }: { arch: Architecture; onSelect: () => void; isSelected: boolean }) {
  const sec = SECURITY_CONFIG[arch.securityLevel];
  const SecIcon = sec.icon;

  return (
    <div className="relative">
      {isSelected && (
        <div
          className="absolute -inset-px rounded-xl pointer-events-none"
          style={{ border: '2px solid #38bdf8', boxShadow: '0 0 20px rgba(56,189,248,0.2)' }}
        />
      )}
      <button
        onClick={onSelect}
        className="w-full text-left p-4 rounded-xl group transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(56,189,248,0.06)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(56,189,248,0.3)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-text-primary">{arch.name}</span>
              <ChevronRight size={14} className="text-text-muted group-hover:text-neon-blue transition-colors" />
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">{arch.description}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {arch.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <SecIcon size={12} color={sec.color} />
              <span className="text-[11px] font-medium" style={{ color: sec.color }}>{sec.label}</span>
            </div>

            {arch.recommendedFor && (
              <p className="text-[10px] text-text-muted mt-1.5">
                <span className="text-text-secondary">Best for:</span> {arch.recommendedFor}
              </p>
            )}

            {arch.docsUrl && (
              <div className="mt-3">
                <a 
                  href={arch.docsUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={e => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors px-2.5 py-1 rounded border"
                  style={{
                    color: '#38bdf8',
                    background: 'rgba(56,189,248,0.1)',
                    borderColor: 'rgba(56,189,248,0.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(56,189,248,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(56,189,248,0.1)';
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  Official Spec RFC
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-neon-green font-semibold mb-1">✓ Pros</div>
            {arch.pros.slice(0, 2).map(p => (
              <div key={p} className="text-[10px] text-text-muted leading-tight">{p}</div>
            ))}
          </div>
          <div>
            <div className="text-[10px] text-neon-red font-semibold mb-1">✗ Cons</div>
            {arch.cons.slice(0, 2).map(c => (
              <div key={c} className="text-[10px] text-text-muted leading-tight">{c}</div>
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}

function getOAuthRoleDesc(role: string): string {
  const descs: Record<string, string> = {
    'Resource Owner': 'The entity (typically a human user) that owns the protected resources and can grant access to them.',
    'Public Client': 'A client that cannot maintain the confidentiality of its credentials. Cannot use a client_secret securely.',
    'Confidential Client': 'A client capable of maintaining the confidentiality of its credentials. Can use a client_secret.',
    'Resource Server': 'The server hosting the protected resources. Validates access tokens on each request.',
    'Authorization Server': 'Issues access tokens to clients after authenticating the resource owner. Core of OAuth2/OIDC.',
    'Protected Resource (Downstream)': 'Data protected behind the Resource Server. Not directly involved in OAuth flows.',
    'Resource Server (External)': 'An external API that is its own resource server, issuing and validating its own tokens.',
  };
  return descs[role] ?? '';
}

function getResponsibilities(type: ComponentType): string[] {
  const map: Record<ComponentType, string[]> = {
    browser: ['Initiates the Authorization Code flow via redirect', 'Renders the authentication UI from the IdP', 'Receives the authorization code redirect after login'],
    spa: ['Generates PKCE code_verifier and code_challenge', 'Redirects to IdP authorization endpoint', 'Exchanges code for tokens at token endpoint', 'Stores tokens securely in memory', 'Attaches Bearer token to API calls'],
    mobile: ['Same as SPA — uses Auth Code + PKCE flow', 'Uses custom URL schemes or App Links for redirect_uri', 'Follows RFC 8252 for native app OAuth'],
    'web-api': ['Validates JWT access tokens on every request', 'Fetches and caches IdP public keys (JWKS)', 'Enforces scope-based authorization', 'Returns protected resources on valid token'],
    idp: ['Authenticates users (password, MFA)', 'Issues authorization codes', 'Issues access tokens, ID tokens, refresh tokens', 'Hosts JWKS endpoint for public key distribution', 'Manages token lifetimes and revocation'],
    database: ['Stores application data behind the API', 'Not directly involved in OAuth flows', 'Protected by API authorization layer'],
    'external-api': ['Issues its own access tokens or validates incoming ones', 'May require On-Behalf-Of (OBO) flow for delegated access', 'Subject to its own authorization policies'],
  };
  return map[type] ?? [];
}

export default function SystemContextPanel() {
  const { activePanel, selectedNodeId, selectedContextTab, closePanel, openPanel, subgraphState, setSelectedArchitecture } = useFlowStore();
  const activeSubgraphId = useCanvasStore(s => s.activeSubgraphId);
  const nodes = useCanvasStore(s => s.nodes);

  const isOpen = activePanel === 'system-context';
  
  if (!isOpen) return null;

  const state = activeSubgraphId ? subgraphState[activeSubgraphId] : null;
  const detectedArchitectures = state?.detectedArchitectures || [];
  const selectedArchitectureId = state?.selectedArchitectureId || null;

  // Derive component info if a node is selected
  const node = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const def = node ? COMPONENT_DEFS[node.data.componentType as ComponentType] : null;
  
  // Default to architecture tab if no component is selected or tab explicitly states it
  const currentTab = selectedContextTab || (node ? 'component' : 'architecture');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 h-full z-30 flex flex-col panel-backdrop"
        style={{
          width: 420,
          background: 'rgba(10,14,26,0.94)',
          borderLeft: '1px solid rgba(30,45,74,0.8)',
        }}
      >
        {/* Header & Tabs */}
        <div className="border-b border-border">
          <div className="flex items-start justify-between p-5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">System Context</h2>
              <p className="text-xs text-text-muted mt-0.5">Inspect nodes or select architecture</p>
            </div>
            <button
              onClick={closePanel}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <X size={14} color="#94a3b8" />
            </button>
          </div>
          
          <div className="flex px-5 gap-6">
            <button
              onClick={() => openPanel('system-context', { nodeId: selectedNodeId ?? undefined, tab: 'architecture' })}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                currentTab === 'architecture' ? 'text-neon-blue border-neon-blue' : 'text-text-muted border-transparent hover:text-text-secondary'
              }`}
            >
              <Activity size={12} />
              Detected Architectures
              {detectedArchitectures.length > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-[9px]">
                  {detectedArchitectures.length}
                </span>
              )}
            </button>
            <button
              disabled={!def}
              onClick={() => openPanel('system-context', { nodeId: selectedNodeId ?? undefined, tab: 'component' })}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                currentTab === 'component' ? 'text-neon-blue border-neon-blue' : 'text-text-muted border-transparent hover:text-text-secondary'
              } ${!def && 'opacity-30 cursor-not-allowed'}`}
            >
              <Settings2 size={12} />
              Component Info
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentTab === 'architecture' && (
            <>
              {!activeSubgraphId ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">👆</div>
                  <p className="text-sm text-text-secondary">Select a system to configure</p>
                  <p className="text-xs text-text-muted mt-1">Click any component on the board to view its architectures.</p>
                </div>
              ) : detectedArchitectures.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">🔗</div>
                  <p className="text-sm text-text-secondary">Connect components to see matching architectures</p>
                  <p className="text-xs text-text-muted mt-1">Try connecting a SPA to an IdP</p>
                </div>
              ) : (
                detectedArchitectures.map(arch => (
                  <ArchCard
                    key={arch.id}
                    arch={arch}
                    isSelected={selectedArchitectureId === arch.id}
                    onSelect={() => {
                      if (activeSubgraphId) {
                        setSelectedArchitecture(activeSubgraphId, arch.id);
                      }
                    }}
                  />
                ))
              )}
            </>
          )}

          {currentTab === 'component' && def && (
            <div className="space-y-5 px-1 py-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${def.accentColor}20`, border: `1px solid ${def.accentColor}40` }}
                >
                  {def.icon}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">{def.label}</h2>
                  <span
                    className="inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${def.accentColor}20`, color: def.accentColor }}
                  >
                    {def.oauthRole}
                  </span>
                </div>
              </div>

              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Overview</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{def.description}</p>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">OAuth2 / OIDC Role</h3>
                <div
                  className="p-3 rounded-lg"
                  style={{ background: `${def.accentColor}10`, border: `1px solid ${def.accentColor}25` }}
                >
                  <div className="text-sm font-semibold" style={{ color: def.accentColor }}>{def.oauthRole}</div>
                  <p className="text-xs text-text-muted mt-1">
                    {getOAuthRoleDesc(def.oauthRole)}
                  </p>
                </div>
              </section>

              {def.rfcNote && (
                <section>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><BookOpen size={11} /> Specification Reference</span>
                  </h3>
                  <a
                    href={`https://datatracker.ietf.org/doc/html/${def.rfcNote.split(' ')[0].toLowerCase()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg transition-colors hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <ExternalLink size={11} color="#38bdf8" />
                    <span className="text-xs text-neon-blue font-mono hover:underline">{def.rfcNote}</span>
                  </a>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Responsibilities</h3>
                <ul className="space-y-1.5">
                  {getResponsibilities(def.type as ComponentType).map(r => (
                    <li key={r} className="flex items-start gap-2 text-xs text-text-muted">
                      <span style={{ color: def.accentColor }} className="mt-0.5">▸</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
