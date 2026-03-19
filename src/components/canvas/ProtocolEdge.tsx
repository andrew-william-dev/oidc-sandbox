import { memo, useMemo } from 'react';
import {
  BaseEdge, EdgeLabelRenderer, getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';
import { useCanvasStore } from '../../store/canvasStore';
import type { ComponentType } from '../../data/components';

const FLOW_COLORS: Record<string, string> = {
  blue: '#38bdf8', orange: '#fb923c', green: '#4ade80', red: '#f87171', purple: '#a78bfa',
};
const FLOW_GLOWS: Record<string, string> = {
  blue: 'rgba(56,189,248,0.5)', orange: 'rgba(251,146,60,0.5)',
  green: 'rgba(74,222,128,0.5)', red: 'rgba(248,113,113,0.5)', purple: 'rgba(167,139,250,0.5)',
};

const ProtocolEdge = memo(({
  id, source, target,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, selected, data
}: EdgeProps) => {
  const { attackMode, selectedAttack, subgraphState } = useFlowStore();
  const nodes = useCanvasStore(s => s.nodes);
  const subgraphs = useCanvasStore(s => s.subgraphs);
  const onEdgesChange = useCanvasStore(s => s.onEdgesChange);

  const isGhost = data?.isGhost as boolean | undefined;

  const edgeSubgraphId = isGhost
    ? id.split('-')[1] + '-' + id.split('-')[2]
    : subgraphs.find(s => s.edgeIds.includes(id))?.id;
    
  const state = edgeSubgraphId ? subgraphState[edgeSubgraphId] : null;

  // Resolve component types for THIS edge's endpoints
  const sourceType = nodes.find(n => n.id === source)?.data?.componentType as ComponentType | undefined;
  const targetType = nodes.find(n => n.id === target)?.data?.componentType as ComponentType | undefined;

  const arch = state?.detectedArchitectures?.find(a => a.id === state.selectedArchitectureId);
  const currentStep = arch?.steps[state?.animationStep || 0];

  // Is this edge affected by the selected attack?
  const isAttackEdge = attackMode && selectedAttack && sourceType && targetType && (
    selectedAttack.affectedTypes.includes(sourceType) &&
    selectedAttack.affectedTypes.includes(targetType)
  );

  const isReverseStep = currentStep !== undefined && currentStep.from === targetType && currentStep.to === sourceType;
  const isActiveStep = currentStep !== undefined && (
    (currentStep.from === sourceType && currentStep.to === targetType) ||
    isReverseStep
  );

  const stepColor = currentStep?.color ?? 'blue';
  const color = isAttackEdge
    ? FLOW_COLORS.red
    : isActiveStep
      ? FLOW_COLORS[stepColor]
      : FLOW_COLORS.blue;
  const glow = isAttackEdge
    ? FLOW_GLOWS.red
    : isActiveStep
      ? FLOW_GLOWS[stepColor]
      : FLOW_GLOWS.blue;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 24,
  });

  const isActive = isActiveStep || isAttackEdge;
  const isDimmed = arch && !isActiveStep && !isAttackEdge;

  const edgeStyle = useMemo(() => ({
    stroke: color,
    strokeWidth: isActive ? 2.5 : 1.5,
    filter: isActive ? `drop-shadow(0 0 6px ${glow})` : undefined,
    transition: 'all 0.35s ease',
    opacity: isGhost ? 0.6 : (isDimmed ? 0.2 : 1),
    strokeDasharray: isGhost ? '6 6' : undefined,
  }), [color, glow, isActive, isDimmed, isGhost]);

  // Determine if this edge is part of ANY step in the selected architecture
  const isPartOfArch = arch?.steps.some(step => 
    (step.from === sourceType && step.to === targetType) ||
    (step.from === targetType && step.to === sourceType)
  );

  // If an architecture is selected, only label edges that participate in it
  const archLabel = arch 
    ? (isPartOfArch ? arch.shortName : null) 
    : (state?.detectedArchitectures?.length ? `${state.detectedArchitectures.length} possible` : null);

  const handleDeleteEdge = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdgesChange([{ type: 'remove', id }]);
  };

  return (
    <>
      {/* Glow duplicate for depth when active */}
      {isActive && (
        <path d={edgePath} fill="none" style={{
          stroke: color, strokeWidth: 10, opacity: 0.1, filter: 'blur(3px)',
        }} />
      )}

      <BaseEdge id={id} path={edgePath} style={edgeStyle} />

      {/* Animated dash travel for active edge */}
      {isActiveStep && !isAttackEdge && state?.isPlaying && (
        <>
          <path d={edgePath} fill="none" style={{
            stroke: color, strokeWidth: 2,
            strokeDasharray: '4 8',
            opacity: 0.8,
            animation: `${isReverseStep ? 'dash-flow-reverse' : 'dash-flow'} 1s linear infinite`,
          }} />
          {/* Glowing explicit data packet */}
          <circle r={6} fill={color} filter={`drop-shadow(0 0 6px ${color})`}>
            <animateMotion 
              dur="1.5s" 
              repeatCount="indefinite" 
              path={edgePath}
              keyPoints={isReverseStep ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        </>
      )}

      {/* Attack stripe for attacked edges */}
      {isAttackEdge && (
        <path d={edgePath} fill="none" style={{
          stroke: '#f87171', strokeWidth: 2,
          strokeDasharray: '4 6',
          opacity: 0.9,
          animation: 'dash-flow 0.5s linear infinite',
        }} />
      )}

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Delete button on selected edge */}
          {selected && (
            <button
              onClick={handleDeleteEdge}
              className="flex items-center justify-center w-5 h-5 rounded-full mb-1 mx-auto"
              style={{
                background: 'rgba(10,14,26,0.95)',
                border: '1.5px solid rgba(248,113,113,0.6)',
                boxShadow: '0 0 8px rgba(248,113,113,0.3)',
              }}
              title="Delete connection"
            >
              <X size={10} color="#f87171" />
            </button>
          )}

          {/* Edge label */}
          {archLabel && (
            <div
              className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}50`,
                color: isAttackEdge ? FLOW_COLORS.red : color,
                backdropFilter: 'blur(4px)',
              }}
            >
              {isAttackEdge ? '⚠ Vulnerable' : (isActiveStep ? currentStep?.label : archLabel)}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

ProtocolEdge.displayName = 'ProtocolEdge';
export default ProtocolEdge;
