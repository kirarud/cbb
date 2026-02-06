
import React, { useState } from 'react';
import { MuzaState, SystemLog, Language, MuzaCapabilities, EmotionType } from '../types';
import { Save, RefreshCw, Trash2, Sliders, Activity, Zap, Brain, ShieldAlert, Cpu, Terminal, ToggleLeft, ToggleRight, Info, ShieldCheck } from 'lucide-react';
import { clearLocalData } from '../services/storageService';
import { TRANSLATIONS, KERNEL_VERSION } from '../constants';
import { SystemMonitor } from '../components/SystemMonitor';

interface SettingsProps {
  state: MuzaState;
  setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
  onLog: (msg: string, type?: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR', source?: string) => void;
  currentUser?: string | null;
  language: Language;
  systemLogs: SystemLog[];
}

// Re-defining a minimal default state for recovery purposes
const DEFAULT_RECOVERY_STATE = {
  progression: {
    level: 1, xp: 0, achievements: [], unlockedNodes: ['ROOT'],
    skills: { logic: 10, creativity: 10, empathy: 10, philosophy: 5, chaos: 1 },
    userSkills: [], totalThoughts: 0, totalCodeRuns: 0,
  },
  capabilities: {
    VOICE_SYNTHESIS: true, VISUAL_ENGINE_3D: true, AI_CLOUD_SYNC: true,
    AI_LOCAL_BRAIN: true, PROCEDURAL_MUSIC: true, INPUT_WEBCAM: false, INPUT_SCREEN: true,
  },
  design: { activeTheme: 'DEFAULT', unlockedThemes: ['DEFAULT'], fluxBalance: 100 },
};

export const Settings: React.FC<SettingsProps> = ({ state, setMuzaState, onLog, currentUser, language, systemLogs }) => {
  const [activeTab, setActiveTab] = useState<'CORE' | 'METRICS' | 'DEBUG'>('CORE');
  const t = TRANSLATIONS[language].settings;

  const handleWipe = () => {
    if (!currentUser) return;
    if (confirm(t.danger_zone_desc(currentUser))) {
      clearLocalData(currentUser);
      window.location.reload();
    }
  };

  const handleVerifyData = () => {
    onLog("Data integrity check initiated.", "INFO", "KERNEL");
    let repaired = false;
    
    setMuzaState(prev => {
        let newState = { ...prev };
        
        if (!newState.progression) {
            newState.progression = DEFAULT_RECOVERY_STATE.progression;
            onLog("Repair: Progression state missing. Re-initializing.", "WARN", "KERNEL");
            repaired = true;
        }
        if (!newState.capabilities) {
            newState.capabilities = DEFAULT_RECOVERY_STATE.capabilities;
            onLog("Repair: Capabilities matrix missing. Re-initializing.", "WARN", "KERNEL");
            repaired = true;
        }
        if (!newState.design) {
            newState.design = DEFAULT_RECOVERY_STATE.design;
            onLog("Repair: Design state missing. Re-initializing.", "WARN", "KERNEL");
            repaired = true;
        }

        return newState;
    });

    setTimeout(() => {
        if (repaired) {
            onLog("Data repair complete. State synchronized.", "SUCCESS", "KERNEL");
        } else {
            onLog("Data integrity check complete. All systems nominal.", "SUCCESS", "KERNEL");
        }
    }, 100);
  };

  const toggleCapability = (key: keyof MuzaCapabilities) => {
      setMuzaState(prev => ({
          ...prev,
          capabilities: {
              ...prev.capabilities,
              [key]: !prev.capabilities[key]
          }
      }));
      onLog(`Capability ${key} toggled to: ${!state.capabilities[key]}`);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500">
        
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700">
                <Sliders className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{t.title}</h2>
                <p className="text-slate-400 text-sm uppercase tracking-widest">{t.subtitle}</p>
            </div>
        </div>
        
        <div className="flex mb-8 border-b border-slate-800">
            <button onClick={() => setActiveTab('CORE')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'CORE' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>{t.tabs.core}</button>
            <button onClick={() => setActiveTab('DEBUG')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'DEBUG' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-white'}`}>{t.tabs.debug}</button>
            <button onClick={() => setActiveTab('METRICS')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'METRICS' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-500 hover:text-white'}`}>{t.tabs.metrics}</button>
        </div>

        {activeTab === 'CORE' && (
            <div className="space-y-8 animate-in fade-in">
                <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-xl font-bold text-cyan-400 mb-6 font-mono tracking-widest uppercase flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        ПАРАМЕТРЫ ЯДРА
                    </h2>
                    
                    <div className="space-y-8">
                        <div>
                        <div className="flex justify-between text-sm mb-2 text-slate-400">
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> {t.energy}</span>
                            <span className="text-cyan-400 font-mono">{(state.energyLevel * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={state.energyLevel * 100}
                            onChange={(e) => setMuzaState(prev => ({ ...prev, energyLevel: parseInt(e.target.value) / 100 }))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        </div>

                        <div>
                        <div className="flex justify-between text-sm mb-2 text-slate-400">
                            <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" /> {t.coherence}</span>
                            <span className="text-purple-400 font-mono">{(state.coherence * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" value={state.coherence * 100}
                            onChange={(e) => setMuzaState(prev => ({ ...prev, coherence: parseInt(e.target.value) / 100 }))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        </div>
                    </div>
                </div>

                 <div className="glass-panel p-6 rounded-2xl border border-red-900/20 bg-red-950/5">
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2"><Trash2 className="w-5 h-5" /> {t.danger_zone}</h3>
                    <p className="text-sm text-slate-400 mb-6">{t.danger_zone_desc(currentUser || 'GUEST')}</p>
                    <button onClick={handleWipe} className="w-full py-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-xl text-red-400 transition-colors flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" /> {t.wipe_button}
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'DEBUG' && (
            <div className="space-y-6 animate-in fade-in">
                 <div className="glass-panel p-6 rounded-2xl border border-green-900/20 bg-green-950/5">
                    <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> {t.data_integrity_check}</h3>
                    <p className="text-sm text-slate-400 mb-6">{t.data_integrity_desc}</p>
                    <button onClick={handleVerifyData} className="w-full py-3 bg-green-950/30 hover:bg-green-900/50 border border-green-900/50 rounded-xl text-green-400 transition-colors flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Запустить Проверку
                    </button>
                </div>
                
                <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-900/5">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6 text-purple-400" />
                                {t.capabilities.title}
                            </h2>
                            <p className="text-slate-400 text-sm">{t.capabilities.desc}</p>
                        </div>
                        <div className="px-3 py-1 bg-purple-900 text-purple-200 border border-purple-500/50 rounded-lg text-[10px] font-mono">
                            KERNEL: {state.kernelVersion}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(Object.keys(state.capabilities) as Array<keyof MuzaCapabilities>).map(key => (
                            <button 
                                key={key}
                                onClick={() => toggleCapability(key)}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${state.capabilities[key] ? 'bg-purple-900/20 border-purple-500/50 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'}`}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-xs font-bold uppercase tracking-wider">{t.capabilities[key as keyof typeof t.capabilities]}</span>
                                    <span className="text-[10px] font-mono opacity-50">{key}</span>
                                </div>
                                {state.capabilities[key] ? <ToggleRight className="w-8 h-8 text-purple-400" /> : <ToggleLeft className="w-8 h-8" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'METRICS' && (
            <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden animate-in fade-in">
                <SystemMonitor language={language} systemLogs={systemLogs} />
            </div>
        )}
      </div>
    </div>
  );
};
