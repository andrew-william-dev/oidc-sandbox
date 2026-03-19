import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { X, Info } from 'lucide-react';
import { COMPONENT_DEFS } from '../../data/components';
import type { ComponentType } from '../../data/components';
import { useFlowStore } from '../../store/flowStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useConfigStore, IDP_PROVIDERS } from '../../store/configStore';

const HANDLE_STYLE: React.CSSProperties = {
  background: 'rgba(56,189,248,0.15)',
  border: '2px solid rgba(56,189,248,0.5)',
  width: 14,
  height: 14,
  borderRadius: '50%',
  transition: 'all 0.15s ease',
  zIndex: 10,
};

const ComponentNode = memo(({ id, data, selected }: NodeProps) => {
  const componentType = (data as any).componentType as ComponentType;
  const def = COMPONENT_DEFS[componentType];
  const removeNode = useCanvasStore(s => s.removeNode);
  const { openPanel, attackMode, selectedAttack, subgraphState } = useFlowStore();
  const subgraphs = useCanvasStore(s => s.subgraphs);
  const { tokenStorage, idpProvider } = useConfigStore();

  const nodeSubgraphId = subgraphs.find(s => s.nodeIds.includes(id))?.id;
  const state = nodeSubgraphId ? subgraphState[nodeSubgraphId] : null;

  if (!def) return null;

  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openPanel('system-context', { nodeId: id, tab: 'component' });
  };

  const isAttacked = attackMode && selectedAttack?.affectedTypes.includes(componentType);

  const isDimmed = attackMode && !isAttacked;
  
  const arch = state?.detectedArchitectures?.find(a => a.id === state.selectedArchitectureId);
  const currentStep = arch?.steps[state?.animationStep || 0];
  
  // Highlight if it's the source OR the target of the active step
  const isActiveInStep = currentStep !== undefined && (currentStep.from === componentType || currentStep.to === componentType);
  const isSelfActive = currentStep !== undefined && currentStep.from === componentType && currentStep.to === componentType;

  const stepColor = currentStep?.color === 'red' ? '#f87171' 
    : currentStep?.color === 'green' ? '#4ade80'
    : currentStep?.color === 'orange' ? '#fb923c'
    : currentStep?.color === 'purple' ? '#a78bfa'
    : '#38bdf8';

  const activeColor = isAttacked ? '#f87171' : isActiveInStep ? stepColor : def.accentColor;
  const activeGlow = isAttacked ? 'rgba(248,113,113,0.5)' : isActiveInStep ? stepColor : def.glowColor;

  const glowStyle: React.CSSProperties = (selected || isAttacked || isActiveInStep)
    ? { boxShadow: `0 0 0 ${isSelfActive ? 3 : 2}px ${activeColor}, 0 0 ${isSelfActive ? 40 : 30}px ${activeGlow}, 0 8px 40px rgba(0,0,0,0.6)` }
    : { boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)` };

  // Generate a badge based on config if applicable
  let configBadge = null;
  if (componentType === 'spa' || componentType === 'mobile') {
    const isHighRisk = tokenStorage === 'localStorage' || tokenStorage === 'sessionStorage';
    configBadge = (
      <div className="flex items-center gap-1 mt-2 text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/5 whitespace-nowrap overflow-hidden">
        <span style={{ color: isHighRisk ? '#f87171' : '#4ade80' }}>
          {isHighRisk ? '⚠' : '✓'}
        </span>
        <span className="text-text-muted truncate">Tokens: {tokenStorage}</span>
      </div>
    );
  } else if (componentType === 'idp') {
    const idpName = IDP_PROVIDERS.find(p => p.id === idpProvider)?.label ?? 'Unknown';
    configBadge = (
      <div className="flex items-center gap-1 mt-2 text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/5 whitespace-nowrap overflow-hidden">
        <span className="text-neon-blue">☁</span>
        <span className="text-text-muted truncate">{idpName}</span>
      </div>
    );
  }

  return (
    // "group" class enables group-hover for the X button
    <div className="component-card group">
      <div
        className={`component-card-inner relative rounded-xl overflow-visible cursor-pointer select-none ${isAttacked ? 'pulse-border' : ''}`}
        style={{
          width: 172,
          background: 'linear-gradient(135deg, #1a2236 0%, #111827 100%)',
          border: `1px solid ${selected || isAttacked ? activeColor : 'rgba(255,255,255,0.08)'}`,
          opacity: isDimmed ? 0.3 : 1,
          ...glowStyle,
          transition: 'all 0.25s ease',
        }}
      >
        {/* Top color strip */}
        <div
          className="rounded-t-xl"
          style={{
            height: 3,
            background: `linear-gradient(90deg, ${activeColor}aa, ${activeColor})`,
          }}
        />

        {/* Card content */}
        <div className="p-3 pb-3.5">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg text-xl flex-shrink-0"
              style={{
                background: `${def.accentColor}15`,
                border: `1px solid ${def.accentColor}30`,
              }}
            >
              {def.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white leading-tight truncate">
                {def.label}
              </div>
              <div
                className="text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full inline-block truncate max-w-full"
                style={{
                  background: `${def.accentColor}20`,
                  color: def.accentColor,
                  border: `1px solid ${def.accentColor}30`,
                }}
              >
                {def.oauthRole}
              </div>
            </div>
          </div>

          <p
            className="text-[10px] leading-normal mt-1.5"
            style={{
              color: 'rgba(148,163,184,0.7)',
              display: '-webkit-box',
              WebkitLineClamp: configBadge ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {def.description}
          </p>
          
          {configBadge}
        </div>

        {/* Config / Info button — visible on hover */}
        <button
          className="nodrag nopan absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 hover:bg-white/10 text-text-muted hover:text-white"
          onClick={handleInfoClick}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          title="Component Settings"
        >
          <Info size={14} />
        </button>

        {/* Delete button — visible on hover */}
        <button
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 z-50"
          style={{
            background: '#1a0f0f',
            border: '1.5px solid rgba(248,113,113,0.7)',
            boxShadow: '0 0 8px rgba(248,113,113,0.3)',
          }}
          onClick={(e) => { e.stopPropagation(); removeNode(id); }}
          title="Delete node (or press Delete key)"
        >
          <X size={10} color="#f87171" />
        </button>
      </div>

      {/* Handles — Overlapped for free multi-directional connections */}
      {/* Top */}
      <Handle type="source" position={Position.Top} id="s-top" style={{ ...HANDLE_STYLE, top: -7, borderColor: `${def.accentColor}80` }} />
      <Handle type="target" position={Position.Top} id="t-top" style={{ ...HANDLE_STYLE, top: -7, borderColor: `${def.accentColor}80` }} />
      {/* Bottom */}
      <Handle type="source" position={Position.Bottom} id="s-bot" style={{ ...HANDLE_STYLE, bottom: -7, borderColor: `${def.accentColor}80` }} />
      <Handle type="target" position={Position.Bottom} id="t-bot" style={{ ...HANDLE_STYLE, bottom: -7, borderColor: `${def.accentColor}80` }} />
      {/* Right */}
      <Handle type="source" position={Position.Right} id="s-right" style={{ ...HANDLE_STYLE, right: -7, borderColor: `${def.accentColor}80` }} />
      <Handle type="target" position={Position.Right} id="t-right" style={{ ...HANDLE_STYLE, right: -7, borderColor: `${def.accentColor}80` }} />
      {/* Left */}
      <Handle type="source" position={Position.Left} id="s-left" style={{ ...HANDLE_STYLE, left: -7, borderColor: `${def.accentColor}80` }} />
      <Handle type="target" position={Position.Left} id="t-left" style={{ ...HANDLE_STYLE, left: -7, borderColor: `${def.accentColor}80` }} />
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';
export default ComponentNode;
