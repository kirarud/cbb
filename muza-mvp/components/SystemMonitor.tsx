
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
  
  const [hwState, setHwState] = useState<HardwareState>(detectHardware());
  const [history, setHistory] = useState<{cpu: number[], ram: number[], gpu: number[], temp: number[]}>({
      cpu: new Array(20).fill(0),
      ram: new Array(20).fill(0),
      gpu: new Array(20).fill(0),
      temp: new Array(20).fill(0)
  });
  const [processes, setProcesses] = useState<ActiveProcess[]>([]);
  const t = TRANSLATIONS[language].systemMonitor;

  useEffect(() => {
      const interval = setInterval(() => {
          const updated = pollMetrics(hwState);
          setHwState(updated);
          setProcesses(getKernelProcesses());
          
          setHistory(prev => ({
              cpu: [...prev.cpu.slice(1), updated.cpu.usage],
              ram: [...prev.ram.slice(1), (updated.ram.used / updated.ram.total) * 100],
              gpu: [...prev.gpu.slice(1), updated.gpu.load],
              temp: [...prev.temp.slice(1), (updated.gpu.temperature / 100) * 100] // Normalize for graph
          }));
      }, 1000);
      return () => clearInterval(interval);
  }, []); 

  useEffect(() => {
    if (activeTab === 'LOGS') logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs, activeTab]);

  const getLogIcon = (type: string) => {
      switch(type) {
          case 'ERROR': return <AlertTriangle className="w-3 h-3 text-red-500" />;
          case 'SUCCESS': return <CheckCircle className="w-3 h-3 text-green-500" />;
          case 'WARN': return <AlertTriangle className="w-3 h-3 text-amber-500" />;
          default: return <Info className="w-3 h-3 text-blue-500" />;
      }
  };

  return (
    <div className="h-full flex flex-col bg-black border-t border-slate-800 font-mono select-none">
        <div className="flex bg-slate-900/50 border-b border-slate-800">
             <button onClick={() => setActiveTab('HARDWARE')} className={`flex-1 py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1 ${activeTab === 'HARDWARE' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                <Cpu className="w-3 h-3" /> {t.tabs.hardware}
             </button>
             <button onClick={() => setActiveTab('KERNEL')} className={`flex-1 py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1 ${activeTab === 'KERNEL' ? 'bg-slate-800 text-purple-400' : 'text-slate-500 hover:text-white'}`}>
                <Layers className="w-3 h-3" /> {t.tabs.kernel}
             </button>
             <button onClick={() => setActiveTab('LOGS')} className={`flex-1 py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1 ${activeTab === 'LOGS' ? 'bg-slate-800 text-green-400' : 'text-slate-500 hover:text-white'}`}>
                <Terminal className="w-3 h-3" /> {t.tabs.logs}
             </button>
        </div>
        
        <div className="flex-1 overflow-y-auto relative scrollbar-thin bg-black/80">
            
            {activeTab === 'HARDWARE' && (
                <div className="p-3 space-y-4">
                    {/* CPU */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {t.labels?.cpu || 'CPU'}</span>
                            <span className="text-cyan-400">{hwState.cpu.usage.toFixed(1)}%</span>
                        </div>
                        <div className="h-10 bg-slate-900/50 border border-slate-800 rounded relative overflow-hidden">
                            <MiniGraph data={history.cpu} color="#22d3ee" />
                        </div>
                    </div>

                    {/* GPU & Thermal */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {t.labels?.gpuLoad || 'GPU Load'}</span>
                            <span className="text-yellow-400">{hwState.gpu.load.toFixed(0)}%</span>
                        </div>
                        <div className="h-10 bg-slate-900/50 border border-slate-800 rounded relative overflow-hidden">
                            <MiniGraph data={history.gpu} color="#facc15" />
                        </div>
                        
                        <div className="flex justify-between mt-2">
                            <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex-1 mr-2">
                                <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                                    <Thermometer className="w-3 h-3 text-red-400" /> {t.labels?.temp || 'Temp'}
                                </div>
                                <div className="text-sm font-bold text-red-300">{hwState.gpu.temperature.toFixed(1)}°C</div>
                            </div>
                            <div className="bg-slate-900/80 p-2 rounded border border-slate-800 flex-1">
                                <div className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-orange-400" /> {t.labels?.vram || 'VRAM'}
                                </div>
                                <div className="text-sm font-bold text-orange-300">{hwState.gpu.vramEstimated} MB</div>
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-600 truncate mt-1">
                            {(t.labels?.renderer || 'Renderer')}: {hwState.gpu.renderer}
                        </div>
                    </div>

                    {/* RAM */}
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-[10px] text-slate-400 uppercase">
                            <span className="flex items-center gap-1"><CircuitBoard className="w-3 h-3" /> {t.labels?.ram || 'RAM'}</span>
                            <span className="text-purple-400">{hwState.ram.used.toFixed(1)} / {hwState.ram.total} GB</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${(hwState.ram.used / hwState.ram.total) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'KERNEL' && (
                <div className="p-2 space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest pl-1 mb-2">{t.kernelTitle}</div>
                    {processes.map(proc => (
                        <div key={proc.id} className="flex items-center justify-between p-2 bg-slate-900/50 border border-slate-800 rounded hover:border-purple-500/30 transition-colors group">
                            <div className="flex items-center gap-2">
                                <Server className="w-3 h-3 text-slate-600 group-hover:text-purple-400" />
                                <span className="text-[10px] text-slate-300 font-bold">{proc.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500 uppercase">{proc.type}</span>
                                <div className="w-12 h-1 bg-slate-800 rounded overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{width: `${proc.progress}%`}}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'LOGS' && (
                <div className="p-2 space-y-0.5 text-[10px]">
                    {systemLogs.length === 0 && <div className="text-slate-700 italic px-2">{t.logsEmpty}</div>}
                    {systemLogs.map((log) => (
                        <div key={log.id} className="flex gap-2 p-1 hover:bg-slate-900 transition-colors items-start border-l-2 border-transparent hover:border-slate-700">
                            <span className="text-slate-600 whitespace-nowrap min-w-[50px] opacity-70">
                                {new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}
                            </span>
                            <span className={`font-bold uppercase w-10 shrink-0 text-right ${log.source === 'KERNEL' ? 'text-purple-500' : log.source === 'HARDWARE' ? 'text-yellow-500' : 'text-slate-500'}`}>
                                {log.source.slice(0,4)}
                            </span>
                            <div className="mt-0.5 opacity-80">{getLogIcon(log.type)}</div>
                            <span className={`break-all leading-tight ${log.type === 'ERROR' ? 'text-red-400' : 'text-slate-300'}`}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            )}
        </div>
    </div>
  );
};
