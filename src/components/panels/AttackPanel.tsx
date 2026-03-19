import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { ATTACK_SCENARIOS } from '../../data/attacks';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#fbbf24',
};

export default function AttackPanel() {
  const { attackMode, selectedAttack, setSelectedAttack } = useFlowStore();

  if (!attackMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 h-full z-30 flex flex-col panel-backdrop"
        style={{
          width: 400,
          background: 'rgba(10,14,26,0.96)',
          borderLeft: '2px solid rgba(248,113,113,0.4)',
        }}
      >
        {/* Header */}
        <div className="p-5 border-b border-border" style={{ borderTop: '3px solid #f87171' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
              <h2 className="text-sm font-bold text-neon-red">Attack Simulation Mode</h2>
            </div>
            <button
              onClick={() => useFlowStore.getState().toggleAttackMode()}
              className="p-1 rounded hover:bg-white/5 transition-colors"
            >
              <X size={14} color="#94a3b8" />
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            Select an attack to see how it exploits your architecture and how to defend against it.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selectedAttack ? (
            <div className="space-y-2">
              {ATTACK_SCENARIOS.map(attack => {
                const color = SEVERITY_COLORS[attack.severity] ?? '#fb923c';
                return (
                  <button
                    key={attack.id}
                    onClick={() => setSelectedAttack(attack)}
                    className="w-full text-left p-4 rounded-xl transition-all group"
                    style={{
                      background: `${color}08`,
                      border: `1px solid ${color}25`,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${color}15`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${color}50`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = `${color}08`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${color}25`;
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={12} color={color} />
                          <span className="text-xs font-bold" style={{ color }}>{attack.name}</span>
                          <span
                            className="text-[10px] px-1.5 py-px rounded-full capitalize"
                            style={{ background: `${color}20`, color }}
                          >
                            {attack.severity}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">{attack.description}</p>
                      </div>
                      <ChevronRight size={14} color="#475569" className="flex-shrink-0 mt-0.5 group-hover:text-text-secondary" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <button
                onClick={() => setSelectedAttack(null)}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1"
              >
                ← Back to attacks
              </button>

              {/* Attack detail */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} color={SEVERITY_COLORS[selectedAttack.severity]} />
                  <h3 className="text-sm font-bold" style={{ color: SEVERITY_COLORS[selectedAttack.severity] }}>
                    {selectedAttack.name}
                  </h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{selectedAttack.detailedExplanation}</p>
              </div>

              {/* Mitigation */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield size={11} color="#4ade80" /> Mitigation
                </h4>
                <div
                  className="p-3 rounded-lg mb-3"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
                >
                  <p className="text-xs text-neon-green font-medium">{selectedAttack.mitigation}</p>
                </div>
                <ul className="space-y-2">
                  {selectedAttack.mitigationSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                      <span className="text-neon-green flex-shrink-0 mt-0.5">{i + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
