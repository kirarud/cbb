
import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Radio, AlertTriangle, CheckCircle, Info, Activity, Cpu, CircuitBoard, HardDrive, Layers, Server, Thermometer, Zap } from 'lucide-react';
import { Language, SystemLog, HardwareState, ActiveProcess } from '../types';
import { TRANSLATIONS } from '../constants';
import { detectHardware, pollMetrics, getKernelProcesses } from '../services/hardwareService';

interface SystemMonitorProps {
    language: Language;
    systemLogs: SystemLog[];
}

const MiniGraph: React.FC<{ data: number[], color: string, height?: number }> = ({ data, color, height = 40 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.clearRect(0,0,w,h);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((val, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - (val / 100) * h;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fillStyle = color + '33'; 
        ctx.fill();
    }, [data, color]);
    return <canvas ref={canvasRef} width={120} height={height} className="w-full" />;
};

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ language, systemLogs }) => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'HARDWARE' | 'KERNEL'>('HARDWARE');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language].system_monitor;
  
  const [hwState, setHwState] = useState<HardwareState>(detectHardware());
  const [history, setHistory] = useState<{cpu: number[], ram: number[], gpu: number[], temp: number[]}>({
      cpu: new Array(20).fill(0),
      ram: new Array(20).fill(0),
      gpu: new Array(20).fill(0),
      temp: new Array(20).fill(0)
  });
  const [processes, setProcesses] = useState<ActiveProcess[]>([]);

  useEffect(() => {
      const interval = setInterval(() => {
          const updated = pollMetrics(hwState);
          setHwState(updated);
          setProcesses(getKernelProcesses());
          
          setHistory(prev => ({
              cpu: [...prev.cpu.slice(1), updated.cpu.usage],
              ram: [...prev.ram.slice(1), (updated.ram.used / updated.ram.total * 100)], // Fixed: Completed RAM calculation
              gpu: [...prev.gpu.slice(1), updated.gpu.load],
              temp: [...prev.temp.slice(1), updated.gpu.temperature]
          }));
      }, 1000); // Poll every second

      return () => clearInterval(interval);
  }, [hwState]); // Dependency array to re-run on hwState changes
  
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  const getLogIcon = (type: string) => {
      switch(type) {
          case 'ERROR': return <AlertTriangle className="w-4 h-4 text-red-500" />;
          case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
          case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
          default: return <Info className="w-4 h-4 text-blue-500" />;
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
        <div className="flex bg-slate-900 border-b border-slate-800 shrink-0">
            <button onClick={() => setActiveTab('HARDWARE')} className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${activeTab === 'HARDWARE' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>{t.tabs.hw}</button>
            <button onClick={() => setActiveTab('KERNEL')} className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${activeTab === 'KERNEL' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-white'}`}>{t.tabs.kernel}</button>
            <button onClick={() => setActiveTab('LOGS')} className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${activeTab === 'LOGS' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-500 hover:text-white'}`}>{t.tabs.logs}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'HARDWARE' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2"><Cpu className="w-4 h-4 text-cyan-400" /> {t.cpu}</h3>
                            <div className="flex justify-between items-end text-white text-2xl font-mono mb-2">
                                <span>{hwState.cpu.usage.toFixed(1)}%</span>
                                <span className="text-sm text-slate-500">{hwState.cpu.cores} Cores</span>
                            </div>
                            <MiniGraph data={history.cpu} color="#22d3ee" />
                        </div>
                        <div className="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2"><CircuitBoard className="w-4 h-4 text-pink-400" /> {t.gpu}</h3>
                            <div className="flex justify-between items-end text-white text-2xl font-mono mb-2">
                                <span>{hwState.gpu.load.toFixed(1)}%</span>
                                <span className="text-sm text-slate-500">{t.vram}: {(hwState.gpu.vramEstimated / 1024).toFixed(1)}GB</span>
                            </div>
                            <MiniGraph data={history.gpu} color="#f472b6" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2"><HardDrive className="w-4 h-4 text-green-400" /> {t.ram}</h3>
                            <div className="flex justify-between items-end text-white text-2xl font-mono mb-2">
                                <span>{((hwState.ram.used / hwState.ram.total) * 100).toFixed(1)}%</span>
                                <span className="text-sm text-slate-500">{(hwState.ram.used).toFixed(0)}/{hwState.ram.total.toFixed(0)} GB</span>
                            </div>
                            <MiniGraph data={history.ram} color="#4ade80" />
                        </div>
                        <div className="glass-panel p-4 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2"><Thermometer className="w-4 h-4 text-red-400" /> {t.temp}</h3>
                            <div className="flex justify-between items-end text-white text-2xl font-mono mb-2">
                                <span>{hwState.gpu.temperature.toFixed(1)}°C</span>
                                <span className="text-sm text-slate-500">Fan: {hwState.fanSpeed.toFixed(0)} RPM</span>
                            </div>
                            <MiniGraph data={history.temp} color="#f87171" />
                        </div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                        <p>OS: {hwState.os} ({hwState.userAgent})</p>
                        <p>GPU: {hwState.gpu.renderer} ({hwState.gpu.vendor})</p>
                        <p>Browser Heap: {hwState.ram.browserHeap} MB</p>
                    </div>
                </div>
            )}

            {activeTab === 'KERNEL' && (
                <div className="space-y-4 animate-in fade-in">
                    <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-400" /> {t.threads}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {processes.map(p => (
                            <div key={p.id} className="glass-panel p-4 rounded-xl border border-slate-800 text-xs font-mono flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-white">{p.name}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] ${p.type === 'KERNEL' ? 'bg-purple-900/50 text-purple-400' : p.type === 'THOUGHT' ? 'bg-cyan-900/50 text-cyan-400' : 'bg-slate-900/50 text-slate-400'}`}>{p.type}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 animate-pulse" style={{ width: `${p.progress}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'LOGS' && (
                <div className="space-y-2 font-mono text-xs animate-in fade-in">
                    {systemLogs.length === 0 && <div className="text-slate-600 italic">No system events logged.</div>}
                    {systemLogs.map((log) => (
                        <div key={log.id} className="flex gap-3 hover:bg-slate-800/30 p-1 rounded transition-colors">
                            <span className="text-slate-600 whitespace-nowrap opacity-70">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
                            <div>{getLogIcon(log.type)}</div>
                            <span className="font-bold text-cyan-400 uppercase">
                                {log.source}
                            </span>
                            <span className="text-slate-300">{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            )}
        </div>
    </div>
  );
};