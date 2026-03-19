import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import ComponentPalette from './components/palette/ComponentPalette';
import CanvasWrapper from './components/canvas/CanvasWrapper';
import TopBar from './components/ui/TopBar';
import FlowTimeline from './components/timeline/FlowTimeline';
import SystemContextPanel from './components/panels/SystemContextPanel';
import PacketDetailPanel from './components/panels/PacketDetailPanel';
import ConfigurationPanel from './components/panels/ConfigurationPanel';
import AttackPanel from './components/panels/AttackPanel';
import ParticleBackground from './components/background/ParticleBackground';
import { useFlowStore } from './store/flowStore';
import { useCanvasStore } from './store/canvasStore';
import { useWalkthroughTour } from './hooks/useWalkthroughTour';

function AppInner() {
  const { attackMode, subgraphState } = useFlowStore();
  const subgraphs = useCanvasStore(s => s.subgraphs);
  const nodes = useCanvasStore(s => s.nodes);
  
  // Global timeline pushes up layout if ANY subgraph has a selected architecture
  const hasTimeline = subgraphs.some(s => {
    const state = subgraphState[s.id];
    return state && state.selectedArchitectureId !== null;
  });

  useWalkthroughTour();

  // Prevent accidental data loss on refresh/close IF canvas isn't empty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (nodes.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Trigger the browser's generic "leave site?" warning
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes.length]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#0a0e1a' }}>
      {/* Top bar */}
      <TopBar />

      {/* Main area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Three.js particle background */}
        <ParticleBackground />

        {/* Palette sidebar */}
        <ComponentPalette />

        {/* Canvas + overlay panels */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ paddingBottom: hasTimeline ? 110 : 0 }}
        >
          <CanvasWrapper />

          {/* All slide-in panels (absolute within this container) */}
          <SystemContextPanel />
          <PacketDetailPanel />
          <ConfigurationPanel />
          {attackMode && <AttackPanel />}
        </div>

        {/* Timeline at bottom */}
        {hasTimeline && <FlowTimeline />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  );
}
