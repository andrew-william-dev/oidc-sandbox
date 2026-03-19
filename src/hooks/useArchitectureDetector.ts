import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useFlowStore } from '../store/flowStore';
import { detectArchitectures } from '../data/architectures';
import type { ComponentType } from '../data/components';

export function useArchitectureDetector() {
  const subgraphs = useCanvasStore(s => s.subgraphs);
  const nodes = useCanvasStore(s => s.nodes);
  const edges = useCanvasStore(s => s.edges);
  const setDetectedArchitectures = useFlowStore(s => s.setDetectedArchitectures);
  const openPanel = useFlowStore(s => s.openPanel);
  const activeSubgraphId = useCanvasStore(s => s.activeSubgraphId);
  const activePanel = useFlowStore(s => s.activePanel);
  
  // Track previously opened subgraphs to avoid spamming the panel open
  const promptedSubgraphs = useRef<Set<string>>(new Set());

  useEffect(() => {
    subgraphs.forEach(subgraph => {
      // 1. Get nodes exclusively for this subgraph
      const subgraphNodes = nodes.filter(n => subgraph.nodeIds.includes(n.id));
      const nodeTypes = subgraphNodes.map(n => n.data.componentType as ComponentType);

      // 2. Get edges exclusively for this subgraph
      const subgraphEdges = edges.filter(e => subgraph.edgeIds.includes(e.id));
      const edgePairs = subgraphEdges.map(e => {
        const srcNode = subgraphNodes.find(n => n.id === e.source);
        const tgtNode = subgraphNodes.find(n => n.id === e.target);
        return {
          source: srcNode?.data.componentType as ComponentType,
          target: tgtNode?.data.componentType as ComponentType,
        };
      }).filter(ep => ep.source && ep.target);

      // 3. Detect and populate flowState
      const detected = detectArchitectures(nodeTypes, edgePairs);
      setDetectedArchitectures(subgraph.id, detected);

      // 4. Auto-open architecture selection if we discovered new flows
      if (detected.length > 0 && 
          activeSubgraphId === subgraph.id && 
          !promptedSubgraphs.current.has(subgraph.id) &&
          activePanel === null) {
        promptedSubgraphs.current.add(subgraph.id);
        openPanel('system-context', { tab: 'architecture' });
      }
    });
  }, [subgraphs, nodes, edges, setDetectedArchitectures, activeSubgraphId, openPanel, activePanel]);
}
