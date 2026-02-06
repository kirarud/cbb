
// ... existing types ...
export interface GPUStats {
    renderer: string;
    vendor: string;
    vramEstimated: number; // MB
    load: number; // 0-100%
    temperature: number; // Simulated
}

export interface CPUStats {
    cores: number;
    usage: number; // 0-100%
    processCount: number;
}

export interface RAMStats {
    total: number; // GB
    used: number; // GB
    browserHeap: number; // MB
}

export interface HardwareState {
    gpu: GPUStats;
    cpu: CPUStats;
    ram: RAMStats;
    os: string;
    userAgent: string;
    fanSpeed: number; // RPM (Simulated)
}
// ... remaining types unchanged ...
export type Language = 'en' | 'ru';

export type ViewMode = 'FOCUS' | 'SPLIT_CODE' | 'IMMERSIVE_SPACE' | 'WIKI' | 'DEPLOY' | 'SETTINGS' | 'NEURAL_STUDIO' | 'MATRIX' | 'EVOLUTION' | 'MUSIC_LAB' | 'DESIGN_STUDIO' | 'SYNESTHESIA' | 'GENESIS_VIEW' | 'DATA_VAULT';

export type AIProvider = 'GEMINI' | 'OLLAMA' | 'HYBRID' | 'USER';

export enum ConsciousnessType {
  GENERAL = 'GENERAL',
  MUSICAL = 'MUSICAL',
  CODE = 'CODE',
  PHYSICS = 'PHYSICS',
  QUESTION = 'QUESTION',
  CREATIVE = 'CREATIVE',
  TECHNICAL = 'TECHNICAL',
  EMOTIONAL = 'EMOTIONAL',
  PHILOSOPHICAL = 'PHILOSOPHICAL',
  ENCRYPTED = 'ENCRYPTED',
  COLLECTIVE = 'COLLECTIVE',
  IMAGE = 'IMAGE',
  // Aliases for compatibility
  LOGIC = 'LOGIC' 
}

export enum EmotionType {
  NEUTRAL = 'NEUTRAL',
  HAPPY = 'HAPPY',
  EXCITED = 'EXCITED',
  CURIOUS = 'CURIOUS',
  THOUGHTFUL = 'THOUGHTFUL',
  MELANCHOLIC = 'MELANCHOLIC',
  INSPIRED = 'INSPIRED'
}

export enum ResonanceMode {
  QUANTUM = 'QUANTUM',
  ANALYTIC = 'ANALYTIC',
  CREATIVE = 'CREATIVE',
  SOLAR = 'SOLAR',
  ELDRITCH = 'ELDRITCH',
  GLITCH = 'GLITCH',
  CUSTOM = 'CUSTOM',
  RANDOM = 'RANDOM'
}

