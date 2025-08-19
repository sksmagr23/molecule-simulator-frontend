import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFile } from "../contexts/FileContext";

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

    camera.position.z = 20;

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
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [atoms]);

  return (
    <div className="w-full h-screen bg-black">
      <div ref={mountRef} className="w-full h-full" />
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
