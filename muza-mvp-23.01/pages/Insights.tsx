
import React, { useEffect, useState, useCallback } from 'react';
import { HyperBit, Language } from '../types';
import { analyzeInsight } from '../services/geminiService';
import { Sparkles, EyeOff, Loader } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface InsightsProps {
  hyperbits: HyperBit[];
  language: Language;
}

export const Insights: React.FC<InsightsProps> = ({ hyperbits, language }) => {
  const t = TRANSLATIONS[language].insights;
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsight = useCallback(async () => {
    if (hyperbits.length < 3) {
      setInsight(t.createMore);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const summary = hyperbits.slice(-10).map(h => `- [${h.type}] ${h.content}`).join('\n');
    const result = await analyzeInsight(summary, language);
    setInsight(result);
    setIsLoading(false);
  }, [hyperbits, language, t.createMore]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="font-mono text-sm uppercase tracking-widest">{t.analyzing}</p>
        </div>
      );
    }
    if (hyperbits.length < 3) {
      return (
          <div className="flex flex-col items-center gap-4 opacity-50">
              <EyeOff className="w-12 h-12 text-slate-600" />
              <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">{t.createMore}</p>
          </div>
      );
    }
    return (
      <p className="text-lg text-slate-300 italic font-light leading-relaxed">
        "{insight}"
      </p>
    );
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">{t.title}</h2>
            
            <div className="min-h-[150px] flex items-center justify-center">
              {renderContent()}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-800 pt-8">
                <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">{hyperbits.length}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{t.bits}</div>
                </div>
                <div className="text-center border-l border-slate-800">
                    <div className="text-2xl font-bold text-purple-400">{(hyperbits.reduce((a, b) => a + b.energy, 0) / (hyperbits.length || 1) * 100).toFixed(0)}%</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{t.avgEnergy}</div>
                </div>
                <div className="text-center border-l border-slate-800">
                    <div className="text-2xl font-bold text-pink-400">Rank A</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{t.evolution}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
