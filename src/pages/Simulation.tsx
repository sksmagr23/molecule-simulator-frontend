import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFile } from "../contexts/FileContext";
import { Link } from "react-router-dom";

type Atom = {
  id: number;
  type: number;
  x: number;
  y: number;
  z: number;
  color: string;
};

type Frame = Atom[];

const Simulation = () => {
  const { file } = useFile();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [atoms, setAtoms] = useState<Frame[]>([]);
  const [zoom, setZoom] = useState(20);

  // Parse .lammpstrj file
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const frames = parseTrajectory(text);
      setAtoms(frames);
    };
    reader.readAsText(file);
  }, [file]);

  // Three.js rendering
  useEffect(() => {
    if (!mountRef.current || atoms.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    camera.position.z = zoom;

    const spheres: THREE.Mesh[] = [];

    // Add atoms for current frame
    function loadFrame(frame: Atom[]) {
      spheres.forEach((s) => scene.remove(s));
      frame.forEach((atom) => {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: atom.color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(atom.x, atom.y, atom.z);
        scene.add(sphere);
        spheres.push(sphere);
      });
    }

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    let frame = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      if (atoms.length > 0) {
        loadFrame(atoms[frame]);
        frame = (frame + 1) % atoms.length;
      }
      camera.position.z = zoom;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [atoms, zoom]);

  useEffect(() => {
    if (!mountRef.current) return;
    const canvas = mountRef.current.querySelector("canvas");
    if (!canvas) return;
    // We'll update camera position in render loop automatically
  }, [zoom]);

  return (
    <div className="w-full h-screen bg-black">
      <Link 
  to="/landing" 
  className="inline-flex items-center gap-2 px-6 py-3 text-lg font-semibold text-white 
           bg-gradient-to-r from-blue-500 to-green-400 rounded-2xl shadow-lg 
           hover:from-blue-600 hover:to-green-500 hover:shadow-xl hover:scale-105 
           transition-all duration-300 ease-in-out"
>
  ⬅ Back to Home
</Link>

      <div ref={mountRef} className="w-[70vw] h-[70vh]" />
      <div className="absolute bottom-5 w-full flex justify-center">
        <input
          type="range"
          min="5"
          max="50"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-1/2"
        />
      </div>
    </div>
  );
};

// --- Parser for .lammpstrj ---
function parseTrajectory(text: string): Frame[] {
  const lines = text.split("\n");
  const frames: Frame[] = [];
  let currentFrame: Atom[] = [];
  let parsingAtoms = false;

  for (const line of lines) {
    if (line.startsWith("ITEM: TIMESTEP")) {
      if (currentFrame.length > 0) frames.push(currentFrame);
      currentFrame = [];
      parsingAtoms = false;
    } else if (line.startsWith("ITEM: ATOMS")) {
      parsingAtoms = true;
    } else if (parsingAtoms && line.trim() !== "") {
      const [id, type, x, y, z] = line.split(/\s+/);
      currentFrame.push({
        id: parseInt(id),
        type: parseInt(type),
        x: parseFloat(x),
        y: parseFloat(y),
        z: parseFloat(z),
        color: getColor(parseInt(type)),
      });
    }
  }
  if (currentFrame.length > 0) frames.push(currentFrame);
  return frames;
}

function getColor(type: number) {
  const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44"];
  return colors[(type - 1) % colors.length];
}

export default Simulation;
