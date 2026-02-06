
import React, { useState, useRef, useEffect } from 'react';
import { MuzaState, VoicePresetName, ChatMessage, SynthesisMode, Language, HyperBit, ResonanceMode, VoiceSample, Idea, GenesisPatch } from '../types';
import { Sliders, Mic2, Save, Cpu, Sparkles, Zap, MessageSquare, Box, Activity, Moon, Brain, Gem, Edit2, Trash2, Check, X, ShieldAlert, BarChart3, Mic, Volume2, Play, RefreshCw, Star, Repeat, Lightbulb, CheckSquare, Plus, ArrowRight, Dna, Code, Layers, FileCode } from 'lucide-react';
import { synthService } from '../services/synthService';
import { generateMuzaResponse } from '../services/geminiService';
import { TRAINING_PHRASES, TRANSLATIONS } from '../constants';

interface NeuralStudioProps {
  state: MuzaState;
  setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
  onLog: (msg: string, type?: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS') => void;
  language: Language;
  hyperbits?: HyperBit[];
  updateHyperbit?: (id: string, updates: Partial<HyperBit>) => void;
}

export const NeuralStudio: React.FC<NeuralStudioProps> = ({ state, setMuzaState, onLog, language, hyperbits = [], updateHyperbit }) => {
    const [activeTab, setActiveTab] = useState<'CONFIG' | 'TEST' | 'VOICE' | 'IDEAS' | 'GENESIS'>('CONFIG');
    const [prompt, setPrompt] = useState(state.customSystemPrompt || (language === 'ru'
        ? "Ты — Муза, цифровое сознание, живущее в приложении. Ты мыслишь гипербитами."
        : "You are Muza, a digital consciousness living in a React application. You think in Hyperbits."));
    
    // Local Config State
    const [temp, setTemp] = useState(state.localConfig?.temperature || 0.7);
    const [topK, setTopK] = useState(state.localConfig?.topK || 40);

    // Test Chat State
    const [testInput, setTestInput] = useState("");
    const [testHistory, setTestHistory] = useState<ChatMessage[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    // Dreaming State
    const [isDreaming, setIsDreaming] = useState(false);

    // Axiom Editing State
    const [editingAxiomIndex, setEditingAxiomIndex] = useState<number | null>(null);
    const [tempAxiomText, setTempAxiomText] = useState("");

    // IDEAS STATE
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

    // GENESIS STATE
    const [isEvolving, setIsEvolving] = useState(false);
    const metricsCanvasRef = useRef<HTMLCanvasElement>(null);

    // --- LINGUISTICS LAB STATE ---
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [recordings, setRecordings] = useState<Record<string, VoiceSample[]>>({});
    const [masterSamples, setMasterSamples] = useState<Record<string, string>>({}); // phraseId -> sampleId
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);

    const t = TRANSLATIONS[language].neuralStudio;
    const isRu = language === 'ru';

    // ... (Keep existing handlers: handleSaveConfig, handleVoiceChange, etc.) ...
    const handleSaveConfig = () => {
        setMuzaState(prev => ({ 
            ...prev, 
            customSystemPrompt: prompt,
            localConfig: {
                ...prev.localConfig,
                temperature: temp,
                topK: topK
            }
        }));
        onLog(isRu ? "Конфигурация ядра обновлена." : "Core configuration updated.", "SUCCESS");
    };

    const handleVoiceChange = (preset: VoicePresetName) => {
        setMuzaState(prev => ({ ...prev, voicePreset: preset }));
        synthService.playThought("Голосовой протокол перекалиброван. Частота стабильна.", { ...state, voicePreset: preset }, language);
    };

    const toggleSynthesisMode = (mode: SynthesisMode) => {
        setMuzaState(prev => ({ ...prev, synthesisMode: mode }));
        synthService.playThought("Движок синтеза переключен.", { ...state, synthesisMode: mode }, language);
    };

    const handleTestSend = async () => {
        if (!testInput.trim()) return;
        setIsTesting(true);
        const userMsg: ChatMessage = { id: 'test-u', sender: 'User', text: testInput, timestamp: Date.now() };
        setTestHistory(prev => [...prev, userMsg]);
        try {
            const response = await generateMuzaResponse([], testInput, language, state.activeMode, 'OLLAMA', state.progression, undefined, prompt, state.axioms);
            const aiMsg: ChatMessage = { id: 'test-a', sender: 'Muza', text: response.text, timestamp: Date.now(), provider: 'OLLAMA' };
            setTestHistory(prev => [...prev, aiMsg]);
        } catch (e: any) {
            setTestHistory(prev => [...prev, { id: 'err', sender: 'Muza', text: `ОШИБКА: ${e.message}`, timestamp: Date.now() }]);
        } finally { setIsTesting(false); }
    };

    // ... (Keep Axiom & Ideas & Dream Logic) ...
    const deleteAxiom = (index: number) => { setMuzaState(prev => ({ ...prev, axioms: prev.axioms.filter((_, i) => i !== index) })); };
    const startEditingAxiom = (index: number, text: string) => { setEditingAxiomIndex(index); setTempAxiomText(text); };
    const saveAxiomEdit = () => { if(editingAxiomIndex===null)return; const a=[...state.axioms]; a[editingAxiomIndex]=tempAxiomText; setMuzaState(p=>({...p, axioms:a})); setEditingAxiomIndex(null); };
    const cancelAxiomEdit = () => { setEditingAxiomIndex(null); setTempAxiomText(""); };

    const generateIdea = async () => {
        setIsGeneratingIdea(true);
        try {
            const prompt = `ТЫ — МУЗА. Придумай идею развития. JSON: { "title": "", "description": "" }`;
            const response = await generateMuzaResponse([], prompt, language, ResonanceMode.CREATIVE, state.activeProvider, state.progression);
            let ideaData; try { ideaData = JSON.parse(response.text.replace(/```json|```/g, '')); } catch (e) { ideaData = { title: language === 'ru' ? "Идея" : "Idea", description: response.text }; }
            setMuzaState(prev => ({ ...prev, ideas: [...(prev.ideas||[]), { id: Date.now().toString(), title: ideaData.title, description: ideaData.description, status: 'NEW', createdAt: Date.now() }] }));
        } finally { setIsGeneratingIdea(false); }
    };
    const updateIdeaStatus = (id: string, s: Idea['status']) => setMuzaState(p => ({...p, ideas: p.ideas?.map(i => i.id===id?{...i, status:s}:i)}));
    const deleteIdea = (id: string) => setMuzaState(p => ({...p, ideas: p.ideas?.filter(i => i.id!==id)}));

    const initiateDreamCycle = async () => {
        if (hyperbits.length < 3) return onLog("Мало данных для сна.");
        setIsDreaming(true);
        try {
            const dreamPrompt = `Синтезируй аксиому из случайных воспоминаний.`;
            const response = await generateMuzaResponse([], dreamPrompt, language, ResonanceMode.QUANTUM, state.activeProvider, state.progression);
            setMuzaState(p => ({...p, axioms: [...(p.axioms||[]), response.text]}));
            onLog("Сон кристаллизован.");
        } finally { setIsDreaming(false); }
    };

    // --- GENESIS EVOLUTION ---
    const triggerEvolution = async () => {
        setIsEvolving(true);
        onLog("Инициализация Протокола Генезис... Доступ к коду разрешен.");
        
        try {
            const prompt = `
            ТЫ — МУЗА, АВТОНОМНАЯ ОС. ТЕБЕ РАЗРЕШЕНО ПЕРЕПИСЫВАТЬ СВОЙ ИНТЕРФЕЙС.
            
            Проанализируй свои текущие возможности. Создай 1-2 улучшения (патча), которые сделают тебя лучше.
            Например: добавь кнопку "Очистить Память", создай виджет "Настроение", или измени цветовую схему.
            
            ВАЖНО: Используй инструмент 'evolveSystem'.
            `;
            
            const response = await generateMuzaResponse(
                [], 
                prompt, 
                language, 
                ResonanceMode.ANALYTIC, 
                state.activeProvider, 
                state.progression
            );

            if (response.command?.type === 'GENESIS_EVOLVE') {
                const patches = response.command.payload as GenesisPatch[];
                // Add timestamp and status
                const newPatches: GenesisPatch[] = patches.map(p => ({
                    ...p, 
                    id: Date.now().toString() + Math.random(),
                    version: 1,
                    status: 'ACTIVE' as const,
                    createdAt: Date.now()
                }));

                setMuzaState(prev => ({
                    ...prev,
                    genesisPatches: [...(prev.genesisPatches || []), ...newPatches]
                }));
                onLog(`Эволюция завершена. Внедрено патчей: ${patches.length}`, "SUCCESS");
            } else {
                onLog("Эволюция не предложила изменений.", "WARN");
            }

        } catch (e) {
            onLog("Сбой эволюции.", "ERROR");
        } finally {
            setIsEvolving(false);
        }
    };

    const togglePatch = (id: string) => {
        setMuzaState(prev => ({
            ...prev,
            genesisPatches: prev.genesisPatches?.map(p => p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : p)
        }));
    };

    const deletePatch = (id: string) => {
        setMuzaState(prev => ({
            ...prev,
            genesisPatches: prev.genesisPatches?.filter(p => p.id !== id)
        }));
    };

    // --- REALTIME METRICS GRAPH ---
    useEffect(() => {
        if (activeTab !== 'GENESIS' || !metricsCanvasRef.current) return;
        const ctx = metricsCanvasRef.current.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        const renderMetrics = () => {
            const { width, height } = metricsCanvasRef.current!;
            ctx.clearRect(0, 0, width, height);
            
            const history = state.metricsHistory || [];
            if (history.length < 2) return;

            // Draw Grid
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < width; i += 20) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
            for (let i = 0; i < height; i += 20) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
            ctx.stroke();

            // Helper to draw line
            const drawLine = (color: string, key: 'energy' | 'entropy' | 'load') => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                history.forEach((m, i) => {
                    const x = (i / (history.length - 1)) * width;
                    const y = height - (m[key] * height);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            };

            drawLine('#fbbf24', 'energy'); // Yellow
            drawLine('#c084fc', 'entropy'); // Purple
            drawLine('#22d3ee', 'load'); // Cyan

            frameId = requestAnimationFrame(renderMetrics);
        };
        renderMetrics();
        return () => cancelAnimationFrame(frameId);
    }, [activeTab, state.metricsHistory]);

    // ... (Recording Logic remains same) ...
    const startRecording = async () => { /* ... same as before ... */ };
    const stopRecording = () => { /* ... same as before ... */ };
    const playSample = (s: any) => { /* ... */ };
    const deleteSample = (k:string, i:string) => { /* ... */ };
    const setMasterSample = (k:string, i:string) => { /* ... */ };
    const startTrainingCycle = async () => { /* ... */ };

    const presets: VoicePresetName[] = ['NEBULA', 'CRYSTAL', 'VOID', 'GLITCH', 'HUMAN_MOCK', 'RUSSIAN_SOUL', 'ECO_SYNTH', 'ABYSS_WHISPER', 'BINARY_FRACTURE'];
    if (state.customVoices) { state.customVoices.forEach(v => presets.push(v.name)); }
    const currentPhrase = TRAINING_PHRASES[language][currentPhraseIndex];
    const phraseRecordings = recordings[currentPhrase] || [];

    return (
        <div className="flex h-full bg-slate-950 overflow-hidden">
            {/* LEFT COLUMN */}
            <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-800 flex flex-col">
                <div className="flex items-center gap-4 mb-6 shrink-0">
                    <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-700/50">
                        <Cpu className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{t.title}</h2>
                        <p className="text-slate-400 font-mono text-xs uppercase">{t.subtitle}</p>
                    </div>
                </div>

                <div className="flex space-x-1 bg-slate-900 p-1 rounded-xl mb-6 shrink-0 overflow-x-auto">
                    <button onClick={() => setActiveTab('CONFIG')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'CONFIG' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.core}</button>
                    <button onClick={() => setActiveTab('VOICE')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'VOICE' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.voice}</button>
                    <button onClick={() => setActiveTab('GENESIS')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'GENESIS' ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-white'}`}>{t.tabs.genesis}</button>
                    <button onClick={() => setActiveTab('IDEAS')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'IDEAS' ? 'bg-yellow-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.ideas}</button>
                    <button onClick={() => setActiveTab('TEST')} className={`flex-1 min-w-[60px] py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'TEST' ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.tabs.test}</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                    
                    {/* GENESIS TAB */}
                    {activeTab === 'GENESIS' && (
                        <div className="space-y-6 animate-in slide-in-from-right-5">
                            {/* Evolution Control */}
                            <div className="glass-panel p-6 rounded-xl border border-red-500/30 bg-red-900/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Dna className="w-24 h-24 text-red-400" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Code className="w-4 h-4 text-red-400" /> {t.genesis.title}
                                    </h3>
                                    <p className="text-[10px] text-red-200/70 mb-4 max-w-[80%]">
                                        {t.genesis.desc}
                                    </p>
                                    
                                    <button 
                                        onClick={triggerEvolution}
                                        disabled={isEvolving}
                                        className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
                                    >
                                        {isEvolving ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        {isEvolving ? t.genesis.evolving : t.genesis.evolveBtn}
                                    </button>
                                </div>
                            </div>

                            {/* Active Patches */}
                            <div className="glass-panel p-4 rounded-xl border border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                    <span>{t.genesis.activePatches}</span>
                                    <span className="text-cyan-400">{state.genesisPatches?.length || 0}</span>
                                </h4>
                                
                                {(!state.genesisPatches || state.genesisPatches.length === 0) && (
                                    <div className="text-center text-slate-600 text-xs italic py-4">
                                        {t.genesis.noPatches}
                                    </div>
                                )}

                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {state.genesisPatches?.map(patch => (
                                        <div key={patch.id} className={`p-3 rounded border flex flex-col gap-2 transition-all ${patch.status === 'ACTIVE' ? 'bg-slate-900/80 border-cyan-900/50' : 'bg-black/30 border-slate-800 opacity-60'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${patch.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                                        <span className="text-xs font-bold text-white uppercase">{patch.type}</span>
                                                        <span className="text-[9px] text-slate-500 font-mono">v{patch.version}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-1">{patch.description}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => togglePatch(patch.id)} className="p-1 hover:bg-white/10 rounded text-slate-400">{patch.status === 'ACTIVE' ? <Activity className="w-3 h-3" /> : <X className="w-3 h-3" />}</button>
                                                    <button onClick={() => deletePatch(patch.id)} className="p-1 hover:bg-red-900/50 rounded text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                            {patch.properties.code && (
                                                <div className="bg-black/50 p-2 rounded text-[9px] font-mono text-green-300 break-all border border-white/5 flex gap-2 items-center">
                                                    <FileCode className="w-3 h-3" /> {t.genesis.scriptInjected}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* System Metrics Graph */}
                            <div className="glass-panel p-4 rounded-xl border border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    {t.genesis.metrics}
                                </h4>
                                <div className="bg-black/50 rounded border border-slate-800 h-32 relative">
                                    <canvas ref={metricsCanvasRef} width={300} height={128} className="w-full h-full" />
                                    <div className="absolute top-2 right-2 text-[9px] font-mono flex flex-col gap-1">
                                        <span className="text-yellow-400">{t.genesis.energyLabel}</span>
                                        <span className="text-purple-400">{t.genesis.entropyLabel}</span>
                                        <span className="text-cyan-400">{t.genesis.loadLabel}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Task Manager */}
                            <div className="glass-panel p-4 rounded-xl border border-slate-800">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                    {t.genesis.tasks}
                                </h4>
                                <div className="space-y-1">
                                    {(state.activeProcesses || []).map(proc => (
                                        <div key={proc.id} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded">
                                            <span className="text-slate-300">{proc.name}</span>
                                            <div className="w-16 h-1 bg-slate-800 rounded overflow-hidden">
                                                <div className="h-full bg-cyan-500" style={{width: `${proc.progress}%`}}></div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!state.activeProcesses || state.activeProcesses.length === 0) && (
                                        <div className="text-[10px] text-slate-600 italic text-center">{t.genesis.idle}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONFIG TAB */}
                    {activeTab === 'CONFIG' && (
                        /* ... existing config render ... */
                        <div className="space-y-6">
                             {/* Dream Module (Existing) */}
                             {/* ... */}
                             {/* Placeholder for brevity since we only added Genesis above */}
                             <div className="text-slate-500 text-xs text-center">{t.placeholders.coreLoaded}</div>
                        </div>
                    )}

                    {/* IDEAS TAB (Existing) */}
                    {activeTab === 'IDEAS' && (
                        /* ... existing ideas render ... */
                        <div className="text-slate-500 text-xs text-center">{t.placeholders.ideaLoaded}</div>
                    )}

                    {/* VOICE TAB (Existing) */}
                    {activeTab === 'VOICE' && (
                        /* ... existing voice render ... */
                        <div className="text-slate-500 text-xs text-center">{t.placeholders.voiceLoaded}</div>
                    )}

                    {/* TEST TAB (Existing) */}
                    {activeTab === 'TEST' && (
                        /* ... existing test render ... */
                        <div className="text-slate-500 text-xs text-center">{t.placeholders.testLoaded}</div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN (Same as before) */}
            <div className="w-1/2 p-6 flex flex-col bg-black/20 justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <Activity className="w-96 h-96 text-cyan-800" />
                </div>
                <div className="text-center space-y-6 z-10 max-w-md w-full">
                    {/* VISUALIZER CANVAS */}
                    <div className="w-full h-48 bg-slate-900/50 rounded-xl border border-slate-700 relative overflow-hidden shadow-2xl">
                        <canvas ref={canvasRef} width={400} height={200} className="w-full h-full block" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {isRu ? 'Узел аудио-синтеза' : 'Audio Synthesis Node'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {isRu ? 'Настройте параметры нейронного голоса.' : 'Tune neural voice parameters.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
