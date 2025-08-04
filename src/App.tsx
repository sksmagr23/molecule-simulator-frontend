import { useState, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stats } from "@react-three/drei";

type Atom = {
  id: number;
  type: number;
  x: number;
  y: number;
  z: number;
};

type ColorScheme = {
  name: string;
  colors: string[];
};

type ScaleSettings = {
  atomSize: number;
  bondWidth: number;
  gridSize: number;
  gridDivisions: number;
};

const COLOR_SCHEMES: ColorScheme[] = [
  { name: "Default", colors: ["#888888", "#ff4444", "#44ff44", "#4444ff", "#ff8844"] },
  { name: "CPK", colors: ["#888888", "#ff0000", "#00ff00", "#0000ff", "#ff8800"] },
  { name: "Pastel", colors: ["#cccccc", "#ffb3b3", "#b3ffb3", "#b3b3ff", "#ffd9b3"] },
  { name: "Neon", colors: ["#ffffff", "#ff00ff", "#00ffff", "#ffff00", "#ff0080"] },
  { name: "Earth", colors: ["#8b4513", "#228b22", "#4169e1", "#dc143c", "#ffd700"] },
];

const DEFAULT_SCALE: ScaleSettings = {
  atomSize: 0.3,
  bondWidth: 0.05,
  gridSize: 10,
  gridDivisions: 10,
};

function parseLAMMPS(text: string): Atom[] {
  const lines = text.split("\n");
  const atoms: Atom[] = [];
  let readingAtoms = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("ITEM: ATOMS")) {
      readingAtoms = true;
      continue;
    }

    if (readingAtoms && line && !line.startsWith("ITEM")) {
      const parts = line.split(/\s+/).map(Number);
      if (parts.length >= 5) {
        const [id, type, x, y, z] = parts;
        atoms.push({ id, type, x, y, z });
      }
    }

    if (line.startsWith("ITEM: TIMESTEP") && atoms.length > 0) {
      break; // Only parse first timestep
    }
  }

  return atoms;
}

