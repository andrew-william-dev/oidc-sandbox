import React, { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  useReactFlow,
  useStore,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  type NodeTypes,
  type EdgeTypes,
  type OnConnect,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ComponentNode from './ComponentNode';
import ProtocolEdge from './ProtocolEdge';
import { useCanvasStore } from '../../store/canvasStore';
import { useFlowStore } from '../../store/flowStore';
import { useArchitectureDetector } from '../../hooks/useArchitectureDetector';
import type { ComponentType } from '../../data/components';
import { COMPONENT_DEFS } from '../../data/components';

const nodeTypes: NodeTypes = {
  component: ComponentNode as NodeTypes['component'],
};
const edgeTypes: EdgeTypes = { protocol: ProtocolEdge };

let nodeIdCounter = 1;

/**
 * Dynamically draws styled bounding boxes around sets of components
 * based on the architectural pattern to visually denote trust zones.
 */
interface BoundaryBoxProps {
  typesToWrap: ComponentType[];
  subgraphNodeIds: string[];
  label: string;
  icon: string;
  borderColor: string;
  bgColor: string;
  pulse?: boolean;
}

function BoundaryBox({ typesToWrap, subgraphNodeIds, label, icon, borderColor, bgColor, pulse }: BoundaryBoxProps) {
  const nodes = useStore((s) => s.nodeLookup);
  const transform = useStore((s) => s.transform);

  // Find all nodes that match the requested types AND are in the target subgraph
  const nodesToWrap = Array.from(nodes.values()).filter(n => 
    subgraphNodeIds.includes(n.id) &&
    typesToWrap.includes((n.data as any).componentType)
  );

  // Ensure all required types for this boundary are actually on the board
  const hasAllTypes = typesToWrap.every(type => 
    nodesToWrap.some(n => (n.data as any).componentType === type)
  );
  if (!hasAllTypes) return null;

  const getX = (n: any) => n.positionAbsolute?.x ?? n.position.x;
  const getY = (n: any) => n.positionAbsolute?.y ?? n.position.y;
  const getW = (n: any) => n.measured?.width ?? 168;
  const getH = (n: any) => n.measured?.height ?? 100;

  const padding = 32;
  const minX = Math.min(...nodesToWrap.map(getX)) - padding;
  const minY = Math.min(...nodesToWrap.map(getY)) - padding - 24; // Extra top space for the badge

  const maxX = Math.max(...nodesToWrap.map(n => getX(n) + getW(n))) + padding;
  const maxY = Math.max(...nodesToWrap.map(n => getY(n) + getH(n))) + padding;

  const width = maxX - minX;
  const height = maxY - minY;
  const [tx, ty, tZoom] = transform;

  // Deriving text/glow colors from the provided border color
  // e.g. "rgba(74, 222, 128, 0.4)" -> "rgba(74, 222, 128, 1)"
  const sharpColor = borderColor.replace(/0\.\d+\)/, '1)');
  const dimBorderColor = borderColor.replace(/0\.\d+\)/, '0.3)');
  const glowShadowColor = borderColor.replace(/0\.\d+\)/, '0.1)');

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${minX * tZoom + tx}px, ${minY * tZoom + ty}px) scale(${tZoom})`,
        width: `${width}px`,
        height: `${height}px`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        borderRadius: '24px',
        border: `2px dashed ${borderColor}`,
        backgroundColor: bgColor,
        zIndex: 0,
      }}
    >
      <div 
        className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0a0e1a] px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 whitespace-nowrap"
        style={{
          color: sharpColor,
          borderColor: dimBorderColor,
          boxShadow: `0 0 15px ${glowShadowColor}`
        }}
      >
        <span className={pulse ? "animate-pulse" : ""}>{icon}</span> {label}
      </div>
    </div>
  );
}

function BoundariesManager() {
  const subgraphs = useCanvasStore(s => s.subgraphs);
  const subgraphState = useFlowStore(s => s.subgraphState);
  const edges = useCanvasStore(s => s.edges);
  
  return (
    <>
      {subgraphs.map(subgraph => {
        const state = subgraphState[subgraph.id];
        const archId = state?.selectedArchitectureId;
        
        // Is Web API physically wired to Database within this subgraph?
        const hasDbEdge = edges.some(e => 
          subgraph.edgeIds.includes(e.id) && 
          ((e.source.includes('web-api') && e.target.includes('database')) ||
           (e.source.includes('database') && e.target.includes('web-api')))
        );

        // Is Web API physically wired to External API within this subgraph?
        const hasS2SEdge = edges.some(e => 
          subgraph.edgeIds.includes(e.id) && 
          ((e.source.includes('web-api') && e.target.includes('external-api')) ||
           (e.source.includes('external-api') && e.target.includes('web-api')))
        );

        return (
          <React.Fragment key={subgraph.id}>
            {archId === 'auth-code-bff' && (
              <BoundaryBox 
                typesToWrap={['spa', 'web-api']}
                subgraphNodeIds={subgraph.nodeIds}
                label="BFF Architecture Boundary"
                icon="🛡️"
                borderColor="rgba(74, 222, 128, 0.4)"
                bgColor="rgba(74, 222, 128, 0.05)"
              />
            )}
            {hasS2SEdge && (
              <BoundaryBox 
                typesToWrap={['web-api', 'external-api']}
                subgraphNodeIds={subgraph.nodeIds}
                label="Server-to-Server Zone"
                icon="🔌"
                borderColor="rgba(167, 139, 250, 0.5)"
                bgColor="rgba(167, 139, 250, 0.05)"
              />
            )}
            {archId === 'implicit-flow' && (
              <BoundaryBox 
                typesToWrap={['browser', 'spa']}
                subgraphNodeIds={subgraph.nodeIds}
                label="Danger: Token Leakage Boundary"
                icon="⚠️"
                pulse={true}
                borderColor="rgba(248, 113, 113, 0.6)"
                bgColor="rgba(248, 113, 113, 0.08)"
              />
            )}
            {hasDbEdge && (
              <BoundaryBox 
                typesToWrap={['web-api', 'database']}
                subgraphNodeIds={subgraph.nodeIds}
                label="Private Subnet"
                icon="🗄️"
                borderColor="rgba(148, 163, 184, 0.4)"
                bgColor="rgba(148, 163, 184, 0.05)"
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default function CanvasWrapper() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, subgraphs, setActiveSubgraph } = useCanvasStore();
  const { openPanel, subgraphState } = useFlowStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Compute ghost edges per active subgraph step where connection doesn't exist
  const displayEdges = useMemo(() => {
    let finalEdges = [...edges];

    subgraphs.forEach(subgraph => {
      const state = subgraphState[subgraph.id];
      if (!state || !state.selectedArchitectureId) return;

      const arch = state.detectedArchitectures.find(a => a.id === state.selectedArchitectureId);
      if (!arch) return;
      
      const currentStep = arch.steps[state.animationStep];
      if (!currentStep) return;

      const subgraphNodes = nodes.filter(n => subgraph.nodeIds.includes(n.id));

      // See if an edge already exists representing this connection in this subgraph
      const hasEdge = edges.some(e => {
        if (!subgraph.edgeIds.includes(e.id)) return false;
        const sNode = subgraphNodes.find(n => n.id === e.source);
        const tNode = subgraphNodes.find(n => n.id === e.target);
        if (!sNode || !tNode) return false;
        const sType = (sNode.data as any).componentType;
        const tType = (tNode.data as any).componentType;
        return (sType === currentStep.from && tType === currentStep.to) ||
               (sType === currentStep.to && tType === currentStep.from);
      });

      if (hasEdge || currentStep.from === currentStep.to) return;

      // Missing edge! Find actual node IDs within the subgraph to draw a ghost connection
      const fromNode = subgraphNodes.find(n => (n.data as any).componentType === currentStep.from);
      const toNode = subgraphNodes.find(n => (n.data as any).componentType === currentStep.to);

      if (fromNode && toNode) {
        const ghostEdge = {
          id: `ghost-${subgraph.id}-${currentStep.from}-${currentStep.to}`,
          source: fromNode.id,
          target: toNode.id,
          type: 'protocol',
          animated: true,
          selectable: false,
          focusable: false,
          data: { isGhost: true }
        };
        finalEdges.push(ghostEdge as any); // Inject ghost
      }
    });

    return finalEdges;
  }, [edges, nodes, subgraphs, subgraphState]);

  // Wire up architecture detector
  useArchitectureDetector();

  const handleConnect: OnConnect = useCallback((connection) => {
    onConnect(connection);
    openPanel('system-context', { tab: 'architecture' });
  }, [onConnect, openPanel]);

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;

    const sourceCType = (sourceNode.data as any).componentType as string;
    const targetCType = (targetNode.data as any).componentType as string;

    // Normalize pair order to easily match against forbidden list
    const pair = [sourceCType, targetCType].sort().join('-');

    const forbiddenPairs = [
      // 1. A component cannot connect to itself (e.g. two SPAs, two Web APIs)
      'web-api-web-api',
      'spa-spa',
      'browser-browser',
      'mobile-mobile',
      'idp-idp',
      'database-database',
      'external-api-external-api',

      // 2. Direct database access from frontend is forbidden
      'browser-database',
      'spa-database',
      'mobile-database',
      'external-api-database',

      // 3. Browser bypasses not making architectural sense
      'browser-external-api',
      'browser-web-api',
    ];

    return !forbiddenPairs.includes(pair);
  }, [nodes]);

  // Drop from palette
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('application/oidc-component') as ComponentType;
    if (!componentType) return;

    // Use React Flow's coordinate mapping to precisely drop where the cursor is
    const position = screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });

    // Offset by roughly half the typical card size (width ~ 168, height ~ 100)
    position.x -= 84;
    position.y -= 50;

    const def = COMPONENT_DEFS[componentType];
    const id = `${componentType}-${nodeIdCounter++}`;
    addNode({
      id,
      type: 'component',
      position,
      data: {
        componentType,
        label: def.label,
      },
    });
  }, [addNode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const subgraph = subgraphs.find(s => s.nodeIds.includes(node.id));
    if (subgraph) {
      setActiveSubgraph(subgraph.id);
      openPanel('system-context', { nodeId: node.id, tab: 'architecture' });
    }
  }, [subgraphs, setActiveSubgraph, openPanel]);
  
  const onPaneClick = useCallback((_: React.MouseEvent) => {
    setActiveSubgraph(null);
  }, [setActiveSubgraph]);

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'protocol' }}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n: Node) => {
            const ct = (n.data as any)?.componentType as ComponentType;
            return COMPONENT_DEFS[ct]?.accentColor ?? '#38bdf8';
          }}
          maskColor="rgba(10,14,26,0.8)"
        />

        {/* Empty state hint */}
        {nodes.length === 0 && (
          <Panel position="top-center">
            <div className="mt-24 text-center pointer-events-none select-none">
              <div className="text-4xl mb-4">🔧</div>
              <p className="text-text-secondary text-sm font-medium">
                Drag components from the left panel onto the canvas
              </p>
              <p className="text-text-muted text-xs mt-1">
                Connect them to see available OAuth2 / OIDC architectures
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
      
      {/* Renders dynamic SVG bounding boxes over the ReactFlow canvas */}
      <BoundariesManager />
    </div>
  );
}
