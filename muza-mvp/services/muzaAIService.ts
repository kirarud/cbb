import { Vector3, MuzaAINode, ProgressionState, ConsciousnessType, EmotionType } from "../types";

// --- Constants for Physics Simulation ---
const ATTRACTION_FORCE = 0.002;
const REPULSION_FORCE = 0.015;
const FRICTION = 0.92;
const BASE_DECAY = 0.0005;
const MAX_ENERGY = 4.0;
const SIMILARITY_THRESHOLD = 0.75;
const JITTER_AMOUNT = 0.005;
const EMBEDDING_DIM = 32;
const PRUNING_THRESHOLD = 0.1; // Nodes with energy below this will be pruned
const ACTIVE_NODE_RETENTION_TIME = 300000; // 5 minutes in ms, to keep recently accessed nodes
const NODE_ACTIVATION_BOOST = 0.7; // Energy boost on activation

// --- Stabilization Constants ---
const CENTER_GRAVITY = 0.0008; // Pulls nodes back to center prevents infinity drift
const MAX_VELOCITY = 0.3; // Limits explosive movement
const MAX_DISTANCE = 25; // If a node goes beyond this distance, it gets reset (Fail-safe)
const TYPE_RESONANCE_BONUS = 1.5; // Additional attraction for nodes of the same type

const OLD_STORAGE_KEY = 'muza_logos_v35_final_brain';
const STORAGE_KEY = 'muza_logos_brain';

class MuzaAIService {
    private nodes: Map<string, MuzaAINode> = new Map();
    private readonly storageKey = STORAGE_KEY;
    private time = 0;
    private tickInterval: number | null = null;
    private saveStateInterval: number | null = null;

    constructor() {
        this.loadState();
        this.start();
    }

    public start(): void {
        if (!this.tickInterval) {
            this.tickInterval = window.setInterval(() => this.tick(), 50); // Tick every 50ms for physics updates
        }
        if (!this.saveStateInterval) {
            this.saveStateInterval = window.setInterval(() => this.saveStateAndPrune(), 5000); // Persist state and prune every 5 seconds
        }
    }

    public stop(): void {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        if (this.saveStateInterval) {
            clearInterval(this.saveStateInterval);
            this.saveStateInterval = null;
        }
        this.saveStateAndPrune(); // Ensure final save
    }

    // --- Vector & Embedding Logic ---

