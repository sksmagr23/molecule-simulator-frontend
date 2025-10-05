import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import simulationService from '../services/simulationService';

const Landing = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleTrajectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setStatusMessage('Uploading trajectory file...');
    try {
      const response = await simulationService.uploadTrajectoryFile(file);
      if (response.data.success) {
        navigate(`/simulation/${response.data.fileId}`);
      }
    } catch (error) {
      console.error("Trajectory upload failed:", error);
      setStatusMessage("Upload failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage('Uploading and running simulation... This may take a moment.');
    try {
      const response = await simulationService.runInputFile(file);
      if (response.data.success) {
        navigate(`/simulation/${response.data.fileId}`);
      }
    } catch (error) {
      console.error("Input file simulation failed:", error);
      setStatusMessage("Simulation failed. Check the script for errors.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const greenButtonClass = "bg-green-900 text-green-400 border border-green-400 border-b-4 font-medium overflow-hidden relative px-4 py-3 rounded-md hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75 outline-none duration-300 group flex items-center justify-center";
  
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(90deg, rgba(9, 76, 128, 1) 0%, rgba(0, 89, 58, 1) 65%, rgba(12, 77, 1, 1) 100%)' }}>
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-white font-semibold text-xl">Molecular Simulator</h1>
          <div className="flex items-center gap-3 text-white/80">
            <span>{user?.displayName || 'User'}</span>
            <button onClick={logout} className={`${greenButtonClass} text-sm`}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-black/10 rounded-xl border border-white/10 p-6">
          <h2 className="text-white/90 text-2xl font-bold mb-4">Run a LAMMPS Simulation</h2>
          <p className="text-white/70 text-sm mb-4">Upload any LAMMPS input script. The simulation will run on the server.</p>
          {/* REMOVED accept attribute to allow any file */}
          <input id="upload-input" type="file" onChange={handleInputUpload} className="hidden" disabled={isProcessing} />
          <label htmlFor="upload-input" className={`${greenButtonClass} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} w-fit`}>
            {isProcessing ? 'Processing...' : 'Upload Input Script'}
          </label>
        </div>

        <div className="bg-black/10 rounded-xl border border-white/10 p-6">
          <h2 className="text-white/90 text-2xl font-bold mb-4">View a Trajectory File</h2>
          <p className="text-white/70 text-sm mb-4">Upload any trajectory file for high-performance viewing.</p>
          {/* REMOVED accept attribute to allow any file */}
          <input id="upload-trajectory" type="file" onChange={handleTrajectoryUpload} className="hidden" disabled={isProcessing} />
          <label htmlFor="upload-trajectory" className={`${greenButtonClass} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} w-fit`}>
             {isProcessing ? 'Processing...' : 'Upload Trajectory File'}
          </label>
        </div>
        
        {isProcessing && (
          <div className="text-center text-white/80 mt-4 animate-pulse">{statusMessage}</div>
        )}
      </div>
    </div>
  );
};

export default Landing;