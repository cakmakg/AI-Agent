import { Terminal } from 'lucide-react';
import ManualTaskPanel from './components/ManualTaskPanel';
import InboxSimulatorPanel from './components/InboxSimulatorPanel';
import { motion } from 'framer-motion';

function App() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/30 shadow-neon-blue">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Antigravity <span className="text-primary neon-text-blue">Nexus</span>
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold text-primary/70">Autonomous AI Factory Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5 shadow-glass">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success shadow-neon-blue"></span>
            </span>
            <span className="text-gray-300 font-medium">7 Sub-Agents Active</span>
          </div>
        </div>
      </motion.header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <ManualTaskPanel />
        <InboxSimulatorPanel />
      </main>

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}

export default App;