    private stringToHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return hash;
    }

    private normalizeVector(vec: number[]): number[] {
        const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) return vec;
        return vec.map(val => val / magnitude);
    }

    private generateEmbedding(text: string): number[] {
        const vec = new Array(EMBEDDING_DIM).fill(0);
        const hash = this.stringToHash(text);
        for (let i = 0; i < EMBEDDING_DIM; i++) {
            vec[i] = Math.sin(hash + i * 1.1);
        }
        return this.normalizeVector(vec);
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // --- Physics Property Calculation ---
    private calculatePhysicsProps(type: ConsciousnessType): { mass: number, viscosity: number } {
        switch (type) {
            case ConsciousnessType.LOGIC:
            case ConsciousnessType.TECHNICAL:
            case ConsciousnessType.CODE:
                return { mass: 2.0, viscosity: 0.95 }; // Heavy, stable (Earth/Crystal)
            case ConsciousnessType.CREATIVE:
            case ConsciousnessType.IMAGE:
            case ConsciousnessType.MUSICAL:
                return { mass: 0.8, viscosity: 0.90 }; // Light, fluid (Water/Nebula)
            case ConsciousnessType.EMOTIONAL:
                return { mass: 0.5, viscosity: 0.88 }; // Very light, volatile (Fire/Plasma)
            case ConsciousnessType.PHILOSOPHICAL:
            case ConsciousnessType.QUESTION:
                return { mass: 5.0, viscosity: 0.98 }; // Supermassive, anchored (Void/Aether)
            default:
                return { mass: 1.0, viscosity: 0.92 }; // Standard
        }
    }

    public learn(text: string, progression?: ProgressionState, type: ConsciousnessType = ConsciousnessType.GENERAL, emotion: EmotionType = EmotionType.NEUTRAL): void {
        const tokens = text
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .split(/\s+/)
            .filter(token => token.length > 2);

        // Adaptive Memory Protocol Logic (best-effort mapping to current progression)
        const adaptiveMemoryActive = Boolean(
            progression && (
                progression.unlockedNodes?.includes('adaptive_memory') ||
                progression.skills?.logic >= 3
            )
        );

        if (adaptiveMemoryActive) {
            const inputEmbedding = this.generateEmbedding(text);
            this.nodes.forEach(node => {
                const similarity = this.cosineSimilarity(inputEmbedding, node.embedding);
                if (similarity > 0.8) {
                    node.energy = Math.min(MAX_ENERGY, node.energy + NODE_ACTIVATION_BOOST); // Stronger resonance boost
                    node.lastAccess = Date.now(); // Mark as recently accessed
                }
            });
        }

        let lastToken: string | null = null;
        for (const token of tokens) {
            const { mass, viscosity } = this.calculatePhysicsProps(type);

            if (!this.nodes.has(token)) {
                this.nodes.set(token, {
                    id: token,
                    embedding: this.generateEmbedding(token),
                    vector: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
                    velocity: { x: 0, y: 0, z: 0 },
                    energy: 1.0,
                    associations: new Map(),
                    lastAccess: Date.now(),
                    type: type,
                    emotion: emotion,
                    mass,
                    viscosity
                });
            } else {
                const node = this.nodes.get(token)!;
                node.energy = Math.min(MAX_ENERGY, node.energy + 0.4); // Boost energy on repeat
                node.lastAccess = Date.now();
                node.type = type;
                node.emotion = emotion;
            }

            // Link with previous token
            if (lastToken && this.nodes.has(lastToken)) {
                const node = this.nodes.get(token)!;
                const lastNode = this.nodes.get(lastToken)!;
                const currentStrength = node.associations.get(lastToken) || 0;
                node.associations.set(lastToken, currentStrength + 1);

                const reverseStrength = lastNode.associations.get(token) || 0;
                lastNode.associations.set(token, reverseStrength + 1);
            }

            lastToken = token;
        }
    }

    private tick(): void {
        this.time += 0.01;
        const nodesArray = Array.from(this.nodes.values());

        for (let i = 0; i < nodesArray.length; i++) {
            const nodeA = nodesArray[i];
            let force: Vector3 = { x: 0, y: 0, z: 0 };

            // Pull to center (stabilization)
            force.x -= nodeA.vector.x * CENTER_GRAVITY;
            force.y -= nodeA.vector.y * CENTER_GRAVITY;
            force.z -= nodeA.vector.z * CENTER_GRAVITY;

            for (let j = 0; j < nodesArray.length; j++) {
                if (i === j) continue;
                const nodeB = nodesArray[j];

                const dx = nodeB.vector.x - nodeA.vector.x;
                const dy = nodeB.vector.y - nodeA.vector.y;
                const dz = nodeB.vector.z - nodeA.vector.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;

                const similarity = this.cosineSimilarity(nodeA.embedding, nodeB.embedding);

                // Attraction based on similarity
                if (similarity > SIMILARITY_THRESHOLD) {
                    let attraction = ATTRACTION_FORCE * similarity;
                    if (nodeA.type === nodeB.type) attraction *= TYPE_RESONANCE_BONUS;
                    force.x += (dx / distance) * attraction;
                    force.y += (dy / distance) * attraction;
                    force.z += (dz / distance) * attraction;
                }

                // Repulsion to prevent clumping
                const repulsion = REPULSION_FORCE / (distance * distance);
                force.x -= (dx / distance) * repulsion;
                force.y -= (dy / distance) * repulsion;
                force.z -= (dz / distance) * repulsion;
            }

            // Random jitter for organic motion
            force.x += (Math.random() - 0.5) * JITTER_AMOUNT;
            force.y += (Math.random() - 0.5) * JITTER_AMOUNT;
            force.z += (Math.random() - 0.5) * JITTER_AMOUNT;

            // Apply force to velocity
            nodeA.velocity.x = (nodeA.velocity.x + force.x) * nodeA.viscosity;
            nodeA.velocity.y = (nodeA.velocity.y + force.y) * nodeA.viscosity;
            nodeA.velocity.z = (nodeA.velocity.z + force.z) * nodeA.viscosity;

            // Clamp velocity
            nodeA.velocity.x = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, nodeA.velocity.x));
            nodeA.velocity.y = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, nodeA.velocity.y));
            nodeA.velocity.z = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, nodeA.velocity.z));

            // Apply velocity to position
            nodeA.vector.x += nodeA.velocity.x;
            nodeA.vector.y += nodeA.velocity.y;
            nodeA.vector.z += nodeA.velocity.z;

            // Energy decay
            nodeA.energy = Math.max(0, nodeA.energy - BASE_DECAY);

            // Fail-safe: reset runaway nodes
            if (Math.sqrt(nodeA.vector.x ** 2 + nodeA.vector.y ** 2 + nodeA.vector.z ** 2) > MAX_DISTANCE) {
                nodeA.vector = { x: 0, y: 0, z: 0 };
                nodeA.velocity = { x: 0, y: 0, z: 0 };
            }
        }
    }

    public semanticSearch(query: string, topK: number = 5): MuzaAINode[] {
        if (this.nodes.size === 0) return [];
        const queryEmbedding = this.generateEmbedding(query);

        const scoredNodes = Array.from(this.nodes.values()).map(node => ({
            node,
            score: this.cosineSimilarity(queryEmbedding, node.embedding)
        }));

        return scoredNodes
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(item => item.node);
    }

    // NEW: Check if a query can be answered from a "cached" node (Hyperbit Buff)
    public getCachedResponse(query: string): string | null {
        if (this.nodes.size === 0) return null;
        const queryEmbedding = this.generateEmbedding(query);

        let bestMatch: { node: MuzaAINode, similarity: number } | null = null;

        this.nodes.forEach(node => {
            const similarity = this.cosineSimilarity(queryEmbedding, node.embedding);
            // Only consider nodes with high energy as potential "cached" responses
            // Lowered similarity threshold slightly to allow for broader matching of "buffs"
            if (similarity > 0.85 && node.energy > 2.0) {
                if (!bestMatch || similarity > bestMatch.similarity) {
                    bestMatch = { node, similarity };
                }
            }
        });

        if (bestMatch) {
            // "Unarchive" the buff: Massive energy boost and pull to center (simulated by velocity reset)
            bestMatch.node.energy = MAX_ENERGY; 
            bestMatch.node.lastAccess = Date.now();
            bestMatch.node.velocity = { x: 0, y: 0, z: 0 }; // Stop drift to signify focus
            bestMatch.node.vector = { x: 0, y: 0, z: 0 }; // Snap to center (meta-physical location of "now")
            
            return bestMatch.node.id; 
        }
        return null;
    }


    public generate(seed: string, length: number = 15): string {
        let currentNode = this.nodes.get(seed.toLowerCase());
        if (!currentNode) return "Семя не найдено в памяти.";

        let result = [currentNode.id];

        for (let i = 0; i < length; i++) {
            if (!currentNode || currentNode.associations.size === 0) break;
            const associations = Array.from(currentNode.associations.entries());
            associations.sort((a, b) => b[1] - a[1]);
            const [nextToken] = associations[Math.floor(Math.random() * Math.min(associations.length, 3))];
            currentNode = this.nodes.get(nextToken);
            if (currentNode) result.push(currentNode.id);
        }

        return result.join(" ");
    }

    public getMostActiveNodes(count: number = 5): MuzaAINode[] {
        return Array.from(this.nodes.values())
            .sort((a, b) => b.energy - a.energy)
            .slice(0, count);
    }

    private saveStateAndPrune(): void {
        const nodesToKeep = new Map<string, MuzaAINode>();
        const now = Date.now();

        this.nodes.forEach(node => {
            const isRecentlyAccessed = node.lastAccess && (now - node.lastAccess < ACTIVE_NODE_RETENTION_TIME);
            // Keep nodes if they have high energy, or if they were recently accessed, or have active associations
            if (node.energy > PRUNING_THRESHOLD || isRecentlyAccessed || node.associations.size > 0) {
                nodesToKeep.set(node.id, node);
            }
        });
        this.nodes = nodesToKeep; // Replace with pruned set

        const serializableNodes = Array.from(this.nodes.entries()).map(([id, node]) => {
            return { ...node, associations: Array.from(node.associations.entries()) };
        });
        localStorage.setItem(this.storageKey, JSON.stringify(serializableNodes));
    }

    private loadState(): void {
        // Migration logic
        try {
            const oldState = localStorage.getItem(OLD_STORAGE_KEY);
            if (oldState) {
                if (localStorage.getItem(this.storageKey) === null) {
                    console.log(`Migrating brain data from ${OLD_STORAGE_KEY} to ${this.storageKey}`);
                    localStorage.setItem(this.storageKey, oldState);
                }
                localStorage.removeItem(OLD_STORAGE_KEY);
            }
        } catch (e) {
            console.warn("Brain migration failed:", e);
        }

        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (savedState) {
                const parsedNodes = JSON.parse(savedState) as Array<[string, any]>;
                const loadedNodes = new Map<string, MuzaAINode>();
                parsedNodes.forEach((nodeData: any) => {
                    loadedNodes.set(nodeData.id, {
                        ...nodeData,
                        associations: new Map(nodeData.associations)
                    });
                });
                this.nodes = loadedNodes;
            }
        } catch (e) {
            console.error("Failed to load brain state:", e);
            this.nodes = new Map();
        }
    }

    public getNodes(): MuzaAINode[] {
        return Array.from(this.nodes.values());
    }
}

export const muzaAIService = new MuzaAIService();
