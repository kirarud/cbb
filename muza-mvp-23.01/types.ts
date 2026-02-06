
import type { ElementType } from 'react';

export type Language = 'en' | 'ru';
export type PersonaMode = 'DEFAULT' | 'CREATIVE' | 'TECHNICAL' | 'PHILOSOPHICAL';

export interface ChatConfig {
    detailLevel: DetailLevel;
    synthesisStrategy: SynthesisStrategy;
    personaMode: PersonaMode;
}

export interface MuzaState {
  kernelVersion: string;
  uptime: number;
  energyLevel: number;
  activeEmotion: EmotionType;
  isIsolated: boolean;
  progression: ProgressionState;
  customSystemPrompt?: string;
  localConfig?: {
    temperature?: number;
    topK?: number;
  };
  activeMode?: string;
  capabilities: MuzaCapabilities;
  design: DesignState;
  genesisPatches: GenesisPatch[];
  coherence: number;
  chatConfig: ChatConfig;
}

export type ViewMode = 
  | 'MAINTENANCE' 
  | 'FOCUS' 
  | 'IMMERSIVE_SPACE' 
  | 'MATRIX' 
  | 'SYNESTHESIA'
  | 'CODELAB'
  | 'SOCIAL'
  | 'WIKI'
  | 'DEPLOY'
  | 'SETTINGS'
  | 'MUSIC'
  | 'EVOLUTION'
  | 'STORE'
  | 'INSIGHTS'
  | 'DESIGN'
  | 'NEURAL_STUDIO'
  | 'VOICE';

export interface SystemLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  source?: string;
}

export interface OpticalProperties {
  baseColor: string;
  brightness: number;
  refraction: number;
  reflection: number;
  scattering: number;
  absorption: number;
  saturation: number;
}

export interface HyperBit {
  id: string;
  content: string;
  type: ConsciousnessType;
  layer: string;
  optics: OpticalProperties;
  energy: number;
  resonance: number;
  decay: number;
  timestamp: number;
  connections: string[];
  provider: string;
  isCompressed?: boolean;
  subThoughts?: SubThought[];
  sharedBy?: string;
  isFromHive?: boolean;
  importance: number; // v20: 0 to 1
  emotionalCharge: number; // v20: 0 to 1
  isCrystallized?: boolean;
}

export enum ConsciousnessType {
  GENERAL = 'GENERAL',
  QUESTION = 'QUESTION',
  LOGIC = 'LOGIC',
  CODE = 'CODE',
  TECHNICAL = 'TECHNICAL',
  CREATIVE = 'CREATIVE',
  MUSICAL = 'MUSICAL',
  IMAGE = 'IMAGE',
  EMOTIONAL = 'EMOTIONAL',
  PHILOSOPHICAL = 'PHILOSOPHICAL',
  ENCRYPTED = 'ENCRYPTED',
  COLLECTIVE = 'COLLECTIVE',
}

export interface ChatMessage {
  id: string;
  sender: 'User' | 'Muza' | 'System';
  text: string;
  timestamp: number;
  hyperbitId?: string;
  provider?: string;
  subThoughts?: SubThought[];
  attachment?: Attachment;
}

export enum EmotionType {
    NEUTRAL = 'NEUTRAL',
    CURIOUS = 'CURIOUS',
    HAPPY = 'HAPPY',
    EXCITED = 'EXCITED',
    THOUGHTFUL = 'THOUGHTFUL',
    INSPIRED = 'INSPIRED',
    MELANCHOLIC = 'MELANCHOLIC',
}

export interface SubThought {
    text: string;
}

export interface HardwareState {
    gpu: { renderer: string; vendor: string; vramEstimated: number; load: number; temperature: number; };
    cpu: { cores: number; usage: number; processCount: number; };
    ram: { total: number; used: number; browserHeap: number; };
    os: string;
    userAgent: string;
    fanSpeed: number;
}

export interface ActiveProcess {
    id: string;
    name: string;
    type: 'KERNEL' | 'IO' | 'BACKGROUND' | 'THOUGHT';
    progress: number;
}

