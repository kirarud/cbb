
import React, { useState, useRef } from 'react';
import { Package, FileText, Database, Download, Cpu, RefreshCw, Cloud, Server, Archive, Upload } from 'lucide-react';
import { Language, BuildTarget, ChatMessage, HyperBit, SystemLog } from '../types';
import { TRANSLATIONS } from '../constants';
import { getFullBackup, restoreBackup } from '../services/storageService';

interface DeployProps {
    language: Language;
    onLog: (msg: string, type: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS') => void;
    messages?: ChatMessage[];
    hyperbits?: HyperBit[];
    systemLogs?: SystemLog[];
    currentUser?: string | null;
}

export const Deploy: React.FC<DeployProps> = ({ language, onLog, messages = [], hyperbits = [], systemLogs = [], currentUser }) => {
    const t = TRANSLATIONS[language].deploy;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isRu = language === 'ru';
    const labels = {
        persistence: isRu ? 'Слой сохранения данных' : 'Data Persistence Layer',
        sync: isRu ? 'СИНХРОНИЗИРОВАТЬ' : 'SYNC CLOUD',
        syncing: isRu ? 'СИНХРОНИЗАЦИЯ...' : 'SYNCING...',
        restore: isRu ? 'ВОССТАНОВИТЬ СЛЕПОК' : 'RESTORE SNAPSHOT',
        exportTargets: isRu ? 'Цели экспорта' : 'Export Targets',
        ready: isRu ? 'ГОТОВ' : 'READY',
        operationLogs: isRu ? 'Журнал операций' : 'Operation Logs'
    };
    
    const [targets, setTargets] = useState<BuildTarget[]>([
        { id: 'desktop', name: t.targets.desktop.name, icon: FileText, status: 'IDLE', progress: 0 },
        { id: 'backup', name: isRu ? 'ПОЛНЫЙ СЛЕПОК СИСТЕМЫ' : 'FULL SYSTEM SNAPSHOT', icon: Archive, status: 'IDLE', progress: 0 },
        { id: 'android', name: t.targets.android.name, icon: Server, status: 'IDLE', progress: 0 },
    ]);

    const [logs, setLogs] = useState<string[]>([]);
    const [isManualSyncing, setIsManualSyncing] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleManualSync = () => {
        setIsManualSyncing(true);
        onLog(isRu ? 'Запущена ручная синхронизация.' : 'Manual synchronization sequence initiated.', 'INFO');
        setTimeout(() => {
             if (navigator.onLine) {
                 window.dispatchEvent(new Event('online')); 
                 onLog(isRu ? 'Сигнал синхронизации отправлен в ядро.' : 'Sync signal sent to Kernel.', 'SUCCESS');
             } else {
                 onLog(isRu ? 'Синхронизация невозможна: сеть оффлайн.' : 'Cannot sync: Network Offline.', 'ERROR');
             }
             setIsManualSyncing(false);
        }, 1000);
    };

    const downloadFile = (filename: string, content: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateContent = (id: string): string => {
        if (id === 'desktop') {
            return `${isRu ? '# Экспорт сессии Музы' : '# Muza Chat Session Export'}\n${isRu ? 'Дата' : 'Date'}: ${new Date().toLocaleString()}\n\n` + 
                   messages.map(m => `### ${m.sender} [${new Date(m.timestamp).toLocaleTimeString()}]\n${m.text}\n`).join('\n---\n');
        }
        if (id === 'backup') {
            return currentUser ? getFullBackup(currentUser) : '{}';
        }
        if (id === 'android') {
            return `:: MUZA OFFLINE LAUNCHER KIT\n@echo off\ntitle Muza Offline Link\nollama serve\npause`;
        }
        return "";
    };

    const startBuild = (id: string) => {
        onLog(isRu ? `Инициализация экспорта: ${id}` : `Initializing export for target: ${id}`, 'INFO');
        addLog(isRu ? `> Сериализация потока данных для ${id}...` : `> Serialize data stream for ${id}...`);
        setTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'BUILDING', progress: 5 } : t));

