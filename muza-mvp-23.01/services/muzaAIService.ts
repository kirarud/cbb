
import { MuzaAIMemory, MuzaAINode, HyperBit, ConsciousnessType, EmotionType } from '../types';

const BASE_DECAY = 0.002;
const CRYSTAL_THRESHOLD = 0.92;
const DRIFT_STRENGTH = 0.8;
const VECTOR_GRAVITY = 0.15;

class MuzaAIService {
  private memory: MuzaAIMemory = {
    nodes: {},
    lastUpdate: Date.now()
  };

  constructor() {
    this.load();
    if (Object.keys(this.memory.nodes).length === 0) {
      this.learn("ядро логос инициализировано", 1.0, 0.5);
    }
    setInterval(() => this.evolve(), 60000);
  }

  private load() {
    try {
      const saved = localStorage.getItem('muza_logos_v20_1');
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
      localStorage.setItem('muza_logos_v20_1', JSON.stringify(this.memory));
    } catch (e) { }
  }

  private tokenize(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\sа-яё]/gi, '')
      .split(/\s+/)
      .filter(t => t.length > 1); // Позволяем короткие слова для связности
  }

  public learn(text: string, importance: number = 0.5, emotionCharge: number = 0.3): void {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) return;

    // Шаг 1: Гарантируем существование всех узлов
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

    // Шаг 2: Создаем связи и применяем семантическое притяжение
    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i];
      const next = tokens[i + 1];
      
      const nodeA = this.memory.nodes[current];
      const nodeB = this.memory.nodes[next];

      if (nodeA && nodeB) {
        nodeA.associations[next] = (nodeA.associations[next] || 0) + 1;
        
        // Сближение векторов
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

  public generate(seed: string = "корень", length: number = 8): string {
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
      })).slice(0, 100), // Ограничение для производительности
      links: nodes.flatMap(n => 
        Object.entries(n.associations).map(([target, weight]) => ({
          source: n.id,
          target,
          weight: typeof weight === 'number' ? weight : 0.1
        }))
      ).slice(0, 200)
    };
  }

  // FIX: Added getNetworkForVisuals method to match usage in components.
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
