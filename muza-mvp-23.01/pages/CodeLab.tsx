
import React, { useState, useEffect } from 'react';
import { Play, Trash2, Clipboard, Terminal as TerminalIcon, Command, Save, Zap, Download, HelpCircle, X, Laptop, Globe, Copy, Check, Box, Server, Rocket } from 'lucide-react';
import { Language, ContainerState } from '../types';
import { TRANSLATIONS } from '../constants';
import { Tooltip } from '../components/Tooltip';
import { saveCodeDraft, loadCodeDraft } from '../services/storageService';

interface CodeLabProps {
    language: Language;
    onLog: (msg: string, type: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS') => void;
    currentUser?: string | null;
}

type ExecutionMode = 'BROWSER' | 'BRIDGE' | 'GENESIS';

export const CodeLab: React.FC<CodeLabProps> = ({ language, onLog, currentUser }) => {
    const t = TRANSLATIONS[language].codelab;
    // Access tooltips from the TRANSLATIONS object using language

    const DEFAULT_CODE_JS = `// Muza JS Sandbox
console.log("Kernel active.");
return "Ready.";`;

    const DEFAULT_CODE_PY = `# Muza Local Bridge
import pyautogui
import time
print("Moving mouse...")
pyautogui.moveRel(100, 0)
`;
    
    const DEFAULT_CODE_GENESIS = `// GENESIS SERVER (Node.js)
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Muza Genesis Container!');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
`;

    const [mode, setMode] = useState<ExecutionMode>('BROWSER');
    const [code, setCode] = useState(DEFAULT_CODE_JS);
    const [output, setOutput] = useState<string[]>([]);
    const [showHelp, setShowHelp] = useState(false);
    
    // v5.0 Genesis State
    const [containerStatus, setContainerStatus] = useState<ContainerState['status']>('OFFLINE');
    const [containerUrl, setContainerUrl] = useState<string | null>(null);

    // Switch Code Template on Mode Change
    useEffect(() => {
        if (mode === 'BRIDGE') setCode(DEFAULT_CODE_PY);
        if (mode === 'BROWSER') setCode(DEFAULT_CODE_JS);
        if (mode === 'GENESIS') setCode(DEFAULT_CODE_GENESIS);
    }, [mode]);

    const handleRun = () => {
        if (mode === 'BRIDGE') executePhantomLink();
        else if (mode === 'GENESIS') deployGenesisContainer();
        else executeBrowserSandbox();
    };

    const executePhantomLink = () => {
        const payload = {
            protocol: "MUZA_BRIDGE_V1",
            action: "EXECUTE",
            payload: code,
            timestamp: Date.now()
        };
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        onLog("Сигнал передан через квантовый буфер (Clipboard).", "SUCCESS");
        setOutput(["> [РЕЖИМ МОСТА] Пакет зашифрован и отправлен.", "> Ожидание локального перехватчика..."]);
    };

    const deployGenesisContainer = () => {
        setOutput(["> Initializing WebContainer environment...", "> Booting Node.js v18..."]);
        setContainerStatus('BOOTING');
        onLog("Genesis Sequence Initiated.", "INFO");

        // Simulate async WebContainer deployment
        setTimeout(() => {
            setOutput(prev => [...prev, "> Installing dependencies...", "> Starting server process..."]);
            setContainerStatus('RUNNING');
            setContainerUrl('http://localhost:3000'); // Simulated URL
            onLog("Container Materialized.", "SUCCESS");
            
            // Simulate server logs
            setTimeout(() => setOutput(prev => [...prev, "[SERVER] Server running at http://localhost:3000/"]), 1000);
            setTimeout(() => setOutput(prev => [...prev, "[SERVER] Request received: GET /"]), 3000);
        }, 2000);
    };

    const executeBrowserSandbox = () => {
        setOutput([]);
        const logs: string[] = [];
        const mockConsole = {
            log: (...args: any[]) => logs.push(`[LOG] ${args.join(' ')}`),
            warn: (...args: any[]) => logs.push(`[WRN] ${args.join(' ')}`),
            error: (...args: any[]) => logs.push(`[ERR] ${args.join(' ')}`)
        };

        try {
            // eslint-disable-next-line no-new-func
            const func = new Function('console', code);
            func(mockConsole);
            onLog('Задача в песочнице выполнена.', 'SUCCESS');
        } catch (e: any) {
            logs.push(`[EXCEPTION] ${e.message}`);
            onLog(`Ошибка песочницы: ${e.message}`, 'ERROR');
        }
        setOutput(logs);
    };

    return (
        <div className="flex flex-col h-full p-4 gap-4 relative">
             {/* TOP BAR */}
             <div className="flex items-center justify-between glass-panel p-4 rounded-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg transition-colors ${mode === 'BRIDGE' ? 'bg-yellow-500/20 text-yellow-400' : mode === 'GENESIS' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {mode === 'BRIDGE' ? <Zap className="w-6 h-6" /> : mode === 'GENESIS' ? <Box className="w-6 h-6" /> : <TerminalIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {mode === 'BRIDGE' ? t.localMode : mode === 'GENESIS' ? 'Genesis Container' : t.browserMode}
                            {mode === 'GENESIS' && <span className="text-[10px] bg-purple-900 px-2 rounded text-purple-200 border border-purple-500/50">v5.0</span>}
                        </h2>
                        
                        <div className="flex gap-1 mt-1 bg-slate-900 p-1 rounded-lg w-fit">
                            <button onClick={() => setMode('BROWSER')} className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-all ${mode === 'BROWSER' ? 'bg-cyan-900/50 text-cyan-300' : 'text-slate-500'}`}>
                                <Globe className="w-3 h-3" /> JS
                            </button>
                            <button onClick={() => setMode('BRIDGE')} className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-all ${mode === 'BRIDGE' ? 'bg-yellow-900/50 text-yellow-300' : 'text-slate-500'}`}>
                                <Laptop className="w-3 h-3" /> PY
                            </button>
                            <button onClick={() => setMode('GENESIS')} className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-all ${mode === 'GENESIS' ? 'bg-purple-900/50 text-purple-300' : 'text-slate-500'}`}>
                                <Server className="w-3 h-3" /> NODE
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={handleRun} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95 text-white 
                        ${mode === 'GENESIS' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-900/20' : 
                          mode === 'BRIDGE' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 shadow-orange-900/20' : 
                          'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-900/20'}`}
                    >
                        {mode === 'GENESIS' ? <Rocket className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                        {mode === 'GENESIS' ? t.materialize_button : t.run}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden min-h-0">
                {/* Editor */}
                <div className={`flex-1 glass-panel rounded-xl overflow-hidden border flex flex-col transition-colors ${mode === 'GENESIS' ? 'border-purple-500/30' : 'border-slate-700'}`}>
                    <textarea 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 bg-slate-950 p-4 font-mono text-sm focus:outline-none resize-none leading-relaxed text-slate-200"
                        spellCheck={false}
                    />
                </div>

                {/* Output / Preview */}
                <div className="flex-1 md:w-1/3 glass-panel rounded-xl overflow-hidden border border-slate-700 flex flex-col bg-black/50">
                    <div className="bg-slate-900 p-2 text-xs text-slate-500 font-mono border-b border-slate-800 flex justify-between items-center">
                        <span>{mode === 'GENESIS' ? t.genesis_container : t.output}</span>
                        {mode === 'GENESIS' && containerStatus === 'RUNNING' && (
                            <div className="flex items-center gap-2 text-green-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                LIVE
                            </div>
                        )}
                    </div>
                    
                    {/* Genesis Preview Frame */}
                    {mode === 'GENESIS' && containerStatus === 'RUNNING' ? (
                        // Display simulated server message in the Genesis preview
                        <div className="flex-1 bg-black text-center flex items-center justify-center flex-col">
                            <div className="text-white font-bold text-xl mb-2">Hello from Muza Genesis Container!</div>
                            <div className="text-slate-400 text-xs">Serving at {containerUrl}</div>
                        </div>
                    ) : (
                        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1">
                            {output.map((line, i) => (
                                <div key={i} className="text-slate-300 border-l-2 border-slate-800 pl-2 break-all">{line}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};