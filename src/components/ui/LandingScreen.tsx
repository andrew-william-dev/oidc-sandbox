import { useState } from 'react';
import { Play, ShieldAlert, Network } from 'lucide-react';

export default function LandingScreen({ onStart }: { onStart: () => void }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleStart = () => {
    setIsClosing(true);
    setTimeout(onStart, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div 
        className="max-w-2xl w-full bg-slate-900 border border-slate-700/50 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Background ambient glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[80px] rounded-full" />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-8 border border-white/10">
            <span className="text-4xl">🔐</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            OIDC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Sandbox</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            Welcome! This is an interactive scratchpad for designing, visualizing, and attacking Modern Authentication architectures.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
            <FeatureCard 
              icon={<Network className="text-blue-400" />}
              title="1. Build"
              description="Drag components from the left palette to build OAuth/OIDC flows."
            />
            <FeatureCard 
              icon={<Play className="text-orange-400" />}
              title="2. Visualize"
              description="Watch the protocol messages travel step-by-step between servers."
            />
            <FeatureCard 
              icon={<ShieldAlert className="text-red-400" />}
              title="3. Attack!"
              description="Toggle Attack Simulation from the top bar to test for XSS and logic flaws."
            />
          </div>

          <button
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-xl overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative">Got it, let's build!</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-4 border border-slate-700">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
