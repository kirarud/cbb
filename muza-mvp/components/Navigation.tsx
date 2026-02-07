
import React from 'react';
import { MessageSquare, Globe, Activity, BookOpen, Terminal, Languages, LogOut, Package, Sliders, Mic2, Grid, Fingerprint, Music, Palette, Zap, Archive, Wifi, WifiOff, Save, Link, Inbox } from 'lucide-react';
import { Language, ViewMode, NavOverrides } from '../types';
import { THEMES, TRANSLATIONS } from '../constants';
import { Tooltip } from './Tooltip';

interface NavigationProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMobile?: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogout: () => void;
  overrides?: NavOverrides; // New: Custom labels
  status?: { isOnline: boolean; lastSaved?: number | null };
  activeThemeId?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ viewMode, setViewMode, isMobile = false, language, setLanguage, onLogout, overrides, status, activeThemeId }) => {
  const t = TRANSLATIONS[language].nav;
  const tooltips = TRANSLATIONS[language].tooltips;
  const isRu = language === 'ru';
  const themeBg = activeThemeId && THEMES[activeThemeId]?.colors?.background;

  const isLightTheme = (() => {
    if (!themeBg || !themeBg.startsWith('#')) return activeThemeId === 'OLYMPUS';
    const hex = themeBg.replace('#', '');
    if (hex.length !== 6) return activeThemeId === 'OLYMPUS';
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.55;
  })();

  const statusShellClass = isLightTheme
    ? 'bg-slate-900/70 border-slate-800/70 shadow-[0_6px_18px_rgba(15,23,42,0.28)]'
    : 'bg-black/30 border-white/10';

  const onlineColorClass = status?.isOnline
    ? (isLightTheme ? 'text-emerald-300' : 'text-green-400')
    : (isLightTheme ? 'text-rose-300' : 'text-red-400');

  const saveColorClass = isLightTheme ? 'text-sky-300' : 'text-cyan-500';

  // Use overrides if available, otherwise default to translation
  const getLabel = (key: keyof NavOverrides, defaultText: string) => {
      return overrides && overrides[key] ? overrides[key] : defaultText;
  };

  const navItems = [
    { mode: 'FOCUS', label: getLabel('chat', t.chat), icon: MessageSquare, tooltip: tooltips.nav_chat },
    { mode: 'DATA_VAULT', label: getLabel('vault', t.vault), icon: Archive, tooltip: tooltips.nav_vault || t.vault },
    { mode: 'SYNESTHESIA', label: getLabel('synesthesia', t.synesthesia), icon: Zap, tooltip: tooltips.nav_synesthesia || t.synesthesia },
    { mode: 'DESIGN_STUDIO', label: t.design, icon: Palette, tooltip: tooltips.nav_design || t.design }, 
    { mode: 'EVOLUTION', label: getLabel('profile', t.profile), icon: Fingerprint, tooltip: tooltips.nav_profile || t.profile }, 
    // Music Lab replaced/enhanced by Synesthesia, but kept for legacy/granular control
    { mode: 'MUSIC_LAB', label: getLabel('music', t.music), icon: Music, tooltip: tooltips.nav_music || t.music },
    { mode: 'SPLIT_CODE', label: getLabel('code', t.codelab), icon: Terminal, tooltip: tooltips.nav_codelab },
    { mode: 'IMMERSIVE_SPACE', label: getLabel('space', t.space), icon: Globe, tooltip: tooltips.nav_space },
    { mode: 'MATRIX', label: t.matrix, icon: Grid, tooltip: tooltips.nav_matrix || t.matrix },
    { mode: 'NEURAL_STUDIO', label: t.neural, icon: Mic2, tooltip: tooltips.nav_neural || t.neural },
    { mode: 'DEPLOY', label: getLabel('deploy', t.deploy), icon: Package, tooltip: tooltips.nav_deploy },
    { mode: 'BRIDGE_UI', label: getLabel('bridge', t.bridge), icon: Link, tooltip: tooltips.nav_bridge || t.bridge },
    { mode: 'LEAD_INBOX', label: isRu ? 'Заявки' : 'Leads', icon: Inbox, tooltip: isRu ? 'Кабинет заявок' : 'Lead inbox' },
    { mode: 'SETTINGS', label: t.settings, icon: Sliders, tooltip: tooltips.nav_settings || t.settings }, 
    { mode: 'WIKI', label: t.wiki, icon: BookOpen, tooltip: tooltips.nav_wiki },
  ];

  const containerClasses = isMobile
    ? "fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex justify-around p-3 z-50 overflow-x-auto no-scrollbar"
    : "hidden md:flex flex-col w-16 h-screen bg-slate-950 border-r border-slate-800 py-6 items-center z-50 transition-colors duration-500 overflow-y-auto no-scrollbar";

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  const handleModeClick = (mode: string) => {
      if (viewMode === mode) {
          setViewMode('FOCUS');
      } else {
          setViewMode(mode as ViewMode);
      }
  };

  return (
    <nav className={containerClasses} style={{ backgroundColor: 'var(--color-bg)', borderColor: 'rgba(255,255,255,0.1)' }} data-testid="nav">
      {!isMobile && (
        <div className="mb-8 flex flex-col items-center space-y-4">
          <Activity className="w-8 h-8 animate-pulse text-cyan-400" />
        </div>
      )}
      
      <div className={`flex ${isMobile ? 'flex-row w-full justify-start gap-4 px-4' : 'flex-col space-y-4 w-full px-2 items-center'}`}>
          {navItems.map((item) => (
            <Tooltip key={item.mode} content={item.label} position={isMobile ? 'top' : 'right'}>
                <button
                onClick={() => handleModeClick(item.mode)}
                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 group shrink-0
                    ${viewMode === item.mode 
                    ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] scale-110' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`}
                data-testid={`nav-${item.mode}`}
                aria-label={item.label}
                >
                <item.icon className={`w-5 h-5 ${viewMode === item.mode ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                </button>
            </Tooltip>
          ))}
      </div>

      <div className="flex-1" />
      
      {!isMobile && (
        <div className="flex flex-col space-y-4 items-center mb-4 mt-4">
             <Tooltip content={isRu ? 'Переключить на английский' : 'Switch to Russian'} position="right">
                <button 
                    onClick={toggleLanguage}
                    className="p-2 text-xs border border-slate-700 rounded-lg hover:bg-white/5 transition-colors text-slate-400 font-bold"
                >
                    {language === 'en' ? 'EN' : 'RU'}
                </button>
            </Tooltip>

             <Tooltip content={t.logout} position="right">
                <button
                    onClick={onLogout}
                    className="p-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </Tooltip>

            {status && (
              <div className="mt-2 flex flex-col items-center gap-2">
                <Tooltip
                  content={
                    status.isOnline
                      ? (isRu ? 'Онлайн' : 'Online')
                      : (isRu ? 'Автономно' : 'Offline')
                  }
                  position="right"
                >
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors duration-500 ${onlineColorClass} ${statusShellClass}`}
                    aria-label={status.isOnline ? (isRu ? 'Онлайн' : 'Online') : (isRu ? 'Автономно' : 'Offline')}
                  >
                    {status.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  </div>
                </Tooltip>
                {status.lastSaved && (
                  <Tooltip
                    content={`${isRu ? 'Сохранено' : 'Saved'}: ${new Date(status.lastSaved).toLocaleTimeString()}`}
                    position="right"
                  >
                    <div
                      className={`w-7 h-7 rounded-full border flex items-center justify-center backdrop-blur-md text-slate-300 ${statusShellClass}`}
                      aria-label={`${isRu ? 'Сохранено' : 'Saved'}: ${new Date(status.lastSaved).toLocaleTimeString()}`}
                    >
                      <Save className={`w-3 h-3 ${saveColorClass}`} />
                    </div>
                  </Tooltip>
                )}
              </div>
            )}
        </div>
      )}

       {isMobile && (
        <div className="flex space-x-2 shrink-0 ml-4 items-center">
            <button onClick={toggleLanguage} className="p-2 text-slate-500"><Languages className="w-5 h-5"/></button>
            <button onClick={onLogout} className="p-2 text-red-500/70"><LogOut className="w-5 h-5"/></button>
        </div>
      )}
    </nav>
  );
};
