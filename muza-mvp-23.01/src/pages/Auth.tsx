
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Fingerprint, ArrowRight } from 'lucide-react';

interface Props {
  lang: Language;
  onLogin: (u: UserProfile) => void;
}

export const Auth: React.FC<Props> = ({ lang, onLogin }) => {
  const [input, setInput] = useState('');
  // FIX: Access SYSTEM_MESSAGES from TRANSLATIONS
  const t = TRANSLATIONS[lang].system_messages;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Create new profile
    const profile: UserProfile = {
      username: input,
      passwordHash: 'GENESIS_NO_PWD',
      recoveryKey: 'GENESIS_KEY',
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isGuest: false,
    };
    onLogin(profile);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen z-10 relative">
      <div className="p-8 glass-panel rounded-3xl border border-cyan-500/30 flex flex-col items-center gap-6 w-full max-w-md backdrop-blur-md bg-black/40">
        <div className="p-4 rounded-full bg-cyan-900/20 border border-cyan-500/50">
          <Fingerprint className="w-12 h-12 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-widest uppercase">{t.auth_welcome}</h1>
        
        <form onSubmit={handleLogin} className="w-full flex gap-2">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="ID..."
            className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors"
            autoFocus
          />
          <button type="submit" className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white transition-all">
            <ArrowRight />
          </button>
        </form>
      </div>
    </div>
  );
};