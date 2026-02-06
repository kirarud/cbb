
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Lock, User, Fingerprint, Check, UserPlus, Key, RefreshCcw, LogIn, Database, AlertCircle, Upload, Download, Ghost } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { registerUser, authenticateUser, resetPassword, getUserCount, importIdentity, exportIdentity } from '../services/storageService';

interface AuthProps {
    language: Language;
    onLogin: (username: string) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'RECOVERY';

export const Auth: React.FC<AuthProps> = ({ language, onLogin }) => {
    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [userCount, setUserCount] = useState(0);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = TRANSLATIONS[language].auth;

    useEffect(() => {
        setUserCount(getUserCount());
        const saved = localStorage.getItem('muza_saved_creds');
        if (saved && mode === 'LOGIN') {
            try {
                const parsed = JSON.parse(atob(saved));
                if (parsed.u) setUsername(parsed.u);
                setRememberMe(true);
            } catch (e) { }
        }
    }, [mode]);

    const handleGuestEnter = async () => {
        setIsLoading(true);
        setError('');
        
        // Simulation delay for effect
        await new Promise(r => setTimeout(r, 1200));
        
        const guestId = `guest_${Math.floor(Date.now() / 1000)}`;
        try {
            const result = await registerUser(guestId, '', true);
            if (result.success) {
                onLogin(guestId);
            } else {
                throw new Error("Guest initialization failed.");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        // Simulation delay for effect
        await new Promise(r => setTimeout(r, 800));

        try {
            if (mode === 'REGISTER') {
                if (password !== confirmPassword) {
                    throw new Error(t.passwordsNoMatch);
                }
                const result = await registerUser(username, password);
                if (!result.success) throw new Error(result.msg);
                
                setGeneratedKey(result.recoveryKey || '');
                setSuccessMsg(t.regComplete);
                setUserCount(prev => prev + 1); // Optimistic update
                
                // --- AUTO DOWNLOAD IDENTITY FILE ---
                // Wait briefly for state to settle, then download
                setTimeout(async () => {
                    try {
                        const identityString = await exportIdentity(username);
                        const blob = new Blob([identityString], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `MUZA_KEY_${username.toUpperCase()}.bit`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        console.log("Identity File Downloaded Automatically.");
                    } catch (err) {
                        console.error("Auto-download failed:", err);
                    }
                }, 500);

            } 
            else if (mode === 'LOGIN') {
                const isValid = await authenticateUser(username, password);
                if (isValid) {
                    if (rememberMe) {
                        localStorage.setItem('muza_saved_creds', btoa(JSON.stringify({ u: username })));
                    } else {
                        localStorage.removeItem('muza_saved_creds');
                    }
                    onLogin(username);
                } else {
                    throw new Error(t.invalidCreds);
                }
            }
            else if (mode === 'RECOVERY') {
                const result = await resetPassword(username, recoveryKey, password);
                if (result) {
                    setSuccessMsg(t.resetSuccess);
                    setTimeout(() => setMode('LOGIN'), 2000);
                } else {
                    throw new Error(t.invalidKey);
                }
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeSwitch = (newMode: AuthMode) => {
        setMode(newMode);
        setError('');
        setGeneratedKey(null);
        setSuccessMsg('');
    };

    const switchToLoginAfterReg = async () => {
        setMode('LOGIN');
        setGeneratedKey(null);
        setSuccessMsg('');
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            setIsLoading(true);
            try {
                const content = ev.target?.result as string;
                const result = await importIdentity(content);
                if (result.success) {
                    setSuccessMsg(result.msg);
                    setUsername(result.userId);
                    // Slight delay to show success
                    setTimeout(() => {
                        onLogin(result.userId);
                    }, 1000);
                } else {
                    setError(result.msg);
                }
            } catch (err) {
                setError("Failed to read identity file.");
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            
            <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-3xl border border-slate-700/50 shadow-2xl transition-all duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                        <Activity className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">MUZA NEXUS</h1>
                    <p className="text-slate-400 mt-2 text-center text-xs uppercase tracking-widest">{t.subtitle}</p>
                    
                    {/* Storage Indicator */}
                    <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/10">
                        <Database className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-mono">
                            {userCount} IDENTITIES DETECTED
                        </span>
                    </div>
                </div>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-xl">
                    <button onClick={() => handleModeSwitch('LOGIN')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === 'LOGIN' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.loginTab}</button>
                    <button onClick={() => handleModeSwitch('REGISTER')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === 'REGISTER' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.registerTab}</button>
                    <button onClick={() => handleModeSwitch('RECOVERY')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${mode === 'RECOVERY' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t.recoverTab}</button>
                </div>
                
                {/* Guest Entry Button */}
                <button 
                    type="button" 
                    onClick={handleGuestEnter} 
                    disabled={isLoading}
                    className="w-full font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] bg-slate-700 hover:bg-slate-600 text-white mb-4"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Ghost className="w-5 h-5" /> <span>{t.guest_enter}</span></>}
                </button>

                {/* Identity File Loader */}
                {mode === 'LOGIN' && (
                    <div className="mb-6">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".bit,.json" onChange={handleFileImport} />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 border border-slate-600 border-dashed rounded-xl text-slate-400 hover:text-white hover:border-cyan-500 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 group"
                        >
                            <Upload className="w-4 h-4 group-hover:text-cyan-400" />
                            <span className="text-xs font-bold">{language === 'ru' ? 'ЗАГРУЗИТЬ NEURO-KEY (.BIT)' : 'LOAD IDENTITY KEY (.BIT)'}</span>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase tracking-widest ml-1">{t.username}</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input 
                                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                                required
                            />
                        </div>
                    </div>

                    {mode === 'RECOVERY' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest ml-1">{t.recoveryKeyLabel}</label>
                            <div className="relative group">
                                <Key className="absolute left-4 top-3.5 w-5 h-5 text-amber-500 transition-colors" />
                                <input 
                                    type="text" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-amber-200 focus:outline-none focus:border-amber-500/50 font-mono"
                                    placeholder={t.recoveryKeyPlaceholder}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs text-slate-500 uppercase tracking-widest ml-1">{mode === 'RECOVERY' ? t.newPassword : t.password}</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input 
                                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                                required
                            />
                        </div>
                    </div>

                    {mode === 'REGISTER' && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs text-slate-500 uppercase tracking-widest ml-1">{t.confirmPassword}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <input 
                                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-purple-500/50"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'LOGIN' && (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                            <div className={`w-4 h-4 rounded border border-slate-600 flex items-center justify-center transition-colors ${rememberMe ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-900'}`}>
                                {rememberMe && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs text-slate-400 select-none">{t.remember}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-900/20 p-3 rounded border border-red-500/30 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold bg-green-900/20 p-3 rounded border border-green-500/30 animate-in fade-in">
                            <Check className="w-4 h-4 shrink-0" />
                            {successMsg}
                        </div>
                    )}
                    
                    {/* Generated Key Display */}
                    {generatedKey && mode === 'REGISTER' && (
                        <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg animate-in fade-in">
                            <p className="text-xs text-green-300 mb-1">{t.regSuccessTitle}</p>
                            <div className="font-mono text-white text-sm bg-black/50 p-2 rounded text-center select-all cursor-text">{generatedKey}</div>
                            <button type="button" onClick={switchToLoginAfterReg} className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" /> LOGIN AS {username.toUpperCase()}
                            </button>
                        </div>
                    )}

                    {(!generatedKey || mode !== 'REGISTER') && (
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] ${
                                mode === 'LOGIN' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20' :
                                mode === 'REGISTER' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20' :
                                'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20'
                            }`}
                        >
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 
                             mode === 'LOGIN' ? <><LogIn className="w-5 h-5" /> <span>{t.accessBtn}</span></> : 
                             mode === 'REGISTER' ? <><UserPlus className="w-5 h-5" /> <span>{t.createBtn}</span></> :
                             <><RefreshCcw className="w-5 h-5" /> <span>{t.resetBtn}</span></>}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};