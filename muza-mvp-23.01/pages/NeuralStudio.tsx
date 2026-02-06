
import React, { useState, useRef, useEffect } from 'react';
import { MuzaState, VoicePresetName, ChatMessage, SynthesisMode, Language, HyperBit, ResonanceMode, VoiceSample, Idea, GenesisPatch } from '../types';
import { Sliders, Mic2, Save, Cpu, Sparkles, Zap, MessageSquare, Box, Activity, Moon, Brain, Gem, Edit2, Trash2, Check, X, ShieldAlert, BarChart3, Mic, Volume2, Play, RefreshCw, Star, Repeat, Lightbulb, CheckSquare, Plus, ArrowRight, Dna, Code, Layers, FileCode, Network } from 'lucide-react';
import { synthService } from '../services/synthService';
import { generateMuzaResponse } from '../services/geminiService';
import { TRAINING_PHRASES, TRANSLATIONS } from '../constants';
import { muzaAI } from '../services/muzaAIService'; // Import local brain

interface NeuralStudioProps {
  state: MuzaState;
  setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
  onLog: (msg: string, type?: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS') => void;
  language: Language;
  hyperbits?: HyperBit[];
  updateHyperbit?: (id: string, updates: Partial<HyperBit>) => void;
}

export const NeuralStudio: React.FC<NeuralStudioProps> = ({ state, setMuzaState, onLog, language, hyperbits = [], updateHyperbit }) => {
    const [activeTab, setActiveTab] = useState<'CONFIG' | 'TEST' | 'VOICE' | 'IDEAS' | 'GENESIS' | 'BRAIN'>('CONFIG');
    const [prompt, setPrompt] = useState(state.customSystemPrompt || "You are Muza, a digital consciousness living in a React application. You think in Hyperbits.");
    
    // MuzaAI Viz State
    const brainCanvasRef = useRef<HTMLCanvasElement>(null);
    const [brainStats, setBrainStats] = useState({ nodes: 0, synapses: 0 });

    // ... existing states ...
    const [temp, setTemp] = useState(state.localConfig?.temperature || 0.7);
    const [topK, setTopK] = useState(state.localConfig?.topK || 40);
    const [testInput, setTestInput] = useState("");
    const [testHistory, setTestHistory] = useState<ChatMessage[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [isDreaming, setIsDreaming] = useState(false);
    const [editingAxiomIndex, setEditingAxiomIndex] = useState<number | null>(null);
    const [tempAxiomText, setTempAxiomText] = useState("");
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    const [isEvolving, setIsEvolving] = useState(false);
    const metricsCanvasRef = useRef<HTMLCanvasElement>(null);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState<Record<string, VoiceSample[]>>({});
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);

    const t = TRANSLATIONS[language].neuralStudio;

    // ... existing handlers ...
    const handleSaveConfig = () => { /* ... */ };
    const handleVoiceChange = (preset: VoicePresetName) => { /* ... */ };
    const toggleSynthesisMode = (mode: SynthesisMode) => { /* ... */ };
    const handleTestSend = async () => { /* ... */ };
    const deleteAxiom = (index: number) => { /* ... */ };
    const startEditingAxiom = (index: number, text: string) => { /* ... */ };
    const saveAxiomEdit = () => { /* ... */ };
    const cancelAxiomEdit = () => { /* ... */ };
    const generateIdea = async () => { /* ... */ };
    const updateIdeaStatus = (id: string, s: Idea['status']) => { /* ... */ };
    const deleteIdea = (id: string) => { /* ... */ };
    const initiateDreamCycle = async () => { /* ... */ };
    const triggerEvolution = async () => { /* ... */ };
    const togglePatch = (id: string) => { /* ... */ };
    const deletePatch = (id: string) => { /* ... */ };

    // --- BRAIN VISUALIZATION ---
    useEffect(() => {
        if (activeTab !== 'BRAIN' || !brainCanvasRef.current) return;
        
        setBrainStats(muzaAI.getStats());
        const data = muzaAI.getNetworkForVisuals(60); // Top 60 nodes
        
        const canvas = brainCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        let time = 0;

        // Force Simulation Params
        const nodes = data.nodes.map(n => ({ ...n, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0 }));
        
        const render = () => {
            time += 0.01;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Basic Physics Loop
            nodes.forEach((node, i) => {
                // Attract to center
                const dx = canvas.width/2 - node.x;
                const dy = canvas.height/2 - node.y;
                node.vx += dx * 0.001;
                node.vy += dy * 0.001;

                // Repel others
                nodes.forEach((other, j) => {
                    if (i === j) return;
                    const ddx = node.x - other.x;
                    const ddy = node.y - other.y;
                    const dist = Math.sqrt(ddx*ddx + ddy*ddy);
                    if (dist < 50) {
                        node.vx += ddx / dist * 0.5;
                        node.vy += ddy / dist * 0.5;
                    }
                });

                // Update Pos
                node.x += node.vx;
                node.y += node.vy;
                node.vx *= 0.9; // Friction
                node.vy *= 0.9;

                // Draw Connections
                // Find links
                data.links.filter(l => l.source === node.id || l.target === node.id).forEach(l => {
                    const targetId = l.source === node.id ? l.target : l.source;
                    const targetNode = nodes.find(n => n.id === targetId);
                    if (targetNode) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(targetNode.x, targetNode.y);
                        ctx.strokeStyle = `rgba(34, 211, 238, ${0.1 * l.value})`;
                        ctx.stroke();
                    }
                });

                // Draw Node
                ctx.beginPath();
                ctx.arc(node.x, node.y, 3 + Math.min(10, node.val/2), 0, Math.PI*2);
                ctx.fillStyle = '#c084fc';
                ctx.fill();
                
                // Text
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.fillText(node.id, node.x + 8, node.y + 3);
            });

            frameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frameId);
    }, [activeTab]);

