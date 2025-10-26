import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import simulationService from '../services/simulationService';
import moleculeImage from '/molecule.png';

const Landing = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [simulationResult, setSimulationResult] = useState<{fileId?: string, error?: string} | null>(null);
  const [mlPrompt, setMlPrompt] = useState('');
  const [inputFilePath, setInputFilePath] = useState('');
  const [simMethod, setSimMethod] = useState<'upload' | 'server'>('upload');

  const handleInputFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowModal(true);
    setStatusMessage('Uploading and processing input file...');
    setSimulationResult(null);

    try {
      const response = await simulationService.uploadAndRunInputFile(file);
      if (response.data.success) {
        setStatusMessage('Conversion complete!');
        setSimulationResult({ fileId: response.data.fileId });
      }
    } catch (error: unknown) {
      console.error("Input file processing failed:", error);
      setStatusMessage('Processing failed');
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      setSimulationResult({ 
        error: errorMessage || "Processing failed. Check your input file." 
      });
    }
  };

  const handleTrajectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setShowModal(true);
    setStatusMessage('Uploading trajectory file...');
    setSimulationResult(null);

    try {
      const response = await simulationService.uploadTrajectoryFile(file);
      if (response.data.success) {
        setStatusMessage('Upload complete!');
        setSimulationResult({ fileId: response.data.fileId });
      }
    } catch (error) {
      console.error("Trajectory upload failed:", error);
      setStatusMessage('Upload failed');
      setSimulationResult({ 
        error: "Upload failed. Please try again." 
      });
    }
  };

  const handleViewSimulation = () => {
    if (simulationResult?.fileId) {
      navigate(`/simulation/${simulationResult.fileId}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSimulationResult(null);
    setStatusMessage('');
  };

  const handleGenerateMolecule = () => {
    setStatusMessage('ML model generation is coming soon!');
    setSimulationResult({ error: 'ML Model Connection is under Progress.' });
    setShowModal(true);
  };

  const handleServerPathRun = async () => {
    if (!inputFilePath.trim()) {
      setStatusMessage('Please enter a file path');
      setSimulationResult({ error: 'Please enter a valid server file path.' });
      setShowModal(true);
      return;
    }

    setShowModal(true);
    setStatusMessage('Processing simulation...');
    setSimulationResult(null);

    try {
      const response = await simulationService.runInputFile(inputFilePath);
      if (response.data.success) {
        setStatusMessage('Conversion complete!');
        setSimulationResult({ fileId: response.data.fileId });
      }
    } catch (error: unknown) {
      console.error("Server path simulation failed:", error);
      setStatusMessage('Processing failed');
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      setSimulationResult({ 
        error: errorMessage || "Simulation failed. Check the file path." 
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1929 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 p-3 flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={moleculeImage} alt="Molecule" className="w-12 h-12" />
            <h1 className="text-sky-400 font-bold text-2xl">Molecular Simulator</h1>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <span className="font-medium">{user?.displayName || 'Guest'}</span>
            <button onClick={logout} className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 rounded-lg text-indigo-300 font-medium transition-colors cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-12 space-y-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-white font-bold text-4xl mb-3">Choose Your Simulation Method</h2>
          <p className="text-white/70 text-lg">Select how you'd like to work with molecular data</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-4 shadow-xl hover:shadow-2xl transition-all hover:border-blue-500/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-sky-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Generate Molecule</h3>
                <p className="text-white/60 text-sm">AI-powered generation</p>
              </div>
            </div>
            
            <p className="text-white/80 mb-6">Use AI to generate molecular structures from simple prompts.</p>
            
            <div className="space-y-3 mb-6">
              <label className="block text-white/80 font-medium text-sm mb-2">Enter Prompt</label>
              <textarea
                value={mlPrompt}
                onChange={(e) => setMlPrompt(e.target.value)}
                placeholder="E.g., 'Generate a benzene ring with attached methyl groups...'"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-sky-500 focus:bg-white/15 transition-all backdrop-blur"
              />
            </div>
            
            <button 
              onClick={handleGenerateMolecule}
              disabled={!mlPrompt}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-800 to-sky-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-sky-500 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Generate
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-teal-500/30 p-4 shadow-xl hover:shadow-2xl transition-all hover:border-green-500/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-700 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">Run Lammps Simulation</h3>
                <p className="text-white/60 text-sm">Upload or use file path (multiple input files)</p>
              </div>
            </div>
            
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setSimMethod('upload')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  simMethod === 'upload'
                    ? 'bg-teal-700 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setSimMethod('server')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  simMethod === 'server'
                    ? 'bg-teal-700 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Server Path
              </button>
            </div>

            {simMethod === 'upload' ? (
              <>
                <p className="text-white/80 mb-6 text-sm">Upload a LAMMPS input file. Note: Works best for standalone input files without external data dependencies.</p>
                <input 
                  id="upload-input" 
                  type="file" 
                  onChange={handleInputFileUpload} 
                  className="hidden" 
                  accept=".lmp,.in,.input"
                />
                <label 
                  htmlFor="upload-input" 
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-700 to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-emerald-600 transform transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload & Run
                </label>
              </>
            ) : (
              <>
                <p className="text-white/80 mb-4 text-sm">Enter the absolute path to your input file on the server. Use this when your input file requires additional data files in the same directory.</p>
                <div className="space-y-3">
                  <input 
                    type="text"
                    value={inputFilePath}
                    onChange={(e) => setInputFilePath(e.target.value)}
                    placeholder="/path/to/your/input.lmp"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-green-400 focus:bg-white/15 transition-all backdrop-blur"
                  />
                  <button 
                    onClick={handleServerPathRun}
                    disabled={!inputFilePath.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-teal-700 to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-teal-600 hover:to-emerald-600 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                  >
                    Run Simulation
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/10 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-8 shadow-xl hover:shadow-2xl transition-all hover:border-yellow-500/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-1">View Trajectory</h3>
                <p className="text-white/60 text-sm">Upload & visualize</p>
              </div>
            </div>
            
            <p className="text-white/80 mb-6">Upload an existing trajectory file and explore it in our advanced 3D viewer with real-time analysis.</p>
            
            <input 
              id="upload-trajectory" 
              type="file" 
              onChange={handleTrajectoryUpload} 
              className="hidden" 
              accept=".lammpstrj,.dump,.trj"
            />
            <label 
              htmlFor="upload-trajectory" 
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-700 to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-yellow-600 hover:to-amber-600 transform transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Trajectory File
            </label>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {!simulationResult ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center animate-pulse">
                    <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Processing</h3>
                    <p className="text-white/60 text-sm">Please wait...</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white/80">{statusMessage}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </>
            ) : simulationResult.error ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 bg-red-700 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Failed</h3>
                    <p className="text-white/60 text-sm">Couldn't Generate Simulation</p>
                  </div>
                </div>
                <p className="text-white/80 mb-6">{simulationResult.error}</p>
                <button onClick={handleCloseModal} className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors cursor-pointer">
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl">Complete!</h3>
                    <p className="text-white/60 text-sm">Ready to view</p>
                  </div>
                </div>
                <p className="text-white/80 mb-6">Your simulation is ready for visualization.</p>
                <div className="flex gap-3">
                  <button onClick={handleViewSimulation} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all shadow-lg cursor-pointer">
                    View Simulation
                  </button>
                  <button onClick={handleCloseModal} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors">
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;