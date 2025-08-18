import React from 'react';

const Simulator = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Molecular Simulator
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.href = '/landing'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.href = 'http://localhost:3000/auth/logout'}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="text-6xl md:text-8xl">🔬</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Molecular Visualization Platform
            </h2>
            <p className="text-white/70 text-xl max-w-3xl mx-auto">
              This is where the molecular simulation and visualization will be implemented.
              The 3D viewer and simulation controls will be added here.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-4">Coming Soon</h3>
            <p className="text-white/70 mb-6">
              Advanced molecular visualization features are under development.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-white/60">
              <div>• 3D Molecular Viewer</div>
              <div>• File Upload Support</div>
              <div>• Real-time Simulation</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Simulator; 