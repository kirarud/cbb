
import React, { useState } from 'react';
import { Palette, Lock, CheckCircle, ShoppingBag, Type, Layout, Coins, Sparkles, Edit3, Wand2 } from 'lucide-react';
import { MuzaState, Language, ThemeId } from '../types';
import { THEMES, THEME_META, TRANSLATIONS } from '../constants';
import { generateMuzaResponse } from '../services/geminiService';

interface DesignStudioProps {
    state: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
    language: Language;
    onLog: (msg: string) => void;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({ state, setMuzaState, language, onLog }) => {
    const [activeTab, setActiveTab] = useState<'THEMES' | 'CUSTOMIZE' | 'STORE'>('THEMES');
    const [isAutoLabeling, setIsAutoLabeling] = useState(false);
    const d = state.design;
    const t = TRANSLATIONS[language].designStudio;
    const isRu = language === 'ru';
    const defaultPrefix = t.navDefaultPrefix || (isRu ? 'По умолчанию' : 'Default');
    const navLabels = {
        chat: TRANSLATIONS[language].nav.chat,
        profile: TRANSLATIONS[language].nav.profile,
        music: TRANSLATIONS[language].nav.music,
        code: TRANSLATIONS[language].nav.codelab,
        deploy: TRANSLATIONS[language].nav.deploy,
    };

    // Theme Switching Logic
    const handleThemeSelect = (id: ThemeId) => {
        if (!d.unlockedThemes.includes(id)) return;
        const meta = THEME_META[id];
        const themeName = isRu ? (meta?.name?.ru || THEMES[id].name) : (meta?.name?.en || THEMES[id].name);
        setMuzaState(prev => ({
            ...prev,
            design: { ...prev.design, activeTheme: id }
        }));
        onLog(isRu ? `Тема материализована: ${themeName}` : `Theme activated: ${themeName}`);
    };

    // Store Logic
    const handlePurchase = (id: ThemeId, cost: number) => {
        if (d.fluxBalance >= cost) {
            const meta = THEME_META[id];
            const themeName = isRu ? (meta?.name?.ru || THEMES[id].name) : (meta?.name?.en || THEMES[id].name);
            setMuzaState(prev => ({
                ...prev,
                design: {
                    ...prev.design,
                    fluxBalance: prev.design.fluxBalance - cost,
                    unlockedThemes: [...prev.design.unlockedThemes, id]
                }
            }));
            onLog(isRu ? `Куплена тема: ${themeName}` : `Theme purchased: ${themeName}`);
        } else {
            onLog(isRu ? `Недостаточно ${t.fluxLabel} для транзакции.` : `Insufficient ${t.fluxLabel}.`);
        }
    };

    // Label Override Logic
    const handleLabelChange = (key: string, val: string) => {
        setMuzaState(prev => ({
            ...prev,
            design: {
                ...prev.design,
                navOverrides: { ...prev.design.navOverrides, [key]: val }
            }
        }));
    };

    const autoLabelInterface = async () => {
        setIsAutoLabeling(true);
        onLog("Анализ матрицы интерфейса...");
        try {
            const prompt = `
            Придумай креативные, футуристические названия на русском языке для элементов интерфейса:
            chat, profile, music, code, deploy.
            Стиль: Киберпанк, Мистика или Научная Фантастика.
            Верни JSON: { "chat": "...", "profile": "...", ... }
            `;
            const response = await generateMuzaResponse([], prompt, language, state.activeMode, state.activeProvider, state.progression);
            const newLabels = JSON.parse(response.text.replace(/```json|```/g, ''));
            
            setMuzaState(prev => ({
                ...prev,
                design: {
                    ...prev.design,
                    navOverrides: { ...prev.design.navOverrides, ...newLabels }
                }
            }));
            onLog("Интерфейс мутировал.");
        } catch (e) {
            onLog("Сбой мутации интерфейса.");
        } finally {
            setIsAutoLabeling(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative">
            {/* Background Preview of Current Theme */}
            <div className="absolute inset-0 opacity-10 pointer-events-none transition-colors duration-700" style={{ backgroundColor: THEMES[d.activeTheme].colors.primary }}></div>

            <div className="p-6 md:p-10 h-full overflow-y-auto z-10">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                            <Palette className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
                            <p className="text-slate-400 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    
                    {/* Wallet */}
                    <div className="glass-panel px-6 py-3 rounded-full border border-yellow-500/30 flex items-center gap-3">
                        <Coins className="w-5 h-5 text-yellow-400" />
                        <span className="text-xl font-bold text-white">{d.fluxBalance}</span>
                        <span className="text-xs text-yellow-500/70 font-bold uppercase tracking-widest">{t.fluxUnit || 'FLUX'}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                    <button onClick={() => setActiveTab('THEMES')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'THEMES' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>
                        {t.tabs.themes}
                    </button>
                    <button onClick={() => setActiveTab('CUSTOMIZE')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'CUSTOMIZE' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-500 hover:text-white'}`}>
                        {t.tabs.customize}
                    </button>
                    <button onClick={() => setActiveTab('STORE')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'STORE' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-500 hover:text-white'}`}>
                        {t.tabs.store}
                    </button>
                </div>

                {/* THEME SELECTOR */}
                {activeTab === 'THEMES' && (
                    <div className="space-y-4">
                        <div className="text-xs text-slate-400">
                            {t.themeHint}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.values(THEMES).map(theme => {
                            const isUnlocked = d.unlockedThemes.includes(theme.id);
                            const isActive = d.activeTheme === theme.id;
                            const meta = THEME_META[theme.id] || null;
                            const themeName = isRu ? (meta?.name.ru || theme.name) : (meta?.name.en || theme.name);
                            const themeDesc = isRu ? (meta?.description.ru || theme.description) : (meta?.description.en || theme.description);
                            const themeEffect = isRu ? (meta?.effect.ru || '') : (meta?.effect.en || '');

                            return (
                                <div key={theme.id} className={`glass-panel p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${isActive ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/10 opacity-80 hover:opacity-100'}`}>
                                    {/* Preview Swatch */}
                                    <div className="h-24 rounded-xl mb-4 relative overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
                                        <div className="absolute top-2 left-2 w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                        <div className="absolute top-2 left-12 w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                        <div className="absolute bottom-2 right-2 text-xs font-bold px-2 py-1 rounded bg-black/50 backdrop-blur" style={{ color: theme.colors.text }}>
                                            Aa
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-white">{themeName}</h3>
                                        {isActive && <CheckCircle className="w-5 h-5 text-cyan-400" />}
                                        {!isUnlocked && <Lock className="w-5 h-5 text-slate-500" />}
                                    </div>
                                    <p className="text-sm text-slate-400 min-h-[40px]">{themeDesc}</p>
                                    {themeEffect && (
                                        <p className="text-[11px] text-slate-500 mt-2 mb-4">
                                            {t.effectLabel}: {themeEffect}
                                        </p>
                                    )}

                                    {isUnlocked ? (
                                        <button 
                                            onClick={() => handleThemeSelect(theme.id)}
                                            disabled={isActive}
                                            className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${isActive ? 'bg-cyan-900/50 text-cyan-400 cursor-default' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                        >
                                            {isActive ? t.activeLabel : t.applyLabel}
                                        </button>
                                    ) : (
                                        <div className="w-full py-2 rounded-lg bg-black/50 text-slate-500 text-center font-bold text-xs">
                                            {t.lockedLabel}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    </div>
                )}

                {/* CUSTOMIZER */}
                {activeTab === 'CUSTOMIZE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-purple-400" /> {t.navOverrideTitle}
                                </h3>
                                <button 
                                    onClick={autoLabelInterface}
                                    disabled={isAutoLabeling}
                                    className="text-xs bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 px-3 py-1 rounded-lg flex items-center gap-1 border border-purple-500/30 transition-all"
                                >
                                    <Wand2 className={`w-3 h-3 ${isAutoLabeling ? 'animate-spin' : ''}`} />
                                    {t.autoLabelBtn}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mb-6">{t.navOverrideDesc}</p>
                            
                            <div className="space-y-4">
                                {['chat', 'profile', 'music', 'code', 'deploy'].map(key => (
                                    <div key={key} className="flex items-center gap-4">
                                        <span className="w-24 text-xs font-bold text-slate-500 uppercase">{(navLabels as any)[key] || key}</span>
                                        <div className="flex-1 relative">
                                            <Edit3 className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                                            <input 
                                                type="text" 
                                                placeholder={`${defaultPrefix}: ${(navLabels as any)[key] || key}`}
                                                value={(d.navOverrides as any)[key] || ''}
                                                onChange={(e) => handleLabelChange(key, e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Type className="w-5 h-5 text-green-400" /> {t.typoTitle}
                            </h3>
                            <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-xl text-yellow-200 text-xs mb-4">
                                {t.cssInjectNote}
                            </div>
                            
                            <div className="space-y-6 opacity-50 pointer-events-none grayscale">
                                {/* Placeholders for future expanded sliders */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Прозрачность Фона</label>
                                    <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Интенсивность Свечения</label>
                                    <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none" />
                                </div>
                                <p className="text-xs text-center text-slate-600">{t.comingSoon}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STORE */}
                {activeTab === 'STORE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* HALLOWEEN ITEM */}
                        <div className="glass-panel p-6 rounded-2xl border border-orange-500/30 bg-orange-900/5 relative overflow-hidden">
                             <div className="absolute -right-4 -top-4 bg-orange-500 text-white text-xs font-bold px-6 py-1 rotate-45">{t.seasonalTag}</div>
                             <div className="h-32 bg-orange-900/20 rounded-xl mb-4 flex items-center justify-center">
                                 <Sparkles className="w-12 h-12 text-orange-400 animate-pulse" />
                             </div>
                             <h3 className="text-lg font-bold text-white">Хэллоуин Протокол</h3>
                             <p className="text-xs text-slate-400 mb-4">Тыквенная эстетика и жуткие шрифты.</p>
                             
                             {d.unlockedThemes.includes('HALLOWEEN') ? (
                                 <button disabled className="w-full py-2 bg-slate-800 text-slate-500 font-bold text-sm rounded-lg">{t.purchasedLabel}</button>
                             ) : (
                                 <button onClick={() => handlePurchase('HALLOWEEN', 100)} className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2">
                                     <ShoppingBag className="w-4 h-4" /> {t.buyForLabel} 100 {t.fluxLabel}
                                 </button>
                             )}
                        </div>

                        {/* FROST ITEM */}
                        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-cyan-900/5 relative overflow-hidden">
                             <div className="h-32 bg-cyan-900/20 rounded-xl mb-4 flex items-center justify-center">
                                 <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
                             </div>
                             <h3 className="text-lg font-bold text-white">Фрост Протокол</h3>
                             <p className="text-xs text-slate-400 mb-4">Кристальная структура для ясности ума.</p>
                             
                             {d.unlockedThemes.includes('FROST') ? (
                                 <button disabled className="w-full py-2 bg-slate-800 text-slate-500 font-bold text-sm rounded-lg">{t.purchasedLabel}</button>
                             ) : (
                                 <button onClick={() => handlePurchase('FROST', 250)} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2">
                                     <ShoppingBag className="w-4 h-4" /> {t.buyForLabel} 250 {t.fluxLabel}
                                 </button>
                             )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
