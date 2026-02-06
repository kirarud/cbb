
import React, { useState } from 'react';
import { MuzaState, Language } from '../types';
import { Save, Download, RefreshCw, Trash2, Sliders, Activity, Zap, Brain } from 'lucide-react';
import { clearLocalData } from '../services/storageService';
import { THEMES, TRANSLATIONS } from '../constants';

interface SettingsProps {
  state: MuzaState;
  setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
  onLog: (msg: string) => void;
  currentUser?: string | null;
  language: Language;
}

export const Settings: React.FC<SettingsProps> = ({ state, setMuzaState, onLog, currentUser, language }) => {
  const t = TRANSLATIONS[language].settings;
  const [selfCheckLog, setSelfCheckLog] = useState<{ id: string; status: 'OK' | 'WARN' | 'ERROR'; message: string }[]>([]);
  const [selfCheckRunning, setSelfCheckRunning] = useState(false);
  const [lastSelfCheckAt, setLastSelfCheckAt] = useState<number | null>(null);
  const isRu = language === 'ru';

  const handleWipe = () => {
    if (!currentUser) return;
    if (confirm(language === 'ru'
        ? "ВНИМАНИЕ: это полностью сотрёт память для выбранного пользователя. Продолжить?"
        : "WARNING: this will wipe all memory for your user account. Continue?")) {
      clearLocalData(currentUser);
      window.location.reload();
    }
  };

  const runSelfCheck = () => {
    setSelfCheckRunning(true);
    const results: { id: string; status: 'OK' | 'WARN' | 'ERROR'; message: string }[] = [];
    const push = (status: 'OK' | 'WARN' | 'ERROR', message: string) => {
      results.push({ id: `${Date.now()}-${Math.random()}`, status, message });
    };

    try {
      const root = TRANSLATIONS[language] as any;
      if (!root?.nav || !root?.chat || !root?.settings) {
        push('ERROR', isRu ? 'Отсутствуют ключи перевода (nav/chat/settings).' : 'Missing translation keys (nav/chat/settings).');
      } else {
        push('OK', isRu ? 'Ключи перевода доступны.' : 'Translation keys are present.');
      }
    } catch (e: any) {
      push('ERROR', isRu ? `Сбой проверки переводов: ${e.message}` : `Translation check failed: ${e.message}`);
    }

    try {
      const navEl = document.querySelector('[data-testid="nav"]');
      if (navEl) {
        push('OK', isRu ? 'Навигация обнаружена.' : 'Navigation detected.');
      } else {
        push('WARN', isRu ? 'Навигация не найдена в DOM.' : 'Navigation not found in DOM.');
      }
    } catch (e: any) {
      push('WARN', isRu ? `Навигация: ошибка чтения DOM (${e.message}).` : `Navigation DOM read error (${e.message}).`);
    }

    try {
      const themeId = state.design?.activeTheme;
      if (themeId && THEMES[themeId]) {
        push('OK', isRu ? `Тема активна: ${themeId}.` : `Theme active: ${themeId}.`);
      } else {
        push('WARN', isRu ? 'Активная тема не найдена в реестре.' : 'Active theme not found in registry.');
      }
    } catch (e: any) {
      push('WARN', isRu ? `Тема: сбой проверки (${e.message}).` : `Theme check failed (${e.message}).`);
    }

    try {
      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue('--color-bg').trim();
      if (bg) push('OK', isRu ? 'CSS‑переменные применены.' : 'CSS variables applied.');
      else push('WARN', isRu ? 'CSS‑переменные не заданы.' : 'CSS variables are missing.');
    } catch (e: any) {
      push('WARN', isRu ? `CSS‑переменные: сбой (${e.message}).` : `CSS variables check failed (${e.message}).`);
    }

    try {
      const testKey = 'muza_selfcheck';
      localStorage.setItem(testKey, '1');
      const ok = localStorage.getItem(testKey) === '1';
      localStorage.removeItem(testKey);
      if (ok) push('OK', isRu ? 'localStorage доступен.' : 'localStorage available.');
      else push('WARN', isRu ? 'localStorage недоступен.' : 'localStorage not available.');
    } catch (e: any) {
      push('ERROR', isRu ? `localStorage ошибка: ${e.message}` : `localStorage error: ${e.message}`);
    }

    try {
      const hasCanvas = !!document.createElement('canvas').getContext('2d');
      push(hasCanvas ? 'OK' : 'ERROR', hasCanvas ? (isRu ? 'Canvas 2D доступен.' : 'Canvas 2D available.') : (isRu ? 'Canvas 2D недоступен.' : 'Canvas 2D unavailable.'));
    } catch (e: any) {
      push('ERROR', isRu ? `Canvas сбой: ${e.message}` : `Canvas error: ${e.message}`);
    }

    const hasAudio = !!(window.AudioContext || (window as any).webkitAudioContext);
    push(hasAudio ? 'OK' : 'WARN', hasAudio ? (isRu ? 'AudioContext доступен.' : 'AudioContext available.') : (isRu ? 'AudioContext недоступен.' : 'AudioContext unavailable.'));

    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    push(hasMedia ? 'OK' : 'WARN', hasMedia ? (isRu ? 'MediaDevices доступен.' : 'MediaDevices available.') : (isRu ? 'MediaDevices недоступен.' : 'MediaDevices unavailable.'));

    if (!state.threads || state.threads.length === 0) {
      push('WARN', isRu ? 'Потоки сообщений отсутствуют.' : 'No message threads found.');
    } else {
      const active = state.threads.find(t => t.id === state.activeThreadId);
      if (active) {
        push('OK', isRu ? `Активный поток: ${active.name || active.id}.` : `Active thread: ${active.name || active.id}.`);
      } else {
        push('ERROR', isRu ? 'Активный поток не найден.' : 'Active thread not found.');
      }
    }

    setSelfCheckLog(results);
    setLastSelfCheckAt(Date.now());
    setSelfCheckRunning(false);
    onLog(isRu ? 'Самопроверка завершена.' : 'Self‑check complete.');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500">
        
        <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700">
                <Sliders className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-white">{t.title}</h2>
                <p className="text-slate-400">{t.subtitle}</p>
                {currentUser && <p className="text-xs text-slate-500 mt-1">{t.target}: {currentUser}</p>}
            </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-cyan-400 mb-6 font-mono tracking-widest uppercase flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t.stateTitle}
          </h2>
          
          <div className="space-y-8">
            {/* Energy Slider */}
            <div>
              <div className="flex justify-between text-sm mb-2 text-slate-400">
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> {t.energyLabel}</span>
                <span className="text-cyan-400 font-mono">{(state.energyLevel * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={state.energyLevel * 100}
                onChange={(e) => setMuzaState(prev => ({ ...prev, energyLevel: parseInt(e.target.value) / 100 }))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-xs text-slate-600 mt-2">
                {t.energyDesc}
              </p>
            </div>

            {/* Coherence Slider */}
            <div>
              <div className="flex justify-between text-sm mb-2 text-slate-400">
                <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" /> {t.coherenceLabel}</span>
                <span className="text-purple-400 font-mono">{(state.coherence * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={state.coherence * 100}
                onChange={(e) => setMuzaState(prev => ({ ...prev, coherence: parseInt(e.target.value) / 100 }))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-xs text-slate-600 mt-2">
                {t.coherenceDesc}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" /> {t.selfCheckTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {t.selfCheckDesc}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={runSelfCheck}
              disabled={selfCheckRunning}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
            >
              {selfCheckRunning ? t.selfCheckRunning : t.selfCheckBtn}
            </button>
            {lastSelfCheckAt && (
              <span className="text-xs text-slate-500">
                {t.selfCheckLast}: {new Date(lastSelfCheckAt).toLocaleTimeString(isRu ? 'ru-RU' : 'en-US')}
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selfCheckLog.length === 0 ? (
              <div className="text-xs text-slate-500">{t.selfCheckEmpty}</div>
            ) : (
              selfCheckLog.map(item => {
                const badge =
                  item.status === 'OK'
                    ? { label: t.selfCheckOk, cls: 'text-green-400 border-green-500/30 bg-green-900/10' }
                    : item.status === 'WARN'
                      ? { label: t.selfCheckWarn, cls: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10' }
                      : { label: t.selfCheckError, cls: 'text-red-400 border-red-500/30 bg-red-900/10' };
                return (
                  <div key={item.id} className={`flex items-center gap-3 text-xs p-2 rounded border ${badge.cls}`}>
                    <span className="font-bold w-20">{badge.label}</span>
                    <span className="text-slate-200">{item.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 opacity-50 pointer-events-none">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Save className="w-5 h-5 text-blue-400" /> {t.persistenceTitle}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {t.persistenceDesc}
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {language === 'ru' ? 'АКТИВНО' : 'ACTIVE'}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-red-900/20 bg-red-950/5">
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> {t.dangerTitle}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {t.dangerDesc} {currentUser && <strong>{currentUser}</strong>}
            </p>
            <button 
              onClick={handleWipe}
              className="w-full py-3 bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 rounded-xl text-red-400 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> {t.wipeBtn}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
