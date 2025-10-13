// --- Type Definitions ---
type Atom = { id: number; type: number; x: number; y: number; z: number };
type Frame = Atom[];
type Bond = { atom1: number; atom2: number };

// --- Main Worker Logic ---
self.onmessage = (event: MessageEvent<string>) => {
  const fileContent = event.data;

  try {
    self.postMessage({ type: 'progress', message: 'Parsing trajectory frames...' });
    const frames = parseTrajectory(fileContent);

    if (frames.length > 0) {
      self.postMessage({ type: 'progress', message: 'Calculating bonds for the first frame...' });
      const bonds = calculateBonds(frames[0]);
      self.postMessage({ type: 'complete', frames, bonds });
    } else {
      throw new Error("No frames were parsed from the file.");
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: (error as Error).message });
  }
};

function parseTrajectory(text: string): Frame[] {
    const lines = text.trim().split("\n");
    const frames: Frame[] = [];
    let currentFrame: Atom[] = [];
    let atomCount = 0;
    let parsingAtoms = false;
    // Format detection is now more robust
    let format: 'lammpstrj' | 'xyz' | null = null;
    
    if (lines.some(line => line.includes("ITEM: TIMESTEP"))) {
        format = 'lammpstrj';
    } else if (!isNaN(parseInt(lines[0]))) {
        format = 'xyz';
    }

    for (const line of lines) {
        if (!format) continue;

        if (format === 'lammpstrj') {
            if (line.startsWith("ITEM: TIMESTEP")) {
                if (currentFrame.length > 0) frames.push(currentFrame);
                currentFrame = [];
                parsingAtoms = false;
            } else if (line.startsWith("ITEM: ATOMS")) {
                parsingAtoms = true;
            } else if (parsingAtoms && line.trim() !== "") {
                const parts = line.split(/\s+/);
                if (parts.length >= 5) {
                    const [id, type, x, y, z] = parts;
                    currentFrame.push({ id: parseInt(id), type: parseInt(type), x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) });
                }
            }
        } else if (format === 'xyz') {
            if (!isNaN(parseInt(line)) && currentFrame.length === 0) {
                if (atomCount > 0 && currentFrame.length > 0) frames.push(currentFrame);
                atomCount = parseInt(line);
                currentFrame = [];
            } else if (line.toLowerCase().includes('frame') || line.toLowerCase().includes('timestep') || atomCount === 0) {
                // Skip comment line
            } else if (line.trim() !== "" && currentFrame.length < atomCount) {
                const parts = line.split(/\s+/);
                if(parts.length >= 4) {
                    const [typeStr, x, y, z] = parts;
                    const type = isNaN(parseInt(typeStr)) ? 1 : parseInt(typeStr);
                    currentFrame.push({ id: currentFrame.length + 1, type, x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) });
                }
            }
        }
    }
    if (currentFrame.length > 0) frames.push(currentFrame);
    return frames;
}

// ... (calculateBonds function remains the same)
function calculateBonds(frame: Frame, cutoffFactor = 1.2): Bond[] {
  const bonds: Bond[] = [];
  const covalentRadii: { [key: number]: number } = { 1: 0.77, 2: 0.37, 6: 0.77, 7: 0.75, 8: 0.73, 9: 0.71, 14: 1.11, 15: 1.06, 16: 1.02 };

  for (let i = 0; i < frame.length; i++) {
    for (let j = i + 1; j < frame.length; j++) {
      const atom1 = frame[i];
      const atom2 = frame[j];
      const radius1 = covalentRadii[atom1.type] || 1.5;
      const radius2 = covalentRadii[atom2.type] || 1.5;
      const cutoff = (radius1 + radius2) * cutoffFactor;
      const dx = atom1.x - atom2.x;
      const dy = atom1.y - atom2.y;
      const dz = atom1.z - atom2.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < cutoff) {
        bonds.push({ atom1: atom1.id, atom2: atom2.id });
      }
    }
  }
  return bonds;
}