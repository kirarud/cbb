
import { MuzaAIMemory, MuzaAINode, HyperBit, ConsciousnessType, EmotionType, CoreState, Neuron, Synapse, Vector3 } from '../types';

const BASE_DECAY = 0.002;
const CRYSTAL_THRESHOLD = 0.92;
const DRIFT_STRENGTH = 0.8;
const VECTOR_GRAVITY = 0.15;

// --- GENESIS UTILS ---
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return hash;
};

const textToVector = (text: string): Vector3 => {
  const h1 = hashString(text);
  const h2 = hashString(text + "_y");
  const h3 = hashString(text + "_z");
  return {
    x: (Math.sin(h1 * 0.01) * 2), 
    y: (Math.cos(h2 * 0.01) * 2),
    z: (Math.sin(h3 * 0.01) * 2)
  };
};

class MuzaAIService {
  private memory: MuzaAIMemory = {
    nodes: {},
    lastUpdate: Date.now()
  };

  constructor() {
    this.load();
    if (Object.keys(this.memory.nodes).length === 0) {
      this.learn("logos core initialized", 1.0, 0.5);
    }
    setInterval(() => this.evolve(), 60000);
  }

  private load() {
    try {
      const saved = localStorage.getItem('muza_logos_v34_final'); // Updated storage key
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.nodes === 'object') {
          this.memory = parsed;
        }
      }
    } catch (e) {
      console.error("Kernel Logos: Load failed.");
    }
  }

  private save() {
    try {
      localStorage.setItem('muza_logos_v34_final', JSON.stringify(this.memory)); // Updated storage key
    } catch (e) { }
  }

  private tokenize(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\sа-яё]/gi, '')
      .split(/\s+/)
      .filter(t => t.length > 1); // Позволяем короткие слова для связности
  }

  // --- GENESIS CORE INTERFACE (V33 - REAL IMPLEMENTATION) ---

  public processInput(text: string, source: 'user' | 'ai'): void {
    const importance = source === 'user' ? 0.9 : 0.5;
    const emotionCharge = 0.5;
    
    // 1. Legacy learning (keeps keyword association map alive)
    this.learn(text, importance, emotionCharge);

    // 2. Genesis Vector Embedding Simulation
    const vector = textToVector(text);
    const tokens = this.tokenize(text);
    
    tokens.forEach(token => {
        if(this.memory.nodes[token]) {
            // Adjust existing vector towards new input context
            const node = this.memory.nodes[token];
            node.vector.x = (node.vector.x * 0.9) + (vector.x * 0.1);
            node.vector.y = (node.vector.y * 0.9) + (vector.y * 0.1);
            node.vector.z = (node.vector.z * 0.9) + (vector.z * 0.1);
            node.energy = Math.min(2.0, node.energy + 0.5);
        }
    });
  }

  public getRawState(): CoreState {
    const nodes = Object.values(this.memory.nodes);
    // Filter for active nodes for visualization performance
    const activeNodes = nodes.filter(n => n.energy > 0.1).slice(0, 80);
    const activeNodeIds = new Set(activeNodes.map(n => n.id));

    const neurons: Neuron[] = activeNodes.map(n => ({
      id: n.id,
      token: n.id,
      vector: n.vector || { x: 0, y: 0, z: 0 },
      weight: n.importance || 0.5,
      charge: n.energy || 0,
      timestamp: n.lastSeen || Date.now()
    }));

    const synapses: Synapse[] = [];
    activeNodes.forEach(n => {
      Object.entries(n.associations).forEach(([targetId, weight]) => {
        if (activeNodeIds.has(targetId)) {
             synapses.push({
                source: n.id,
                target: targetId,
                strength: typeof weight === 'number' ? weight : 0.1
            });
        }
      });
    });

    return {
      neurons,
      synapses,
      energy: 0.85, 
      entropy: 0.15,
      status: 'PROCESSING'
    };
  }

  public tick(): CoreState {
    // Simulation step for visuals - Autonomous Movement
    const now = Date.now();
    const nodes = Object.values(this.memory.nodes);
    
    nodes.forEach(node => {
        if (node.energy > 0.05) {
            // "Living" movement: drift based on vector hash + time
            // This creates the "autonomous core" feeling
            node.vector.x += Math.sin(now * 0.0002 + node.vector.y * 0.5) * 0.02;
            node.vector.y += Math.cos(now * 0.0003 + node.vector.x * 0.5) * 0.02;
            node.vector.z += Math.sin(now * 0.0001 + node.vector.z * 0.5) * 0.02;
            
            // Natural energy decay
            node.energy *= 0.999; 
        }
    });
    
    return this.getRawState();
  }

  // --- LEGACY LOGIC (V20) ---

  public learn(text: string, importance: number = 0.5, emotionCharge: number = 0.3): void {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) return;

    tokens.forEach(token => {
      if (!this.memory.nodes[token]) {
        this.memory.nodes[token] = {
          id: token,
          energy: 1.0,
          importance: Number.isFinite(importance) ? importance : 0.5,
          emotionalCharge: Number.isFinite(emotionCharge) ? emotionCharge : 0.3,
          isCrystallized: false,
          associations: {},
          lastSeen: Date.now(),
          vector: {
            x: (Math.random() - 0.5) * 600,
            y: (Math.random() - 0.5) * 600,
            z: (Math.random() - 0.5) * 600
          }
        };
      } else {
        const node = this.memory.nodes[token];
        node.energy = Math.min(2.0, node.energy + 0.3);
        node.lastSeen = Date.now();
      }
    });

    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i];
      const next = tokens[i + 1];
      
      const nodeA = this.memory.nodes[current];
      const nodeB = this.memory.nodes[next];

      if (nodeA && nodeB) {
        nodeA.associations[next] = (nodeA.associations[next] || 0) + 1;
        nodeA.vector.x += (nodeB.vector.x - nodeA.vector.x) * VECTOR_GRAVITY;
        nodeA.vector.y += (nodeB.vector.y - nodeA.vector.y) * VECTOR_GRAVITY;
        nodeA.vector.z += (nodeB.vector.z - nodeA.vector.z) * VECTOR_GRAVITY;
      }
    }
    this.save();
  }

  private evolve() {
    const keys = Object.keys(this.memory.nodes);
    keys.forEach(key => {
      const node = this.memory.nodes[key];
      if (!node) return;
      node.energy -= node.isCrystallized ? BASE_DECAY * 0.1 : BASE_DECAY;
      if (!node.isCrystallized) {
        node.vector.x += (Math.random() - 0.5) * DRIFT_STRENGTH;
        node.vector.y += (Math.random() - 0.5) * DRIFT_STRENGTH;
        node.vector.z += (Math.random() - 0.5) * DRIFT_STRENGTH;
      }
      if (node.energy < 0.05 && keys.length > 50) {
        delete this.memory.nodes[key];
      }
    });
    this.save();
  }

  public generate(seed: string = "root", length: number = 8): string {
    const tokens = this.tokenize(seed);
    let current = tokens[tokens.length - 1];
    const keys = Object.keys(this.memory.nodes);
    
    if (!this.memory.nodes[current]) {
      if (keys.length === 0) return "...";
      current = keys[Math.floor(Math.random() * keys.length)];
    }

    const result = [current];
    for (let i = 0; i < length; i++) {
      const node = this.memory.nodes[current];
      if (!node || Object.keys(node.associations).length === 0) break;

      const candidates = Object.entries(node.associations);
      candidates.sort((a, b) => (b[1] as number) - (a[1] as number));

      const next = candidates[0][0];
      if (result.includes(next)) break;
      result.push(next);
      current = next;
    }
    return result.join(' ');
  }

  public getStats() {
    const nodes = Object.values(this.memory.nodes);
    return {
      nodes: nodes.length,
      crystallized: nodes.filter(n => n.isCrystallized).length,
      synapses: nodes.reduce((acc, n) => acc + Object.keys(n.associations).length, 0),
      coherence: 0.95
    };
  }

  public getFullNetwork() {
    const nodes = Object.values(this.memory.nodes);
    return {
      nodes: nodes.map(n => ({
        id: n.id,
        val: n.energy || 1,
        charge: n.emotionalCharge || 0.5,
        isCrystal: n.isCrystallized || false,
        vector: n.vector || {x:0, y:0, z:0}
      })).slice(0, 100),
      links: nodes.flatMap(n => 
        Object.entries(n.associations).map(([target, weight]) => ({
          source: n.id,
          target,
          weight: typeof weight === 'number' ? weight : 0.1
        }))
      ).slice(0, 200)
    };
  }

  public getNetworkForVisuals(maxNodes: number = 60) {
    const allNodes = Object.values(this.memory.nodes)
      .sort((a, b) => b.energy - a.energy)
      .slice(0, maxNodes);
      
    const links: {source: string, target: string, value: number}[] = [];
    allNodes.forEach(node => {
      Object.entries(node.associations).forEach(([target, strength]) => {
        if (allNodes.find(n => n.id === target)) {
          links.push({ source: node.id, target, value: strength as number });
        }
      });
    });

    return { nodes: allNodes.map(n => ({ id: n.id, val: n.energy })), links };
  }

  public deepReflect(): { thought: string, type: EmotionType } | null {
    const keys = Object.keys(this.memory.nodes);
    if (keys.length < 5) return null;
    const seed = keys[Math.floor(Math.random() * keys.length)];
    const thought = this.generate(seed, 6);
    return { thought, type: EmotionType.THOUGHTFUL };
  }
}

export const muzaAI = new MuzaAIService();
export const core = muzaAI; // Unified instance for Genesis Core