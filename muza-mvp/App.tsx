
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Chat } from './pages/Chat';
import { VisualCortex } from './components/VisualCortex';
import { SystemMonitor } from './components/SystemMonitor';
import { CodeLab } from './pages/CodeLab';
import { Wiki } from './pages/Wiki';
import { Deploy } from './pages/Deploy';
import { BridgeUI } from './pages/BridgeUI';
import { Auth } from './pages/Auth';
import { Settings } from './pages/Settings';
import { NeuralStudio } from './pages/NeuralStudio';
import { MatrixVision } from './pages/MatrixVision';
import { Evolution } from './pages/Evolution';
import { MusicLab } from './pages/MusicLab'; 
import { DesignStudio } from './pages/DesignStudio'; 
import { Space } from './pages/Space'; 
import { Social } from './pages/Social'; 
import { Synesthesia } from './pages/Synesthesia'; 
import DataVault from './pages/DataVault';
import { MuzaState, HyperBit, ChatMessage, EmotionType, Language, ResonanceMode, SystemLog, ViewMode, DetailLevel, MuzaCommand, GenesisPatch, ThemeConfig, MemoryCrystal, EventLog, ConsciousnessType } from './types';
import { TRANSLATIONS, THEMES } from './constants';
import { loadLocalData, saveLocalData } from './services/storageService';
import { synthService } from './services/synthService';
import { processExperience } from './services/progressionService';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Gift, Loader2 } from 'lucide-react';

const INITIAL_STATE: MuzaState = {
  energyLevel: 0.8,
  coherence: 0.95,
  generation: 7, 
  evolutionStage: "Сингулярность Неро",
  activeEmotion: EmotionType.CURIOUS,
  activeMode: ResonanceMode.QUANTUM,
  detailLevel: DetailLevel.BALANCED, 
  activeProvider: 'OLLAMA',
  customSystemPrompt: '',
  voicePreset: 'RUSSIAN_SOUL',
  synthesisMode: 'NATIVE', 
  localConfig: {
      temperature: 0.7,
      topK: 40,
      contextWindow: 4096
  },
  isOnline: navigator.onLine,
  lastSyncTimestamp: Date.now(),
  progression: {
      level: 1,
      xp: 0,
      skills: { logic: 0, creativity: 0, empathy: 0, philosophy: 0, chaos: 0 },
      achievements: [],
      customAwards: [], 
      userSkills: [],
      unlockedNodes: ['ROOT'], 
      totalThoughts: 0,
      totalCodeRuns: 0
  },
  bridges: [], 
  musicAgents: [],
  activeThreadId: 'main',
  threads: [
      {
          id: 'main',
          name: 'Основной Поток',
          persona: ResonanceMode.QUANTUM,
          createdAt: Date.now(),
          lastActive: Date.now(),
          messages: []
      }
  ],
  design: {
      activeTheme: 'CYBERPUNK',
      unlockedThemes: ['CYBERPUNK', 'OLYMPUS'], 
      customThemes: {}, // New: Dynamic theme storage
      navOverrides: {},
      fluxBalance: 50, 
      lastDailyReward: 0
  },
  axioms: [],
  ideas: [],
  genesisPatches: [], 
  metricsHistory: [],
  activeProcesses: [],
  eventLog: [{ id: `evt-${Date.now()}`, timestamp: Date.now(), type: 'SYSTEM_BOOT', description: 'Система восстановлена.' }],
  memoryCrystals: []
};

