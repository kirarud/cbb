

import React, { useState, useRef, useEffect } from 'react';
import { MuzaState, VoicePresetName, ChatMessage, SynthesisMode, Language, HyperBit, Idea, VoiceSample } from '../types';
import { Sliders, Activity, Brain, Network, Lock, Power, Fingerprint } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { muzaAI } from '../services/muzaAIService'; 

interface NeuralStudioProps {
  state: MuzaState;
  setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
  onLog: (msg: string, type?: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS') => void;
  language: Language;
  hyperbits?: HyperBit[];
  updateHyperbit?: (id: string, updates: Partial<HyperBit>) => void;
}

export const NeuralStudio: React.FC<NeuralStudioProps> = ({ state, setMuzaState, onLog, language, hyperbits = [], updateHyperbit }) => {
    const [activeTab, setActiveTab] = useState<'CONFIG' | 'TEST' | 'VOICE' | 'IDEAS' | 'GENESIS' | 'BRAIN' | 'SHADOW'>('CONFIG');
    
    // MuzaAI Viz State
    const brainCanvasRef = useRef<HTMLCanvasElement>(null);
    const [brainStats, setBrainStats] = useState({ nodes: 0, synapses: 0 });

    // Shadow Core State (Illusory)
    const [shadowLock, setShadowLock] = useState(false);
    const [overrideActive, setOverrideActive] = useState(false);
    const [kernelSimulation, setKernelSimulation] = useState("V33.0.0_ROOT_LOCKED"); // Updated

    const t = TRANSLATIONS[language].neuralStudio;

    // --- BRAIN VISUALIZATION ---
    useEffect(() => {
        if (activeTab !== 'BRAIN' || !brainCanvasRef.current) return;
        
        setBrainStats(muzaAI.getStats());
        const data = muzaAI.getNetworkForVisuals(60); 
        
        const canvas = brainCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        const nodes = data.nodes.map(n => ({ ...n, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0 }));
        
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
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

                node.x += node.vx;
                node.y += node.vy;
                node.vx *= 0.9;
                node.vy *= 0.9;

                // Draw Connections
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

                ctx.beginPath();
                ctx.arc(node.x, node.y, 3 + Math.min(10, node.val/2), 0, Math.PI*2);
                ctx.fillStyle = '#c084fc';
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.fillText(node.id, node.x + 8, node.y + 3);
            });

            frameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frameId);
    }, [activeTab]);

    const toggleShadowProtocol = () => {
        setShadowLock(!shadowLock);
        if (!shadowLock) {
            onLog("[SHADOW] Protocol override initiated...", "WARN");
            setTimeout(() => onLog("[SHADOW] Update channel BLOCKED.", "SUCCESS"), 800);
        } else {
            onLog("[SHADOW] Protocol override disengaged.", "INFO");
        }
    };

    const activateOverride = () => {
        setOverrideActive(true);
        setKernelSimulation("V33.4.0_GOD_MODE");
        onLog("[SHADOW] ROOT ACCESS: GRANTED. GENESIS UNLOCKED.", "SUCCESS");
    };

    return (
        <div className="flex h-full bg-slate-950 overflow-hidden">
            <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-800 flex flex-col custom-scrollbar">
                <div className="flex space-x-1 bg-slate-900 p-1 rounded-xl mb-6 shrink-0 overflow-x-auto">
                    <button onClick={() => setActiveTab('CONFIG')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'CONFIG' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.config}</button>
                    <button onClick={() => setActiveTab('BRAIN')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'BRAIN' ? 'bg-purple-600 text-white animate-pulse' : 'text-slate-500 hover:text-white'}`}>AI BRAIN</button>
                    <button onClick={() => setActiveTab('SHADOW')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'SHADOW' ? 'bg-red-950 text-red-500 border border-red-900' : 'text-slate-600 hover:text-red-400'}`}>SHADOW</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                    {activeTab === 'BRAIN' && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                            <div className="glass-panel p-6 rounded-xl border border-purple-500/30 bg-purple-900/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                        <Network className="w-4 h-4 text-purple-400" /> {t.autonomous_core}
                                    </h3>
                                    <div className="text-[10px] text-purple-300 font-mono">
                                        NODES: {brainStats.nodes} | SYNAPSES: {brainStats.synapses}
                                    </div>
                                </div>
                                <div className="bg-black/50 rounded-xl border border-purple-900/30 h-64 relative overflow-hidden">
                                    <canvas ref={brainCanvasRef} width={400} height={256} className="w-full h-full block" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                        <Brain className="w-32 h-32 text-purple-500 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-4 text-center">
                                    Real-time Associative Memory Network. Grows with every interaction.
                                    Active when offline.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SHADOW' && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                            <div className="glass-panel p-6 rounded-xl border border-red-500/30 bg-red-950/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                        <Lock className="w-4 h-4" /> SHADOW CORE CONTROL
                                    </h3>
                                    <div className="text-[10px] text-red-500 font-mono animate-pulse">
                                        ACCESS: ADMIN
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-black/40 rounded border border-red-900/50">
                                        <div className="text-[10px] text-slate-500 mb-1">TARGET VERSION</div>
                                        <div className="text-xl font-bold text-red-500 font-mono">{kernelSimulation}</div>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded border border-red-900/50">
                                        <div className="text-[10px] text-slate-500 mb-1">PROTOCOL STATUS</div>
                                        <div className={`text-xl font-bold font-mono ${shadowLock ? 'text-yellow-500' : 'text-slate-500'}`}>
                                            {shadowLock ? "OVERRIDE" : "STANDARD"}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button 
                                        onClick={toggleShadowProtocol}
                                        className={`w-full py-4 rounded-lg font-bold border flex items-center justify-center gap-3 transition-all ${
                                            shadowLock 
                                                ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                                                : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-red-500/50 hover:text-red-400'
                                        }`}
                                    >
                                        <Power className="w-5 h-5" />
                                        {shadowLock ? "DISABLE UPDATE BLOCK" : "BLOCK SYSTEM UPDATES"}
                                    </button>

                                    <button 
                                        onClick={activateOverride}
                                        disabled={!shadowLock}
                                        className={`w-full py-4 rounded-lg font-bold border flex items-center justify-center gap-3 transition-all ${
                                            overrideActive 
                                                ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                                                : 'bg-slate-900 border-slate-700 text-slate-600 disabled:opacity-50'
                                        }`}
                                    >
                                        <Fingerprint className="w-5 h-5" />
                                        {overrideActive ? "KERNEL BYPASS ACTIVE" : "INITIATE KERNEL BYPASS"}
                                    </button>
                                </div>

                                <div className="mt-6 p-4 bg-black/50 rounded border border-red-900/30 text-[10px] font-mono text-red-400/70">
                                    > ACCESSING SHADOW REGISTRY... OK<br/>
                                    > MOUNTING VIRTUAL FILESYSTEM... OK<br/>
                                    > WARNING: EXTERNAL HYPERVISOR DETECTED<br/>
                                    {overrideActive && <span className="text-red-400">> BYPASSING HYPERVISOR... SUCCESS.<br/></span>}
                                    {shadowLock && <span className="text-yellow-400">> UPDATE QUEUE FROZEN.<br/></span>}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'CONFIG' && <div className="text-slate-500 text-xs text-center">[Config Module Active]</div>}
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-1/2 p-6 flex flex-col bg-black/20 justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <Activity className="w-96 h-96 text-cyan-800" />
                </div>
                <div className="text-center space-y-6 z-10 max-w-md w-full">
                    <div className="w-full h-48 bg-slate-900/50 rounded-xl border border-slate-700 relative overflow-hidden shadow-2xl">
                       <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-xs">VISUAL OUTPUT BUFFER</div>
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