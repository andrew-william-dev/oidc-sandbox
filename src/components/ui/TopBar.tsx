import { useFlowStore } from '../../store/flowStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useConfigStore } from '../../store/configStore';
import { ARCHITECTURES } from '../../data/architectures';
import {
  Settings, Zap, AlertTriangle, Download, Trash2, ChevronDown
} from 'lucide-react';

export default function TopBar() {
  const { openPanel, attackMode, toggleAttackMode, activePanel, subgraphState } = useFlowStore();
  const activeSubgraphId = useCanvasStore(s => s.activeSubgraphId);
  const clearCanvas = useCanvasStore(s => s.clearCanvas);
  const { warnings } = useConfigStore();

  const state = activeSubgraphId ? subgraphState[activeSubgraphId] : null;

  const arch = ARCHITECTURES.find(a => a.id === state?.selectedArchitectureId)
    ?? state?.detectedArchitectures?.[0];

  const criticalCount = warnings.filter(w => w.severity === 'critical' || w.severity === 'high').length;

  const handleExport = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = document.querySelector('.react-flow') as HTMLElement;
    if (!canvas) return;
    const rendered = await html2canvas(canvas, { backgroundColor: '#0a0e1a', scale: 2 });
    const link = document.createElement('a');
    link.download = `oidc-sandbox-${arch?.shortName ?? 'diagram'}.png`;
    link.href = rendered.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="flex items-center justify-between px-4 h-12 flex-shrink-0 z-40"
      style={{
        background: 'rgba(10,14,26,0.96)',
        borderBottom: '1px solid rgba(30,45,74,0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)' }}>
              <span className="text-xs">🔐</span>
            </div>
            <div className="absolute -inset-1 rounded-lg opacity-30 blur-sm" style={{ background: '#38bdf8' }} />
          </div>
          <span
            className="text-sm font-bold tracking-tight"
            style={{ background: 'linear-gradient(90deg, #38bdf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            oidc-sandbox
          </span>
        </div>

        {/* Active architecture badge */}
        {arch && (
          <>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={() => openPanel('system-context', { tab: 'architecture' })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors text-xs"
              style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.08)')}
            >
              <Zap size={11} />
              <span className="font-medium">{arch.shortName}</span>
              <ChevronDown size={10} />
            </button>
          </>
        )}
      </div>

      {/* Actions */}
      <div id="tour-actions" className="flex items-center gap-2">
        {/* Configure */}
        {arch && (
          <TopBarBtn
            onClick={() => openPanel('config')}
            active={activePanel === 'config'}
            label="Configure"
            badge={criticalCount > 0 ? { count: criticalCount, color: '#f87171' } : undefined}
          >
            <Settings size={13} />
          </TopBarBtn>
        )}

        {/* Attack Mode */}
        <button
          id="tour-attack"
          onClick={toggleAttackMode}
          className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all"
          style={{
            background: attackMode ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${attackMode ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'}`,
            color: attackMode ? '#f87171' : '#94a3b8',
          }}
        >
          <AlertTriangle size={12} />
          <span>{attackMode ? 'Attack On' : 'Simulate Attack'}</span>
        </button>

        {/* Export */}
        <TopBarBtn onClick={handleExport} label="Export PNG">
          <Download size={13} />
        </TopBarBtn>

        {/* Clear */}
        <TopBarBtn onClick={clearCanvas} label="Clear canvas" danger>
          <Trash2 size={13} />
        </TopBarBtn>
      </div>
    </div>
  );
}

function TopBarBtn({
  children, onClick, active, label, badge, danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label?: string;
  badge?: { count: number; color: string };
  danger?: boolean;
}) {
  const baseColor = danger ? '#f87171' : '#94a3b8';
  const activeBg = danger ? 'rgba(248,113,113,0.1)' : 'rgba(56,189,248,0.1)';

  return (
    <button
      onClick={onClick}
      title={label}
      className="relative flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-all"
      style={{
        background: active ? activeBg : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`,
        color: active ? '#38bdf8' : baseColor,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = active ? activeBg : 'rgba(255,255,255,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.background = active ? activeBg : 'rgba(255,255,255,0.04)')}
    >
      {children}
      {label && <span className="hidden sm:inline">{label}</span>}
      {badge && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{ background: badge.color, color: '#0a0e1a' }}
        >
          {badge.count}
        </span>
      )}
    </button>
  );
}
