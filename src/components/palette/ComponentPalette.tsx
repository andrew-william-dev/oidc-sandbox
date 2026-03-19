import { COMPONENT_DEFS, PALETTE_GROUPS } from '../../data/components';
import type { ComponentType } from '../../data/components';

function PaletteCard({ type }: { type: ComponentType }) {
  const def = COMPONENT_DEFS[type];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/oidc-component', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group flex items-center gap-2.5 p-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 select-none"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = `${def.accentColor}12`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${def.accentColor}40`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
      }}
      title={def.description}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{
          background: `${def.accentColor}20`,
          border: `1px solid ${def.accentColor}30`,
        }}
      >
        {def.icon}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text-primary leading-tight">
          {def.label}
        </div>
        <div
          className="text-[10px] mt-0.5"
          style={{ color: def.accentColor, opacity: 0.8 }}
        >
          {def.oauthRole}
        </div>
      </div>
      {/* Drag hint */}
      <div className="opacity-0 group-hover:opacity-40 transition-opacity text-text-muted">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="3" cy="2" r="1.5"/><circle cx="7" cy="2" r="1.5"/>
          <circle cx="3" cy="7" r="1.5"/><circle cx="7" cy="7" r="1.5"/>
          <circle cx="3" cy="12" r="1.5"/><circle cx="7" cy="12" r="1.5"/>
        </svg>
      </div>
    </div>
  );
}

export default function ComponentPalette() {
  return (
    <div
      id="tour-palette"
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 220,
        background: 'rgba(17,24,39,0.95)',
        borderRight: '1px solid rgba(30,45,74,0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-slow" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Components</span>
        </div>
        <p className="text-[10px] text-text-muted leading-relaxed">
          Drag onto canvas to build your architecture
        </p>
      </div>

      {/* Groups */}
      <div className="flex-1 p-3 space-y-4">
        {PALETTE_GROUPS.map(group => (
          <div key={group.label}>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2 px-1">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.types.map(type => (
                <PaletteCard key={type} type={type} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border">
        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Color Legend</div>
        <div className="space-y-1">
          {[
            { color: '#38bdf8', label: 'OIDC Protocol' },
            { color: '#fb923c', label: 'OAuth2 / Token' },
            { color: '#4ade80', label: 'Success / Response' },
            { color: '#f87171', label: 'Error / Attack' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}80` }} />
              <span className="text-[10px] text-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
