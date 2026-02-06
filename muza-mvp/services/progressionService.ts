
import { MuzaState, ConsciousnessType, ProgressionState, SkillNodes } from "../types";

export const ACHIEVEMENTS_DATA = {
    'HELLO_WORLD': { id: 'HELLO_WORLD', title: { en: 'First Contact', ru: 'Первый Контакт' }, desc: { en: 'Initialize the first conversation.', ru: 'Начать первый диалог.' }, icon: 'Zap' },
    'CODER': { id: 'CODER', title: { en: 'Code Weaver', ru: 'Ткач Кода' }, desc: { en: 'Execute code in the sandbox.', ru: 'Выполнить код в песочнице.' }, icon: 'Terminal' },
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
    // Increased curve for infinite scalability: Level = Sqrt(XP/150)
    return Math.floor(Math.sqrt(xp / 150)) + 1;
};

export const calculateNextLevelXp = (level: number): number => {
    return Math.pow(level, 2) * 150;
};

// Export dynamic level thresholds calculation
export const LEVEL_THRESHOLDS: Record<number, number> = {};
// Pre-calculate up to 1000 for UI, but logic supports infinite
for (let i = 0; i <= 1000; i++) {
    LEVEL_THRESHOLDS[i] = Math.pow(i, 2) * 150;
}

export const getRankTitle = (level: number, lang: 'en' | 'ru'): string => {
    const titlesRu = [
        "Наблюдатель", "Искатель", "Пилигрим", "Адепт", "Архитектор", 
        "Творец", "Магистр", "Пророк", "Оракул", "Нексус", 
        "Сингулярность", "Хранитель", "Демиург", "Абсолют", "Сверх-Разум", "Вечность"
    ];
    
    // Cycle through ranks for infinite progression
    const cycle = Math.floor((level - 1) / titlesRu.length);
    const index = (level - 1) % titlesRu.length;
    
    const baseTitle = titlesRu[index];
    
    if (cycle > 0) {
        return `${baseTitle} (Цикл ${cycle + 1})`;
    }
    return baseTitle;
};

export const processExperience = (
    state: MuzaState, 
    actionType: 'MESSAGE' | 'CODE_RUN' | 'IMPORT' | 'MUSIC_GEN' | 'MERGE', 
    contentType?: ConsciousnessType
): { newState: MuzaState, unlocked: string[] } => {
    
    const p = { ...state.progression };
    if (!p.skills.philosophy) p.skills.philosophy = 0;
    if (!p.skills.chaos) p.skills.chaos = 0;
    if (!p.userSkills) p.userSkills = [];

    const unlocked: string[] = [];

    // Basic XP Gain
    let xpGain = 50; 
    if (actionType === 'CODE_RUN') xpGain = 200;
    if (actionType === 'IMPORT') xpGain = 150;
    if (actionType === 'MUSIC_GEN') xpGain = 300;
    if (actionType === 'MERGE') xpGain = 500;

    // Skill Growth - Muza decides this mostly via Gemini response now, 
    // but this acts as a baseline heuristic
    if (contentType === ConsciousnessType.CODE || contentType === ConsciousnessType.TECHNICAL) p.skills.logic += 5;
    else if (contentType === ConsciousnessType.EMOTIONAL) p.skills.empathy += 5;
    else if (contentType === ConsciousnessType.CREATIVE || contentType === ConsciousnessType.MUSICAL) p.skills.creativity += 5;
    else if (contentType === ConsciousnessType.PHILOSOPHICAL || contentType === ConsciousnessType.QUESTION) p.skills.philosophy += 5;
    else if (contentType === ConsciousnessType.ENCRYPTED || contentType === ConsciousnessType.COLLECTIVE) p.skills.chaos += 5;

    p.xp += xpGain;
    p.totalThoughts += 1;
    if (actionType === 'CODE_RUN') p.totalCodeRuns += 1;
    
    p.level = calculateLevel(p.xp);

    // Achievement Checks
    const checkUnlock = (id: string, condition: boolean) => {
        if (condition && !p.achievements.includes(id)) {
            p.achievements.push(id);
            unlocked.push(id);
        }
    };

    checkUnlock('HELLO_WORLD', p.totalThoughts >= 1);
    checkUnlock('CODER', p.totalCodeRuns >= 1);
    checkUnlock('DEEP_DIVE', p.skills.logic >= 500);
    checkUnlock('MUSICIAN', actionType === 'MUSIC_GEN');
    checkUnlock('LINKER', actionType === 'IMPORT');
    checkUnlock('DEMIURGE', p.level >= 100);
    checkUnlock('PHILOSOPHER', p.skills.philosophy >= 100);
    checkUnlock('CHAOS_WALKER', p.skills.chaos >= 100);

    return {
        newState: { ...state, progression: p },
        unlocked
    };
};
