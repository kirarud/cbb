
import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Radio, User, Cpu, AlertTriangle, CheckCircle, Info, Key, Lock, Network, Share2, ShieldCheck, Globe, Zap, Users } from 'lucide-react';
import { Language, SystemLog, PeerNode } from '../types';

interface SocialProps {
    language: Language;
    username: string;
    systemLogs: SystemLog[];
    peers?: PeerNode[];
}

export const Social: React.FC<SocialProps> = ({ language, username, systemLogs, peers = [] }) => {
  const isRu = language === 'ru';
  const labels = {
      title: isRu ? 'Коллективный разум (v4.0)' : 'Hive Mind (v4.0)',
      protocol: isRu ? 'ДЕЦЕНТРАЛИЗОВАННЫЙ ПРОТОКОЛ АКТИВЕН' : 'DECENTRALIZED MESH PROTOCOL ACTIVE',
      swarmStatus: isRu ? 'Статус роя' : 'Swarm Status',
      localNode: isRu ? 'Локальный узел' : 'Local Node',
      anonymous: isRu ? 'Аноним' : 'Anonymous',
      online: isRu ? 'В СЕТИ' : 'ONLINE',
      activePeers: isRu ? 'Активные узлы' : 'Active Peers',
      sync: isRu ? 'Синхр.' : 'Sync',
      block: isRu ? 'Блок' : 'Block',
      topology: isRu ? 'КАРТА_ТОПОЛОГИИ::В_РЕАЛЬНОМ_ВРЕМЕНИ' : 'TOPOLOGY_MAP::REALTIME',
      hiveLogs: isRu ? 'Логи роя' : 'Hive Logs',
      noActivity: isRu ? 'Сетевой активности нет...' : 'No network activity...'
  };
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activePeers, setActivePeers] = useState<PeerNode[]>(peers.length > 0 ? peers : [
      { id: 'alpha', name: 'Node-Alpha', status: 'IDLE', role: 'LOGIC', latency: 45, sharedBits: 124 },
      { id: 'beta', name: 'Node-Beta', status: 'CONNECTED', role: 'CREATIVE', latency: 12, sharedBits: 890 }
  ]);
  const [hiveStatus, setHiveStatus] = useState<'OFFLINE' | 'SYNCING' | 'CONNECTED'>('CONNECTED');

  // Mesh Visualization Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
                   name: `${isRu ? 'Искатель' : 'Seeker'}-${Math.floor(Math.random()*999)}`,
                   status: 'CONNECTED',
                   role: 'STORAGE',
                   latency: Math.floor(Math.random() * 100),
                   sharedBits: 0
               }]);
          }
      }, 3000);
  };

  // Mesh Animation
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

          // Draw Central Node (YOU)
          ctx.beginPath();
          ctx.arc(cx, cy, 20, 0, Math.PI * 2);
          ctx.fillStyle = '#22d3ee'; // Cyan
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#22d3ee';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw Peers
          activePeers.forEach((peer, i) => {
              const angle = (i / activePeers.length) * Math.PI * 2 + time * 0.2;
              const dist = 100 + Math.sin(time + i) * 20;
              const x = cx + Math.cos(angle) * dist;
              const y = cy + Math.sin(angle) * dist;

              // Connection Line
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
              ctx.arc(x, y, 10, 0, Math.PI * 2);
              ctx.fillStyle = peer.role === 'LOGIC' ? '#60a5fa' : peer.role === 'CREATIVE' ? '#c084fc' : '#facc15';
              ctx.fill();

              // Data Particles
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
  }, [activePeers]);

  const getLogIcon = (type: string) => {
      switch(type) {
          case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />;
          case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
          case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
          default: return <Info className="w-4 h-4 text-blue-500" />;
      }
  };
  const statusLabel = (status: 'OFFLINE' | 'SYNCING' | 'CONNECTED') => {
      if (!isRu) return status;
      if (status === 'CONNECTED') return 'СОЕДИНЁН';
      if (status === 'SYNCING') return 'СИНХРОН.';
      return 'ОФФЛАЙН';
  };
  const roleLabel = (role: string) => {
      if (!isRu) return role;
      if (role === 'LOGIC') return 'ЛОГИКА';
      if (role === 'CREATIVE') return 'ТВОРЧЕСТВО';
      if (role === 'STORAGE') return 'ПАМЯТЬ';
      return role;
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-hidden flex flex-col bg-slate-950">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full gap-6">
        
        {/* Header (v4.0 Style) */}
        <div className="flex justify-between items-center shrink-0">
          <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Globe className="w-8 h-8 text-purple-400" />
                  {labels.title}
              </h2>
              <p className="text-slate-400 text-xs font-mono mt-1">{labels.protocol}</p>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 font-bold uppercase">{labels.swarmStatus}</span>
                  <span className={`text-sm font-bold ${hiveStatus === 'CONNECTED' ? 'text-green-400' : 'text-red-400'}`}>{statusLabel(hiveStatus)}</span>
              </div>
              <div className="p-2 bg-purple-900/20 rounded-full border border-purple-500/30">
                <Network className="w-6 h-6 text-purple-400 animate-pulse" />
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
            
            {/* LEFT: MESH CONTROL */}
            <div className="flex flex-col gap-4">
                
                {/* Node Identity */}
                <div className="glass-panel p-4 rounded-xl border border-purple-500/30 bg-purple-900/5">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> {labels.localNode}
                    </h3>
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-white font-bold">{username || labels.anonymous}</span>
                         <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-400 text-[10px] border border-green-500/30">{labels.online}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono break-all">
                        ID: {btoa(username || 'anon').slice(0, 12)}...
                    </div>
                </div>

                {/* Peer List */}
                <div className="glass-panel p-4 rounded-xl border border-slate-700 flex-1 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4" /> {labels.activePeers} ({activePeers.length})
                        </h3>
                        <button 
                            onClick={handleScan}
                            disabled={isScanning}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-cyan-400 transition-colors"
                        >
                            <Radio className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {activePeers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-600 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${p.status === 'CONNECTED' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">{p.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{roleLabel(p.role)} • {p.latency}ms</div>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button className="text-slate-500 hover:text-cyan-400" title={labels.sync}><Zap className="w-3 h-3" /></button>
                                    <button className="text-slate-500 hover:text-red-400" title={labels.block}><ShieldCheck className="w-3 h-3" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MIDDLE: VISUALIZER */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="flex-1 glass-panel rounded-xl border border-slate-800 relative overflow-hidden bg-black/40">
                    <div className="absolute top-4 left-4 z-10 text-[10px] font-mono text-slate-500">
                        {labels.topology}
                    </div>
                    <canvas ref={canvasRef} className="w-full h-full block" />
                </div>

                {/* LOGS */}
                <div className="h-48 glass-panel rounded-xl border border-slate-800 flex flex-col relative overflow-hidden">
                    <div className="p-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-2">{labels.hiveLogs}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-black/40 font-mono text-xs">
                        {systemLogs.filter(l => l.source === 'HIVE' || l.source === 'NETWORK').length === 0 && <div className="text-slate-600 italic">{labels.noActivity}</div>}
                        
                        {systemLogs.filter(l => l.source === 'HIVE' || l.source === 'NETWORK').map((log) => (
                            <div key={log.id} className="flex gap-3 hover:bg-slate-800/30 p-1 rounded transition-colors">
                                <span className="text-slate-600 whitespace-nowrap opacity-70">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                                <div>{getLogIcon(log.type)}</div>
                                <span className="font-bold text-purple-400 uppercase">
                                    {log.source}
                                </span>
                                <span className="text-slate-300">{log.message}</span>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