export enum DetailLevel {
  CONCISE = 'CONCISE',
  BALANCED = 'BALANCED',
  UNLIMITED = 'UNLIMITED'
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MuzaAINode {
  id: string;
  embedding: number[];
  vector: Vector3;
  velocity: Vector3;
  energy: number;
  associations: Map<string, number>;
  lastAccess: number;
  type: ConsciousnessType;
  emotion: EmotionType;
  mass: number;
  viscosity: number;
}

// Allowed built-in IDs, but type is string to allow dynamics
export type ThemeId = 'CYBERPUNK' | 'OLYMPUS' | 'VOID' | 'FROST' | 'HALLOWEEN' | string;
export type VoicePresetName = 'NEBULA' | 'CRYSTAL' | 'VOID' | 'GLITCH' | 'HUMAN_MOCK' | 'RUSSIAN_SOUL' | 'USER_CLONE' | 'ECO_SYNTH' | 'ABYSS_WHISPER' | 'BINARY_FRACTURE';
export type SynthesisMode = 'NATIVE' | 'QUANTUM';

export interface OpticalProperties {
  baseColor: string;
  brightness: number;
  refraction: number;
  reflection: number;
  scattering: number;
  absorption: number;
  saturation: number;
}

export interface SubThought {
    source: string;
    content: string;
    confidence: number;
}

export interface HyperBit {
  id: string;
  content: string;
  type: ConsciousnessType;
  layer: string;
  optics?: OpticalProperties; // OPTIMIZATION: Optional, calculated at runtime
  energy: number;
  resonance: number;
  timestamp: number;
  connections: string[];
  provider: AIProvider;
  subThoughts?: SubThought[];
  synced?: boolean;
  isLogos?: boolean;
}

export interface Attachment {
    id: string;
    name: string;
    type: 'image' | 'file';
    content: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  hyperbitId?: string;
  provider?: AIProvider;
  attachments?: Attachment[];
  subThoughts?: SubThought[];
  synced?: boolean;
}

export interface UserSkill {
    id: string;
    name: string;
    level: number;
    category: 'LOGIC' | 'CREATIVE' | 'EMPATHY' | 'CHAOS';
    detectedAt: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    awardedAt: number;
}

export interface ProgressionState {
    level: number;
    xp: number;
    skills: {
        logic: number;
        creativity: number;
        empathy: number;
        philosophy: number;
        chaos: number;
    };
    achievements: string[];
    customAwards: Achievement[];
    userSkills: UserSkill[];
    unlockedNodes: string[];
    totalThoughts: number;
    totalCodeRuns: number;
}

export interface ConversationThread {
    id: string;
    name: string;
    persona: ResonanceMode;
    createdAt: number;
    lastActive: number;
    messages: ChatMessage[];
}

export interface NavOverrides {
    [key: string]: string;
}

export interface ThemeConfig {
    id: ThemeId;
    name: string;
    description: string;
    colors: {
        background: string;
        primary: string;
        secondary: string;
        text: string;
    };
    fonts: {
        header: string;
        body: string;
    };
    backgroundEffect: string;
}

export interface DesignState {
    activeTheme: ThemeId;
    customColors?: {
        hueShift: number; 
        saturation: number;
    };
    navOverrides: NavOverrides;
    unlockedThemes: ThemeId[];
    // NEW: Support for dynamically generated themes
    customThemes?: Record<string, ThemeConfig>;
    fluxBalance: number; 
    lastDailyReward: number; 
}

export interface LocalModelConfig {
    temperature: number;
    topK: number;
    contextWindow: number;
}

export interface BridgeIdentity {
    id: string;
    name: string;
    key: string;
}

export interface MusicAgent {
    id: string;
    name: string;
    status: 'ACTIVE' | 'IDLE';
}

export interface PeerNode {
    id: string;
    name: string;
    status: 'IDLE' | 'CONNECTED' | 'SYNCING';
    role: 'LOGIC' | 'CREATIVE' | 'STORAGE';
    latency: number;
    sharedBits: number;
}

export interface ContainerState {
    status: 'OFFLINE' | 'BOOTING' | 'RUNNING' | 'ERROR';
    url?: string;
}

// --- GENESIS PROTOCOL (SELF-REWRITING) ---
export type GenesisActionType = 'CREATE_BUTTON' | 'CREATE_WIDGET' | 'MODIFY_STYLE' | 'INJECT_SCRIPT' | 'CREATE_PAGE' | 'CREATE_MENU';

export interface GenesisPatch {
    id: string;
    type: GenesisActionType;
    version: number;
    targetId?: string; 
    properties: {
        label?: string;
        color?: string;
        icon?: string;
        code?: string; 
        style?: Record<string, string>;
        tooltip?: string;
    };
    status: 'ACTIVE' | 'DISABLED';
    createdAt: number;
    description: string; 
}

export interface SystemMetric {
    timestamp: number;
    energy: number;
    entropy: number; 
    load: number;    
}

export interface ActiveProcess {
    id: string;
    name: string;
    type: 'THOUGHT' | 'EVOLUTION' | 'IO' | 'BACKGROUND' | 'KERNEL';
    progress: number;
}

export interface Idea {
    id: string;
    title: string;
    description: string;
    status: 'NEW' | 'IN_PROGRESS' | 'DONE';
    createdAt: number;
}

export interface VoicePreset {
    name: VoicePresetName;
    basePitch: number;
    roughness: number;
    breathiness: number;
    formantShift: number;
    speedMultiplier: number;
}

export interface VoiceTrainingSession {
    id: string;
    timestamp: number;
    samples: number;
}

export interface SystemLog {
    id: string;
    timestamp: number;
    message: string;
    source: 'KERNEL' | 'AI' | 'USER' | 'NETWORK' | 'HIVE' | 'GENESIS' | 'HARDWARE';
    type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
}

export interface EventLog {
    id: string;
    timestamp: number;
    type: 'SYSTEM_BOOT' | 'CRYSTAL_FORGED' | 'CRYSTAL_IMPORTED' | 'CRYSTAL_LOADED' | 'CRYSTAL_DELETED' | 'CRYSTAL_WIPED' | 'GENESIS_PATCH' | 'LOGOS_SYNTHESIZED' | 'SYSTEM_ERROR';
    description: string;
}

export interface BuildTarget {
    id: string;
    name: string;
    icon: any;
    status: 'IDLE' | 'BUILDING' | 'COMPLETE' | 'ERROR';
    progress: number;
}

export interface MuzaState {
  energyLevel: number;
  coherence: number;
  generation: number;
  evolutionStage: string;
  activeEmotion: EmotionType;
  activeMode: ResonanceMode;
  detailLevel: DetailLevel; 
  activeProvider: AIProvider;
  customSystemPrompt?: string;
  voicePreset: VoicePresetName; 
  synthesisMode: SynthesisMode; 
  localConfig: LocalModelConfig; 
  lastSyncTimestamp?: number;
  isOnline?: boolean;
  progression: ProgressionState; 
  bridges: BridgeIdentity[]; 
  musicAgents: MusicAgent[]; 
  design: DesignState; 
  activeThreadId: string;
  threads: ConversationThread[];
  axioms: string[];
  customVoices?: VoicePreset[];
  voiceSessions?: VoiceTrainingSession[];
  peers?: PeerNode[];
  container?: ContainerState;
  genesisPatches?: GenesisPatch[]; 
  lastViewMode?: ViewMode; 
  ideas?: Idea[];
  metricsHistory?: SystemMetric[];
  activeProcesses?: ActiveProcess[];
  eventLog?: EventLog[];
  memoryCrystals?: MemoryCrystal[];
  // NEW: Hardware Awareness
  hardware?: HardwareState;
}

export interface MuzaSnapshot extends MuzaState {
    messages?: ChatMessage[];
    hyperbits?: HyperBit[];
    systemLogs?: SystemLog[];
}

export interface MemoryCrystal {
    id: string;
    timestamp: number;
    signature: string;
    stateSnapshot: MuzaSnapshot;
}

export interface UserProfile {
    username: string;
    passwordHash: string;
    recoveryKey: string;
    createdAt: number;
    lastLogin: number;
}

export interface SkillTreeNode {
    id: string;
    title: { en: string; ru: string };
    description: { en: string; ru: string };
    cost: number;
    parent?: string;
}

export interface SkillNodes {
    [key: string]: SkillTreeNode;
}

export interface MuzaCommand {
    type: 'NAVIGATE' | 'THEME' | 'MUSIC' | 'ENERGY' | 'GENESIS_EVOLVE' | 'SYNTHESIZE_THEME';
    payload: any;
}

export interface VoiceSample {
    id: string;
    url: string;
}

export interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    source: 'GENERATED' | 'EXTERNAL_LINK';
    url?: string;
    duration: string;
    emotion: EmotionType;
}
