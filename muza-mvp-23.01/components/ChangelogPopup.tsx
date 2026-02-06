
import React from 'react';
import { Gift, Sparkles, Bug, Wrench, X } from 'lucide-react';

interface ReleaseNotes {
  title: string;
  added: string[];
  fixed: string[];
  changed: string[];
}

interface ChangelogPopupProps {
  version: string;
  releaseNotes: ReleaseNotes;
  onClose: () => void;
}

export const ChangelogPopup: React.FC<ChangelogPopupProps> = ({ version, releaseNotes, onClose }) => {
  if (!releaseNotes) {
    return null; // Don't render if there are no notes for this version
  }

  const sections = [
    { title: 'Добавлено', icon: Sparkles, color: 'text-green-400', items: releaseNotes.added },
    { title: 'Исправлено', icon: Bug, color: 'text-orange-400', items: releaseNotes.fixed },
    { title: 'Изменено', icon: Wrench, color: 'text-cyan-400', items: releaseNotes.changed },
  ];

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden max-h-[90vh]">
        <header className="p-6 border-b border-slate-800 text-center relative">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Обновление Системы</h2>
          <p className="text-cyan-400 font-mono">Aura OS v{version} "{releaseNotes.title}"</p>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </header>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {sections.map(section => (
              section.items && section.items.length > 0 && (
                <div key={section.title}>
                  <h3 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-3 ${section.color}`}>
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </h3>
                  <ul className="space-y-2 pl-6 list-disc list-outside text-slate-300 marker:text-cyan-400">
                    {section.items.map((item, index) => (
                      <li key={index} className="text-sm leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>

        <footer className="p-6 border-t border-slate-800 mt-auto">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            Понятно
          </button>
        </footer>
      </div>
    </div>
  );
};
