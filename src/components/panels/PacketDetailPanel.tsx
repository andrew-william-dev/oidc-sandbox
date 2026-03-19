import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, Info } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { ARCHITECTURES } from '../../data/architectures';

const COLOR_MAP: Record<string, string> = {
  blue: '#38bdf8', orange: '#fb923c', green: '#4ade80', red: '#f87171', purple: '#a78bfa',
};

import { useCanvasStore } from '../../store/canvasStore';

export default function PacketDetailPanel() {
  const { activePanel, selectedPacketStepId, subgraphState, closePanel } = useFlowStore();
  const activeSubgraphId = useCanvasStore(s => s.activeSubgraphId);

  const isOpen = activePanel === 'packet-detail' && selectedPacketStepId !== null;
  const state = activeSubgraphId ? subgraphState[activeSubgraphId] : null;

  const arch = ARCHITECTURES.find(a => a.id === state?.selectedArchitectureId)
    ?? state?.detectedArchitectures?.[0];
  const step = arch?.steps.find(s => s.id === selectedPacketStepId);

  const color = step ? COLOR_MAP[step.color] ?? '#38bdf8' : '#38bdf8';

  return (
    <AnimatePresence>
      {isOpen && step && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full z-30 flex flex-col panel-backdrop"
          style={{ width: 400, background: 'rgba(10,14,26,0.96)', borderLeft: '1px solid rgba(30,45,74,0.8)' }}
        >
          {/* Header */}
          <div className="p-5 border-b border-border" style={{ borderTop: `3px solid ${color}` }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                  <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                    {step.from} → {step.to}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-text-primary">{step.label}</h2>
              </div>
              <button onClick={closePanel} className="p-1 rounded hover:bg-white/5 transition-colors mt-1">
                <X size={14} color="#94a3b8" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Explanation */}
            <section>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info size={11} /> What is happening
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
            </section>

            {/* HTTP breakdown */}
            {(step.httpMethod || step.httpPath || step.httpBody) && (
              <section>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  HTTP Message
                </h3>
                <div
                  className="rounded-lg overflow-hidden font-mono"
                  style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Request line */}
                  {step.httpMethod && (
                    <div className="px-3 py-2 border-b border-white/5">
                      <span style={{ color }} className="text-xs font-bold">{step.httpMethod}</span>
                      {step.httpPath && (
                        <span className="text-xs text-text-secondary ml-2">{step.httpPath}</span>
                      )}
                    </div>
                  )}
                  {/* Headers */}
                  {step.httpHeaders && Object.keys(step.httpHeaders).length > 0 && (
                    <div className="px-3 py-2 border-b border-white/5">
                      {Object.entries(step.httpHeaders).map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="text-neon-purple">{k}:</span>
                          <span className="text-text-muted ml-1 break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Body */}
                  {step.httpBody && (
                    <div className="px-3 py-2">
                      <pre className="text-xs text-text-secondary whitespace-pre-wrap break-words leading-relaxed">{step.httpBody}</pre>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Security note */}
            {step.isHighRisk && (
              <section>
                <div
                  className="flex items-start gap-2.5 p-3 rounded-lg"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
                >
                  <AlertTriangle size={14} color="#f87171" className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-neon-red mb-1">Security sensitive step</div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      This message carries sensitive credentials or tokens. Ensure the connection uses HTTPS/TLS. Never log this data.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* What if intercepted */}
            <section>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield size={11} /> What if this is intercepted?
              </h3>
              <div
                className="p-3 rounded-lg"
                style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}
              >
                <p className="text-xs text-text-muted leading-relaxed">{getInterceptionWarning(step.id)}</p>
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getInterceptionWarning(stepId: string): string {
  const warnings: Record<string, string> = {
    'pkce-2': 'Intercepting the authorization request reveals the code_challenge and redirect_uri but NOT the code_verifier. PKCE is specifically designed so that intercepting this request is harmless — the verifier is never sent here.',
    'pkce-5': 'Intercepting the token request would expose the authorization code AND code_verifier. This is why HTTPS is mandatory — an attacker with both can exchange them for tokens. PKCE prevents the code from being usable without the verifier, but both are sent here.',
    'pkce-6': 'Intercepting the token response exposes access and refresh tokens. This is a critical step — HTTPS/TLS MUST be enforced. Tokens obtained here give full API access.',
    'pkce-7': 'Intercepting this API call exposes the Bearer token. An attacker can replay it until it expires. Use short token lifetimes (5-15 min) and consider DPoP (sender-constraining) to limit damage.',
    'bff-6': 'The session cookie is set with HttpOnly and Secure flags. An attacker intercepting this on the wire (impossible with HTTPS) could steal the cookie. The HttpOnly flag prevents JS from reading it even if XSS occurs.',
    'cc-1': 'Intercepting the client credentials request exposes the client_secret. This is catastrophic — an attacker can mint their own tokens. Use mTLS or managed identities to avoid transmitting secrets over the wire.',
  };
  return warnings[stepId] ?? 'HTTPS/TLS encryption protects this message in transit. Ensure all endpoints use valid TLS certificates and reject plain HTTP connections.';
}
