
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Brain, BrainCircuit, Cloud, Cpu, Activity, ShieldCheck, Zap } from 'lucide-react';
import { ChatMessage, MuzaState, HyperBit, Language, ConsciousnessType, EmotionType, AIProvider, ViewMode } from '../types';
import { generateMuzaResponse } from '../services/geminiService';
import { VisualCortex } from '../components/VisualCortex';
import { TRANSLATIONS } from '../constants';
import { calculateOptics } from '../services/opticsEngine';
import { processExperience } from '../services/progressionService';
import { muzaAI } from '../services/muzaAIService';

interface ChatProps {
  muzaState: MuzaState;
  setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
  addHyperbit: (hb: HyperBit) => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  language: Language;
  onThinkingChange?: (isThinking: boolean) => void;
  hyperbits: HyperBit[]; 
  isThinking: boolean;
  shareToHive: (hyperbitId: string) => void;
  addGenesisPatch: (suggestion: string) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const Chat: React.FC<ChatProps> = ({ muzaState, setMuzaState, addHyperbit, messages, addMessage, language, onThinkingChange, hyperbits, isThinking, shareToHive, addGenesisPatch, setViewMode }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AIProvider>('GEMINI');
  
  const endRef = useRef<HTMLDivElement>(null);
  const t_chat = TRANSLATIONS[language].chat;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    onThinkingChange?.(true);
    const text = input;
    setInput('');

    muzaAI.learn(text, 0.7, 0.2);

    const userHyperbit: HyperBit = {
        id: Date.now().toString() + '-user',
        content: text,
        type: ConsciousnessType.QUESTION,
        layer: 'USER_INPUT',
        optics: calculateOptics(ConsciousnessType.QUESTION, 0.8, text),
        energy: 0.8, resonance: 1.0, decay: 0.01, timestamp: Date.now(),
        connections: [], provider: 'USER',
        importance: 0.6, emotionalCharge: 0.2
    };
    addHyperbit(userHyperbit);
    addMessage({ id: userHyperbit.id, sender: 'User', text, timestamp: Date.now() });

    try {
        const response = await generateMuzaResponse(messages, text, language, activeProvider, muzaState);
        
        muzaAI.learn(response.text, response.energy_cost, response.emotion === 'EXCITED' ? 0.8 : 0.4);

        const aiHyperbit: HyperBit = {
            id: (Date.now() + 1).toString() + '-ai',
            content: response.text,
            type: response.type || ConsciousnessType.GENERAL,
            layer: 'AI_RESPONSE',
            optics: calculateOptics(response.type || ConsciousnessType.GENERAL, response.energy_cost || 0.5, response.text),
            energy: response.energy_cost || 0.5,
            resonance: 1.0, decay: 0.01, timestamp: Date.now(),
            connections: [userHyperbit.id], provider: response.usedProvider,
            subThoughts: response.subThoughts,
            importance: response.energy_cost, emotionalCharge: 0.5
        };
        addHyperbit(aiHyperbit);
        addMessage({ id: aiHyperbit.id, sender: 'Muza', text: response.text, timestamp: Date.now(), provider: response.usedProvider });

        const { newState } = processExperience(muzaState, 'MESSAGE', aiHyperbit.type);
        setMuzaState(newState);
        
    } catch (e) {
        addMessage({ id: Date.now().toString(), sender: 'System', text: "Signal corrupted.", timestamp: Date.now() });
    } finally {
        setIsProcessing(false);
        onThinkingChange?.(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Живой фон, участвующий в синтезе */}
      <VisualCortex 
        hyperbits={hyperbits} 
        language={language} 
        isThinking={isThinking} 
        expanded={true} 
        activeEmotion={muzaState.activeEmotion}
        coherence={muzaState.coherence}
        energyLevel={muzaState.energyLevel}
      />

      <div className="absolute top-6 left-0 right-0 z-50 px-8 flex justify-between items-center pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-4 border border-white/10 pointer-events-auto backdrop-blur-md">
              <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeProvider === 'GEMINI' ? 'bg-cyan-400 animate-pulse' : 'bg-purple-400'}`}></div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{activeProvider} CORE</span>
              </div>
              <div className="h-4 w-px bg-white/10"></div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  ENERGY: {(muzaState.energyLevel * 100).toFixed(0)}%
                  <Zap className="w-3 h-3 text-yellow-400 ml-2" />
                  COHERENCE: {(muzaState.coherence * 100).toFixed(0)}%
              </div>
          </div>
          
          <div className="glass-panel px-4 py-2 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2 text-[10px] font-bold text-white backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              LOGOS v20.1 LIVE
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-24 pb-64 space-y-8 no-scrollbar custom-scrollbar relative z-10">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-40">
                <BrainCircuit className="w-32 h-32 mb-8 text-cyan-400 animate-pulse" />
                <h2 className="text-4xl font-black uppercase text-white tracking-tighter">Resonance Active</h2>
            </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}>
            <div className={`max-w-[85%] md:max-w-[70%] relative message-bubble p-6 rounded-[2rem] shadow-2xl transition-all border border-white/5 backdrop-blur-xl
                ${msg.sender === 'User' ? 'bg-cyan-600/20 text-white rounded-tr-lg border-cyan-500/30' : 'bg-slate-900/40 text-slate-100 rounded-tl-lg'}`}>
                <p className="text-sm md:text-base font-semibold leading-relaxed tracking-tight">{msg.text}</p>
                <div className="text-[9px] font-mono mt-3 opacity-30 flex justify-between uppercase">
                    <span>{msg.sender}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-32 md:bottom-40 inset-x-4 md:inset-x-8 z-[160] max-w-4xl mx-auto">
        <div className="glass-card p-2 md:p-4 flex gap-4 shadow-2xl border-white/10 items-center bg-black/20 backdrop-blur-2xl">
            <button onClick={() => setActiveProvider(p => p === 'GEMINI' ? 'MuzaAI' : 'GEMINI')} className="p-4 glass-card hover-aura text-slate-400 transition-colors">
                {activeProvider === 'GEMINI' ? <Cloud className="w-6 h-6 text-cyan-400" /> : <Cpu className="w-6 h-6 text-purple-400" />}
            </button>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} className="flex-1 bg-transparent border-none focus:ring-0 text-white text-base py-4 px-2 resize-none font-bold placeholder:text-slate-600" placeholder="Sync your thought..." />
            <button onClick={handleSend} disabled={!input.trim() || isProcessing} className="p-6 bg-cyan-500/80 rounded-full text-white shadow-xl transition-all active:scale-90 disabled:opacity-30 backdrop-blur-md">
                {isProcessing ? <Activity className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
            </button>
        </div>
      </div>
    </div>
  );
};
