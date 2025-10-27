import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useNavigate, useParams } from "react-router-dom";
import simulationService from "../services/simulationService";
import ParserWorker from '../workers/parser.worker?worker';

type Atom = { id: number; type: number; x: number; y: number; z: number };
type Frame = Atom[];
type Bond = { atom1: number; atom2: number };

type ColorScheme = "CPK" | "Type" | "Charge" | "Mass" | "Element" | "Temperature" | "Velocity";

const Simulation = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const atomMeshesRef = useRef<THREE.Mesh[]>([]);
  const bondMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameIdRef = useRef<number>(0);

  const [frames, setFrames] = useState<Frame[]>([]);
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loadingState, setLoadingState] = useState({ isLoading: true, message: 'Initializing...' });
  
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [atomStyle, setAtomStyle] = useState<"CPK" | "Points" | "VDW">("CPK");
  const [atomScale, setAtomScale] = useState(0.25);
  const [bondScale, setBondScale] = useState(0.05);
  const [showBonds, setShowBonds] = useState(true);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("CPK");
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!fileId) {
      navigate('/landing');
      return;
    }
    const worker = new ParserWorker();
    worker.onmessage = (event) => {
      const { type, frames, bonds, message } = event.data;
      if (type === 'progress') setLoadingState({ isLoading: true, message });
      else if (type === 'complete') {
        setFrames(frames);
        setBonds(bonds);
        setCurrentFrameIndex(0);
        setLoadingState({ isLoading: false, message: '' });
      } else if (type === 'error') {
        setLoadingState({ isLoading: false, message: `Error: ${message}` });
      }
    };

    setLoadingState({ isLoading: true, message: 'Fetching file from server...' });
    simulationService.getTrajectoryFile(fileId)
      .then(response => {
        if (response.data.success) worker.postMessage(response.data.content);
        else throw new Error(response.data.message);
      })
      .catch(() => setLoadingState({ isLoading: false, message: 'Error: Could not fetch file.' }));

    return () => worker.terminate();
  }, [fileId, navigate]);

  useEffect(() => {
    if (!mountRef.current || frames.length === 0) return;

    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(rendererRef.current.domElement);
    
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dLight.position.set(5, 10, 7.5);
    sceneRef.current.add(dLight);
    sceneRef.current.add(new THREE.AxesHelper(5));

    const boundingBox = new THREE.Box3().setFromPoints(frames[0].map(a => new THREE.Vector3(a.x, a.y, a.z)));
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.8;
    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    controlsRef.current.target.copy(center);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      rendererRef.current?.dispose();
    };
  }, [frames]);

  useEffect(() => {
    if (!rendererRef.current || frames.length === 0) return;

    const scene = sceneRef.current!;
    const camera = cameraRef.current!;
    const renderer = rendererRef.current!;
    const controls = controlsRef.current!;

    const atomGeometry = new THREE.SphereGeometry(1, 16, 16);
    const bondGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
    const atomTypes = Array.from(new Set(frames.flat().map(a => a.type)));
    const atomMaterials = Object.fromEntries(
      atomTypes.map(type => [type, new THREE.MeshStandardMaterial({ 
        color: getColor(type, colorScheme),
        metalness: 0.3,
        roughness: 0.5
      })])
    );
    const bondMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.2 });
    
    let lastFrameTime = 0;

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = now - lastFrameTime;
      const timePerFrame = 800 / playbackSpeed;

      if (isPlaying && delta > timePerFrame) {
        lastFrameTime = now - (delta % timePerFrame);
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }

      const currentFrame = frames[currentFrameIndex] || [];
      
      currentFrame.forEach((atom, i) => {
        if (!atomMeshesRef.current[i]) {
          const mesh = new THREE.Mesh(atomGeometry, atomMaterials[atom.type]);
          scene.add(mesh);
          atomMeshesRef.current[i] = mesh;
        }
        const mesh = atomMeshesRef.current[i];
        mesh.position.set(atom.x, atom.y, atom.z);
        const scale = atomStyle === 'CPK' ? atomScale : atomScale * 0.2;
        mesh.scale.set(scale, scale, scale);
        const material = new THREE.MeshStandardMaterial({ 
          color: getColor(atom.type, colorScheme),
          metalness: 0.3,
          roughness: 0.5
        });
        mesh.material = material;
      });

      bondMeshesRef.current.forEach(mesh => (mesh.visible = showBonds));
      if (showBonds) {
        bonds.forEach((bond, i) => {
          const atom1 = currentFrame.find(a => a.id === bond.atom1);
          const atom2 = currentFrame.find(a => a.id === bond.atom2);
          if (!atom1 || !atom2) return;

          if (!bondMeshesRef.current[i]) {
            const mesh = new THREE.Mesh(bondGeometry, bondMaterial);
            scene.add(mesh);
            bondMeshesRef.current[i] = mesh;
          }
          const mesh = bondMeshesRef.current[i];
          const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
          const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
          const distance = start.distanceTo(end);
          
          mesh.position.copy(start).lerp(end, 0.5);
          mesh.scale.set(bondScale, distance, bondScale);
          mesh.lookAt(end);
          mesh.rotateX(Math.PI / 2);
        });
      }
      
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

      return () => {
        cancelAnimationFrame(animationFrameIdRef.current);
      };
  }, [frames, bonds, currentFrameIndex, isPlaying, playbackSpeed, atomStyle, atomScale, bondScale, showBonds, colorScheme]);
  
  const handleBack = () => {
      navigate('/landing');
  }

  if (loadingState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">{loadingState.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-screen bg-black flex flex-col overflow-hidden">
        {showControls && (
          <div className="absolute top-4 left-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 text-white p-4 rounded-xl backdrop-blur-xl border border-white/20 w-80 space-y-4 z-10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-xl font-bold">Controls</h2>
              <button 
                onClick={() => setShowControls(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-400 uppercase">Animation</h3>
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)} 
                  className="bg-blue-600 hover:bg-blue-700 px-2 py-2 rounded-sm font-medium transition-colors w-24 cursor-pointer"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <span className="text-sm text-white/70">Frame: {currentFrameIndex + 1} / {frames.length}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max={frames.length - 1} 
                value={currentFrameIndex} 
                onChange={(e) => setCurrentFrameIndex(Number(e.target.value))} 
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm w-24">Speed: {playbackSpeed} fps</label>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={playbackSpeed} 
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))} 
                  className="flex-1" 
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/10">
              <h3 className="text-sm font-semibold text-green-400 uppercase">Representation</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm w-24">Style:</label>
                <select 
                  value={atomStyle} 
                  onChange={(e) => setAtomStyle(e.target.value as "CPK" | "Points" | "VDW")} 
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="CPK">CPK</option>
                  <option value="Points">Points</option>
                  <option value="VDW">VDW</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm w-24">Atom Size:</label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05" 
                  value={atomScale} 
                  onChange={(e) => setAtomScale(Number(e.target.value))} 
                  className="flex-1" 
                />
                <span className="text-xs text-white/60 w-12">{atomScale.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm w-24">Bond Size:</label>
                <input 
                  type="range" 
                  min="0.01" 
                  max="0.2" 
                  step="0.01" 
                  value={bondScale} 
                  onChange={(e) => setBondScale(Number(e.target.value))} 
                  className="flex-1" 
                />
                <span className="text-xs text-white/60 w-12">{bondScale.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm w-24">Show Bonds:</label>
                <input 
                  type="checkbox" 
                  id="showBonds" 
                  checked={showBonds} 
                  onChange={(e) => setShowBonds(e.target.checked)} 
                  className="w-4 h-4"
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/10">
              <h3 className="text-sm font-semibold text-purple-400 uppercase">Color Scheme</h3>
              <select 
                value={colorScheme} 
                onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="CPK">CPK</option>
                <option value="Type">Type</option>
                <option value="Element">Element</option>
                <option value="Charge">Charge</option>
                <option value="Temperature">Temperature</option>
                <option value="Velocity">Velocity</option>
              </select>
            </div>

            <button 
              onClick={handleBack} 
              className="bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 px-4 py-3 rounded-lg font-semibold w-full mt-4 transition-all shadow-lg cursor-pointer"
            >
              ← Back
            </button>
          </div>
        )}

        {!showControls && (
          <button 
            onClick={() => setShowControls(true)}
            className="absolute top-4 left-4 bg-gradient-to-br from-gray-800 to-gray-900 text-white px-4 py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg border border-white/20 backdrop-blur-xl z-10"
          >
            ⚙️ Controls
          </button>
        )}
        <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

