import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { useConfigStore, AVAILABLE_SCOPES, IDP_PROVIDERS } from '../../store/configStore';
import type { TokenStorage } from '../../store/configStore';

const TOKEN_STORAGE_OPTIONS: { id: TokenStorage; label: string; risk: 'safe' | 'medium' | 'high'; desc: string }[] = [
  { id: 'memory', label: 'Memory', risk: 'safe', desc: 'In JS variable. Safest — lost on refresh.' },
  { id: 'httpOnly', label: 'HttpOnly Cookie', risk: 'safe', desc: 'Server-set cookie, JS cannot read.' },
  { id: 'sessionStorage', label: 'sessionStorage', risk: 'medium', desc: 'Cleared on tab close, XSS-accessible.' },
  { id: 'localStorage', label: 'localStorage', risk: 'high', desc: 'Persistent but fully XSS-accessible.' },
  { id: 'cookie', label: 'Cookie (readable)', risk: 'medium', desc: 'Without HttpOnly flag — JS can read it.' },
];

const RISK_COLORS = { safe: '#4ade80', medium: '#fbbf24', high: '#f87171' };
const RISK_LABELS = { safe: '✓ Safe', medium: '⚠ Medium Risk', high: '✗ High Risk' };

export default function ConfigurationPanel() {
  const { activePanel, closePanel } = useFlowStore();
  const { tokenStorage, idpProvider, selectedScopes, enableRefreshToken, warnings,
    setTokenStorage, setIdpProvider, toggleScope, setEnableRefreshToken } = useConfigStore();

  const isOpen = activePanel === 'config';

  const criticalWarnings = warnings.filter(w => w.severity === 'critical' || w.severity === 'high');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full z-30 flex flex-col panel-backdrop"
          style={{ width: 420, background: 'rgba(10,14,26,0.96)', borderLeft: '1px solid rgba(30,45,74,0.8)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Configure Architecture</h2>
              <p className="text-xs text-text-muted mt-0.5">Security validation happens in real time</p>
            </div>
            <button onClick={closePanel} className="p-1 rounded hover:bg-white/5 transition-colors">
              <X size={14} color="#94a3b8" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Warnings Banner */}
            {criticalWarnings.length > 0 && (
              <div className="space-y-2">
                {criticalWarnings.map(w => (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3 rounded-lg badge-pulse-red"
                    style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}
                  >
                    <AlertTriangle size={13} color="#f87171" className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-neon-red capitalize">{w.severity} Risk</div>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{w.message}</p>
                      <p className="text-xs mt-1" style={{ color: '#38bdf8' }}>→ {w.recommendation}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Identity Provider */}
            <section>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Identity Provider</h3>
              <div className="space-y-1.5">
                {IDP_PROVIDERS.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => setIdpProvider(provider.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-all text-left"
                    style={{
                      background: idpProvider === provider.id ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${idpProvider === provider.id ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div>
                      <div className="text-xs font-medium text-text-primary">{provider.label}</div>
                      <div className="text-[10px] text-text-muted font-mono">{provider.domain}</div>
                    </div>
                    {idpProvider === provider.id && <CheckCircle size={13} color="#38bdf8" />}
                  </button>
                ))}
              </div>
            </section>

            {/* Token Storage */}
            <section>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Token Storage</h3>
              <p className="text-[10px] text-text-muted mb-3">Where will access tokens be stored in the browser?</p>
              <div className="space-y-1.5">
                {TOKEN_STORAGE_OPTIONS.map(opt => {
                  const riskColor = RISK_COLORS[opt.risk];
                  const isSelected = tokenStorage === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTokenStorage(opt.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left"
                      style={{
                        background: isSelected ? `${riskColor}12` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? `${riskColor}50` : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: riskColor, boxShadow: `0 0 6px ${riskColor}80` }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-text-primary">{opt.label}</span>
                          <span className="text-[10px] px-1.5 py-px rounded-full" style={{ background: `${riskColor}20`, color: riskColor }}>
                            {RISK_LABELS[opt.risk]}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">{opt.desc}</p>
                      </div>
                      {isSelected && <CheckCircle size={13} color={riskColor} />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Scopes */}
            <section>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Requested Scopes</h3>
              <p className="text-[10px] text-text-muted mb-3">Select scopes following least-privilege principle</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SCOPES.map(scope => {
                  const active = selectedScopes.includes(scope.id);
                  return (
                    <button
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all"
                      style={{
                        background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? '#38bdf8' : '#475569',
                      }}
                      title={scope.description}
                    >
                      {scope.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Refresh Token */}
            <section>
              <div className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="text-xs font-semibold text-text-primary">Refresh Token</div>
                  <p className="text-[10px] text-text-muted mt-0.5">Enable for persistent sessions without re-login</p>
                </div>
                <button
                  onClick={() => setEnableRefreshToken(!enableRefreshToken)}
                  className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                  style={{ background: enableRefreshToken ? '#38bdf8' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ left: enableRefreshToken ? '22px' : '2px' }}
                  />
                </button>
              </div>
            </section>

            {/* All clear */}
            {criticalWarnings.length === 0 && warnings.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <CheckCircle size={13} color="#4ade80" />
                <span className="text-xs text-neon-green font-medium">Configuration looks good!</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