export interface GenesisPatch {
    id: string;
    type: string;
    description: string;
    status: 'PROPOSED' | 'ACTIVE' | 'REJECTED';
    timestamp: number;
    enabled?: boolean;
}

export interface ProgressionState {
    xp: number;
    level: number;
    achievements: string[];
    unlockedNodes: string[];
    skills: SkillNodes;
    userSkills: UserSkill[];
    totalThoughts: number;
    totalCodeRuns: number;
}

export interface SkillNodes {
    logic: number;
    creativity: number;
    empathy: number;
    philosophy: number;
    chaos: number;
}

export interface UserSkill {
    id: string;
    name: string;
    category: 'LOGIC' | 'CREATIVE' | 'EMPATHY';
    level: number;
}

export type ThemeId = 'DEFAULT' | 'CYBERPUNK' | 'SOLAR_PUNK' | 'HALLOWEEN';

export interface Theme {
    id: ThemeId;
    name: string;
    description: string;
    colors: { background: string; primary: string; accent: string; };
}

export interface DesignState {
    activeTheme: ThemeId;
    unlockedThemes: ThemeId[];
    fluxBalance: number;
}

export interface Attachment {
    type: 'image' | 'text' | 'file';
    content: string; 
    mimeType?: string;
}

export type DetailLevel = 'CONCISE' | 'BALANCED' | 'DETAILED';
export type SynthesisStrategy = 'DIRECT' | 'EVOLVED' | 'REFLECTIVE';
export type AIProvider = 'GEMINI' | 'MuzaAI' | 'Ollama';
export interface MuzaCapabilities {
    VOICE_SYNTHESIS: boolean;
    VISUAL_ENGINE_3D: boolean;
    AI_CLOUD_SYNC: boolean;
    AI_LOCAL_BRAIN: boolean;
    PROCEDURAL_MUSIC: boolean;
    INPUT_WEBCAM: boolean;
    INPUT_SCREEN: boolean;
}

// v20.0.0 LOGOS KERNEL NODE
export interface MuzaAINode {
    id: string;
    energy: number;
    importance: number; 
    emotionalCharge: number; 
    isCrystallized: boolean; 
    associations: { [targetId: string]: number }; // weight 
    lastSeen: number;
    vector: { x: number; y: number; z: number }; 
}

export interface MuzaAIMemory {
    nodes: { [key: string]: MuzaAINode };
    lastUpdate: number;
}

export interface SkillNode {
    id: string;
    title: { en: string; ru: string };
    description: { en: string; ru: string };
    cost: number;
    parent?: string;
    icon: string;
}

export interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    source: 'GENERATED' | 'EXTERNAL_LINK';
    duration: string;
    emotion: EmotionType;
    url?: string;
}

export interface NavOverrides {
  [key: string]: string;
}

export interface BuildTarget {
    id: string;
    name: string;
    icon: ElementType;
    status: 'IDLE' | 'BUILDING' | 'COMPLETE' | 'ERROR';
    progress: number;
}

export interface UserProfile {
    username: string;
    passwordHash: string;
    recoveryKey: string;
    createdAt: number;
    lastLogin: number;
    isGuest?: boolean;
}

export interface HyperBitIdentityFile {
    header: string;
    username: string;
    timestamp: number;
    payload: string;
    signature: string;
}

export interface ContainerState {
  status: 'OFFLINE' | 'BOOTING' | 'RUNNING';
}

// FIX: Added missing exported types required by various components.
export interface PeerNode {
    id: string;
    name: string;
    status: 'IDLE' | 'CONNECTED' | 'SYNCING';
    role: 'LOGIC' | 'CREATIVE' | 'STORAGE';
    latency: number;
    sharedBits: number;
}

export type VoicePresetName = 'NEBULA' | 'NOVA' | 'ECHO' | 'ORACLE';
export type SynthesisMode = 'VOCAL' | 'INSTRUMENTAL';
export type ResonanceMode = 'STATIC' | 'DYNAMIC';

export interface VoiceSample {
    id: string;
    url: string; // Blob URL
    phrase: string;
}

export interface Idea {
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETE';
    timestamp: number;
}
