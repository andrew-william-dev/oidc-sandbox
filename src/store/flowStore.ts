import { create } from 'zustand';
import type { Architecture } from '../data/architectures';
import type { AttackScenario } from '../data/attacks';

export type PanelType = 'system-context' | 'packet-detail' | 'config' | 'attack-info' | null;

export interface SubgraphState {
  detectedArchitectures: Architecture[];
  selectedArchitectureId: string | null;
  animationStep: number;
  isPlaying: boolean;
}

interface FlowStore {
  // Architecture & Animation per Subgraph
  subgraphState: Record<string, SubgraphState>;
  setDetectedArchitectures: (subgraphId: string, archs: Architecture[]) => void;
  setSelectedArchitecture: (subgraphId: string, archId: string | null) => void;
  play: (subgraphId: string) => void;
  pause: (subgraphId: string) => void;
  stepForward: (subgraphId: string) => void;
  stepBack: (subgraphId: string) => void;
  resetAnimation: (subgraphId: string) => void;
  setAnimationStep: (subgraphId: string, step: number) => void;

  // Panels
  activePanel: PanelType;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedPacketStepId: string | null;
  selectedContextTab: 'architecture' | 'component' | null;
  openPanel: (panel: PanelType, context?: { nodeId?: string; edgeId?: string; packetId?: string; tab?: 'architecture' | 'component' }) => void;
  closePanel: () => void;

  // Attack mode
  attackMode: boolean;
  selectedAttack: AttackScenario | null;
  toggleAttackMode: () => void;
  setSelectedAttack: (attack: AttackScenario | null) => void;

  // New connection pending
  pendingConnectionNodeIds: string[] | null;
  setPendingConnection: (nodeIds: string[] | null) => void;
}

const defaultSubgraphState: SubgraphState = {
  detectedArchitectures: [],
  selectedArchitectureId: null,
  animationStep: 0,
  isPlaying: false,
};

const getSub = (state: any, id: string): SubgraphState => state.subgraphState[id] || defaultSubgraphState;

export const useFlowStore = create<FlowStore>((set, get) => ({
  subgraphState: {},
  setDetectedArchitectures: (subgraphId, archs) =>
    set(s => ({
      subgraphState: {
        ...s.subgraphState,
        [subgraphId]: { ...getSub(s, subgraphId), detectedArchitectures: archs }
      }
    })),
  setSelectedArchitecture: (subgraphId, archId) =>
    set(s => ({
      subgraphState: {
        ...s.subgraphState,
        [subgraphId]: { ...getSub(s, subgraphId), selectedArchitectureId: archId, animationStep: 0, isPlaying: false }
      }
    })),

  play: (subgraphId) =>
    set(s => ({
      subgraphState: {
        ...s.subgraphState,
        [subgraphId]: { ...getSub(s, subgraphId), isPlaying: true }
      }
    })),
  pause: (subgraphId) =>
    set(s => ({
      subgraphState: {
        ...s.subgraphState,
        [subgraphId]: { ...getSub(s, subgraphId), isPlaying: false }
      }
    })),
  stepForward: (subgraphId) => {
    const s = get();
    const sub = getSub(s, subgraphId);
    const arch = sub.detectedArchitectures.find(a => a.id === sub.selectedArchitectureId);
    if (!arch) return;
    const maxStep = arch.steps.length - 1;
    set({
      subgraphState: {
        ...s.subgraphState,
        [subgraphId]: { ...sub, animationStep: Math.min(sub.animationStep + 1, maxStep) }
      }
    });
  },
  stepBack: (subgraphId) =>
    set(s => {
      const sub = getSub(s, subgraphId);
      return {
        subgraphState: {
          ...s.subgraphState,
          [subgraphId]: { ...sub, animationStep: Math.max(0, sub.animationStep - 1) }
        }
      };
    }),
  resetAnimation: (subgraphId) =>
    set(s => ({
      subgraphState: {
        ...s.subgraphState,
        [subgraphId]: { ...getSub(s, subgraphId), animationStep: 0, isPlaying: false }
      }
    })),
  setAnimationStep: (subgraphId, step) =>
    set(s => ({
      subgraphState: {
        ...s.subgraphState,
        [subgraphId]: { ...getSub(s, subgraphId), animationStep: step }
      }
    })),

  // Panels
  activePanel: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedPacketStepId: null,
  selectedContextTab: null,
  openPanel: (panel, context) => set({
    activePanel: panel,
    selectedNodeId: context?.nodeId ?? null,
    selectedEdgeId: context?.edgeId ?? null,
    selectedPacketStepId: context?.packetId ?? null,
    selectedContextTab: context?.tab ?? null,
  }),
  closePanel: () => set({ activePanel: null, selectedNodeId: null, selectedEdgeId: null, selectedPacketStepId: null, selectedContextTab: null }),

  // Attack mode
  attackMode: false,
  selectedAttack: null,
  toggleAttackMode: () => set(s => ({ attackMode: !s.attackMode, selectedAttack: null })),
  setSelectedAttack: (attack) => set({ selectedAttack: attack }),

  // Pending connection
  pendingConnectionNodeIds: null,
  setPendingConnection: (nodeIds) => set({ pendingConnectionNodeIds: nodeIds }),
}));
