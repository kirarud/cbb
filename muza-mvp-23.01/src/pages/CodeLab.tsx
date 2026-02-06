
import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, Trash2, Terminal as TerminalIcon, Zap, 
    Box, Server, Rocket, Code2, Save, 
    RefreshCw, Cpu, Database, Binary, ShieldCheck,
    ChevronRight, TerminalSquare
} from 'lucide-react';
import { Language, ContainerState, MuzaState, ConsciousnessType } from '../types';
import { TRANSLATIONS } from '../constants';
import { core } from '../services/muzaAIService';
import { processExperience } from '../services/progressionService';

interface CodeLabProps {
    language: Language;
    muzaState: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
    onLog: (msg: string, type: any) => void;
}

type ExecutionMode = 'BROWSER' | 'BRIDGE' | 'GENESIS';

export const CodeLab: React.FC<CodeLabProps> = ({ language, muzaState, setMuzaState, onLog }) => {
    const t = TRANSLATIONS[language].codelab;
    
    const [mode, setMode] = useState<ExecutionMode>('BROWSER');
    const [code, setCode] = useState(`// Initializing Neural Interface...\nconsole.log("Muza Kernel Linked.");\n\nfunction evolve() {\n  return "Logic Synced";\n}\n\nevolve();`);
    const [output, setOutput] = useState<{msg: string, type: 'LOG' | 'ERR' | 'SYS'}[]>([]);
    const [containerStatus, setContainerStatus] = useState<ContainerState['status']>('OFFLINE');
    const [isMaterializing, setIsMaterializing] = useState(false);
    
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [output]);

    const addOutput = (msg: string, type: 'LOG' | 'ERR' | 'SYS' = 'LOG') => {
        setOutput(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
    };

    const handleRun = () => {
        addOutput(`Initiating execution in ${mode} mode...`, 'SYS');
        
        // Feed code tokens to Muza Brain
        core.processInput(code, 'user');
        
        if (mode === 'GENESIS') {
            materializeGenesis();
        } else if (mode === 'BROWSER') {
            executeJS();
        } else {
            simulateBridge();
        }

        // Grant Experience
        const { newState } = processExperience(muzaState, 'CODE_RUN', ConsciousnessType.CODE);
        setMuzaState(newState);
    };

    const executeJS = () => {
        try {
            const mockConsole = {
                log: (m: string) => addOutput(String(m), 'LOG'),
                error: (m: string) => addOutput(String(m), 'ERR')
            };
            const runner = new Function('console', code);
            const result = runner(mockConsole);
            if (result) addOutput(`Return: ${JSON.stringify(result)}`, 'SYS');
            onLog("Script sequence completed.", "SUCCESS");
        } catch (e: any) {
            addOutput(e.message, 'ERR');
            onLog("Execution failed: Syntax error.", "ERROR");
        }
    };

    const materializeGenesis = () => {
        setIsMaterializing(true);
        setContainerStatus('BOOTING');
        addOutput("Allocating virtual memory...", "SYS");
        
        setTimeout(() => {
            addOutput("Mounting Genesis Root FS...", "SYS");
            setTimeout(() => {
                addOutput("Container Materialized at port 3000.", "SYS");
                setContainerStatus('RUNNING');
                setIsMaterializing(false);
                onLog("Genesis Container Online.", "SUCCESS");
            }, 1500);
        }, 1000);
    };

    const simulateBridge = () => {
        addOutput("Awaiting bridge heartbeat...", "SYS");
        setTimeout(() => {
            addOutput("Quantum tunnel established.", "LOG");
            addOutput("Data packet encrypted and sent via buffer.", "LOG");
            navigator.clipboard.writeText(code);
            onLog("Bridge command pushed to clipboard.", "INFO");
        }, 800);
    };

    const handleSaveAsPatch = () => {
        const newPatch = {
            id: `patch-${Date.now()}`,
            type: 'USER_MUTATION',
            description: `Manual code injection: ${code.substring(0, 30)}...`,
            status: 'ACTIVE' as const,
            timestamp: Date.now()
        };
        setMuzaState(prev => ({
            ...prev,
            genesisPatches: [newPatch, ...prev.genesisPatches]
        }));
        onLog("Patch committed to Neural History.", "SUCCESS");
    };

    return (
        <div className="p-6 md:p-10 h-full flex flex-col bg-slate-950 gap-6 overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter uppercase">
                        <TerminalIcon className="w-10 h-10 text-cyan-400" />
                        Code Lab
                    </h1>
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            <Cpu className="w-3 h-3" /> Kernel: {muzaState.kernelVersion}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500 uppercase tracking-widest">
                            <div className={`w-1.5 h-1.5 rounded-full ${containerStatus === 'RUNNING' ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                            Genesis Status: {containerStatus}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="glass-panel p-1 rounded-xl bg-black/40 flex border border-white/5">
                        {(['BROWSER', 'BRIDGE', 'GENESIS'] as const).map(m => (
                            <button 
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                                    ${mode === m ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={handleRun}
                        disabled={isMaterializing}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isMaterializing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        {mode === 'GENESIS' ? 'Materialize' : 'Execute'}
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                
                {/* Editor Surface */}
                <div className="lg:col-span-8 flex flex-col glass-panel rounded-[2rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl relative">
                    <div className="absolute top-6 right-6 z-10 flex gap-2">
                        <button 
                            onClick={handleSaveAsPatch}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-cyan-400 transition-all border border-white/5"
                            title="Neural Commit"
                        >
                            <Save className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setCode('')}
                            className="p-3 bg-white/5 hover:bg-red-500/20 rounded-2xl text-slate-400 hover:text-red-400 transition-all border border-white/5"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="bg-slate-900/50 p-4 border-b border-white/5 flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-4">MuzaIDE_v4.sh — 1024.bit</span>
                    </div>

                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 bg-transparent p-8 font-mono text-sm text-cyan-50/80 resize-none focus:outline-none custom-scrollbar selection:bg-cyan-500/30 leading-relaxed"
                        spellCheck={false}
                        placeholder="// Start typing your neural logic..."
                    />

                    {isMaterializing && (
                        <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                            <div className="relative">
                                <Binary className="w-20 h-20 text-cyan-400 animate-pulse" />
                                <div className="absolute inset-0 animate-ping border-2 border-cyan-500 rounded-full scale-150 opacity-20" />
                            </div>
                            <p className="mt-8 text-cyan-400 font-mono text-xs uppercase tracking-[0.5em] animate-bounce">Materializing Reality...</p>
                        </div>
                    )}
                </div>

                {/* Side Panel: Output & Container Monitor */}
                <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
                    
                    {/* Console / Terminal */}
                    <div className="flex-1 flex flex-col glass-panel rounded-[2rem] border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
                        <div className="bg-black/40 p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <TerminalSquare className="w-4 h-4 text-cyan-400" /> Vortex Console
                            </div>
                            <button onClick={() => setOutput([])} className="text-[9px] text-slate-600 hover:text-white uppercase font-bold">Clear</button>
                        </div>
                        <div 
                            ref={terminalRef}
                            className="flex-1 p-6 font-mono text-[11px] overflow-y-auto custom-scrollbar space-y-2 bg-black/20"
                        >
                            {output.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-700 opacity-30 select-none">
                                    <span className="animate-pulse">Awaiting Signal...</span>
                                </div>
                            ) : (
                                output.map((line, i) => (
                                    <div key={i} className={`flex gap-3 leading-relaxed break-all animate-in slide-in-from-left-2
                                        ${line.type === 'ERR' ? 'text-red-400' : line.type === 'SYS' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                                        <ChevronRight className="w-3 h-3 shrink-0 mt-1 opacity-40" />
                                        <span>{line.msg}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Materialization Preview */}
                    <div className="h-48 glass-panel rounded-[2rem] border border-white/10 bg-black overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
                        <div className="absolute top-4 left-6 z-10">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Genesis Viewport</span>
                        </div>
                        
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8 relative z-10">
                            {containerStatus === 'RUNNING' ? (
                                <>
                                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                        <ShieldCheck className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase tracking-widest">Instance-3000 Alive</p>
                                        <p className="text-[9px] text-slate-500 mt-1 font-mono">Simulated server responsive. Neural patterns stable.</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Box className="w-12 h-12 text-slate-800" />
                                    <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black">No active deployment</p>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};