

import { ChatMessage, HyperBit, MuzaState, SystemLog, UserProfile, HyperBitIdentityFile } from "../types";

// !!!!!!! CRITICAL CHANGE !!!!!!!
// CHANGED TO v34_final to force absolute clean slate
const REGISTRY_KEY = 'muza_registry_v34_final';

const getKeys = (userId: string) => ({
    MESSAGES: `muza_v34_${userId}_messages`,
    HYPERBITS: `muza_v34_${userId}_hyperbits`,
    STATE: `muza_v34_${userId}_state`,
    LOGS: `muza_v34_${userId}_logs`,
    CODE: `muza_v34_${userId}_code_draft`
});

// --- CRYPTO SIMULATION ---
const hashPassword = async (pwd: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateSignature = async (data: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(data + "HYPERBIT_SALT_V1");
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
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

export const registerUser = async (username: string, password: string, isGuest: boolean = false): Promise<{ success: boolean, msg: string, recoveryKey?: string }> => {
    try {
        const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
        if (registry[username] && !isGuest) {
            return { success: false, msg: "User already exists." };
        }

        const hash = isGuest ? 'GUEST_NO_PWD' : await hashPassword(password);
        const recoveryKey = isGuest ? 'NONE' : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const newUser: UserProfile = {
            username,
            passwordHash: hash,
            recoveryKey,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            isGuest
        };

        registry[username] = newUser;
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
        
        return { success: true, msg: isGuest ? "Guest stream initialized." : "Identity created.", recoveryKey };
    } catch (e) {
        console.error("Storage Error during Register", e);
        return { success: false, msg: "Storage Write Failed" };
    }
};

export const authenticateUser = async (username: string, password: string): Promise<boolean> => {
    try {
        const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
        const user = registry[username] as UserProfile;
        if (!user) return false;
        
        const updateLogin = () => {
            user.lastLogin = Date.now();
            registry[username] = user;
            localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
        };

        if (user.isGuest) {
            updateLogin();
            return true;
        }

        const hash = await hashPassword(password);
        if (user.passwordHash === hash) {
            updateLogin();
            return true;
        }
        return false;
    } catch (e) {
        console.error("Auth Error", e);
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
        // Important: We only save state that doesn't conflict with core updates
        localStorage.setItem(keys.STATE, JSON.stringify(state));
        localStorage.setItem(keys.LOGS, JSON.stringify(logs.slice(-50)));
    } catch (e) {
        console.error("Storage Quota Exceeded or Error", e);
    }
};

const safeParse = (key: string, raw: string | null, fallback: any) => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error(`DATA CORRUPTION DETECTED FOR ${key}. BACKING UP.`);
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
        console.error("Critical Load Error", e);
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

export const restoreBackup = (jsonString: string): { success: boolean, userId?: string, error?: string } => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.userId) throw new Error("Invalid Backup File");
        
        saveLocalData(data.userId, data.messages, data.hyperbits, data.state, data.logs);
        if (data.code) saveCodeDraft(data.userId, data.code);
        return { success: true, userId: data.userId };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

// --- HYPERBIT IDENTITY FILE SYSTEM ---

export const exportIdentity = async (userId: string): Promise<string> => {
    const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
    const userProfile = registry[userId];
    
    if (!userProfile) throw new Error("User Profile Not Found");

    const localData = loadLocalData(userId);
    const fullPayload = {
        profile: userProfile,
        data: localData
    };

    const jsonString = JSON.stringify(fullPayload);
    const encodedPayload = btoa(unescape(encodeURIComponent(jsonString)));
    const signature = await generateSignature(encodedPayload);

    const identityFile: HyperBitIdentityFile = {
        header: 'HYPERBIT_SECURE_IDENTITY_V1',
        username: userId,
        timestamp: Date.now(),
        payload: encodedPayload,
        signature: signature
    };

    return JSON.stringify(identityFile, null, 2);
};

export const importIdentity = async (fileContent: string): Promise<{ success: boolean, userId: string, msg: string }> => {
    try {
        const identityFile: HyperBitIdentityFile = JSON.parse(fileContent);

        if (identityFile.header !== 'HYPERBIT_SECURE_IDENTITY_V1') {
            return { success: false, userId: '', msg: "Invalid File Format. Not a Hyper-BIT Identity." };
        }

        const checkSignature = await generateSignature(identityFile.payload);
        if (checkSignature !== identityFile.signature) {
            return { success: false, userId: identityFile.username, msg: "SECURITY ALERT: File Tampering Detected." };
        }

        const jsonString = decodeURIComponent(escape(atob(identityFile.payload)));
        const fullPayload = JSON.parse(jsonString);
        const { profile, data } = fullPayload;

        const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
        registry[profile.username] = profile;
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));

        saveLocalData(profile.username, data.messages, data.hyperbits, data.state, data.logs);

        return { success: true, userId: profile.username, msg: "Identity Verified & Restored." };

    } catch (e: any) {
        console.error("Identity Import Error", e);
        return { success: false, userId: '', msg: "Corrupted File Structure." };
    }
};