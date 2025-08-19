import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import { useFile } from "../contexts/FileContext";

const Landing = () => {
  const { user, logout } = useAuth();

  const [prompt, setPrompt] = useState<string>('');

  const greenButtonClass = "bg-green-900 text-green-400 border border-green-400 border-b-4 font-medium overflow-hidden relative px-4 py-3 rounded-md hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75 outline-none duration-300 group flex items-center justify-center";

  const handleLogout = async () => {
    await logout();
  };

  const { setFile } = useFile();
const navigate = useNavigate();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setFile(file);
  navigate("/simulation");
};

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(90deg, rgba(9, 76, 128, 1) 0%, rgba(0, 89, 58, 1) 65%, rgba(12, 77, 1, 1) 100%)' }}>
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-semibold text-xl">Molecular Simulator</h1>
          <div className="flex items-center gap-3 text-white/80">
            <span>{user?.displayName || 'User'}</span>
            <button onClick={handleLogout} className={`${greenButtonClass}`}>
              <span className="bg-green-400 shadow-green-400 absolute -top-[150%] left-0 inline-flex w-80 h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]"></span>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ChatGPT-like main area */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-black/10 rounded-xl border border-white/10 p-6">
          <h2 className="text-white/90 text-lg font-semibold mb-4">Describe your system</h2>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., water at boiling point"
              className="flex-1 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 px-3 outline-none"
            />
            <button disabled className={`${greenButtonClass} opacity-50 cursor-not-allowed`}>
              <span className="bg-green-400 shadow-green-400 absolute -top-[150%] left-0 inline-flex w-80 h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]"></span>
              Analyze
            </button>
          </div>
        </div>

        <div className="mt-6 bg-black/10 rounded-xl border border-white/10 p-6">
          <h2 className="text-white/90 text-lg font-semibold mb-4">Or upload a LAMMPS trajectory (.lammpstrj / .trj / .tj)</h2>
          <input id="upload-input" type="file" accept=".lammpstrj,.trj,.tj,.txt" onChange={handleFile} className="hidden" />
          <label htmlFor="upload-input" className={`${greenButtonClass} cursor-pointer w-fit`}>
            <span className="bg-green-400 shadow-green-400 absolute -top-[150%] left-0 inline-flex w-80 h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]"></span>
            Upload File
          </label>
          <p className="text-white/70 text-sm mt-3">We will animate all timesteps for you.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
