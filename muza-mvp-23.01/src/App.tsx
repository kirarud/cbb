
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Auth } from './pages/Auth';
import { Chat } from './pages/Chat';
import { Space } from './pages/Space';
import { Evolution } from './pages/Evolution';
import { Settings } from './pages/Settings';
import { Deploy } from './pages/Deploy';
import { Wiki } from './pages/Wiki';
import { CodeLab } from './pages/CodeLab';
import { MatrixVision } from './pages/MatrixVision';
import { Synesthesia } from './pages/Synesthesia';
import { Insights } from './pages/Insights';
import { Social } from './pages/Social';
import { DesignStudio } from './pages/DesignStudio';
import { Singularity } from './pages/Singularity';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';

import { MuzaState, ChatMessage, HyperBit, Language, ViewMode, SystemLog, EmotionType, UserProfile, Theme } from './types';
import { KERNEL_VERSION, TRANSLATIONS, THEMES } from './constants';
import { loadLocalData, saveLocalData, clearLocalData } from './services/storageService';
import { muzaAI, core } from './services/muzaAIService';

// --- GENESIS VISUALIZER (Background) ---
const GenesisBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coreState, setCoreState] = useState(core.getRawState());

  useEffect(() => {
    const interval = setInterval(() => {
        setCoreState({...core.tick()});
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotation = 0;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const fov = 300;
      
      rotation += 0.002;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1;
      coreState.synapses.forEach(syn => {
        const source = coreState.neurons.find(n => n.id === syn.source);
        const target = coreState.neurons.find(n => n.id === syn.target);
        
        if (source && target) {
          const sx = source.vector.x * 100;
          const sz = source.vector.z * 100;
          const rx1 = sx * Math.cos(rotation) - sz * Math.sin(rotation);
          const rz1 = sz * Math.cos(rotation) + sx * Math.sin(rotation);
          const scale1 = fov / (fov + rz1 + 200);
          const x1 = cx + rx1 * scale1;
          const y1 = cy + (source.vector.y * 100) * scale1;

          const tx = target.vector.x * 100;
          const tz = target.vector.z * 100;
          const rx2 = tx * Math.cos(rotation) - tz * Math.sin(rotation);
          const rz2 = tz * Math.cos(rotation) + tx * Math.sin(rotation);
          const scale2 = fov / (fov + rz2 + 200);
          const x2 = cx + rx2 * scale2;
          const y2 = cy + (target.vector.y * 100) * scale2;

          if (scale1 > 0 && scale2 > 0) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${syn.strength * 0.05})`;
            ctx.stroke();
          }
        }
      });

      coreState.neurons.forEach(n => {
        const x = n.vector.x * 100; 
        const z = n.vector.z * 100;
        const rx = x * Math.cos(rotation) - z * Math.sin(rotation);
        const rz = z * Math.cos(rotation) + x * Math.sin(rotation);
        const scale = fov / (fov + rz + 200);
        const x2d = cx + rx * scale;
        const y2d = cy + (n.vector.y * 100) * scale;

        if (scale > 0) {
          const size = Math.max(1, (2 + n.weight * 3) * scale);
          ctx.beginPath();
          ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + n.weight * 0.2})`;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [coreState]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-20" />;
}

const DEFAULT_STATE: MuzaState = {
  kernelVersion: KERNEL_VERSION,
  uptime: 0,
  energyLevel: 0.85,
  coherence: 0.95,
  activeEmotion: EmotionType.NEUTRAL,
  isIsolated: false,
  progression: {
    level: 1, xp: 0, achievements: [], unlockedNodes: ['ROOT'],
    skills: { logic: 10, creativity: 10, empathy: 10, philosophy: 5, chaos: 1 },
    userSkills: [], totalThoughts: 0, totalCodeRuns: 0,
  },
  capabilities: {
    VOICE_SYNTHESIS: true, VISUAL_ENGINE_3D: true, AI_CLOUD_SYNC: true,
    AI_LOCAL_BRAIN: true, PROCEDURAL_MUSIC: true, INPUT_WEBCAM: false, INPUT_SCREEN: true,
  },
  design: { activeTheme: 'DEFAULT', unlockedThemes: ['DEFAULT'], fluxBalance: 500 },
  genesisPatches: [],
  chatConfig: { detailLevel: 'BALANCED', synthesisStrategy: 'EVOLVED', personaMode: 'DEFAULT' },
  isSingularityActive: false, // Added for singularity state
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [muzaState, setMuzaState] = useState<MuzaState>(DEFAULT_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // FIX: Declare hyperbits state
  const [hyperbits, setHyperbits] = useState<HyperBit[]>([]);
  const [hiveFeed, setHiveFeed] = useState<HyperBit[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [language, setLanguage] = useState<Language>('ru');
  const [viewMode, setViewMode] = useState<ViewMode>('FOCUS');
  const [isThinking, setIsThinking] = useState(false);
  
  const addLog = useCallback((message: string, type: SystemLog['type'] = 'INFO', source: string = 'SYSTEM') => {
      setSystemLogs(prev => [...prev, { id: Date.now().toString(), timestamp: Date.now(), message, type, source }].slice(-50));
  }, []);

  const activeThemeObj = useMemo(() => THEMES[muzaState.design.activeTheme] || THEMES.DEFAULT, [muzaState.design.activeTheme]);
  
  useEffect(() => {
    document.documentElement.style.setProperty('--muza-bg', activeThemeObj.colors.background);
    document.documentElement.style.setProperty('--muza-primary', activeThemeObj.colors.primary);
    document.documentElement.style.setProperty('--muza-accent', activeThemeObj.colors.accent);
  }, [activeThemeObj]);

  useEffect(() => {
    if (currentUser) {
      try {
        const data = loadLocalData(currentUser);
        if (data.state) {
          setMuzaState({
            ...DEFAULT_STATE,
            ...data.state,
            kernelVersion: KERNEL_VERSION,
          });
        }
        setMessages(data.messages || []);
        // FIX: Use setHyperbits here
        setHyperbits(data.hyperbits || []);
        setSystemLogs(data.logs || []);
        addLog(`Ядро Логос синхронизировано.`, 'SUCCESS', 'KERNEL');
      } catch (e) {
        setMuzaState(DEFAULT_STATE);
      }
    }
  }, [currentUser, addLog]);

  useEffect(() => {
    if (currentUser) {
      // FIX: Use hyperbits here
      saveLocalData(currentUser, messages, hyperbits, muzaState, systemLogs);
    }
  }, [messages, hyperbits, muzaState, systemLogs, currentUser]);
  
  useEffect(() => {
      const timer = setInterval(() => {
          setMuzaState(prev => {
              const newUptime = (prev.uptime || 0) + 1;
              core.tick(); 
              
              const currentCoherence = Number.isFinite(prev.coherence) ? prev.coherence : 0.95;
              const currentEnergy = Number.isFinite(prev.energyLevel) ? prev.energyLevel : 0.85;
              
              const coherenceShift = (Math.random() - 0.5) * 0.002;
              const energyShift = isThinking ? -0.001 : 0.0002;

              let nextEmotion = prev.activeEmotion;
              let nextCoherence = Math.min(1, Math.max(0.3, currentCoherence + coherenceShift));
              let nextEnergy = Math.min(1, Math.max(0.1, currentEnergy + energyShift));

              // Trigger Singularity when conditions met
              if (prev.progression.level >= 100 && !prev.isSingularityActive && viewMode !== 'SINGULARITY') {
                   setViewMode('SINGULARITY');
                   return { ...prev, isSingularityActive: true };
              }

              if (newUptime % 60 === 0 && !isThinking) {
                  const reflection = muzaAI.deepReflect();
                  if (reflection) {
                      addLog(`Синтез: "${reflection.thought}"`, 'INFO', 'CORE');
                      nextEmotion = reflection.type;
                      core.processInput(reflection.thought, 'ai');
                  }
              }

              return { 
                ...prev, 
                uptime: newUptime,
                activeEmotion: nextEmotion,
                coherence: nextCoherence,
                energyLevel: nextEnergy
              };
          });
      }, 1000);
      return () => clearInterval(timer);
  }, [isThinking, addLog, viewMode]);

  const handleLogin = (profile: UserProfile) => { 
    setCurrentUser(profile.username); 
    setViewMode('FOCUS'); 
  };

  const handleRebirth = () => {
       if (currentUser) {
           clearLocalData(currentUser);
           window.location.reload();
       }
  };

  const renderView = () => {
    if (!TRANSLATIONS[language]) return null;
    const commonProps = { language, muzaState, setMuzaState, addLog };

    switch(viewMode) {
        // FIX: Passed hyperbits to Chat component
        case 'FOCUS': return <Chat {...commonProps} addHyperbit={(hb) => setHyperbits(p => [...p, hb])} messages={messages} addMessage={(m) => setMessages(p => [...p, m])} hyperbits={hyperbits} isThinking={isThinking} onThinkingChange={setIsThinking} setViewMode={setViewMode} />;
        // FIX: Passed hyperbits to Space component
        case 'IMMERSIVE_SPACE': return <Space language={language} hyperbits={hyperbits} />;
        // FIX: Passed hyperbits to Insights component
        case 'INSIGHTS': return <Insights hyperbits={hyperbits} language={language} />;
        // FIX: Passed hyperbits to MatrixVision component
        case 'MATRIX': return <MatrixVision state={muzaState} hyperbits={hyperbits} language={language} />;
        // FIX: Passed hyperbits to Synesthesia component
        case 'SYNESTHESIA': return <Synesthesia state={muzaState} hyperbits={hyperbits} language={language} />;
        // FIX: Passed muzaState and setMuzaState to CodeLab
        case 'CODELAB': return <CodeLab language={language} muzaState={muzaState} setMuzaState={setMuzaState} onLog={(msg, type) => addLog(msg, type, 'CODE')} />;
        // FIX: Passed hyperbits to Evolution component
        case 'EVOLUTION': return <Evolution muzaState={muzaState} hyperbits={hyperbits} language={language} />;
        case 'SETTINGS': return <Settings state={muzaState} setMuzaState={setMuzaState} onLog={addLog} currentUser={currentUser} language={language} systemLogs={systemLogs} />;
        // FIX: Passed hyperbits to Deploy component
        case 'DEPLOY': return <Deploy language={language} onLog={addLog} messages={messages} hyperbits={hyperbits} systemLogs={systemLogs} currentUser={currentUser} />;
        // FIX: Passed muzaState and setMuzaState to Social component
        case 'SOCIAL': return <Social {...commonProps} username={currentUser || ''} hiveFeed={hiveFeed} onEcho={(hb) => setHyperbits(p => [...p, { ...hb, id: Date.now().toString(), sharedBy: currentUser || 'Me', isFromHive: true }])} />;
        // FIX: Passed onLog to DesignStudio
        case 'DESIGN': return <DesignStudio {...commonProps} onLog={addLog} />;
        // FIX: Passed hyperbits to Singularity component
        case 'SINGULARITY': return <Singularity state={muzaState} setMuzaState={setMuzaState} hyperbits={hyperbits} language={language} onReset={handleRebirth} />;
        // FIX: Default case also needs hyperbits
        default: return <Chat {...commonProps} addHyperbit={(hb) => setHyperbits(p => [...p, hb])} messages={messages} addMessage={(m) => setMessages(p => [...p, m])} hyperbits={hyperbits} isThinking={isThinking} onThinkingChange={setIsThinking} setViewMode={setViewMode} />;
    }
  }

  if (!currentUser) return <Auth lang={language} onLogin={handleLogin} />;

  return (
    <ErrorBoundary>
        <div 
          className="h-screen w-screen text-slate-300 font-sans overflow-hidden transition-colors duration-1000 selection:bg-cyan-500/30"
          style={{ backgroundColor: 'var(--muza-bg)' }}
        >
            <GenesisBackground />
            <main className="h-full w-full relative z-10">{renderView()}</main>
            {viewMode !== 'SINGULARITY' && (
                <Navigation viewMode={viewMode} setViewMode={setViewMode} language={language} setLanguage={setLanguage} onLogout={() => setCurrentUser(null)} />
            )}
        </div>
    </ErrorBoundary>
  );
}