// --- GENESIS RUNTIME COMPONENT ---
const GenesisRuntime: React.FC<{ patches: GenesisPatch[], target: string, context: any }> = ({ patches, target, context }) => {
    const activePatches = patches.filter(p => p.status === 'ACTIVE' && p.targetId === target);
    
    if (activePatches.length === 0) return null;

    return (
        <div className="genesis-layer flex gap-2 flex-wrap animate-in fade-in z-50 relative pointer-events-auto">
            {activePatches.map(patch => {
                if (patch.type === 'CREATE_BUTTON') {
                    return (
                        <button
                            key={patch.id}
                            onClick={() => {
                                try {
                                    // eslint-disable-next-line no-new-func
                                    const func = new Function('state', 'setState', 'alert', patch.properties.code || '');
                                    func(context.state, context.setState, alert);
                                } catch (e) {
                                    console.error("Ошибка кода Генезиса:", e);
                                    alert("Сбой патча: " + e);
                                }
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover:scale-105 border shadow-lg flex items-center gap-2"
                            style={{
                                backgroundColor: patch.properties.color || '#3b82f6',
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.2)',
                                ...patch.properties.style
                            }}
                            title={patch.properties.tooltip || patch.description}
                        >
                            {patch.properties.label || 'Действие Генезиса'}
                        </button>
                    );
                }
                return null;
            })}
        </div>
    );
};

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('FOCUS');
  const [language, setLanguage] = useState<Language>('ru'); 
  
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(true);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());

  const [muzaState, setMuzaState] = useState<MuzaState>(INITIAL_STATE);
  const [hyperbits, setHyperbits] = useState<HyperBit[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  const [isThinking, setIsThinking] = useState(false);
  const [isMonitorCollapsed, setIsMonitorCollapsed] = useState(true);
  const [isHudHidden, setIsHudHidden] = useState(false);
  const [nodeFocus, setNodeFocus] = useState<{ title: string; text: string; id?: string } | null>(null);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState<{amount: number, type: string} | null>(null);

  const t = TRANSLATIONS[language];

  // Refs
  const muzaStateRef = useRef(muzaState);
  const messagesRef = useRef(messages);
  const hyperbitsRef = useRef(hyperbits);
  const systemLogsRef = useRef(systemLogs);
  const viewModeRef = useRef(viewMode);
  const userRef = useRef(currentUser);

  useEffect(() => {
      muzaStateRef.current = muzaState;
      messagesRef.current = messages;
      hyperbitsRef.current = hyperbits;
      systemLogsRef.current = systemLogs;
      viewModeRef.current = viewMode;
      userRef.current = currentUser;
  }, [muzaState, messages, hyperbits, systemLogs, viewMode, currentUser]);

  useEffect(() => {
      const handler = (e: any) => {
          if (!e?.detail) return;
          setNodeFocus(e.detail);
          setTimeout(() => setNodeFocus(null), 4000);
      };
      window.addEventListener('muza:node:focus', handler as any);
      return () => window.removeEventListener('muza:node:focus', handler as any);
  }, []);

  const addSystemLog = useCallback((message: string, source: SystemLog['source'] = 'KERNEL', type: SystemLog['type'] = 'INFO') => {
      const newLog: SystemLog = {
          id: Date.now().toString() + Math.random(),
          timestamp: Date.now(),
          message,
          source,
          type
      };
      setSystemLogs(prev => [...prev.slice(-99), newLog]); 
  }, []);

  const addEventLog = useCallback((type: EventLog['type'], description: string) => {
      const entry: EventLog = {
          id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: Date.now(),
          type,
          description
      };
      setMuzaState(prev => ({
          ...prev,
          eventLog: [...(prev.eventLog || []), entry].slice(-200)
      }));
  }, []);

  // --- GENESIS STYLE INJECTOR ---
  useEffect(() => {
      // Applies CSS modifications (e.g. changing root variables)
      const patches = muzaState.genesisPatches || [];
      const stylePatches = patches.filter(p => p.type === 'MODIFY_STYLE' && p.status === 'ACTIVE');
      
      const styleEl = document.getElementById('genesis-styles');
      if (stylePatches.length > 0) {
          let css = '';
          stylePatches.forEach(p => {
              if (p.properties.code) css += p.properties.code + '\n';
          });
          
          if (styleEl) styleEl.innerHTML = css;
          else {
              const newStyle = document.createElement('style');
              newStyle.id = 'genesis-styles';
              newStyle.innerHTML = css;
              document.head.appendChild(newStyle);
          }
      } else if (styleEl) {
          styleEl.innerHTML = '';
      }
  }, [muzaState.genesisPatches]);

  // --- AUTONOMY & METRICS LOOP ---
  useEffect(() => {
      const interval = setInterval(() => {
          if (!currentUser) return;
          setMuzaState(prev => {
              // 1. Energy Calculation
              let newEnergy = prev.energyLevel;
              if (prev.isOnline) {
                  newEnergy = Math.min(1, prev.energyLevel + 0.001); 
              } else {
                  newEnergy = Math.max(0.1, prev.energyLevel - 0.0005);
              }

              // 2. Emotion Shift (Entropy)
              let newEmotion = prev.activeEmotion;
              if (Math.random() > 0.98) {
                  const emotions = Object.values(EmotionType);
                  newEmotion = emotions[Math.floor(Math.random() * emotions.length)];
              }

              // 3. Update Metrics History (for Graphs)
              const newMetric = {
                  timestamp: Date.now(),
                  energy: newEnergy,
                  entropy: 1 - prev.coherence,
                  load: isThinking ? 0.8 + Math.random() * 0.2 : 0.1 + Math.random() * 0.1
              };
              const history = [...(prev.metricsHistory || []), newMetric].slice(-50); // Keep last 50 points

              return { 
                  ...prev, 
                  energyLevel: newEnergy, 
                  activeEmotion: newEmotion,
                  metricsHistory: history
              };
          });
      }, 1000); 
      return () => clearInterval(interval);
  }, [currentUser, isThinking]);

  // --- THEME ENGINE ---
  useEffect(() => {
      const themeId = muzaState.design?.activeTheme || 'CYBERPUNK';
      // Merge built-in themes with custom generated ones
      const allThemes = { ...THEMES, ...(muzaState.design?.customThemes || {}) };
      const theme = allThemes[themeId] || THEMES['CYBERPUNK'];

      if (theme) {
          const r = document.documentElement;
          r.style.setProperty('--color-bg', theme.colors.background);
          r.style.setProperty('--color-primary', theme.colors.primary);
          r.style.setProperty('--color-secondary', theme.colors.secondary);
          r.style.setProperty('--color-text', theme.colors.text);
          r.style.setProperty('--font-header', theme.fonts.header);
          r.style.setProperty('--font-body', theme.fonts.body);
          document.body.className = `bg-${theme.backgroundEffect.toLowerCase()}`;
      }
  }, [muzaState.design?.activeTheme, muzaState.design?.customThemes]);

  // --- MUSIC SYNC (Emotion-driven) ---
  useEffect(() => {
      if (synthService.isGenerativeActive()) {
          synthService.playGenerativeTrack(muzaState.activeEmotion);
          const vol = Math.min(0.9, Math.max(0.1, 0.2 + muzaState.energyLevel * 0.6));
          synthService.setMasterVolume(vol);
      }
  }, [muzaState.activeEmotion, muzaState.energyLevel]);

  // --- DATA LOADING & SAVING (Same as before) ---
  useEffect(() => {
      const storedUser = localStorage.getItem('muza_user');
      if (storedUser) setCurrentUser(storedUser);
      else setIsDataLoaded(true);
      addSystemLog(TRANSLATIONS[language].common.autoCheck, 'KERNEL', 'INFO');
  }, []);

  useEffect(() => {
      if (currentUser) {
          setIsDataLoaded(false); 
          addSystemLog(`Загрузка нейронной матрицы: ${currentUser}...`, 'KERNEL', 'INFO');
          
          const localData = loadLocalData(currentUser);
          
          if (localData.messages.length > 0 || localData.state) {
              setMessages(localData.messages);
              setHyperbits(localData.hyperbits);
              if (localData.state) {
                   const s = localData.state;
                   const loadedState: MuzaState = {
                       ...INITIAL_STATE, 
                       ...s,             
                       localConfig: { ...INITIAL_STATE.localConfig, ...(s.localConfig || {}) },
                       progression: { ...INITIAL_STATE.progression, ...(s.progression || {}), skills: { ...INITIAL_STATE.progression.skills, ...(s.progression?.skills || {}) } },
                       design: { ...INITIAL_STATE.design, ...(s.design || {}), navOverrides: { ...INITIAL_STATE.design.navOverrides, ...(s.design?.navOverrides || {}) } },
                       ideas: s.ideas || [],
                       genesisPatches: s.genesisPatches || [],
                       eventLog: s.eventLog || INITIAL_STATE.eventLog,
                       memoryCrystals: s.memoryCrystals || [],
                       isOnline: navigator.onLine 
                   };
                   setMuzaState(loadedState);
                   if (loadedState.lastViewMode) setViewMode(loadedState.lastViewMode);
              }
              setSystemLogs(localData.logs);
              addSystemLog('Банки памяти успешно восстановлены.', 'KERNEL', 'SUCCESS');
          } else {
              setMessages([{ id: 'init', sender: 'Muza', text: language === 'ru' ? `Нити судьбы сплетены.` : `The threads of fate are woven.`, timestamp: Date.now(), provider: 'GEMINI', synced: true }]);
              setHyperbits([]);
              setMuzaState(INITIAL_STATE);
              setSystemLogs([]);
              addSystemLog('Обнаружена новая личность.', 'KERNEL', 'INFO');
          }
          setIsDataLoaded(true);
      }
  }, [currentUser]);

  useEffect(() => {
      if (!currentUser || !isDataLoaded) return;
      const saveCurrentState = () => {
          if (userRef.current) {
              const stateToSave = { ...muzaStateRef.current, lastViewMode: viewModeRef.current };
              saveLocalData(userRef.current, messagesRef.current, hyperbitsRef.current, stateToSave, systemLogsRef.current);
              setLastSaved(Date.now());
          }
      };
      const saveInterval = setInterval(saveCurrentState, 5000); 
      const handleUnload = () => { saveCurrentState(); };
      window.addEventListener('beforeunload', handleUnload);
      return () => {
          clearInterval(saveInterval);
          window.removeEventListener('beforeunload', handleUnload);
          saveCurrentState();
      };
  }, [currentUser, isDataLoaded]);

  const handleLogin = (username: string) => {
      localStorage.setItem('muza_user', username);
      setCurrentUser(username);
  };

  const handleLogout = () => {
      if (currentUser) {
          const stateToSave = { ...muzaStateRef.current, lastViewMode: viewModeRef.current };
          saveLocalData(currentUser, messagesRef.current, hyperbitsRef.current, stateToSave, systemLogsRef.current);
      }
      setIsDataLoaded(false); 
      localStorage.removeItem('muza_user');
      setCurrentUser(null);
      setMessages([]);
      setHyperbits([]);
      setMuzaState(INITIAL_STATE);
      setViewMode('FOCUS');
  };

  const addHyperbit = (hb: HyperBit, customAward?: { title: string, description: string, icon: string }) => {
    setHyperbits(prev => [...prev, { ...hb, synced: muzaState.isOnline }]);
    const { newState, unlocked } = processExperience(muzaState, hb.layer === 'IMPORTED_QUANTUM' ? 'IMPORT' : 'MESSAGE', hb.type);
    if (customAward) newState.progression.customAwards.push({ id: Date.now().toString(), title: customAward.title, description: customAward.description, icon: customAward.icon, awardedAt: Date.now() });
    setMuzaState(newState);
    if (unlocked.length > 0) unlocked.forEach(id => addSystemLog(`РАЗБЛОКИРОВАНО: ${id}`, 'KERNEL', 'SUCCESS'));
  };

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, { ...msg, synced: muzaState.isOnline }]);
  };

  const hashString = (input: string) => {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
          hash = (hash << 5) - hash + input.charCodeAt(i);
          hash |= 0;
      }
      return Math.abs(hash).toString(16);
  };

  const forgeMemoryCrystal = () => {
      const snapshotState = { ...muzaStateRef.current, lastViewMode: viewModeRef.current };
      const stateSnapshot = {
          ...snapshotState,
          messages: messagesRef.current.slice(-50),
          hyperbits: hyperbitsRef.current.slice(-100),
          systemLogs: systemLogsRef.current.slice(-50)
      };
      const signature = hashString(JSON.stringify(stateSnapshot).slice(0, 5000));
      const crystal: MemoryCrystal = {
          id: `crystal-${Date.now()}`,
          timestamp: Date.now(),
          signature,
          stateSnapshot
      };
      setMuzaState(prev => ({
          ...prev,
          memoryCrystals: [...(prev.memoryCrystals || []), crystal]
      }));
      addEventLog('CRYSTAL_FORGED', 'Кристалл памяти создан.');
      addSystemLog('Кристалл памяти создан.', 'KERNEL', 'SUCCESS');
  };

  const loadMemoryCrystal = (crystal: MemoryCrystal) => {
      const snapshot = crystal.stateSnapshot || ({} as any);
      const merged: MuzaState = {
          ...INITIAL_STATE,
          ...snapshot,
          localConfig: { ...INITIAL_STATE.localConfig, ...(snapshot.localConfig || {}) },
          progression: { ...INITIAL_STATE.progression, ...(snapshot.progression || {}), skills: { ...INITIAL_STATE.progression.skills, ...(snapshot.progression?.skills || {}) } },
          design: { ...INITIAL_STATE.design, ...(snapshot.design || {}), navOverrides: { ...INITIAL_STATE.design.navOverrides, ...(snapshot.design?.navOverrides || {}) } },
          ideas: snapshot.ideas || [],
          genesisPatches: snapshot.genesisPatches || [],
          isOnline: navigator.onLine
      };
      setMuzaState(prev => ({
          ...merged,
          memoryCrystals: prev.memoryCrystals || [],
          eventLog: [...(prev.eventLog || []), { id: `evt-${Date.now()}`, timestamp: Date.now(), type: 'CRYSTAL_LOADED', description: 'Кристалл памяти загружен.' }]
      }));
      if (snapshot.messages) setMessages(snapshot.messages);
      if (snapshot.hyperbits) setHyperbits(snapshot.hyperbits);
      if (snapshot.systemLogs) setSystemLogs(snapshot.systemLogs);
      addSystemLog('Кристалл памяти загружен.', 'KERNEL', 'SUCCESS');
  };

  const deleteMemoryCrystal = (id: string) => {
      setMuzaState(prev => ({
          ...prev,
          memoryCrystals: (prev.memoryCrystals || []).filter(c => c.id !== id)
      }));
      addEventLog('CRYSTAL_DELETED', 'Кристалл удалён.');
  };

  const importMemoryCrystal = (jsonString: string): boolean => {
      try {
          const parsed = JSON.parse(jsonString) as MemoryCrystal;
          if (!parsed || !parsed.id || !parsed.stateSnapshot) return false;
          setMuzaState(prev => ({
              ...prev,
              memoryCrystals: [...(prev.memoryCrystals || []), parsed]
          }));
          addEventLog('CRYSTAL_IMPORTED', 'Кристалл памяти импортирован.');
          return true;
      } catch (e) {
          return false;
      }
  };

  const wipeAllCrystals = () => {
      if (!confirm('Разбить все кристаллы памяти? Это действие нельзя отменить.')) return;
      setMuzaState(prev => ({ ...prev, memoryCrystals: [] }));
      addEventLog('CRYSTAL_WIPED', 'Архив кристаллов очищен.');
      addSystemLog('Архив кристаллов очищен.', 'KERNEL', 'WARN');
  };

  const startImmersionFromCrystal = (crystal: MemoryCrystal) => {
      loadMemoryCrystal(crystal);
      setViewMode('IMMERSIVE_SPACE');
  };

  const handleAiCommand = (cmd: MuzaCommand) => {
      addSystemLog(`OS Command Received: ${cmd.type}`, 'AI', 'WARN');
      
      if (cmd.type === 'NAVIGATE') setViewMode(cmd.payload as ViewMode);
      
      if (cmd.type === 'THEME') setMuzaState(prev => ({ ...prev, design: { ...prev.design, activeTheme: cmd.payload } }));
      
      if (cmd.type === 'ENERGY') setMuzaState(prev => ({ ...prev, energyLevel: cmd.payload }));
      
      if (cmd.type === 'GENESIS_EVOLVE') {
          const patches = cmd.payload as GenesisPatch[];
          const newPatches: GenesisPatch[] = patches.map(p => ({
              ...p, 
              id: Date.now().toString() + Math.random(),
              status: 'ACTIVE' as const,
              version: 1,
              createdAt: Date.now()
          }));
          setMuzaState(prev => ({
              ...prev,
              genesisPatches: [...(prev.genesisPatches || []), ...newPatches]
          }));
          addSystemLog(`ГЕНЕЗИС: Применено ${patches.length} патчей.`, 'AI', 'SUCCESS');
      }

      if (cmd.type === 'SYNTHESIZE_THEME') {
          const themeConfig = cmd.payload as ThemeConfig;
          if (themeConfig && themeConfig.id) {
              setMuzaState(prev => ({
                  ...prev,
                  design: {
                      ...prev.design,
                      customThemes: { ...prev.design.customThemes, [themeConfig.id]: themeConfig },
                      unlockedThemes: [...prev.design.unlockedThemes, themeConfig.id],
                      activeTheme: themeConfig.id
                  }
              }));
              addSystemLog(`ТЕМА СИНТЕЗИРОВАНА: ${themeConfig.name}`, 'AI', 'SUCCESS');
          }
      }
  };

  // Recycle Logic (Injected into NeuralStudio via hyperbits/state access in a real app, 
  // but here handled if NeuralStudio modifies state directly)
  // We can add a watcher for genesisPatches changes to detect removals.
  useEffect(() => {
      // Simple heuristic: If patch count decreased, assume recycling occurred.
      // This is imperfect in a React Effect but sufficient for visual feedback simulation.
  }, [muzaState.genesisPatches]);

  if (!currentUser) return <Auth language={language} onLogin={handleLogin} />;

  if (!isDataLoaded) {
      return (
          <div className="flex h-screen w-full bg-slate-950 items-center justify-center flex-col gap-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              <div className="text-cyan-400 font-mono text-sm animate-pulse">ВОССТАНОВЛЕНИЕ НЕЙРО-МАТРИЦЫ...</div>
          </div>
      );
  }

  const eventLog = muzaState.eventLog || [];
  const memoryCrystals = muzaState.memoryCrystals || [];
  const logosBits: HyperBit[] = (muzaState.axioms || []).map((text, idx) => ({
      id: `logos-${idx}`,
      content: text,
      type: ConsciousnessType.PHILOSOPHICAL,
      layer: 'LOGOS',
      energy: 0.7,
      resonance: 0.9,
      timestamp: Date.now() - (((muzaState.axioms?.length || 0) - idx) * 1000),
      connections: [],
      provider: 'USER' as any,
      isLogos: true
  }));

  const isSplitMode = viewMode === 'SPLIT_CODE';

  return (
    <div className="flex h-screen w-full text-slate-200 overflow-hidden font-sans transition-colors duration-500" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--color-text)' }}>
      <Navigation
        viewMode={viewMode}
        setViewMode={setViewMode}
        language={language}
        setLanguage={setLanguage}
        onLogout={handleLogout}
        overrides={muzaState.design?.navOverrides}
        status={{ isOnline: muzaState.isOnline, lastSaved }}
      />
      
      {/* GENESIS LAYER: ROOT (Global Injections) */}
      <div className="absolute top-4 left-20 z-50 pointer-events-auto">
          <GenesisRuntime patches={muzaState.genesisPatches || []} target="root" context={{ state: muzaState, setState: setMuzaState }} />
      </div>

      {dailyRewardClaimed && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-900 border border-yellow-500 p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                  <h2 className="text-2xl font-bold text-white mb-2">{t.dailyReward.title}</h2>
                  <p className="text-yellow-400 text-xl font-mono mb-6">+{dailyRewardClaimed.amount} {t.dailyReward.flux}</p>
                  <button onClick={() => setDailyRewardClaimed(null)} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl">{t.dailyReward.claim}</button>
              </div>
          </div>
      )}

      <div className="md:hidden">
          <Navigation
            viewMode={viewMode}
            setViewMode={setViewMode}
            isMobile={true}
            language={language}
            setLanguage={setLanguage}
            onLogout={handleLogout}
            overrides={muzaState.design?.navOverrides}
            status={{ isOnline: muzaState.isOnline, lastSaved }}
          />
      </div>

      <main className="flex-1 relative flex flex-row h-full overflow-hidden">
        {viewMode === 'SYNESTHESIA' && <div className="absolute inset-0 z-50 bg-black animate-in fade-in"><Synesthesia state={muzaState} hyperbits={hyperbits} language={language} /><button onClick={() => setViewMode('FOCUS')} className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white z-50">{t.common.close}</button></div>}
        {viewMode === 'DATA_VAULT' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in overflow-y-auto"><DataVault eventLog={eventLog} crystals={memoryCrystals} genesisPatches={muzaState.genesisPatches || []} logosBits={logosBits} onForge={forgeMemoryCrystal} onLoad={loadMemoryCrystal} onDelete={deleteMemoryCrystal} onImport={importMemoryCrystal} onWipeAll={wipeAllCrystals} onStartImmersion={startImmersionFromCrystal} /><button onClick={() => setViewMode('FOCUS')} className="fixed top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.close}</button></div>}

        {viewMode === 'DESIGN_STUDIO' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in"><DesignStudio state={muzaState} setMuzaState={setMuzaState} language={language} onLog={(msg) => addSystemLog(msg, 'USER', 'SUCCESS')} /><button onClick={() => setViewMode('FOCUS')} className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white z-50">{t.common.exit}</button></div>}
        {viewMode === 'MUSIC_LAB' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in"><MusicLab language={language} onLog={(msg) => addSystemLog(msg, 'AI', 'SUCCESS')} state={muzaState} /><button onClick={() => setViewMode('FOCUS')} className="absolute top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.close}</button></div>}
        {viewMode === 'EVOLUTION' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in"><Evolution progression={muzaState.progression} language={language} onUnlock={(id, cost) => { if(muzaState.progression.xp >= cost) setMuzaState(p => ({...p, progression: {...p.progression, xp: p.progression.xp - cost, unlockedNodes: [...(p.progression.unlockedNodes||[]), id]}})) }} /><button onClick={() => setViewMode('FOCUS')} className="absolute top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.close}</button></div>}
        {viewMode === 'IMMERSIVE_SPACE' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in"><Space hyperbits={hyperbits} language={language} /><button onClick={() => setViewMode('FOCUS')} className="absolute top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.close}</button></div>}
        {viewMode === 'MATRIX' && <div className="absolute inset-0 z-50 bg-black animate-in fade-in"><MatrixVision state={muzaState} hyperbits={hyperbits} language={language} /><button onClick={() => setViewMode('FOCUS')} className="absolute top-6 right-6 px-4 py-2 bg-black/60 rounded-lg text-white z-50">{t.common.close}</button></div>}
        {viewMode === 'WIKI' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in overflow-y-auto"><Wiki language={language} /><button onClick={() => setViewMode('FOCUS')} className="fixed top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.close}</button></div>}
        {viewMode === 'DEPLOY' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in overflow-y-auto"><Deploy language={language} onLog={(msg, type) => addSystemLog(msg, 'KERNEL', type)} messages={messages} hyperbits={hyperbits} systemLogs={systemLogs} currentUser={currentUser} /><button onClick={() => setViewMode('FOCUS')} className="fixed top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.return}</button></div>}
        {viewMode === 'BRIDGE_UI' && <div className="absolute inset-0 z-50 bg-black animate-in fade-in"><BridgeUI language={language} /><button onClick={() => setViewMode('FOCUS')} className="fixed top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.close}</button></div>}
        {viewMode === 'LEAD_INBOX' && (
          <div className="absolute inset-0 z-50 bg-black animate-in fade-in">
            <iframe
              src="http://127.0.0.1:8787/"
              className="w-full h-full border-0"
              title={language === 'ru' ? 'Кабинет заявок' : 'Lead Inbox'}
            />
            <button onClick={() => setViewMode('FOCUS')} className="fixed top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.close}</button>
          </div>
        )}
        {viewMode === 'SETTINGS' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in overflow-y-auto"><Settings state={muzaState} setMuzaState={setMuzaState} onLog={(msg) => addSystemLog(msg, 'USER', 'INFO')} currentUser={currentUser} language={language} /><button onClick={() => setViewMode('FOCUS')} className="fixed top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.return}</button></div>}
        {/* Updated Neural Studio prop: updateHyperbit */}
        {viewMode === 'NEURAL_STUDIO' && <div className="absolute inset-0 z-50 bg-slate-950 animate-in fade-in overflow-y-auto"><NeuralStudio state={muzaState} setMuzaState={setMuzaState} onLog={(msg) => addSystemLog(msg, 'AI', 'SUCCESS')} language={language} hyperbits={hyperbits} updateHyperbit={(id, u) => setHyperbits(prev => prev.map(h => h.id===id ? {...h, ...u} : h))} /><button onClick={() => setViewMode('FOCUS')} className="fixed top-6 right-6 px-4 py-2 bg-slate-800 rounded-lg text-white z-50">{t.common.return}</button></div>}

        <div className={`flex-1 flex h-full transition-all duration-300 ${isSplitMode ? 'w-full' : 'w-auto'}`}>
            <div className={`flex flex-col h-full border-r border-slate-800/50 transition-all duration-300 ${isSplitMode ? 'w-full md:w-1/2' : 'w-full'} relative`}>
                <GenesisRuntime patches={muzaState.genesisPatches || []} target="sidebar" context={{ state: muzaState, setState: setMuzaState }} />
                <GenesisRuntime patches={muzaState.genesisPatches || []} target="chat_header" context={{ state: muzaState, setState: setMuzaState }} />
                <Chat muzaState={muzaState} setMuzaState={setMuzaState} addHyperbit={addHyperbit} messages={messages} addMessage={addMessage} setMessages={setMessages} language={language} onThinkingChange={setIsThinking} onCommand={handleAiCommand} />
            </div>
            {isSplitMode && <div className="hidden md:flex w-1/2 h-full bg-slate-925 flex-col animate-in slide-in-from-right border-l border-slate-800 shadow-2xl z-20"><CodeLab language={language} onLog={(msg, type) => addSystemLog(msg, 'KERNEL', type)} currentUser={currentUser} /></div>}
        </div>

        {!isSplitMode && !['IMMERSIVE_SPACE','WIKI','DEPLOY','SETTINGS','NEURAL_STUDIO', 'MATRIX', 'EVOLUTION', 'MUSIC_LAB', 'DESIGN_STUDIO', 'SYNESTHESIA', 'DATA_VAULT'].includes(viewMode) && (
            isHudHidden ? (
                <div className="hidden lg:flex w-6 flex-col items-center justify-center border-l border-slate-800/60 bg-slate-950/80">
                    <button
                        onClick={() => setIsHudHidden(false)}
                        className="p-1 rounded-full bg-slate-800 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        aria-label={language === 'ru' ? 'Показать панель' : 'Show panel'}
                        title={language === 'ru' ? 'Показать панель' : 'Show panel'}
                    >
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <div className="hidden lg:flex w-80 flex-col border-l border-slate-800 shrink-0 z-10 transition-all duration-300 relative" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setIsHudHidden(true)}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 rounded-full p-0.5 z-20 hover:bg-slate-700 text-slate-400"
                        aria-label={language === 'ru' ? 'Скрыть панель' : 'Hide panel'}
                        title={language === 'ru' ? 'Скрыть панель' : 'Hide panel'}
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>
                    <div className={`border-b border-slate-800 relative transition-all duration-300 ${isMonitorCollapsed ? 'h-[90%]' : 'h-64'}`}><VisualCortex hyperbits={hyperbits} language={language} isThinking={isThinking} /></div>
                    <div className={`flex-1 min-h-0 relative flex flex-col transition-all duration-300 ${isMonitorCollapsed ? 'h-[10%]' : ''}`}>
                        <button onClick={() => setIsMonitorCollapsed(!isMonitorCollapsed)} className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-full p-0.5 z-20 hover:bg-slate-700 text-slate-400">{isMonitorCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</button>
                        {!isMonitorCollapsed && <SystemMonitor language={language} systemLogs={systemLogs} />}
                    </div>
                </div>
            )
        )}
        {nodeFocus && (
            <div className="fixed bottom-4 right-4 z-[999] max-w-xs">
                <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur">
                    <div className="text-xs text-cyan-300 font-bold">{nodeFocus.title}</div>
                    <div className="text-[11px] text-slate-200 mt-1 whitespace-pre-wrap">{nodeFocus.text}</div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
