
import React from 'react';
import { ShoppingBag, Coins, Lock, CheckCircle, Palette, Music } from 'lucide-react';
import { MuzaState, Language, ThemeId } from '../types';
import { THEMES, TRANSLATIONS } from '../constants';

interface StoreProps {
    state: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
    language: Language;
    onLog: (msg: string) => void;
}

export const Store: React.FC<StoreProps> = ({ state, setMuzaState, language, onLog }) => {
    const d = state.design;
    const t = TRANSLATIONS[language].store;

    const soundPacks = [
        { id: 'ANCIENT_FORGE', name: 'Древняя Кузница', cost: 300, desc: 'Глубокие, эмбиентные звуки.' },
        { id: 'GLITCH_PROTOCOL', name: 'Глитч Протокол', cost: 500, desc: 'Экспериментальные, цифровые артефакты.' },
    ];

    const handlePurchase = (id: ThemeId, cost: number) => {
        if (d.fluxBalance >= cost) {
            setMuzaState(prev => ({
                ...prev,
                design: {
                    ...prev.design,
                    fluxBalance: prev.design.fluxBalance - cost,
                    unlockedThemes: [...prev.design.unlockedThemes, id]
                }
            }));
            onLog(`Куплена тема: ${THEMES[id].name}`);
        } else {
            onLog("Недостаточно Flux для транзакции.");
        }
    };
    
    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl border border-yellow-500/30 bg-yellow-900/10">
                            <ShoppingBag className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
                            <p className="text-slate-400 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <div className="glass-panel px-6 py-3 rounded-full border border-yellow-500/30 flex items-center gap-3">
                        <Coins className="w-5 h-5 text-yellow-400" />
                        <span className="text-xl font-bold text-white">{d.fluxBalance}</span>
                        <span className="text-xs text-yellow-500/70 font-bold uppercase tracking-widest">Flux</span>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Palette className="w-5 h-5 text-cyan-400"/> {t.themes}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                     {Object.values(THEMES).map(theme => {
                         const isUnlocked = d.unlockedThemes.includes(theme.id);
                         const cost = theme.id === 'HALLOWEEN' ? 100 : 250;
                         if (isUnlocked) return null;

                         return (
                            <div key={theme.id} className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden group">
                                {theme.id === 'HALLOWEEN' && <div className="absolute -right-4 -top-4 bg-orange-500 text-white text-xs font-bold px-6 py-1 rotate-45">{t.seasonal}</div>}
                                <div className="h-32 rounded-xl mb-4" style={{ backgroundColor: theme.colors.background }}></div>
                                <h3 className="text-lg font-bold text-white">{theme.name}</h3>
                                <p className="text-xs text-slate-400 mb-4 h-10">{theme.description}</p>
                                <button onClick={() => handlePurchase(theme.id, cost)} disabled={d.fluxBalance < cost} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed">
                                    <ShoppingBag className="w-4 h-4" /> {t.purchase} {cost} Flux
                                </button>
                            </div>
                         );
                     })}
                </div>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Music className="w-5 h-5 text-pink-400"/> {t.sound_packs}</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {soundPacks.map(pack => (
                        <div key={pack.id} className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden group opacity-50">
                            <div className="h-32 bg-pink-900/20 rounded-xl mb-4 flex items-center justify-center"><Music className="w-12 h-12 text-pink-400/50" /></div>
                            <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                            <p className="text-xs text-slate-400 mb-4 h-10">{pack.desc}</p>
                            <button disabled className="w-full py-2 bg-slate-700 text-slate-500 font-bold text-sm rounded-lg flex items-center justify-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> {t.purchase} {pack.cost} Flux
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};