        const steps = [
            { prog: 30, msg: isRu ? "Сжатие..." : "Compressing..." },
            { prog: 60, msg: isRu ? "Форматирование..." : "Formatting..." },
            { prog: 100, msg: isRu ? "Готово." : "Ready." }
        ];
        let stepIndex = 0;
        const interval = setInterval(() => {
            if (stepIndex >= steps.length) {
                clearInterval(interval);
                setTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETE', progress: 100 } : t));
                addLog(isRu ? `> УСПЕХ: ${id} готов.` : `> SUCCESS: ${id} ready.`);
                onLog(isRu ? `Экспорт завершён: ${id}` : `Export complete for ${id}`, 'SUCCESS');
                return;
            }
            const step = steps[stepIndex];
            setTargets(prev => prev.map(t => t.id === id ? { ...t, progress: step.prog } : t));
            addLog(`> ${step.msg}`);
            stepIndex++;
        }, 500);
    };

    const handleDownload = (id: string) => {
        const content = generateContent(id);
        const ext = id === 'desktop' ? 'md' : id === 'backup' ? 'json' : 'bat';
        downloadFile(`muza_${id}_${Date.now()}.${ext}`, content, id === 'backup' ? 'application/json' : 'text/plain');
        onLog(isRu ? 'Файл загружен' : 'File downloaded', 'SUCCESS');
    };

    const handleRestoreClick = () => fileInputRef.current?.click();

    const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            const res = restoreBackup(content);
            if (res.success) {
                alert(isRu ? `Система восстановлена для: ${res.userId}. Перезагрузка...` : `System Restored for user: ${res.userId}. Reloading...`);
                window.location.reload();
            } else {
                alert(isRu ? `Ошибка восстановления: ${res.error}` : `Restore Failed: ${res.error}`);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-full p-6 md:p-10 overflow-hidden bg-slate-950">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileRestore} />
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/30">
                    <Package className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white">{t.title}</h2>
                    <p className="text-slate-400">{t.subtitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0">
                <div className="flex flex-col gap-6 overflow-y-auto">
                    <div className="glass-panel p-6 rounded-xl border border-blue-500/30 bg-blue-900/5">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Server className="w-5 h-5 text-blue-400" />
                            {labels.persistence}
                        </h3>
                        <div className="flex gap-4">
                            <button onClick={handleManualSync} disabled={isManualSyncing} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all">
                                <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
                                {isManualSyncing ? labels.syncing : labels.sync}
                            </button>
                            <button onClick={handleRestoreClick} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold flex items-center justify-center gap-2 border border-slate-600">
                                <Upload className="w-4 h-4" />
                                {labels.restore}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">{labels.exportTargets}</h3>
                        {targets.map(target => (
                            <div key={target.id} className="glass-panel p-4 rounded-xl border border-slate-700 relative overflow-hidden flex justify-between items-center group hover:bg-slate-800/30 transition-colors">
                                <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-900/10 to-cyan-900/10 transition-all duration-500 pointer-events-none" style={{ width: `${target.progress}%` }} />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${target.status === 'BUILDING' ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                                        <target.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{target.name}</h4>
                                        <div className="text-xs font-mono mt-1 text-slate-500">
                                            {target.status === 'IDLE' ? labels.ready : (target.status === 'BUILDING' ? t.status.building : target.status === 'COMPLETE' ? t.status.complete : t.status.error)}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    {target.status === 'IDLE' && <button onClick={() => startBuild(target.id)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><Cpu className="w-5 h-5" /></button>}
                                    {target.status === 'COMPLETE' && <button onClick={() => handleDownload(target.id)} className="p-2 bg-green-500/20 rounded-lg text-green-400"><Download className="w-5 h-5" /></button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel rounded-xl border border-slate-800 flex flex-col bg-black/60 font-mono text-xs overflow-hidden">
                    <div className="p-3 bg-slate-900 border-b border-slate-800"><span className="text-slate-400 uppercase">{labels.operationLogs}</span></div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-1">
                        {logs.map((log, i) => <div key={i} className="text-slate-300 border-l-2 border-slate-800 pl-2">{log}</div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};
