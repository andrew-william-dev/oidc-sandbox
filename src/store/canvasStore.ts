import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type { ComponentType } from '../data/components';

export interface CanvasNodeData extends Record<string, unknown> {
  componentType: ComponentType;
  label: string;
}

export type CanvasNode = Node<CanvasNodeData>;
export type CanvasEdge = Edge;

export interface Subgraph {
  id: string;
  nodeIds: string[];
  edgeIds: string[];
}

interface CanvasStore {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  subgraphs: Subgraph[];
  activeSubgraphId: string | null;
  setActiveSubgraph: (id: string | null) => void;
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
  onConnect: OnConnect;
  addNode: (node: CanvasNode) => void;
  removeNode: (id: string) => void;
  clearCanvas: () => void;
}

function computeSubgraphs(nodes: CanvasNode[], edges: CanvasEdge[]): Subgraph[] {
  const adjList = new Map<string, string[]>();
  nodes.forEach(n => adjList.set(n.id, []));
  edges.forEach(e => {
    if (adjList.has(e.source) && adjList.has(e.target)) {
      adjList.get(e.source)!.push(e.target);
      adjList.get(e.target)!.push(e.source);
    }
  });

  const SHARED_TYPES = ['idp', 'browser', 'external-api', 'database'];

  // Map nodes to their types for easy lookup
  const nodeTypes = new Map<string, ComponentType>();
  nodes.forEach(n => nodeTypes.set(n.id, n.data.componentType));

  const isShared = (id: string) => SHARED_TYPES.includes(nodeTypes.get(id) || '');

  const visitedCore = new Set<string>();
  const subgraphs: Subgraph[] = [];
  
  // First pass: Group all core (non-shared) nodes into subgraphs
  for (const node of nodes) {
    if (!isShared(node.id) && !visitedCore.has(node.id)) {
      const componentNodeIds: string[] = [];
      const queue = [node.id];
      visitedCore.add(node.id);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        componentNodeIds.push(curr);
        
        for (const neighbor of adjList.get(curr) || []) {
          // If the neighbor is a SHARED node, add it to this subgraph, but do NOT queue it to traverse further
          if (isShared(neighbor)) {
            if (!componentNodeIds.includes(neighbor)) {
              componentNodeIds.push(neighbor);
            }
          } 
          // If it's a CORE node, add it to queue and mark as globally visited
          else if (!visitedCore.has(neighbor)) {
            visitedCore.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      
      // Compute edges that belong entirely to this subgraph
      const componentNodeSet = new Set(componentNodeIds);
      const componentEdgeIds = edges
        .filter(e => componentNodeSet.has(e.source) && componentNodeSet.has(e.target))
        .map(e => e.id);
        
      // Stable ID based on the alphabetically first core node ID
      const coreNodes = componentNodeIds.filter(id => !isShared(id)).sort();
      const subgraphId = coreNodes.length > 0 ? `sys-${coreNodes[0]}` : `sys-${componentNodeIds.sort()[0]}`;
      
      subgraphs.push({
        id: subgraphId,
        nodeIds: componentNodeIds,
        edgeIds: componentEdgeIds
      });
    }
  }

  // Second pass: Any completely isolated shared nodes form their own single-node subgraphs
  const nodesInAnySubgraph = new Set<string>(subgraphs.flatMap(s => s.nodeIds));
  for (const node of nodes) {
    if (isShared(node.id) && !nodesInAnySubgraph.has(node.id)) {
      subgraphs.push({
        id: `sys-${node.id}`,
        nodeIds: [node.id],
        edgeIds: []
      });
    }
  }

  return subgraphs;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  subgraphs: [],
  activeSubgraphId: null,
  setActiveSubgraph: (id) => set({ activeSubgraphId: id }),
  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: newNodes, subgraphs: computeSubgraphs(newNodes, get().edges) });
  },
  onEdgesChange: (changes) => {
    const newEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: newEdges, subgraphs: computeSubgraphs(get().nodes, newEdges) });
  },
  onConnect: (connection) => {
    const newEdges = addEdge({ ...connection, type: 'protocol', animated: false }, get().edges);
    set({ edges: newEdges, subgraphs: computeSubgraphs(get().nodes, newEdges) });
  },
  addNode: (node) => {
    const newNodes = [...get().nodes, node];
    set({ nodes: newNodes, subgraphs: computeSubgraphs(newNodes, get().edges) });
  },
  removeNode: (id) => {
    const newNodes = get().nodes.filter(n => n.id !== id);
    const newEdges = get().edges.filter(e => e.source !== id && e.target !== id);
    set({
      nodes: newNodes,
      edges: newEdges,
      subgraphs: computeSubgraphs(newNodes, newEdges)
    });
  },
  clearCanvas: () => set({ nodes: [], edges: [], subgraphs: [], activeSubgraphId: null }),
}));
