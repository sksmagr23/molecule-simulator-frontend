import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useNavigate, useParams } from "react-router-dom";
import simulationService from "../services/simulationService";
import ParserWorker from '../workers/parser.worker?worker';

type Atom = { id: number; type: number; x: number; y: number; z: number };
type Frame = Atom[];
type Bond = { atom1: number; atom2: number };

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
  const [atomStyle, setAtomStyle] = useState<"CPK" | "Points">("CPK");
  const [atomScale, setAtomScale] = useState(0.3);
  const [bondScale, setBondScale] = useState(0.05);
  const [showBonds, setShowBonds] = useState(true);

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
      .catch(error => setLoadingState({ isLoading: false, message: 'Error: Could not fetch file.' }));

    return () => worker.terminate();
  }, [fileId, navigate]);

  useEffect(() => {
    if (!mountRef.current || frames.length === 0) return;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x111111);

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
    cameraZ *= 1.5;
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
      atomTypes.map(type => [type, new THREE.MeshStandardMaterial({ color: getColor(type) })])
    );
    const bondMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.2 });
    
    let lastFrameTime = 0;

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = now - lastFrameTime;
      const timePerFrame = 1000 / playbackSpeed;

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
        mesh.material = atomMaterials[atom.type]; // Ensure material is correct
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
  }, [frames, bonds, currentFrameIndex, isPlaying, playbackSpeed, atomStyle, atomScale, bondScale, showBonds]);
  
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
        <div className="absolute top-4 left-4 bg-gray-800/80 text-white p-4 rounded-lg backdrop-blur-sm border border-white/10 w-80 space-y-4 z-10">
            <h2 className="text-xl font-bold border-b border-white/20 pb-2">Simulation Controls</h2>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="bg-gray-700 px-4 py-1 rounded hover:bg-gray-600 w-24">{isPlaying ? "Pause" : "Play"}</button>
                    <span className="text-sm">Frame: {currentFrameIndex + 1} / {frames.length}</span>
                </div>
                <input type="range" min="0" max={frames.length - 1} value={currentFrameIndex} onChange={(e) => setCurrentFrameIndex(Number(e.target.value))} className="w-full"/>
                <div className="flex items-center gap-2">
                    <label className="text-sm">Speed (fps):</label>
                    <input type="range" min="1" max="60" value={playbackSpeed} onChange={(e) => setPlaybackSpeed(Number(e.target.value))} className="w-full"/>
                </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-white/20">
                <div className="flex items-center gap-2">
                    <label className="text-sm w-20">Atom Style:</label>
                    <select value={atomStyle} onChange={(e) => setAtomStyle(e.target.value as "CPK" | "Points")} className="bg-gray-700 rounded p-1 flex-1">
                        <option value="CPK">CPK</option>
                        <option value="Points">Points</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm w-20">Atom Size:</label>
                    <input type="range" min="0.1" max="1.0" step="0.05" value={atomScale} onChange={(e) => setAtomScale(Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm w-20">Bond Size:</label>
                    <input type="range" min="0.01" max="0.2" step="0.01" value={bondScale} onChange={(e) => setBondScale(Number(e.target.value))} className="w-full" />
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="showBonds" checked={showBonds} onChange={(e) => setShowBonds(e.target.checked)} />
                    <label htmlFor="showBonds" className="text-sm">Show Bonds</label>
                </div>
            </div>
            <button onClick={handleBack} className="bg-blue-700 px-3 py-2 rounded hover:bg-blue-600 w-full mt-2">Back to Landing</button>
        </div>
        <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

function getColor(type: number): string {
  const colors: { [key: number]: string } = {
      1: "#2E89F1", 2: "#F0F00A", 6: "#555555", 8: "#E74C3C", 14: "#F39C12", 15: "#FF8000", 16: "#FFFF00", 17: "#9B59B6", 35: "#A569BD", 53: "#E67E22"
  };
  return colors[type] || "#AE81FF";
}


export default Simulation;