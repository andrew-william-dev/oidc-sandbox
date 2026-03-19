import { useEffect, useRef, useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { ARCHITECTURES } from '../../data/architectures';

const FLOW_COLORS: Record<string, string> = {
  blue: '#38bdf8',
  orange: '#fb923c',
  green: '#4ade80',
  red: '#f87171',
  purple: '#a78bfa',
};

interface PacketPosition {
  x: number;
  y: number;
}

// Interpolate position along a bezier curve path
function getPointOnPath(pathEl: SVGPathElement, t: number): PacketPosition {
  const length = pathEl.getTotalLength();
  const pt = pathEl.getPointAtLength(t * length);
  return { x: pt.x, y: pt.y };
}

interface Props {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

import { useCanvasStore } from '../../store/canvasStore';

function SubgraphPacketAnimator({ subgraphId, svgRef }: { subgraphId: string; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const { subgraphState, setAnimationStep, pause, openPanel } = useFlowStore();
  const subgraphs = useCanvasStore(s => s.subgraphs);
  const nodes = useCanvasStore(s => s.nodes);
  const edges = useCanvasStore(s => s.edges);
  
  const state = subgraphState[subgraphId];
  const [packetPos, setPacketPos] = useState<PacketPosition | null>(null);
  const progressRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const STEP_DURATION = 1800; // ms per step

  if (!state) return null;

  const { selectedArchitectureId, animationStep, isPlaying } = state;
  const arch = ARCHITECTURES.find(a => a.id === selectedArchitectureId);
  const currentStep = arch?.steps[animationStep];

  useEffect(() => {
    if (!isPlaying || !arch || !currentStep) return;

    // Determine exact edge ID this step is animating over
    const subgraph = subgraphs.find(s => s.id === subgraphId);
    if (!subgraph) return;
    
    const subgraphNodes = nodes.filter(n => subgraph.nodeIds.includes(n.id));
    const fromNode = subgraphNodes.find(n => (n.data as any).componentType === currentStep.from);
    const toNode = subgraphNodes.find(n => (n.data as any).componentType === currentStep.to);
    
    let targetEdgeId: string | null = null;
    if (fromNode && toNode) {
      const existingEdge = edges.find(e => 
        subgraph.edgeIds.includes(e.id) &&
        ((e.source === fromNode.id && e.target === toNode.id) ||
         (e.source === toNode.id && e.target === fromNode.id))
      );
      if (existingEdge) {
        targetEdgeId = existingEdge.id;
      } else {
        targetEdgeId = `ghost-${subgraphId}-${currentStep.from}-${currentStep.to}`;
      }
    }

    if (!targetEdgeId) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(elapsed / STEP_DURATION, 1);
      progressRef.current = t;

      // Find the specific SVG path for the target edge
      if (svgRef.current) {
        const edgeGroup = svgRef.current.querySelector(`g.react-flow__edge[data-id="${targetEdgeId}"]`);
        const pathEl = edgeGroup?.querySelector<SVGPathElement>('path.react-flow__edge-path');
        if (pathEl) {
          const pos = getPointOnPath(pathEl, Math.max(0, Math.min(1, t)));
          setPacketPos(pos);
        }
      }

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Move to next step
        startTimeRef.current = 0;
        progressRef.current = 0;
        const nextStep = animationStep + 1;
        if (nextStep < arch.steps.length) {
          setAnimationStep(subgraphId, nextStep);
        } else {
          pause(subgraphId);
          setAnimationStep(subgraphId, 0);
        }
      }
    };

    startTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, animationStep, arch]);

  if (!currentStep || !packetPos || !isPlaying) return null;

  const color = FLOW_COLORS[currentStep.color] || '#38bdf8';

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Glow trail */}
      <circle
        cx={packetPos.x}
        cy={packetPos.y}
        r={14}
        fill={color}
        opacity={0.08}
      />
      {/* Main packet */}
      <circle
        cx={packetPos.x}
        cy={packetPos.y}
        r={7}
        fill={color}
        style={{
          filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color}80)`,
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
        onClick={() => openPanel('packet-detail', { packetId: currentStep.id })}
      />
      {/* Label */}
      <rect
        x={packetPos.x + 12}
        y={packetPos.y - 12}
        width={Math.min(currentStep.label.length * 6.5 + 16, 180)}
        height={22}
        rx={4}
        fill="rgba(10,14,26,0.9)"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.5}
      />
      <text
        x={packetPos.x + 20}
        y={packetPos.y + 3}
        fill={color}
        fontSize={10}
        fontFamily="JetBrains Mono, monospace"
        fontWeight={500}
      >
        {currentStep.label}
      </text>
    </g>
  );
}

export default function PacketOverlay({ svgRef }: Props) {
  const subgraphs = useCanvasStore(s => s.subgraphs);
  
  return (
    <>
      {subgraphs.map(subgraph => (
        <SubgraphPacketAnimator key={subgraph.id} subgraphId={subgraph.id} svgRef={svgRef} />
      ))}
    </>
  );
}
