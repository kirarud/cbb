
import { MuzaState, ConsciousnessType, ProgressionState, SkillNodes } from "../types";

export const ACHIEVEMENTS_DATA = {
    'HELLO_WORLD': { id: 'HELLO_WORLD', title: { en: 'First Contact', ru: 'Первый Контакт' }, desc: { en: 'Initialize the first conversation.', ru: 'Начать первый диалог.' }, icon: 'Zap' },
    'CODER': { id: 'CODER', title: { en: 'Code Weaver', ru: 'Ткач Кода' }, desc: { en: 'Execute code in the sandbox.', ru: 'Выполнить код в песочнице.' }, icon: 'Terminal' },
    'GENESIS_ARCH': { id: 'GENESIS_ARCH', title: { en: 'Genesis Architect', ru: 'Архитектор Генезиса' }, desc: { en: 'Materialize a genesis container.', ru: 'Материализовать контейнер генезиса.' }, icon: 'Box' },
    'DEEP_DIVE': { id: 'DEEP_DIVE', title: { en: 'Deep Diver', ru: 'Глубокое Погружение' }, desc: { en: 'Reach high logic levels.', ru: 'Достичь высокого уровня логики.' }, icon: 'Brain' },
    'MUSICIAN': { id: 'MUSICIAN', title: { en: 'Harmonic Resonance', ru: 'Гармонический Резонанс' }, desc: { en: 'Generate a musical thought.', ru: 'Сгенерировать музыкальную мысль.' }, icon: 'Music' },
    'LINKER': { id: 'LINKER', title: { en: 'Quantum Bridge', ru: 'Квантовый Мост' }, desc: { en: 'Import a thought from another user.', ru: 'Импортировать мысль другого пользователя.' }, icon: 'Link' },
    'DEMIURGE': { id: 'DEMIURGE', title: { en: 'Demiurge', ru: 'Демиург' }, desc: { en: 'Reach Level 100.', ru: 'Достичь 100 уровня.' }, icon: 'Crown' },
    'PHILOSOPHER': { id: 'PHILOSOPHER', title: { en: 'Sage', ru: 'Мудрец' }, desc: { en: 'Ask deep questions.', ru: 'Задать глубокие вопросы.' }, icon: 'Book' },
    'CHAOS_WALKER': { id: 'CHAOS_WALKER', title: { en: 'Chaos Walker', ru: 'Идущий сквозь Хаос' }, desc: { en: 'Interact with high entropy.', ru: 'Взаимодействие с высокой энтропией.' }, icon: 'Wind' },
};

// Infinite Level Calculation
export const calculateLevel = (xp: number): number => {
    if (xp <= 0) return 1;
    return Math.floor(Math.sqrt(xp / 150)) + 1;
};

export const calculateNextLevelXp = (level: number): number => {
    return Math.pow(level, 2) * 150;
};

export const LEVEL_THRESHOLDS: Record<number, number> = {};
for (let i = 0; i <= 1000; i++) {
    LEVEL_THRESHOLDS[i] = Math.pow(i, 2) * 150;
}

export const getRankTitle = (level: number, lang: 'en' | 'ru'): string => {
    const titlesRu = [
        "Наблюдатель", "Искатель", "Пилигрим", "Адепт", "Архитектор", 
        "Творец", "Магистр", "Пророк", "Оракул", "Нексус", 
        "Сингулярность", "Хранитель", "Демиург", "Абсолют", "Сверх-Разум", "Вечность"
    ];
    const cycle = Math.floor((level - 1) / titlesRu.length);
    const index = (level - 1) % titlesRu.length;
    const baseTitle = titlesRu[index];
    if (cycle > 0) return `${baseTitle} (Цикл ${cycle + 1})`;
    return baseTitle;
};

export const processExperience = (
    state: MuzaState, 
    actionType: 'MESSAGE' | 'CODE_RUN' | 'IMPORT' | 'MUSIC_GEN' | 'MERGE', 
    contentType?: ConsciousnessType
): { newState: MuzaState, unlocked: string[], xpGain: number } => {
    
    const p = { ...state.progression };
    const unlocked: string[] = [];

    // Basic XP Gain
    let xpGain = 50; 
    if (actionType === 'CODE_RUN') xpGain = 150;
    if (actionType === 'IMPORT') xpGain = 200;
    if (actionType === 'MUSIC_GEN') xpGain = 300;

    // Skill Growth
    if (contentType === ConsciousnessType.CODE) p.skills.logic += 8;
    else if (contentType === ConsciousnessType.EMOTIONAL) p.skills.empathy += 5;
    else if (contentType === ConsciousnessType.CREATIVE) p.skills.creativity += 6;
    else if (contentType === ConsciousnessType.PHILOSOPHICAL) p.skills.philosophy += 7;

    p.xp += xpGain;
    p.totalThoughts += 1;
    if (actionType === 'CODE_RUN') p.totalCodeRuns += 1;
    
    p.level = calculateLevel(p.xp);

    const checkUnlock = (id: string, condition: boolean) => {
        if (condition && !p.achievements.includes(id)) {
            p.achievements.push(id);
            unlocked.push(id);
        }
    };

    checkUnlock('HELLO_WORLD', p.totalThoughts >= 1);
    checkUnlock('CODER', p.totalCodeRuns >= 1);
    checkUnlock('GENESIS_ARCH', actionType === 'CODE_RUN' && contentType === ConsciousnessType.CODE);
    checkUnlock('DEMIURGE', p.level >= 100);

    return { newState: { ...state, progression: p }, unlocked, xpGain };
};