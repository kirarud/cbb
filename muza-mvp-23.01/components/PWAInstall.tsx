import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { TRANSLATIONS } from '../constants'; // Assuming language is managed globally

// This component doesn't have access to the app's language state.
// For now, we'll assume a default or detect from browser.
// A more robust solution would involve a LanguageContext.
const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
const t = TRANSLATIONS[lang].pwa;


export const PWAInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    });
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-24 md:bottom-32 right-4 z-[200] animate-in slide-in-from-right-10 fade-in">
      <div className="glass-card p-4 rounded-2xl shadow-2xl border-cyan-500/30 bg-slate-900/80 flex items-center gap-4">
        <div className="p-3 bg-cyan-500/20 rounded-full border border-cyan-500/50">
          <Smartphone className="w-6 h-6 text-cyan-300" />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{t.install_title}</p>
          <p className="text-slate-400 text-xs">{t.install_desc}</p>
        </div>
        <button
          onClick={handleInstallClick}
          className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full transition-colors"
          title={t.install_button}
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={handleClose}
          className="p-2 text-slate-500 hover:text-white transition-colors"
          title={t.close_button}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