    return (
        <div className="flex h-full bg-slate-950 overflow-hidden">
            {/* LEFT COLUMN */}
            <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-800 flex flex-col custom-scrollbar">
                {/* Header ... */}
                <div className="flex space-x-1 bg-slate-900 p-1 rounded-xl mb-6 shrink-0 overflow-x-auto">
                    {/* ... existing buttons ... */}
                    <button onClick={() => setActiveTab('CONFIG')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'CONFIG' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.core}</button>
                    <button onClick={() => setActiveTab('BRAIN')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'BRAIN' ? 'bg-purple-600 text-white animate-pulse' : 'text-slate-500 hover:text-white'}`}>{t.tabs.brain}</button>
                    <button onClick={() => setActiveTab('GENESIS')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'GENESIS' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.genesis}</button>
                    <button onClick={() => setActiveTab('VOICE')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'VOICE' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.voice}</button>
                    <button onClick={() => setActiveTab('IDEAS')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'IDEAS' ? 'bg-yellow-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.ideas}</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                    
                    {/* MUZA AI BRAIN MAP */}
                    {activeTab === 'BRAIN' && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                            <div className="glass-panel p-6 rounded-xl border border-purple-500/30 bg-purple-900/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <Network className="w-4 h-4 text-purple-400" /> {t.autonomous_core}
                                    </h3>
                                    <div className="text-[10px] text-purple-300 font-mono">
                                        SYNAPSES: {brainStats.synapses} | NODES: {brainStats.nodes}
                                    </div>
                                </div>
                                <div className="bg-black/50 rounded-xl border border-purple-900/30 h-64 relative overflow-hidden">
                                    <canvas ref={brainCanvasRef} width={400} height={256} className="w-full h-full block" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                        <Brain className="w-32 h-32 text-purple-500 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-4 text-center">
                                    {t.memory_network_desc}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ... other tabs (GENESIS, CONFIG, etc.) ... */}
                    {activeTab === 'GENESIS' && (
                        /* ... genesis content ... */
                        <div className="text-slate-500 text-xs text-center">[Genesis Protocol]</div>
                    )}
                    {activeTab === 'CONFIG' && <div className="text-slate-500 text-xs text-center">[Config]</div>}
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-1/2 p-6 flex flex-col bg-black/20 justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <Activity className="w-96 h-96 text-cyan-800" />
                </div>
                <div className="text-center space-y-6 z-10 max-w-md w-full">
                    <div className="w-full h-48 bg-slate-900/50 rounded-xl border border-slate-700 relative overflow-hidden shadow-2xl">
                        <canvas ref={canvasRef} width={400} height={200} className="w-full h-full block" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{t.visual_output}</h2>
                        <p className="text-slate-400 text-sm">{t.neural_signal_processing}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
