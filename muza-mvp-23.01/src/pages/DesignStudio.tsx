

import React from 'react';
import { Palette, Zap, Brain, Sparkles, Sliders, Check, Lock, Coins, Eye, Info, FlaskConical } from 'lucide-react';
import { MuzaState, Language, ThemeId, Theme, PersonaMode } from '../types';
import { THEMES, TRANSLATIONS } from '../constants';
import { Tooltip } from '../components/Tooltip';

interface DesignStudioProps {
    state: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
    language: Language;
    onLog: (msg: string, type?: any) => void;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({ state, setMuzaState, language, onLog }) => {
    const t = TRANSLATIONS[language].store;
    const d = state.design;

    const handleThemeChange = (id: ThemeId) => {
        if (!d.unlockedThemes.includes(id)) {
            const cost = 200; // Default cost to unlock
            if (d.fluxBalance >= cost) {
                setMuzaState(prev => ({
                    ...prev,
                    design: {
                        ...prev.design,
                        fluxBalance: prev.design.fluxBalance - cost,
                        unlockedThemes: [...prev.design.unlockedThemes, id],
                        activeTheme: id
                    }
                }));
                onLog(`Theme unlocked & activated: ${id}`, 'SUCCESS');
            } else {
                onLog("Insufficient Flux for resonance upgrade.", 'ERROR');
            }
            return;
        }
        setMuzaState(prev => ({
            ...prev,
            design: { ...prev.design, activeTheme: id }
        }));
        onLog(`Visual Cortex synced to theme: ${id}`);
    };

    const updateConfig = (updates: Partial<MuzaState['chatConfig']>) => {
        setMuzaState(prev => ({
            ...prev,
            chatConfig: { ...prev.chatConfig, ...updates }
        }));
    };

    const personaModes: PersonaMode[] = ['DEFAULT', 'CREATIVE', 'TECHNICAL', 'PHILOSOPHICAL'];

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-950 custom-scrollbar pb-32">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-5xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
                            <Palette className="w-12 h-12 text-rose-500 animate-pulse" />
                            Neural Design
                        </h1>
                        <p className="text-slate-500 font-mono text-[10px] mt-2 uppercase tracking-[0.3em]">Module: Aesthetic_Synthesizer_v8.4</p>
                    </div>
                    <div className="glass-panel px-8 py-4 rounded-3xl border border-rose-500/20 flex items-center gap-4 bg-rose-500/5 backdrop-blur-xl">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Available Flux</span>
                            <span className="text-2xl font-bold text-white tabular-nums">{d.fluxBalance}</span>
                        </div>
                        <div className="p-3 bg-rose-500/20 rounded-2xl">
                            <Coins className="w-6 h-6 text-rose-400" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Theme Selector (Aura Patterns) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Aura Patterns</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(THEMES).map((theme: Theme) => {
                                const isUnlocked = d.unlockedThemes.includes(theme.id);
                                const isActive = d.activeTheme === theme.id;
                                
                                return (
                                    <button 
                                        key={theme.id}
                                        onClick={() => handleThemeChange(theme.id)}
                                        className={`group relative p-1 rounded-[2rem] transition-all duration-500 overflow-hidden border-2
                                            ${isActive ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="glass-panel h-full w-full p-6 rounded-[1.8rem] flex flex-col gap-4 text-left bg-black/40">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-2">
                                                    <div className="w-6 h-6 rounded-lg" style={{ background: theme.colors.primary }} />
                                                    <div className="w-6 h-6 rounded-lg" style={{ background: theme.colors.accent }} />
                                                </div>
                                                {isActive ? <Check className="w-5 h-5 text-rose-500" /> : !isUnlocked && <Lock className="w-4 h-4 text-slate-600" />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{theme.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{theme.description}</p>
                                            </div>
                                            {!isUnlocked && (
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-rose-400">COST: 200 FLUX</span>
                                                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400">Unlock</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* Background Preview Wave */}
                                        <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.accent})` }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI DNA Tuning */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Cognitive DNA</h2>
                        </div>
                        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/20 space-y-8">
                            
                            {/* Persona Modes */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cognitive Mask (Persona)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {personaModes.map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => updateConfig({ personaMode: mode })}
                                            className={`py-2 px-3 rounded-xl text-[9px] font-bold border transition-all uppercase tracking-wider
                                                ${state.chatConfig.personaMode === mode 
                                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg' 
                                                    : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Logic Entropy</span>
                                        <span className="text-xs font-bold text-cyan-400">BALANCED</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                        <div className="absolute inset-y-0 left-0 bg-cyan-500 w-1/2 shadow-[0_0_10px_#22d3ee]" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-500 uppercase">Detail Synthesis</span>
                                        <span className="text-xs font-bold text-purple-400">HIGH</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                        <div className="absolute inset-y-0 left-0 bg-purple-500 w-3/4 shadow-[0_0_10px_#a855f7]" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/20 flex gap-3">
                                <Info className="w-5 h-5 text-cyan-400 shrink-0" />
                                <p className="text-[9px] text-slate-400 leading-relaxed italic">
                                    Adjusting cognitive parameters affects how Gemini processes semantic associations. High entropy leads to creative drift, while low entropy enforces technical rigor.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Jitter & Flux Params */}
                <div className="glass-panel p-10 rounded-[3rem] border border-white/5 bg-black/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FlaskConical className="w-40 h-40 text-rose-500" />
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <Sliders className="w-5 h-5 text-rose-400" />
                                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Interface Flux</h2>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Blur Density</label>
                                        <span className="text-[10px] font-mono text-rose-400">{(state.coherence * 100).toFixed(0)}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="1" step="0.01" 
                                        value={state.coherence}
                                        onChange={(e) => setMuzaState(prev => ({ ...prev, coherence: parseFloat(e.target.value) }))}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aura Brightness</label>
                                        <span className="text-[10px] font-mono text-rose-400">{(state.energyLevel * 100).toFixed(0)}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="1" step="0.01" 
                                        value={state.energyLevel}
                                        onChange={(e) => setMuzaState(prev => ({ ...prev, energyLevel: parseFloat(e.target.value) }))}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-purple-600 blur-2xl animate-pulse opacity-40" />
                                <div className="relative -mt-32">
                                    <div className="p-8 rounded-full border-4 border-white/5 backdrop-blur-2xl inline-block shadow-2xl">
                                        <Eye className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="mt-6">
                                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">Visual Sync Active</span>
                                        <p className="text-[9px] text-slate-500 mt-2 font-mono">RENDERING ENGINE: VORTEX_UI_v4</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};