function getColor(type: number, scheme: ColorScheme = "CPK"): string {
  const cpkColors: { [key: number]: string } = {
    1: "#2E89F1",   // H - Blue
    2: "#F0F00A",   // He - Light Yellow
    6: "#555455",   // C - Dark Gray
    7: "#0000FF",   // N - Blue
    8: "#E74C3C",   // O - Red
    9: "#2ECC71",   // F - Green
    10: "#E67E22",  // Ne - Orange
    14: "#F39C12",  // Si - Yellow
    15: "#FF8000",  // P - Orange
    16: "#FFFF00",  // S - Yellow
    17: "#9B59B6",  // Cl - Purple
    18: "#A569BD",  // Ar - Light Purple
    35: "#5DADE2",  // Br - Light Blue
    53: "#FF69B4"   // I - Pink
  };

  const elementColors: { [key: number]: string } = {
    // Hydrogen series
    1: "#FFFFFF",   // H - White
    
    // Carbon group
    6: "#909099",   // C - Gray
    
    // Nitrogen group  
    7: "#3050F8",   // N - Royal Blue
    
    // Oxygen group
    8: "#FF0D0D",   // O - Red
    16: "#FFFF30",  // S - Yellow
    
    // Halogens
    9: "#90E050",   // F - Green Yellow
    17: "#1FF09f",  // Cl - Green
    35: "#A62929",  // Br - Dark Red
    53: "#940094"   // I - Purple
  };

  const rainbowColors = [
    "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", 
    "#0000FF", "#4B0082", "#9400D3"
  ];

  switch (scheme) {
    case "CPK":
      return cpkColors[type] || "#AE81FF";
    case "Type":
      return elementColors[type] || "#AE81FF";
    case "Element":
      return elementColors[type] || "#AE81FF";
    case "Charge": {
      // Blue for negative, red for positive
      return type < 0 ? "#FF0000" : "#0000dd";
    }
    case "Temperature": {
      const index = type % rainbowColors.length;
      return rainbowColors[index];
    }
    case "Velocity":
      return "#00FFFF";
    default:
      return cpkColors[type] || "#AE81FF";
  }
}


export default Simulation;