const AtomSphere = ({ 
  atom, 
  color, 
  size 
}: { 
  atom: Atom; 
  color: string; 
  size: number;
}) => {
  return (
    <mesh position={[atom.x, atom.y, atom.z]}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
};

const Bond = ({ 
  start, 
  end, 
  width, 
  color 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  width: number;
  color: string;
}) => {
  const direction = [
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ];
  const length = Math.sqrt(
    direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2
  );
  
  const center = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ];

  return (
    <mesh position={center as [number, number, number]}>
      <cylinderGeometry args={[width, width, length, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const MoleculeViewer = ({ 
  atoms, 
  colorScheme, 
  scale, 
  showGrid, 
  showStats,
  showBonds 
}: { 
  atoms: Atom[];
  colorScheme: ColorScheme;
  scale: ScaleSettings;
  showGrid: boolean;
  showStats: boolean;
  showBonds: boolean;
}) => {
  const bonds = useMemo(() => {
    if (!showBonds) return [];
    const bondList: Array<{start: [number, number, number], end: [number, number, number]}> = [];
    const bondDistance = scale.atomSize * 2.5;
    
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dx = atoms[i].x - atoms[j].x;
        const dy = atoms[i].y - atoms[j].y;
        const dz = atoms[i].z - atoms[j].z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < bondDistance) {
          bondList.push({
            start: [atoms[i].x, atoms[i].y, atoms[i].z],
            end: [atoms[j].x, atoms[j].y, atoms[j].z]
          });
        }
      }
    }
    return bondList;
  }, [atoms, showBonds, scale.atomSize]);

  return (
    <Canvas 
      camera={{ position: [0, 0, 30], fov: 50 }}
      style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      {showGrid && (
        <Grid 
          args={[scale.gridSize, scale.gridDivisions]} 
          cellSize={scale.gridSize / scale.gridDivisions}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={scale.gridSize / 2}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />
      )}
      
      {showBonds && bonds.map((bond, index) => (
        <Bond 
          key={`bond-${index}`}
          start={bond.start}
          end={bond.end}
          width={scale.bondWidth}
          color="#ffffff"
        />
      ))}
      
      {atoms.map((atom) => (
        <AtomSphere 
          key={atom.id}
          atom={atom} 
          color={colorScheme.colors[atom.type % colorScheme.colors.length]}
          size={scale.atomSize}
        />
      ))}
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={5}
        maxDistance={100}
      />
      
      {showStats && <Stats />}
    </Canvas>
  );
};

function App() {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(COLOR_SCHEMES[0]);
  const [scale, setScale] = useState<ScaleSettings>(DEFAULT_SCALE);
  const [showGrid, setShowGrid] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showBonds, setShowBonds] = useState(true);
  const [fileName, setFileName] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseLAMMPS(text);
    setAtoms(parsed);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-white">Molecular Visualizer</h1>
            <div className="hidden sm:block text-white/70 text-sm lg:text-base">
              {fileName ? `Loaded: ${fileName}` : "No file loaded"}
            </div>
          </div>
          <div className="text-white/70 text-sm sm:hidden">
            {fileName ? fileName : "No file"}
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Sidebar */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-80 bg-black/20 backdrop-blur-sm border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isMobile ? 'w-full sm:w-80' : ''}
        `}>
          <div className="p-4 lg:p-6 h-full overflow-y-auto">
            <div className="space-y-6">
              {/* Mobile close button */}
              <div className="flex justify-between items-center lg:hidden">
                <h2 className="text-lg font-semibold text-white">Settings</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">File Upload</h3>
                <div className="relative">
                  <input
                    type="file"
                    accept=".lammpstrj,.txt"
                    onChange={handleFile}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors"
                  />
                </div>
              </div>

              {/* Color Scheme */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Color Scheme</h3>
                <select
                  value={selectedColorScheme.name}
                  onChange={(e) => {
                    const scheme = COLOR_SCHEMES.find(s => s.name === e.target.value);
                    if (scheme) setSelectedColorScheme(scheme);
                  }}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  {COLOR_SCHEMES.map((scheme) => (
                    <option key={scheme.name} value={scheme.name}>
                      {scheme.name}
                    </option>
                  ))}
                </select>
                <div className="flex space-x-2 mt-2">
                  {selectedColorScheme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full border-2 border-white/30"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Scale Controls */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Scale Controls</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Atom Size</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={scale.atomSize}
                      onChange={(e) => setScale({...scale, atomSize: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm text-white/70">{scale.atomSize}</span>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Bond Width</label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.2"
                      step="0.01"
                      value={scale.bondWidth}
                      onChange={(e) => setScale({...scale, bondWidth: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm text-white/70">{scale.bondWidth}</span>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Grid Size</label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={scale.gridSize}
                      onChange={(e) => setScale({...scale, gridSize: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm text-white/70">{scale.gridSize}</span>
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Display Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded"
                    />
                    <span>Show Grid</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={showBonds}
                      onChange={(e) => setShowBonds(e.target.checked)}
                      className="rounded"
                    />
                    <span>Show Bonds</span>
                  </label>
                  <label className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={showStats}
                      onChange={(e) => setShowStats(e.target.checked)}
                      className="rounded"
                    />
                    <span>Show Stats</span>
                  </label>
                </div>
              </div>

              {/* Info Panel */}
              {atoms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Molecule Info</h3>
                  <div className="bg-white/10 rounded-lg p-3 space-y-1">
                    <div className="text-white/70 text-sm">Total Atoms: {atoms.length}</div>
                    <div className="text-white/70 text-sm">
                      Types: {new Set(atoms.map(a => a.type)).size}
                    </div>
                    <div className="text-white/70 text-sm">
                      Bounds: {Math.min(...atoms.map(a => a.x)).toFixed(2)} to {Math.max(...atoms.map(a => a.x)).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Viewer */}
        <div className="flex-1 relative">
          {atoms.length > 0 ? (
            <MoleculeViewer 
              atoms={atoms}
              colorScheme={selectedColorScheme}
              scale={scale}
              showGrid={showGrid}
              showStats={showStats}
              showBonds={showBonds}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 p-4">
                <div className="text-4xl sm:text-6xl text-white/30">🧬</div>
                <div className="text-white/70 text-lg sm:text-xl">
                  Upload a .lammpstrj file to visualize molecules
                </div>
                <div className="text-white/50 text-sm sm:text-base">
                  Drag and drop or click to browse files
                </div>
                <button
                  onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  Choose File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
