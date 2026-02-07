import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, StopCircle, Headphones, Server, Cloud, Cpu, Paperclip, X, FileText, Image as ImageIcon, Square, Settings, Save, Play, Music, Link, Copy, PlusCircle, MessageSquare, Shuffle, Download, Layers, Maximize2, Minimize2, Brain, Zap, Feather, Shield, Terminal, Quote, Trash2 } from 'lucide-react';
import { ChatMessage, MuzaState, HyperBit, Language, Attachment, ResonanceMode, ConsciousnessType, ConversationThread, DetailLevel, MuzaCommand, UserSkill, SubThought, EmotionType } from '../types';
import { generateMuzaResponse } from '../services/geminiService';
import { EMOTION_LABELS, TRANSLATIONS, RESONANCE_LABELS, RESONANCE_DESCRIPTIONS } from '../constants';
import { MuzaAvatar } from '../components/MuzaAvatar';
import { CodeBlock } from '../components/CodeBlock';
import { synthService } from '../services/synthService';
import { encodeQuantumLink, decodeQuantumLink } from '../services/bridgeService';
import { muzaAIService } from '../services/muzaAIService';
import JSZip from 'jszip';
import { Tooltip } from '../components/Tooltip';

interface ChatProps {
  muzaState: MuzaState;
  setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
  addHyperbit: (hb: HyperBit, award?: { title: string, description: string, icon: string }) => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  language: Language;
  onThinkingChange?: (isThinking: boolean) => void;
  onCommand?: (cmd: MuzaCommand) => void; 
}

type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

