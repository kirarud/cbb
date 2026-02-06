
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Terminal, Radio, User, Cpu, AlertTriangle, CheckCircle, Info, Key, Lock, Network, Share2, ShieldCheck, Globe, Zap, Users, Activity } from 'lucide-react';
import { Language, SystemLog, PeerNode, HyperBit, EmotionType } from '../types';
import { TRANSLATIONS, EMOTION_COLORS } from '../constants';
import { HyperbitCard } from '../components/HyperbitCard';

interface SocialProps {
    language: Language;
    username: string;
    systemLogs: SystemLog[];
    peers?: PeerNode[];
    hiveFeed: HyperBit[];
}

export const Social: React.FC<SocialProps> = ({ language, username, systemLogs, peers = [], hiveFeed }) => {
  const t = TRANSLATIONS[language].social;
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activePeers, setActivePeers] = useState<PeerNode[]>(peers.length > 0 ? peers : [
      { id: 'alpha', name: 'Node-Alpha', status: 'IDLE', role: 'LOGIC', latency: 45, sharedBits: 124 },
      { id: 'beta', name: 'Node-Beta', status: 'CONNECTED', role: 'CREATIVE', latency: 12, sharedBits: 890 }
  ]);
  const [hiveStatus, setHiveStatus] = useState<'OFFLINE' | 'SYNCING' | 'CONNECTED'>('CONNECTED');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- HIVE CONSENSUS ALGORITHM ---
  // Анализ коллективного бессознательного (Hive Feed)
  const consensus = useMemo(() => {
      if (hiveFeed.length === 0) return { emotion: EmotionType.NEUTRAL, strength: 0 };
      
      const counts: Record<string, number> = {};
      // Используем типы гипербитов как прокси для эмоций, если эмоции не заданы явно
      hiveFeed.forEach(bit => {
          // Простая эвристика: маппинг типа сознания в эмоцию для визуализации
          let emotion = EmotionType.NEUTRAL;
          if (bit.type === 'EMOTIONAL') emotion = EmotionType.HAPPY;
          else if (bit.type === 'LOGIC' || bit.type === 'CODE') emotion = EmotionType.THOUGHTFUL;
          else if (bit.type === 'CREATIVE') emotion = EmotionType.INSPIRED;
          else if (bit.type === 'QUESTION') emotion = EmotionType.CURIOUS;
          
          counts[emotion] = (counts[emotion] || 0) + bit.energy;
      });

      let dominant = EmotionType.NEUTRAL;
      let maxVal = 0;
      Object.entries(counts).forEach(([emo, val]) => {
          if (val > maxVal) {
              maxVal = val;
              dominant = emo as EmotionType;
          }
      });

      return { emotion: dominant, strength: Math.min(1, maxVal / hiveFeed.length) };
  }, [hiveFeed]);


  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  const handleScan = () => {
      setIsScanning(true);
      setTimeout(() => {
          setIsScanning(false);
          if (Math.random() > 0.5) {
               setActivePeers(prev => [...prev, {
                   id: `node-${Date.now()}`,
                   name: `Seeker-${Math.floor(Math.random()*999)}`,
                   status: 'CONNECTED',
                   role: 'STORAGE',
                   latency: Math.floor(Math.random() * 100),
                   sharedBits: 0
               }]);
          }
      }, 3000);
  };

  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrame: number;
      let time = 0;

      const render = () => {
          time += 0.01;
          
          if (canvas.parentElement) {
             canvas.width = canvas.parentElement.clientWidth;
             canvas.height = canvas.parentElement.clientHeight;
          }

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          ctx.clearRect(0,0,canvas.width, canvas.height);

          // Draw Central Node (Consensus)
          const pulse = 20 + Math.sin(time * 2) * 5 + (consensus.strength * 10);
          ctx.beginPath();
          ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
          // Color based on dominant emotion
          ctx.fillStyle = EMOTION_COLORS[consensus.emotion] || '#22d3ee';
          ctx.shadowBlur = 30 * consensus.strength;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw Peers
          activePeers.forEach((peer, i) => {
              const angle = (i / activePeers.length) * Math.PI * 2 + time * 0.2;
              const dist = 80 + Math.sin(time + i) * 15;
              const x = cx + Math.cos(angle) * dist;
              const y = cy + Math.sin(angle) * dist;

              // Connections
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(x, y);
              ctx.strokeStyle = peer.status === 'CONNECTED' ? '#4ade80' : '#94a3b8';
              ctx.lineWidth = 1;
              ctx.setLineDash(peer.status === 'SYNCING' ? [5, 5] : []);
              ctx.lineDashOffset = -time * 20;
              ctx.stroke();

              // Peer Node
              ctx.beginPath();
              ctx.arc(x, y, 8, 0, Math.PI * 2);
              ctx.fillStyle = peer.role === 'LOGIC' ? '#60a5fa' : peer.role === 'CREATIVE' ? '#c084fc' : '#facc15';
              ctx.fill();

              // Packet transfer simulation
              if (peer.status === 'CONNECTED') {
                  const pT = (time * 2 + i) % 1;
                  const pX = cx + (x - cx) * pT;
                  const pY = cy + (y - cy) * pT;
                  ctx.beginPath();
                  ctx.arc(pX, pY, 2, 0, Math.PI * 2);
                  ctx.fillStyle = '#fff';
                  ctx.fill();
              }
          });

          animationFrame = requestAnimationFrame(render);
      };
      render();
      return () => cancelAnimationFrame(animationFrame);
  }, [activePeers, consensus]);

  return (
    <div className="p-6 md:p-10 h-full overflow-hidden flex flex-col bg-slate-950">
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full gap-6">
        
        <div className="flex justify-between items-center shrink-0">
          <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Globe className="w-8 h-8 text-purple-400" />
                  Hive Mind
              </h2>
              <p className="text-slate-400 text-xs font-mono mt-1">DECENTRALIZED MESH PROTOCOL ACTIVE</p>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 font-bold uppercase">Swarm Status</span>
                  <span className={`text-sm font-bold ${hiveStatus === 'CONNECTED' ? 'text-green-400' : 'text-red-400'}`}>{hiveStatus}</span>
              </div>
              <div className="p-2 bg-purple-900/20 rounded-full border border-purple-500/30">
                <Network className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full min-h-0">
            
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="glass-panel p-4 rounded-xl border border-purple-500/30 bg-purple-900/5">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Local Node
                    </h3>
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-white font-bold">{username || 'Anonymous'}</span>
                         <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-400 text-[10px] border border-green-500/30">ONLINE</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono break-all">
                        ID: {btoa(username || 'anon').slice(0, 12)}...
                    </div>
                </div>

                {/* VISUALIZATION CANVAS */}
                <div className="glass-panel rounded-xl border border-slate-700 relative overflow-hidden bg-black/40 h-48">
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/50 rounded px-2 py-1">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] text-white font-mono uppercase">Consensus: {consensus.emotion}</span>
                    </div>
                    <canvas ref={canvasRef} className="w-full h-full block" />
                </div>

                <div className="glass-panel p-4 rounded-xl border border-slate-700 flex-1 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4" /> Active Peers ({activePeers.length})
                        </h3>
                        <button onClick={handleScan} disabled={isScanning} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-cyan-400 transition-colors">
                            <Radio className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                        {activePeers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-600 transition-colors group">
                                <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${p.status === 'CONNECTED' ? 'bg-green-500' : 'bg-slate-500'}`}></div><div><div className="text-xs font-bold text-slate-200">{p.name}</div><div className="text-[10px] text-slate-500 font-mono">{p.role} • {p.latency}ms</div></div></div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2"><button className="text-slate-500 hover:text-cyan-400" title="Sync"><Zap className="w-3 h-3" /></button><button className="text-slate-500 hover:text-red-400" title="Block"><ShieldCheck className="w-3 h-3" /></button></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3 flex flex-col">
                <div className="glass-panel p-4 rounded-xl border border-slate-700 flex-1 overflow-hidden flex flex-col">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-purple-400"/> {t.hive_feed}
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        {hiveFeed.length === 0 && <p className="text-center text-slate-600 text-xs py-10">Hive is silent...</p>}
                        {hiveFeed.map(bit => (
                            <div key={bit.id} className="animate-in fade-in slide-in-from-bottom-4">
                               <HyperbitCard hyperbit={bit} language={language} />
                               <p className="text-[10px] text-slate-600 font-mono mt-1 ml-2">
                                   BROADCAST BY: <span className="text-purple-400">{bit.sharedBy}</span>
                               </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
