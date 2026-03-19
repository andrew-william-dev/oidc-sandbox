import { useFlowStore } from '../../store/flowStore';
import { useCanvasStore } from '../../store/canvasStore';
import { ARCHITECTURES } from '../../data/architectures';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

const STEP_COLORS: Record<string, string> = {
  blue: '#38bdf8', orange: '#fb923c', green: '#4ade80', red: '#f87171', purple: '#a78bfa',
};

export default function FlowTimeline() {
  const { subgraphState, play, pause, stepForward, stepBack, resetAnimation, setAnimationStep } = useFlowStore();
  const activeSubgraphId = useCanvasStore(s => s.activeSubgraphId);

  if (!activeSubgraphId) return null;
  const state = subgraphState[activeSubgraphId];
  if (!state || !state.selectedArchitectureId) return null;

  const { selectedArchitectureId, detectedArchitectures, animationStep, isPlaying } = state;

  const arch = ARCHITECTURES.find(a => a.id === selectedArchitectureId)
    ?? detectedArchitectures[0];

  if (!arch) return null;

  const steps = arch.steps;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20"
      style={{
        background: 'rgba(10,14,26,0.92)',
        borderTop: '1px solid rgba(30,45,74,0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Timeline steps */}
      <div className="flex items-center gap-0 px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide">
        {steps.map((step, i) => {
          const color = STEP_COLORS[step.color] ?? '#38bdf8';
          const isActive = i === animationStep;
          const isPast = i < animationStep;
          const isFuture = i > animationStep;

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              {/* Step bubble */}
              <button
                onClick={() => setAnimationStep(activeSubgraphId, i)}
                className="flex flex-col items-center group"
                title={step.label}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background: isActive ? color : isPast ? `${color}30` : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${isActive ? color : isPast ? `${color}60` : 'rgba(255,255,255,0.1)'}`,
                    color: isActive ? '#0a0e1a' : isPast ? color : '#475569',
                    boxShadow: isActive ? `0 0 16px ${color}80` : undefined,
                    transform: isActive ? 'scale(1.2)' : undefined,
                  }}
                >
                  {isPast ? '✓' : i + 1}
                </div>
                <span
                  className="text-[9px] mt-1 max-w-[80px] text-center leading-tight line-clamp-2 transition-colors"
                  style={{ color: isActive ? color : isFuture ? '#2a3f6a' : `${color}80` }}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className="w-8 h-px mx-1 flex-shrink-0 transition-all duration-300"
                  style={{
                    background: i < animationStep
                      ? `${STEP_COLORS[steps[i].color] ?? '#38bdf8'}`
                      : 'rgba(255,255,255,0.08)',
                    boxShadow: i < animationStep
                      ? `0 0 4px ${STEP_COLORS[steps[i].color] ?? '#38bdf8'}60`
                      : undefined,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step info row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-text-primary">{steps[animationStep]?.label}</span>
          <span className="text-xs text-text-muted ml-2 font-mono">
            {steps[animationStep]?.from} → {steps[animationStep]?.to}
          </span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1.5">
          <ControlBtn icon={RotateCcw} onClick={() => resetAnimation(activeSubgraphId)} title="Reset" />
          <ControlBtn icon={SkipBack} onClick={() => stepBack(activeSubgraphId)} title="Previous step" />
          <button
            onClick={() => isPlaying ? pause(activeSubgraphId) : play(activeSubgraphId)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: isPlaying ? 'rgba(248,113,113,0.2)' : 'rgba(56,189,248,0.2)',
              border: `1px solid ${isPlaying ? 'rgba(248,113,113,0.4)' : 'rgba(56,189,248,0.4)'}`,
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause size={14} color="#f87171" />
              : <Play size={14} color="#38bdf8" />
            }
          </button>
          <ControlBtn icon={SkipForward} onClick={() => stepForward(activeSubgraphId)} title="Next step" />
        </div>

        {/* Step counter */}
        <div className="ml-3 text-xs text-text-muted font-mono">
          {animationStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
}

function ControlBtn({ icon: Icon, onClick, title }: { icon: any; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded flex items-center justify-center transition-colors"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
    >
      <Icon size={12} color="#94a3b8" />
    </button>
  );
}