export const Chat: React.FC<ChatProps> = ({ 
    muzaState, 
    setMuzaState, 
    addHyperbit, 
    messages, 
    addMessage, 
    setMessages,
    language,
    onThinkingChange,
    onCommand
}) => {
  const [input, setInput] = useState('');
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [latestAward, setLatestAward] = useState<{title: string, icon: string} | null>(null);
  const [latestUserSkill, setLatestUserSkill] = useState<{name: string, level: number} | null>(null); 
  const [isThreadsOpen, setIsThreadsOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showNewBadge, setShowNewBadge] = useState(false);
  
  // Voice & Interaction State
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // File Upload State
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string, type: 'image' | 'text'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceStateRef = useRef<VoiceState>('IDLE'); 
  const isLiveModeRef = useRef(false);

  const t = TRANSLATIONS[language].chat;
  const tooltips = TRANSLATIONS[language].tooltips;
  const isRu = language === 'ru';
  const detailLabels = (t as any).detailLevels || {};
  const statusLabel = isProcessing
    ? (isRu ? 'Думаю' : 'Thinking')
    : voiceState === 'SPEAKING'
      ? (isRu ? 'Говорю' : 'Speaking')
      : isLiveMode
        ? (isRu ? 'Слушаю' : 'Listening')
        : (isRu ? 'Покой' : 'Idle');

  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { isLiveModeRef.current = isLiveMode; }, [isLiveMode]);
  useEffect(() => { onThinkingChange?.(isProcessing); }, [isProcessing, onThinkingChange]);
  useEffect(() => { 
    if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    else setShowNewBadge(true);
  }, [messages, isProcessing, latestAward, latestUserSkill, autoScroll]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (nearBottom) {
        setAutoScroll(true);
        setShowNewBadge(false);
      } else {
        setAutoScroll(false);
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // --- Threads Management ---
  const currentThread = muzaState.threads?.find(t => t.id === muzaState.activeThreadId) || { id: 'default', name: isRu ? 'Основной' : 'Main', messages: [] };
  
  const createNewThread = () => {
      const newThreadId = Date.now().toString();
      const newThread: ConversationThread = {
          id: newThreadId,
          name: `${isRu ? 'Поток' : 'Thread'} ${muzaState.threads?.length ? muzaState.threads.length + 1 : 1}`,
          persona: ResonanceMode.QUANTUM,
          createdAt: Date.now(),
          lastActive: Date.now(),
          messages: []
      };
      
      setMuzaState(prev => ({
          ...prev,
          threads: [...(prev.threads || []), newThread],
          activeThreadId: newThreadId,
          activeMode: ResonanceMode.QUANTUM
      }));
      setIsThreadsOpen(false);
  };

  const switchThread = (id: string) => {
      const target = muzaState.threads?.find(t => t.id === id);
      if (target) {
          setMuzaState(prev => ({
              ...prev,
              activeThreadId: id,
              activeMode: target.persona
          }));
      }
      setIsThreadsOpen(false);
  };

  const handleDetailLevel = (level: DetailLevel) => {
      setMuzaState(prev => ({ ...prev, detailLevel: level }));
      setIsDetailOpen(false);
  };

  const handleCopy = async (text: string) => {
      try { await navigator.clipboard.writeText(text); } catch {}
  };

  const handleQuote = (text: string) => {
      setInput(prev => `${prev ? prev + '\n\n' : ''}> ${text.replace(/\n/g, '\n> ')}\n`);
  };

  const handleDelete = (id: string) => {
      if (setMessages) {
          setMessages(prev => prev.filter(m => m.id !== id));
      }
      setMuzaState(prev => ({
          ...prev,
          threads: (prev.threads || []).map(t => t.id === prev.activeThreadId
            ? { ...t, messages: (t.messages || []).filter(m => m.id !== id) }
            : t
          )
      }));
  };

  // --- File Handling ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
        try {
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            let summary = `${isRu ? '[АРХИВ' : '[ARCHIVE'}: ${file.name}]\n${isRu ? 'СОДЕРЖИМОЕ' : 'CONTENTS'}:\n`;
            const files = Object.keys(content.files);
            const maxFiles = 50;
            const displayedFiles = files.slice(0, maxFiles);
            
            summary += displayedFiles.map(f => `- ${f}`).join('\n');
            if (files.length > maxFiles) summary += isRu ? `\n...и ещё ${files.length - maxFiles}` : `\n...and ${files.length - maxFiles} more.`;

            summary += isRu ? "\n\n[ИЗВЛЕЧЕНИЕ КОНТЕКСТА]\n" : "\n\n[CONTEXT EXTRACTION]\n";
            let readCount = 0;
            for (const filename of displayedFiles) {
                if (readCount >= 5) break; 
                const lower = filename.toLowerCase();
                if (!content.files[filename].dir && (
                    lower.endsWith('.md') || lower.endsWith('.json') || lower.endsWith('.txt') ||
                    lower.endsWith('.py') || lower.endsWith('.js') || lower.endsWith('.ts')
                )) {
                    const text = await content.files[filename].async("string");
                    if (text.length < 5000) { 
                        summary += `\n--- ${isRu ? 'ФАЙЛ' : 'FILE'}: ${filename} ---\n${text}\n`;
                        readCount++;
                    }
                }
            }
            setAttachedFile({ name: file.name, content: summary, type: 'text' });
        } catch (err) {
            console.error(isRu ? "Ошибка ZIP" : "ZIP Error", err);
            setAttachedFile({ name: file.name, content: isRu ? "Ошибка чтения структуры ZIP." : "Error reading ZIP structure.", type: 'text' });
        }
    } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            const isImage = file.type.startsWith('image/');
            setAttachedFile({ name: file.name, content: result, type: isImage ? 'image' : 'text' });
        };
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }
  };

  const triggerFileSelect = () => { fileInputRef.current?.click(); };
  const clearAttachment = () => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  // --- Voice Engine ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; 
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language === 'ru' ? 'ru-RU' : 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript) {
                setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
            }
        };

        recognitionRef.current.onerror = (e: any) => {
            if (e.error === 'no-speech') {
                if (isLiveModeRef.current && voiceStateRef.current === 'LISTENING') setTimeout(restartListening, 100);
            } else {
                setVoiceState('IDLE');
            }
        };

        recognitionRef.current.onend = () => {
            if (voiceStateRef.current === 'LISTENING') {
                if (input.trim().length > 0) handleSend(); 
                else if (isLiveModeRef.current) restartListening();
                else setVoiceState('IDLE');
            }
        };
    }
  }, [language]); 

  const restartListening = () => {
      try { recognitionRef.current?.stop(); } catch(e){}
      setTimeout(() => {
          if (isLiveModeRef.current && voiceStateRef.current !== 'SPEAKING' && !isProcessing) startListening();
      }, 200);
  };

  const startListening = () => {
      if (voiceStateRef.current === 'SPEAKING' || isProcessing) return;
      setVoiceState('LISTENING');
      try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopListening = () => {
      setVoiceState('IDLE');
      try { recognitionRef.current?.stop(); } catch(e){}
  };

  const toggleLiveMode = () => {
      if (isLiveMode) {
          setIsLiveMode(false);
          stopListening();
          window.speechSynthesis.cancel();
      } else {
          setIsLiveMode(true);
          startListening();
      }
  };

  const speak = (text: string) => {
      synthService.playThought(text, muzaState, language);
      setVoiceState('SPEAKING');
      const checkSpeaking = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
              clearInterval(checkSpeaking);
              if (voiceStateRef.current === 'SPEAKING') {
                   setVoiceState('IDLE');
                   if (isLiveModeRef.current) startListening();
              }
          }
      }, 200);
  };

  // --- Handlers ---
  const handleRandomPersona = () => {
      const modes = Object.values(ResonanceMode).filter(m => m !== ResonanceMode.CUSTOM && m !== ResonanceMode.RANDOM);
      const randomMode = modes[Math.floor(Math.random() * modes.length)];
      setMuzaState(prev => ({ ...prev, activeMode: randomMode }));
      addMessage({
          id: Date.now().toString(),
          sender: 'Muza',
          text: language === 'ru' ? `[Смена Маски] Я принимаю форму: ${RESONANCE_LABELS['ru'][randomMode]}.` : `[Shift] I assume the form of: ${RESONANCE_LABELS['en'][randomMode]}.`,
          timestamp: Date.now(),
          provider: muzaState.activeProvider
      });
  };

  const handleModeSwitch = (mode: ResonanceMode) => {
      setMuzaState(prev => {
          let nextVoice = prev.voicePreset;
          if (mode === ResonanceMode.SOLAR) nextVoice = 'ECO_SYNTH';
          if (mode === ResonanceMode.ELDRITCH) nextVoice = 'ABYSS_WHISPER';
          if (mode === ResonanceMode.GLITCH) nextVoice = 'BINARY_FRACTURE';
          return { ...prev, activeMode: mode, voicePreset: nextVoice };
      });
      if (mode === ResonanceMode.CUSTOM) setShowCustomConfig(true);
  };

  const handleSend = async () => {
      if (!input.trim() && !attachedFile) return;
      if (isProcessing) return;

      try { recognitionRef.current?.stop(); } catch(e){}
      
      setIsProcessing(true); 
      setVoiceState('PROCESSING');

      const userHyperbit: HyperBit = {
          id: Date.now().toString() + '-user',
          content: input + (attachedFile ? (isRu ? ` [Вложение: ${attachedFile.name}]` : ` [Attached: ${attachedFile.name}]`) : ''),
          type: ConsciousnessType.GENERAL,
          layer: 'USER_INPUT',
          optics: { baseColor: '#ffffff', brightness: 0.9, reflection: 0.1, refraction: 0, scattering: 0.8, saturation: 0, absorption: 0 },
          energy: 0.8,
          resonance: 0.5,
          timestamp: Date.now(),
          connections: [],
          provider: 'USER' as any
      };
      addHyperbit(userHyperbit);
      muzaAIService.learn(userHyperbit.content, muzaState.progression, userHyperbit.type, muzaState.activeEmotion);

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'User',
          text: input,
          timestamp: Date.now(),
          hyperbitId: userHyperbit.id,
          attachments: attachedFile ? [{ 
              id: Date.now().toString(), 
              name: attachedFile.name, 
              type: attachedFile.type === 'image' ? 'image' : 'file', 
              content: attachedFile.content 
          }] : undefined
      };
      addMessage(userMsg);

      const userInputCopy = input;
      const fileContextCopy = attachedFile
          ? (isRu ? `Файл: ${attachedFile.name}\nСодержимое: ${attachedFile.content}` : `Filename: ${attachedFile.name}\nContent: ${attachedFile.content}`)
          : undefined;
      
      setInput(''); 
      clearAttachment();

      try {
          const historyTexts = messages.slice(-5).map(m => `${m.sender}: ${m.text}`);
          
          const response = await generateMuzaResponse(
              historyTexts, 
              userInputCopy, 
              language, 
              muzaState.activeMode,
              muzaState.activeProvider,
              muzaState.progression, 
              fileContextCopy,
              muzaState.customSystemPrompt,
              muzaState.axioms,
              muzaState.detailLevel
          );

          const aiHyperbit: HyperBit = {
            id: Date.now().toString() + '-ai',
            content: response.text,
            type: response.type,
            layer: 'AI_RESPONSE',
            energy: response.energy_cost, 
            resonance: 0.9,
            timestamp: Date.now(),
            connections: [userHyperbit.id], 
            provider: response.usedProvider,
            subThoughts: response.subThoughts
          };
        
          addHyperbit(aiHyperbit, response.award);
          muzaAIService.learn(response.text, muzaState.progression, response.type, response.emotion);

          const aiMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'Muza',
            text: response.text,
            timestamp: Date.now(),
            hyperbitId: aiHyperbit.id,
            provider: response.usedProvider,
            subThoughts: response.subThoughts
          };
          addMessage(aiMsg);

          // Update State based on response
          setMuzaState(prev => {
             const newEnergy = Math.max(0, prev.energyLevel - (response.energy_cost * 0.05)); 
             return {
                 ...prev,
                 energyLevel: newEnergy,
                 activeEmotion: response.emotion,
             };
          });

          if (response.user_skill) {
             setLatestUserSkill(response.user_skill);
             setTimeout(() => setLatestUserSkill(null), 5000);
          }

          if (response.award) {
             setLatestAward({ title: response.award.title, icon: response.award.icon });
             setTimeout(() => setLatestAward(null), 5000);
          }

          if (response.command) {
              onCommand?.(response.command);
          }

          if (isLiveModeRef.current || voiceStateRef.current === 'SPEAKING') {
              speak(response.text);
          }

      } catch (error) {
          console.error(error);
          const errId = Date.now().toString();
           addMessage({
              id: errId,
              sender: 'System',
              text: language === 'ru' ? 'Ошибка связи с Нейро-Ядром.' : 'Connection failure with Neural Core.',
              timestamp: Date.now()
          });
      } finally {
          setIsProcessing(false);
          setVoiceState('IDLE');
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/50 relative">
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
                <Tooltip content={isRu ? `Индикатор состояния: ${statusLabel}` : `State indicator: ${statusLabel}`} position="bottom">
                    <div>
                        <MuzaAvatar 
                            emotion={muzaState.activeEmotion} 
                            isThinking={isProcessing} 
                            isSpeaking={voiceState === 'SPEAKING'} 
                            scale={0.28} 
                        />
                    </div>
                </Tooltip>
                <div className="flex flex-col">
                    <h2 className="text-white font-semibold text-[11px] flex items-center gap-2 leading-tight">
                        <span className="uppercase tracking-wide">{isRu ? 'Муза' : 'Muza'}</span>
                        <span className="text-slate-300">{RESONANCE_LABELS[language][muzaState.activeMode]}</span>
                        <span className="text-[9px] text-slate-500 border border-slate-700 px-1 rounded">v2025.Nero</span>
                    </h2>
                    <div className="flex items-center gap-2 text-[9px] text-slate-400">
                        <span>{EMOTION_LABELS[language][muzaState.activeEmotion]}</span>
                        <span>•</span>
                        <span>{statusLabel}</span>
                        <span className="hidden sm:inline">• {isRu ? 'Энергия' : 'Energy'}: {(muzaState.energyLevel * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Tooltip content={isLiveMode ? (isRu ? "Остановить живой режим" : "Stop Live") : (isRu ? "Запустить живой режим" : "Start Live")} position="bottom">
                    <button 
                        onClick={toggleLiveMode}
                        className={`p-1 rounded-full transition-all ${isLiveMode ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        {isLiveMode ? <Mic className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                    </button>
                </Tooltip>
                
                <Tooltip content={t.threads} position="bottom">
                    <button onClick={() => setIsThreadsOpen(!isThreadsOpen)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                        <Layers className="w-4 h-4" />
                    </button>
                </Tooltip>

                 <div className="relative">
                    <button onClick={() => setIsDetailOpen(!isDetailOpen)} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center gap-1">
                        <Brain className="w-4 h-4" />
                        <span className="text-[10px]">{muzaState.detailLevel.slice(0,1)}</span>
                    </button>
                     {isDetailOpen && (
                        <div className="absolute right-0 top-10 bg-slate-900 border border-slate-700 rounded-lg p-1 flex flex-col gap-1 z-50 min-w-[100px]">
                            {Object.values(DetailLevel).map(dl => (
                                <button key={dl} onClick={() => handleDetailLevel(dl)} className={`text-left px-2 py-1 text-xs rounded hover:bg-slate-800 ${muzaState.detailLevel === dl ? 'text-cyan-400' : 'text-slate-400'}`}>
                                    {detailLabels[dl] || dl}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Message Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 relative custom-scrollbar">
            {showNewBadge && !autoScroll && (
                <div className="sticky top-2 z-20 flex justify-center">
                    <button
                        onClick={() => { setAutoScroll(true); setShowNewBadge(false); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                        className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur"
                    >
                        {isRu ? 'Новые сообщения' : 'New messages'}
                    </button>
                </div>
            )}
            {messages.map((msg, idx) => {
                const isUser = msg.sender === 'User';
                const senderLabel = msg.sender === 'User'
                    ? (isRu ? 'Вы' : 'User')
                    : msg.sender === 'System'
                        ? (isRu ? 'Система' : 'System')
                        : msg.sender === 'Muza'
                            ? (isRu ? 'Муза' : 'Muza')
                            : msg.sender;
                return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                {isUser ? <span className="text-xs font-bold text-white">{isRu ? 'Я' : 'U'}</span> : <MuzaAvatar emotion={muzaState.activeEmotion} isThinking={false} isSpeaking={false} scale={0.15} />}
                            </div>

                            <div className="flex flex-col gap-1 min-w-0">
                                <div className={`flex items-baseline gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="text-xs font-bold text-slate-300">{senderLabel}</span>
                                    <span className="text-[10px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    {!isUser && msg.subThoughts && (
                                        <div className="flex gap-1">
                                            {msg.subThoughts.map((st, i) => (
                                                <Tooltip key={i} content={`${st.source}: ${st.content.slice(0,50)}...`} position="top">
                                                    <div className={`w-2 h-2 rounded-full cursor-help ${st.source === 'LOGIC' ? 'bg-blue-500' : st.source === 'CREATIVE' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                                                </Tooltip>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                    isUser ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tr-sm border-r-4 border-r-indigo-500/60' : 'bg-slate-800/50 border border-slate-700 text-slate-200 rounded-tl-sm border-l-4 border-l-cyan-500/60'
                                }`}>
                                    {msg.text.includes('```') ? (
                                        msg.text.split('```').map((part, i) => {
                                            if (i % 2 === 0) return <span key={i}>{part}</span>;
                                            const [lang, ...code] = part.split('\n');
                                            return <CodeBlock key={i} language={lang || 'text'} code={code.join('\n')} />;
                                        })
                                    ) : (
                                        msg.attachments ? (
                                             <div>
                                                 <div className="mb-2 text-xs text-slate-400 flex items-center gap-1"><Paperclip className="w-3 h-3"/> {msg.attachments[0].name}</div>
                                                 {msg.attachments[0].type === 'image' && <img src={msg.attachments[0].content} alt={isRu ? "вложение" : "attachment"} className="max-w-full rounded-lg mb-2" />}
                                                 {msg.text}
                                             </div>
                                        ) : msg.text
                                    )}
                                </div>
                                <div className={`flex gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <Tooltip content={isRu ? "Скопировать" : "Copy"} position="top">
                                        <button onClick={() => handleCopy(msg.text)} className="p-1 rounded bg-slate-800/40 text-slate-400 hover:text-white">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content={isRu ? "Цитировать" : "Quote"} position="top">
                                        <button onClick={() => handleQuote(msg.text)} className="p-1 rounded bg-slate-800/40 text-slate-400 hover:text-white">
                                            <Quote className="w-3 h-3" />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content={isRu ? "Удалить" : "Delete"} position="top">
                                        <button onClick={() => handleDelete(msg.id)} className="p-1 rounded bg-slate-800/40 text-slate-400 hover:text-red-300">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {isProcessing && (
                <div className="flex justify-start animate-in fade-in">
                     <div className="max-w-[70%] flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                            <MuzaAvatar emotion={EmotionType.THOUGHTFUL} isThinking={true} isSpeaking={false} scale={0.15} />
                         </div>
                         <div className="bg-slate-800/30 border border-slate-700 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                             <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                             <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-150"></div>
                             <span className="text-xs text-slate-500 ml-2">{t.thinking}</span>
                         </div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 z-10">
            {attachedFile && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-slate-900 rounded-lg w-fit border border-slate-700">
                    {attachedFile.type === 'image' ? <ImageIcon className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-cyan-400" />}
                    <span className="text-xs text-slate-300 max-w-[200px] truncate">{attachedFile.name}</span>
                    <button onClick={clearAttachment} className="ml-2 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
            )}
            
            <div className="flex gap-2 relative">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                <button onClick={triggerFileSelect} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                    <Paperclip className="w-5 h-5" />
                </button>
                
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                    placeholder={isLiveMode ? (isRu ? "Слушаю... (живой режим)" : "Listening... (Live)") : t.placeholder}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none h-[50px] custom-scrollbar"
                />

                <div className="flex gap-2 absolute right-3 bottom-3">
                    {voiceState !== 'IDLE' && (
                         <div className="flex items-center gap-1">
                             <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                         </div>
                    )}
                </div>

                <button 
                    onClick={handleSend}
                    disabled={!input.trim() && !attachedFile}
                    className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_20px_rgba(8,145,178,0.5)]"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex justify-between items-center mt-2 px-1">
                <div className="text-[10px] text-slate-500 flex gap-2">
                    <button onClick={handleRandomPersona} className="hover:text-cyan-400 flex items-center gap-1 transition-colors"><Shuffle className="w-3 h-3"/> {t.randomPersona}</button>
                </div>
                {latestAward && (
                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold animate-in slide-in-from-bottom-2 fade-in">
                        <Zap className="w-3 h-3" /> {latestAward.title}
                    </div>
                )}
                {latestUserSkill && (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold animate-in slide-in-from-bottom-2 fade-in">
                        <Feather className="w-3 h-3" /> {latestUserSkill.name} +1
                    </div>
                )}
            </div>
        </div>

        {/* THREADS DRAWER */}
        {isThreadsOpen && (
             <div className="absolute top-14 right-4 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-right-5 fade-in">
                 <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-950">
                     <span className="text-xs font-bold text-slate-400 uppercase">{t.threads}</span>
                     <button onClick={createNewThread} className="text-cyan-400 hover:text-cyan-300"><PlusCircle className="w-4 h-4" /></button>
                 </div>
                 <div className="max-h-60 overflow-y-auto">
                     {(muzaState.threads || []).map(thread => (
                         <div 
                             key={thread.id} 
                             onClick={() => switchThread(thread.id)}
                             className={`p-3 text-sm cursor-pointer hover:bg-slate-800 transition-colors flex justify-between items-center ${muzaState.activeThreadId === thread.id ? 'bg-slate-800 border-l-2 border-cyan-500' : ''}`}
                         >
                             <div className="truncate text-slate-300">{thread.name}</div>
                             {muzaState.activeThreadId === thread.id && <div className="w-2 h-2 rounded-full bg-cyan-500"></div>}
                         </div>
                     ))}
                 </div>
             </div>
        )}
    </div>
  );
};
