import React from 'react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Molecule Simulator
          </h1>
          <button
            onClick={() => window.location.href = 'http://localhost:3000/auth/logout'}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="text-6xl md:text-8xl">🎉</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Welcome to the Molecule Simulator!
            </h2>
            <p className="text-white/70 text-xl max-w-3xl mx-auto">
              You have successfully signed in. You now have access to our advanced molecular visualization platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-200">
              <div className="text-4xl mb-4">🧬</div>
              <h3 className="text-xl font-semibold text-white mb-2">3D Visualization</h3>
              <p className="text-white/70 text-sm">
                Explore molecular structures in interactive 3D space with advanced rendering
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-200">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Simulation</h3>
              <p className="text-white/70 text-sm">
                Run molecular dynamics simulations with real-time visualization
              </p>
            </div>
          </div>
          
          <div className="pt-8">
            <button
              onClick={() => window.location.href = '/simulator'}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
            >
              Launch Simulator
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
