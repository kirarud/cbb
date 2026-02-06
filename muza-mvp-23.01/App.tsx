
import React, { useState, useEffect, useCallback } from 'react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';

import { MuzaState, ChatMessage, HyperBit, Language, ViewMode, SystemLog, EmotionType } from './types';
import { KERNEL_VERSION, TRANSLATIONS } from './constants';
import { loadLocalData, saveLocalData } from './services/storageService';
import { muzaAI } from './services/muzaAIService';

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
  design: { activeTheme: 'DEFAULT', unlockedThemes: ['DEFAULT'], fluxBalance: 100 },
  genesisPatches: [],
  chatConfig: { detailLevel: 'BALANCED', synthesisStrategy: 'EVOLVED', personaMode: 'DEFAULT' },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [muzaState, setMuzaState] = useState<MuzaState>(DEFAULT_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hyperbits, setHyperbits] = useState<HyperBit[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [language, setLanguage] = useState<Language>('ru');
  const [viewMode, setViewMode] = useState<ViewMode>('FOCUS');
  const [isThinking, setIsThinking] = useState(false);
  
  const addLog = useCallback((message: string, type: SystemLog['type'] = 'INFO', source: SystemLog['source'] = 'SYSTEM') => {
      setSystemLogs(prev => [...prev, { id: Date.now().toString(), timestamp: Date.now(), message, type, source }].slice(-50));
  }, []);

  useEffect(() => {
    if (currentUser) {
      try {
        const data = loadLocalData(currentUser);
        if (data.state) {
          setMuzaState({
            ...DEFAULT_STATE,
            ...data.state,
            kernelVersion: KERNEL_VERSION,
            // Защита от поврежденных числовых данных в localStorage
            energyLevel: Number.isFinite(data.state.energyLevel) ? data.state.energyLevel : 0.85,
            coherence: Number.isFinite(data.state.coherence) ? data.state.coherence : 0.95,
          });
        }
        setMessages(data.messages || []);
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
      saveLocalData(currentUser, messages, hyperbits, muzaState, systemLogs);
    }
  }, [messages, hyperbits, muzaState, systemLogs, currentUser]);
  
  // Цикл жизни ядра: Динамическое изменение когерентности и энергии
  useEffect(() => {
      const timer = setInterval(() => {
          setMuzaState(prev => {
              const newUptime = (prev.uptime || 0) + 1;
              const currentCoherence = Number.isFinite(prev.coherence) ? prev.coherence : 0.95;
              const currentEnergy = Number.isFinite(prev.energyLevel) ? prev.energyLevel : 0.85;
              
              const coherenceShift = (Math.random() - 0.5) * 0.005;
              const energyShift = isThinking ? -0.002 : 0.0005;

              let nextEmotion = prev.activeEmotion;
              let nextCoherence = Math.min(1, Math.max(0.3, currentCoherence + coherenceShift));
              let nextEnergy = Math.min(1, Math.max(0.1, currentEnergy + energyShift));

              if (newUptime % 60 === 0 && !isThinking) {
                  const reflection = muzaAI.deepReflect();
                  if (reflection) {
                      addLog(`Синтез: "${reflection.thought}"`, 'INFO', 'CORE');
                      nextEmotion = reflection.type;
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
  }, [isThinking, addLog]);

  const handleLogin = (username: string) => { 
    setCurrentUser(username); 
    setViewMode('FOCUS'); 
  };

  const renderView = () => {
    if (!TRANSLATIONS[language]) return null;

    switch(viewMode) {
        case 'FOCUS': return <Chat muzaState={muzaState} setMuzaState={setMuzaState} addHyperbit={(hb) => setHyperbits(p => [...p, hb])} messages={messages} addMessage={(m) => setMessages(p => [...p, m])} language={language} hyperbits={hyperbits} isThinking={isThinking} onThinkingChange={setIsThinking} shareToHive={() => {}} addGenesisPatch={() => {}} setViewMode={setViewMode} />;
        case 'IMMERSIVE_SPACE': return <Space language={language} />;
        case 'INSIGHTS': return <Insights hyperbits={hyperbits} language={language} />;
        case 'MATRIX': return <MatrixVision state={muzaState} hyperbits={hyperbits} language={language} />;
        case 'SYNESTHESIA': return <Synesthesia state={muzaState} hyperbits={hyperbits} language={language} />;
        case 'CODELAB': return <CodeLab language={language} onLog={(msg, type) => addLog(msg, type, 'CODE')} currentUser={currentUser} />;
        case 'EVOLUTION': return <Evolution muzaState={muzaState} hyperbits={hyperbits} language={language} />;
        case 'SETTINGS': return <Settings state={muzaState} setMuzaState={setMuzaState} onLog={addLog} currentUser={currentUser} language={language} systemLogs={systemLogs} />;
        default: return <Chat muzaState={muzaState} setMuzaState={setMuzaState} addHyperbit={(hb) => setHyperbits(p => [...p, hb])} messages={messages} addMessage={(m) => setMessages(p => [...p, m])} language={language} hyperbits={hyperbits} isThinking={isThinking} onThinkingChange={setIsThinking} shareToHive={() => {}} addGenesisPatch={() => {}} setViewMode={setViewMode} />;
    }
  }

  if (!currentUser) return <Auth language={language} onLogin={handleLogin} />;

  return (
    <ErrorBoundary>
        <div className="h-screen w-screen bg-[#010409] text-slate-300 font-sans overflow-hidden selection:bg-cyan-500/30">
            <main className="h-full w-full relative">{renderView()}</main>
            <Navigation viewMode={viewMode} setViewMode={setViewMode} language={language} setLanguage={setLanguage} onLogout={() => setCurrentUser(null)} />
        </div>
    </ErrorBoundary>
  );
}
