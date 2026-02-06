
import { ChatMessage, HyperBit, MuzaState, SystemLog, UserProfile, Language } from "../types";

const REGISTRY_KEY = 'muza_registry_v1';

const getKeys = (userId: string) => ({
    MESSAGES: `muza_${userId}_messages`,
    HYPERBITS: `muza_${userId}_hyperbits`,
    STATE: `muza_${userId}_state`,
    LOGS: `muza_${userId}_logs`,
    CODE: `muza_${userId}_code_draft`
});

// --- CRYPTO SIMULATION ---
const hashPassword = async (pwd: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- USER MANAGEMENT ---
export const getUserCount = (): number => {
    try {
        const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
        return Object.keys(registry).length;
    } catch (e) {
        return 0;
    }
};

export const registerUser = async (username: string, password: string, language: Language = 'ru'): Promise<{ success: boolean, msg: string, recoveryKey?: string }> => {
    try {
        const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
        if (registry[username]) {
            return { success: false, msg: language === 'ru' ? "Пользователь уже существует." : "User already exists." };
        }

        const hash = await hashPassword(password);
        const recoveryKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const newUser: UserProfile = {
            username,
            passwordHash: hash,
            recoveryKey,
            createdAt: Date.now(),
            lastLogin: Date.now()
        };

        registry[username] = newUser;
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
        
        return { success: true, msg: language === 'ru' ? "Личность создана." : "Identity created.", recoveryKey };
    } catch (e) {
        console.error(language === 'ru' ? "Ошибка хранилища при регистрации" : "Storage Error during Register", e);
        return { success: false, msg: language === 'ru' ? "Ошибка записи в хранилище" : "Storage Write Failed" };
    }
};

export const authenticateUser = async (username: string, password: string): Promise<boolean> => {
    try {
        const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
        const user = registry[username] as UserProfile;
        if (!user) return false;
        
        const hash = await hashPassword(password);
        if (user.passwordHash === hash) {
            user.lastLogin = Date.now();
            registry[username] = user;
            localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
            return true;
        }
        return false;
    } catch (e) {
        console.error("Ошибка авторизации", e);
        return false;
    }
};

export const resetPassword = async (username: string, recoveryKey: string, newPassword: string): Promise<boolean> => {
    const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
    const user = registry[username] as UserProfile;
    if (!user) return false;

    if (user.recoveryKey === recoveryKey) {
        const newHash = await hashPassword(newPassword);
        user.passwordHash = newHash;
        registry[username] = user;
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
        return true;
    }
    return false;
};

// --- DATA PERSISTENCE ---

export const saveLocalData = (
    userId: string,
    messages: ChatMessage[], 
    hyperbits: HyperBit[], 
    state: MuzaState,
    logs: SystemLog[]
) => {
    try {
        const keys = getKeys(userId);
        
        localStorage.setItem(keys.MESSAGES, JSON.stringify(messages));
        localStorage.setItem(keys.HYPERBITS, JSON.stringify(hyperbits));
        localStorage.setItem(keys.STATE, JSON.stringify(state));
        localStorage.setItem(keys.LOGS, JSON.stringify(logs.slice(-50)));
    } catch (e) {
        console.error("Ошибка хранилища или превышен лимит квоты", e);
    }
};

const safeParse = (key: string, raw: string | null, fallback: any) => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Обнаружена порча данных для ${key}. Резервное сохранение.`);
        // Save the corrupt string to a new key so we don't lose it forever
        localStorage.setItem(`${key}_CORRUPT_${Date.now()}`, raw);
        return fallback;
    }
};

export const loadLocalData = (userId: string) => {
    try {
        const keys = getKeys(userId);
        const m = localStorage.getItem(keys.MESSAGES);
        const h = localStorage.getItem(keys.HYPERBITS);
        const s = localStorage.getItem(keys.STATE);
        const l = localStorage.getItem(keys.LOGS);

        const messages = safeParse(keys.MESSAGES, m, []);
        const hyperbits = safeParse(keys.HYPERBITS, h, []);
        const state = safeParse(keys.STATE, s, null);
        const logs = safeParse(keys.LOGS, l, []);
        
        return { messages, hyperbits, state, logs };
    } catch (e) {
        console.error("Критическая ошибка загрузки", e);
        return { messages: [], hyperbits: [], state: null, logs: [] };
    }
};

export const saveCodeDraft = (userId: string, code: string) => {
    const keys = getKeys(userId);
    localStorage.setItem(keys.CODE, code);
};

export const loadCodeDraft = (userId: string): string | null => {
    const keys = getKeys(userId);
    return localStorage.getItem(keys.CODE);
};

export const clearLocalData = (userId: string) => {
    const keys = getKeys(userId);
    localStorage.removeItem(keys.MESSAGES);
    localStorage.removeItem(keys.HYPERBITS);
    localStorage.removeItem(keys.STATE);
    localStorage.removeItem(keys.LOGS);
    localStorage.removeItem(keys.CODE);
};

export const getFullBackup = (userId: string) => {
    const data = loadLocalData(userId);
    const code = loadCodeDraft(userId);
    return JSON.stringify({ ...data, code, userId, timestamp: Date.now() }, null, 2);
};

export const restoreBackup = (jsonString: string) => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.userId) throw new Error("Неверный файл резервной копии");
        
        saveLocalData(data.userId, data.messages, data.hyperbits, data.state, data.logs);
        if (data.code) saveCodeDraft(data.userId, data.code);
        return { success: true, userId: data.userId };
    } catch (e) {
        return { success: false, error: e };
    }
};
