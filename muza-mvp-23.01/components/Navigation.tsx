
import React, { useRef } from 'react';
import { 
    MessageSquare, Music, LogOut, BookOpen, Package, 
    SlidersHorizontal, Users, Code, Network, Grid3X3, 
    Waves, Sparkles, Palette, Brain, Zap, Fingerprint
} from 'lucide-react';
import { Language, ViewMode, NavOverrides } from '../types';
import { Tooltip } from './Tooltip';
import { TRANSLATIONS } from '../constants';

interface NavigationProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
  overrides?: NavOverrides;
}

export const Navigation: React.FC<NavigationProps> = ({ viewMode, setViewMode, language, overrides, onLogout }) => {
  
  const navRef = useRef<HTMLElement>(null);
  const t_nav = TRANSLATIONS[language].nav;

  const navItems = [
    { mode: 'FOCUS', icon: MessageSquare, color: 'text-cyan-400', key: 'chat' },
    { mode: 'IMMERSIVE_SPACE', icon: Network, color: 'text-pink-400', key: 'space' },
    { mode: 'INSIGHTS', icon: Sparkles, color: 'text-purple-400', key: 'insights' },
    { mode: 'EVOLUTION', icon: Fingerprint, color: 'text-amber-400', key: 'evolution' },
    { mode: 'NEURAL_STUDIO', icon: Brain, color: 'text-blue-400', key: 'neuro' },
    { mode: 'MATRIX', icon: Grid3X3, color: 'text-green-400', key: 'matrix' },
    { mode: 'DESIGN', icon: Palette, color: 'text-rose-400', key: 'design' },
    { mode: 'CODELAB', icon: Code, color: 'text-gray-400', key: 'codelab' },
    { mode: 'DEPLOY', icon: Package, color: 'text-indigo-400', key: 'deploy' },
    { mode: 'SETTINGS', icon: SlidersHorizontal, color: 'text-slate-400', key: 'settings' }
  ];

  return (
    <div className="fixed bottom-0 md:bottom-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-6xl px-2 md:px-0 mb-2 md:mb-0 safe-area-inset-bottom">
      <nav 
        ref={navRef}
        className="glass-card p-1 md:p-2 flex items-center justify-start md:justify-center gap-1 md:gap-1.5 overflow-x-auto no-scrollbar shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-white/20"
        style={{ cursor: 'grab', userSelect: 'none' }}
      >
        {navItems.map((item) => (
          <Tooltip key={item.mode} content={overrides?.[item.key] || t_nav[item.key as keyof typeof t_nav] || item.key} position="top">
            <button
              onClick={() => setViewMode(item.mode as ViewMode)}
              className={`relative flex flex-col items-center justify-center p-2.5 md:p-3.5 rounded-2xl transition-all duration-300 group shrink-0
                ${viewMode === item.mode 
                  ? 'bg-white/10 scale-105 shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5 active:scale-95'
                }`}
            >
              <item.icon className={`w-5 h-5 md:w-7 md:h-7 ${viewMode === item.mode ? item.color : 'opacity-60 group-hover:opacity-100'} transition-transform duration-300`} />
              <span className={`hidden lg:block mt-1 text-[8px] font-bold uppercase tracking-widest transition-opacity duration-300 ${viewMode === item.mode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {overrides?.[item.key] || t_nav[item.key as keyof typeof t_nav]}
              </span>
              {viewMode === item.mode && (
                  <div className={`absolute -bottom-1 w-5 md:w-7 h-1 rounded-full ${item.color.replace('text-', 'bg-')} animate-pulse shadow-[0_0_10px_currentColor]`}></div>
              )}
            </button>
          </Tooltip>
        ))}
        <div className="hidden md:block w-px h-10 bg-white/10 mx-1"></div>
        <Tooltip content={t_nav.logout} position="top">
          <button
            onClick={onLogout}
            className="hidden md:flex flex-col items-center justify-center p-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all active:scale-90"
          >
            <LogOut className="w-6 h-6 md:w-7 md:h-7" />
          </button>
        </Tooltip>
      </nav>
    </div>
  );
};
