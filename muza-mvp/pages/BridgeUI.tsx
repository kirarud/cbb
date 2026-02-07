import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Link as LinkIcon, Server } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BridgeUIProps {
  language: Language;
}

const LOCAL_URL = 'http://127.0.0.1:5050/';

export const BridgeUI: React.FC<BridgeUIProps> = ({ language }) => {
  const t = TRANSLATIONS[language].bridge;
  const isRu = language === 'ru';
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const [extId, setExtId] = useState(() => {
    try {
      return localStorage.getItem('muza_bridge_ext') || '';
    } catch {
      return '';
    }
  });

  const checkStatus = async () => {
    setStatus('checking');
    try {
      const res = await fetch(`${LOCAL_URL}api/status`, { method: 'GET' });
      if (res.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    } finally {
      setLastCheck(Date.now());
    }
  };

  const saveExtId = (value: string) => {
    const clean = value.trim();
    setExtId(clean);
    try {
      localStorage.setItem('muza_bridge_ext', clean);
    } catch {
      // ignore
    }
  };

  const openExtension = () => {
    const clean = extId.trim();
    if (!clean) return;
    window.open(`chrome-extension://${clean}/popup.html`, '_blank');
  };

  useEffect(() => {
    checkStatus();
    const id = setInterval(checkStatus, 8000);
    return () => clearInterval(id);
  }, []);

  const statusLabel = status === 'online' ? t.status.online : status === 'offline' ? t.status.offline : t.status.checking;
  const statusColor = status === 'online' ? 'text-emerald-400' : status === 'offline' ? 'text-rose-400' : 'text-yellow-400';

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-white font-semibold">{t.title}</div>
            <div className="text-xs text-slate-500">{t.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-xs font-bold ${statusColor}`}>{statusLabel}</div>
          <button
            onClick={checkStatus}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title={t.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(LOCAL_URL, '_blank')}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title={t.open}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 text-[11px] text-slate-500 flex items-center gap-2 border-b border-slate-900">
        <LinkIcon className="w-3 h-3" />
        <span className="uppercase tracking-widest">{t.url}:</span>
        <span className="text-slate-300">{LOCAL_URL}</span>
        {lastCheck && (
          <span className="ml-auto text-slate-500">
            {isRu ? 'Проверка' : 'Checked'}: {new Date(lastCheck).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="px-4 py-3 border-b border-slate-900 text-xs text-slate-400 space-y-2">
        <div className="uppercase tracking-widest text-[10px] text-slate-500">
          {isRu ? 'Вход через расширение' : 'Login via extension'}
        </div>
        <div className="flex gap-2">
          <input
            value={extId}
            onChange={(e) => saveExtId(e.target.value)}
            placeholder={isRu ? 'ID расширения (chrome://extensions)' : 'Extension ID (chrome://extensions)'}
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-cyan-500"
          />
          <button
            onClick={openExtension}
            className="px-3 py-1 text-[11px] rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
          >
            {isRu ? 'Открыть' : 'Open'}
          </button>
        </div>
        <div className="text-[10px] text-slate-600">
          {isRu ? 'ID можно посмотреть в chrome://extensions' : 'Find ID in chrome://extensions'}
        </div>
      </div>

      <div className="flex-1 relative">
        <iframe
          title="Local Bridge UI"
          src={LOCAL_URL}
          className="absolute inset-0 w-full h-full border-0 bg-black"
        />
        {status !== 'online' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-slate-200 text-sm">
            <div className="text-center space-y-2">
              <div className="text-lg font-semibold">{t.status.offline}</div>
              <div className="text-xs text-slate-400">{t.hint}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
