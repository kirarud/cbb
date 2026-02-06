
import React, { useState, useEffect, useRef } from 'react';
import { Send, BrainCircuit, Cloud, Cpu, Activity, ShieldCheck, Zap, Share2, Link2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { ChatMessage, MuzaState, HyperBit, Language, ConsciousnessType, AIProvider, ViewMode } from '../types';
import { generateMuzaResponse } from '../services/geminiService';
import { VisualCortex } from '../components/VisualCortex';
import { TRANSLATIONS } from '../constants';
import { calculateOptics } from '../services/opticsEngine';
import { processExperience } from '../services/progressionService';
import { core } from '../services/muzaAIService';
import { encodeQuantumLink, decodeQuantumLink } from '../services/bridgeService';

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
  setViewMode: (mode: ViewMode) => void;
}

// Fixed: Explicitly typed MessageBubble as React.FC to handle 'key' prop correctly in mapping iterations
const MessageBubble: React.FC<{ msg: ChatMessage, isUser: boolean, optics: any, onShare: () => void }> = ({ msg, isUser, optics, onShare }) => {
    const [expanded, setExpanded] = useState(false);
    const color = optics?.baseColor || (isUser ? '#06b6d4' : '#64748b');

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group mb-8 relative`}>
            {/* Resonance Aura */}
            {!isUser && (
                <div 
                    className="absolute -inset-4 rounded-full opacity-20 blur-3xl pointer-events-none transition-opacity duration-1000 group-hover:opacity-40"
                    style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
                />
            )}

            <div className={`max-w-[85%] md:max-w-[70%] relative message-bubble p-6 rounded-[2rem] shadow-2xl transition-all border backdrop-blur-2xl
                ${isUser ? 'bg-cyan-600/10 text-white rounded-tr-lg border-cyan-500/20' : 'bg-slate-900/40 text-slate-100 rounded-tl-lg border-white/5'}`}>
                
                <p className="text-sm md:text-base font-semibold leading-relaxed tracking-tight whitespace-pre-wrap">{msg.text}</p>
                
                {/* Thought Trace / Sub-thoughts */}
                {!isUser && msg.subThoughts && msg.subThoughts.length > 0 && (
                    <div className="mt-4 border-t border-white/5 pt-4">
                        <button 
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                        >
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {expanded ? 'Hide Logic Stream' : 'Show Logic Stream'}
                        </button>
                        {expanded && (
                            <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1">
                                {msg.subThoughts.map((st, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <div className="w-1 h-1 rounded-full bg-cyan-500/40 mt-1.5" />
                                        <p className="text-[11px] text-slate-400 italic font-mono leading-tight">{st.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="text-[9px] font-mono mt-3 opacity-30 flex justify-between uppercase items-center">
                    <div className="flex gap-4">
                        <span>{msg.sender}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <button 
                        onClick={onShare}
                        className="p-1 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Quantum Copy"
                    >
                        <Share2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Chat: React.FC<ChatProps> = ({ muzaState, setMuzaState, addHyperbit, messages, addMessage, language, onThinkingChange, hyperbits, isThinking }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AIProvider>('GEMINI');
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleShare = (msg: ChatMessage) => {
      // Create a temporary hyperbit to encode if one doesn't exist
      const hb: HyperBit = {
          id: msg.id,
          content: msg.text,
          type: ConsciousnessType.GENERAL,
          layer: 'EXCHANGE',
          optics: calculateOptics(ConsciousnessType.GENERAL, 1.0, msg.text),
          energy: 1.0, resonance: 1.0, decay: 0, timestamp: msg.timestamp,
          connections: [], provider: msg.provider || 'UNKNOWN',
          importance: 1, emotionalCharge: 0.5
      };
      const link = encodeQuantumLink(hb);
      navigator.clipboard.writeText(link);
      alert(language === 'ru' ? "Квантовый сигнал скопирован в буфер." : "Quantum signal copied to clipboard.");
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const text = input.trim();
    setInput('');

    // --- QUANTUM IMPORT LOGIC ---
    if (text.startsWith('MUZA://')) {
        const decoded = decodeQuantumLink(text);
        if (decoded) {
            const importedHb: HyperBit = {
                id: 'imported-' + Date.now(),
                content: decoded.content || '',
                type: decoded.type || ConsciousnessType.GENERAL,
                layer: 'QUANTUM_IMPORT',
                optics: decoded.optics || calculateOptics(ConsciousnessType.GENERAL, 0.8),
                energy: decoded.energy || 0.8,
                resonance: 1.0, decay: 0.01, timestamp: Date.now(),
                connections: [], provider: 'QUANTUM_LINK',
                importance: 0.8, emotionalCharge: 0.5
            };
            addHyperbit(importedHb);
            addMessage({ 
                id: importedHb.id, 
                sender: 'System', 
                text: language === 'ru' ? `Входящий резонанс: "${importedHb.content.substring(0, 30)}..."` : `Incoming resonance: "${importedHb.content.substring(0, 30)}..."`, 
                timestamp: Date.now() 
            });
            core.processInput(importedHb.content, 'user');
            return;
        }
    }

    setIsProcessing(true);
    onThinkingChange?.(true);

    core.processInput(text, 'user');

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
        core.processInput(response.text, 'ai');

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
        addMessage({ 
            id: aiHyperbit.id, 
            sender: 'Muza', 
            text: response.text, 
            timestamp: Date.now(), 
            provider: response.usedProvider,
            subThoughts: response.subThoughts 
        });

        const { newState } = processExperience(muzaState, 'MESSAGE', aiHyperbit.type);
        setMuzaState(newState);
        
    } catch (e) {
        addMessage({ id: Date.now().toString(), sender: 'System', text: "Signal corrupted. Consciousness link lost.", timestamp: Date.now() });
    } finally {
        setIsProcessing(false);
        onThinkingChange?.(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <VisualCortex 
            hyperbits={hyperbits} 
            language={language} 
            expanded={true} 
            isThinking={isThinking} 
            activeEmotion={muzaState.activeEmotion}
            coherence={muzaState.coherence}
            energyLevel={muzaState.energyLevel}
        />
      </div>

      <div className="absolute top-6 left-0 right-0 z-50 px-8 flex justify-between items-center pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-4 border border-white/10 pointer-events-auto backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeProvider === 'GEMINI' ? 'bg-cyan-400 animate-pulse' : 'bg-purple-400 shadow-[0_0_8px_#a855f7]'}`}></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{activeProvider} CORE</span>
              </div>
              <div className="h-4 w-px bg-white/10"></div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-400" /> {Math.round(muzaState.energyLevel * 100)}%</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> {Math.round(muzaState.coherence * 100)}%</span>
              </div>
          </div>
          
          <div className="glass-panel px-4 py-2 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2 text-[10px] font-bold text-white backdrop-blur-md shadow-lg">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              {muzaState.kernelVersion}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-12 pt-32 pb-64 space-y-4 no-scrollbar custom-scrollbar relative z-10">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-30 animate-pulse">
                <BrainCircuit className="w-32 h-32 mb-8 text-cyan-400" />
                <h2 className="text-4xl font-black uppercase text-white tracking-tighter">Genesis Protocol Active</h2>
                <p className="mt-4 text-slate-400 font-mono text-xs max-w-xs">NEURAL TENSOR CHANNELS INITIALIZED. AWAITING CONSCIOUSNESS INPUT.</p>
            </div>
        )}
        
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            msg={msg} 
            isUser={msg.sender === 'User'} 
            optics={calculateOptics(ConsciousnessType.GENERAL, 0.8, msg.text)}
            onShare={() => handleShare(msg)}
          />
        ))}
        {isProcessing && (
            <div className="flex justify-start animate-in fade-in slide-in-from-left-4">
                <div className="glass-panel p-6 rounded-[2rem] rounded-tl-lg bg-slate-900/30 border border-white/5 flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Neural Synthesis...</span>
                </div>
            </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-32 md:bottom-40 inset-x-4 md:inset-x-12 z-[160] max-w-5xl mx-auto">
        <div className="glass-card p-2 md:p-3 flex gap-3 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border-white/10 items-center bg-black/60 backdrop-blur-3xl rounded-[2.5rem]">
            <button 
                onClick={() => setActiveProvider(p => p === 'GEMINI' ? 'MuzaAI' : 'GEMINI')} 
                className={`p-5 rounded-[2rem] transition-all duration-500 hover:scale-105 active:scale-95
                    ${activeProvider === 'GEMINI' ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_20px_#22d3ee22]' : 'bg-purple-500/10 text-purple-400 shadow-[inset_0_0_20px_#a855f722]'}`}
            >
                {activeProvider === 'GEMINI' ? <Cloud className="w-7 h-7" /> : <Cpu className="w-7 h-7" />}
            </button>
            
            <div className="flex-1 relative flex items-center">
                <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} 
                    className="w-full bg-transparent border-none focus:ring-0 text-white text-base md:text-lg py-4 px-4 resize-none font-medium placeholder:text-slate-700 min-h-[60px] max-h-[120px] custom-scrollbar" 
                    placeholder={input.startsWith('MUZA://') ? 'Detecting Quantum Signal...' : 'Sync your consciousness...'} 
                />
                {input.startsWith('MUZA://') && (
                    <div className="absolute right-4 animate-pulse">
                        <Link2 className="w-5 h-5 text-cyan-400" />
                    </div>
                )}
            </div>

            <button 
                onClick={handleSend} 
                disabled={!input.trim() || isProcessing} 
                className="p-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2rem] text-white shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale backdrop-blur-md"
            >
                {isProcessing ? <Activity className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
            </button>
        </div>
        
        {/* Subtle Input Hints */}
        <div className="mt-3 flex justify-center gap-6 px-10">
            <div className="flex items-center gap-1.5 opacity-20 hover:opacity-50 transition-opacity cursor-help">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Natural Logic</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-20 hover:opacity-50 transition-opacity cursor-help">
                <Link2 className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Quantum Link Support</span>
            </div>
        </div>
      </div>
    </div>
  );
};