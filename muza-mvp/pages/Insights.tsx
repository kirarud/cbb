import React, { useEffect, useState } from 'react';
import { HyperBit, Language } from '../types';
import { analyzeInsight } from '../services/geminiService';
import { Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface InsightsProps {
  hyperbits: HyperBit[];
  language: Language;
}

export const Insights: React.FC<InsightsProps> = ({ hyperbits, language }) => {
  const t = TRANSLATIONS[language].insights;
  const [insight, setInsight] = useState<string>(t.analyzing);

  useEffect(() => {
    // Reset message when language changes if not loading real data yet
    if (insight === TRANSLATIONS[language === 'en' ? 'ru' : 'en'].insights.analyzing) {
        setInsight(t.analyzing);
    }
  }, [language, insight, t.analyzing]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (hyperbits.length === 0) {
        setInsight(t.createMore);
        return;
      }
      
      const summary = hyperbits.slice(-5).map(h => `- [${h.type}] ${h.content}`).join('\n');
      const result = await analyzeInsight(summary, language);
      setInsight(result);
    };

    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hyperbits.length, language]);

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-purple-500/20 relative overflow-hidden">
        {/* Background Aura */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">{t.title}</h2>
            
            <div className="min-h-[150px] flex items-center justify-center">
                <p className="text-lg text-slate-300 italic font-light leading-relaxed">
                    "{insight}"
                </p>
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
                    <div className="text-2xl font-bold text-pink-400">{t.rankPrefix} A</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{t.evolution}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
