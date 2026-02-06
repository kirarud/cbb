

import React, { useState, useRef } from 'react';
import { Package, FileText, Database, Download, Cpu, RefreshCw, Cloud, Server, Archive, Upload, Terminal } from 'lucide-react';
import { Language, BuildTarget, ChatMessage, HyperBit, SystemLog } from '../types';
import { TRANSLATIONS } from '../constants';
import { getFullBackup, restoreBackup } from '../services/storageService';
import JSZip from 'jszip';

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
    
    const [targets, setTargets] = useState<BuildTarget[]>([
        { id: 'desktop', name: t.targets.desktop.name, icon: FileText, status: 'IDLE', progress: 0 },
        { id: 'backup', name: t.targets.backup.name, icon: Archive, status: 'IDLE', progress: 0 },
        { id: 'android', name: t.targets.android.name, icon: Server, status: 'IDLE', progress: 0 },
    ]);

    const [logs, setLogs] = useState<string[]>([]);
    const [isManualSyncing, setIsManualSyncing] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleManualSync = () => {
        setIsManualSyncing(true);
        onLog('Ручная синхронизация инициирована.', 'INFO');
        setTimeout(() => {
             if (navigator.onLine) {
                 window.dispatchEvent(new Event('online')); 
                 onLog('Сигнал синхронизации отправлен ядру.', 'SUCCESS');
             } else {
                 onLog('Синхронизация невозможна: нет сети.', 'ERROR');
             }
             setIsManualSyncing(false);
        }, 1000);
    };

    const downloadFile = (filename: string, content: string | Blob, type: string) => {
        const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateContent = async (id: string): Promise<string | Blob> => {
        if (id === 'desktop') {
            return `# Экспорт сессии чата Музы\nДата: ${new Date().toLocaleString()}\n\n` + 
                   messages.map(m => `### ${m.sender} [${new Date(m.timestamp).toLocaleTimeString()}]\n${m.text}\n`).join('\n---\n');
        }
        if (id === 'backup') {
            return currentUser ? getFullBackup(currentUser) : '{}';
        }
        if (id === 'android') {
             const zip = new JSZip();
             const allFiles = document.querySelectorAll('script[src], link[href]');
             // This is a simplified fetch, real implementation would need to handle CORS
             zip.file('index.html', document.documentElement.outerHTML);
             // In a real scenario, you'd fetch all local .tsx, .ts files. Here we simulate it.
             zip.file('readme.txt', 'Распакуйте архив и откройте index.html в браузере для запуска оффлайн-версии Музы.');
             return zip.generateAsync({ type: "blob" });
        }
        return "";
    };

    const startBuild = (id: string) => {
        onLog(`Инициализация экспорта для: ${id}`, 'INFO');
        addLog(t.log_serialize(id));
        setTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'BUILDING', progress: 5 } : t));

        const steps = [{ prog: 30, msg: t.log_compress }, { prog: 60, msg: t.log_format }, { prog: 100, msg: t.log_ready }];
        let stepIndex = 0;
        const interval = setInterval(() => {
            if (stepIndex >= steps.length) {
                clearInterval(interval);
                setTargets(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETE', progress: 100 } : t));
                addLog(t.log_success(id));
                onLog(`Экспорт завершен для ${id}`, 'SUCCESS');
                return;
            }
            const step = steps[stepIndex];
            setTargets(prev => prev.map(t => t.id === id ? { ...t, progress: step.prog } : t));
            addLog(`> ${step.msg}`);
            stepIndex++;
        }, 500);
    };

    const handleDownload = async (id: string) => {
        const content = await generateContent(id);
        const ext = id === 'desktop' ? 'md' : id === 'backup' ? 'json' : 'zip';
        downloadFile(`muza_${id}_${Date.now()}.${ext}`, content, id === 'backup' ? 'application/json' : id === 'android' ? 'application/zip' : 'text/plain');
        onLog(`Файл загружен`, 'SUCCESS');
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
                // FIX: Complete the template literal string here
                alert(`${language === 'ru' ? 'Система восстановлена для пользователя' : 'System restored for user'}: ${res.userId}. ${language === 'ru' ? 'Перезагрузите страницу для применения.' : 'Reload page to apply changes.'}`);
                onLog(`Восстановление успешно: ${res.userId}`, 'SUCCESS');
            } else {
                alert(`Ошибка восстановления: ${res.error || 'Неизвестная ошибка'}`);
                onLog(`Ошибка восстановления: ${res.error || 'Неизвестная ошибка'}`, 'ERROR');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-900/10">
                        <Package className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{t.title}</h1>
                        <p className="text-slate-400 text-sm">{t.subtitle}</p>
                    </div>
                </div>

                {/* Data Persistence Layer */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Database className="w-6 h-6 text-cyan-400" /> {t.data_persistence}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={handleManualSync}
                            disabled={isManualSyncing}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isManualSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />} {t.sync_cloud}
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileRestore} 
                            accept="application/json" 
                            className="hidden" 
                        />
                        <button 
                            onClick={handleRestoreClick}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-all"
                        >
                            <Upload className="w-4 h-4" /> {t.restore_snapshot}
                        </button>
                    </div>
                </div>

                {/* Export Targets */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Download className="w-6 h-6 text-purple-400" /> {t.export_targets}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {targets.map((target) => (
                            <div key={target.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center text-center">
                                <target.icon className={`w-12 h-12 mb-3 ${target.status === 'COMPLETE' ? 'text-green-400' : 'text-purple-400'}`} />
                                <h3 className="text-lg font-bold text-white mb-1">{target.name}</h3>
                                <p className="text-xs text-slate-400 mb-4 h-10">{t.targets[target.id as keyof typeof t.targets].desc}</p>
                                
                                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-3 overflow-hidden">
                                    <div 
                                        className={`h-2.5 rounded-full ${target.status === 'BUILDING' ? 'bg-purple-500 animate-pulse' : target.status === 'COMPLETE' ? 'bg-green-500' : 'bg-slate-700'}`} 
                                        style={{ width: `${target.progress}%` }}
                                    ></div>
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-widest ${target.status === 'COMPLETE' ? 'text-green-400' : target.status === 'BUILDING' ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`}>
                                    {target.status === 'IDLE' ? t.status_idle : 
                                     target.status === 'BUILDING' ? t.status_building : 
                                     target.status === 'COMPLETE' ? t.status_complete : 
                                     t.status_error}
                                </span>

                                <button 
                                    onClick={() => target.status === 'COMPLETE' ? handleDownload(target.id) : startBuild(target.id)}
                                    disabled={target.status === 'BUILDING'}
                                    className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
                                >
                                    {target.status === 'COMPLETE' ? <Download className="w-4 h-4 inline-block mr-2" /> : <Cpu className="w-4 h-4 inline-block mr-2" />}
                                    {target.status === 'COMPLETE' ? t.download : t.build}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Operation Logs */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Terminal className="w-6 h-6 text-yellow-400" /> {t.op_logs}
                    </h2>
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-slate-300 h-64 overflow-y-auto custom-scrollbar">
                        {logs.length === 0 ? <p className="text-slate-600 italic">No operations logged yet.</p> :
                         logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};