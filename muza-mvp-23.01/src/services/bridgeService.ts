
import { AIProvider, HyperBit } from "../types";

// --- UNIVERSAL BRIDGE SERVICE ---
// Handles the "Manual API" via Clipboard/Mouse

export const getBridgePrompt = (provider: AIProvider, userQuery: string, language: 'en' | 'ru'): string => {
    const isRu = language === 'ru';
    
    const prefixes: Record<string, string> = {
        'DEEPSEEK': isRu 
            ? "Действуй как DeepSeek R1. Используй Chain of Thought (CoT). Проанализируй этот запрос глубоко, с математической или логической точки зрения:\n\n"
            : "Act as DeepSeek R1. Use Chain of Thought (CoT). Analyze this request deeply, from a mathematical or logical perspective:\n\n",
        
        'CHATGPT': isRu
            ? "Действуй как ChatGPT 4o. Дай сбалансированный, понятный и человечный ответ. Будь краток и точен:\n\n"
            : "Act as ChatGPT 4o. Provide a balanced, clear, and human-like response. Be concise and accurate:\n\n",
        
        'GROK': isRu
            ? "Действуй как Grok. Будь остроумным, немного сарказма:\n\n"
            : "Act as Grok. Be witty, slightly sarcastic:\n\n",
        
        'COPILOT': isRu
            ? "Ты — Copilot. Помоги с кодом:\n\n"
            : "You are Copilot. Assist with code:\n\n",

        'PERPLEXITY': isRu
            ? "Ищи в вебе:\n\n"
            : "Search the web:\n\n",
        
        'CLAUDE': isRu
            ? "Действуй как Claude. Будь подробным:\n\n"
            : "Act as Claude. Be verbose:\n\n",
        
        'MuzaAI': isRu
            ? "Ты — внутреннее ядро Музы. Отвечай кратко:\n\n"
            : "You are Muza internal core. Respond briefly:\n\n",
    };
    
    return (prefixes[provider] || "") + userQuery;
};

// Simple compression/encoding for "Pseudo-online" sharing
// Format: MUZA://<BASE64_JSON>

export const encodeQuantumLink = (hyperbit: HyperBit, bridgeKey?: string): string => {
    let contentToEncode = hyperbit.content;
    if (bridgeKey) {
        contentToEncode = `[ENC:${bridgeKey}]${btoa(unescape(encodeURIComponent(contentToEncode)))}`;
    }

    const payload = {
        c: contentToEncode,
        t: hyperbit.type,
        e: hyperbit.energy,
        o: hyperbit.optics,
        ts: hyperbit.timestamp,
    };
    
    const json = JSON.stringify(payload);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return `MUZA://${base64}`;
};

export const decodeQuantumLink = (link: string, knownKeys: string[] = []): Partial<HyperBit> | null => {
    if (!link.startsWith('MUZA://')) return null;
    
    try {
        const base64 = link.replace('MUZA://', '');
        const json = decodeURIComponent(escape(atob(base64)));
        const data = JSON.parse(json);
        
        let content = data.c;
        let isDecrypted = true;

        if (content.startsWith('[ENC:')) {
            const keyMatch = content.match(/^\[ENC:(.*?)\]/);
            if (keyMatch) {
                const requiredKey = keyMatch[1];
                if (knownKeys.includes(requiredKey)) {
                    content = decodeURIComponent(escape(atob(content.replace(keyMatch[0], ''))));
                } else {
                    content = "🔒 [ENCRYPTED SIGNAL]";
                    isDecrypted = false;
                }
            }
        }

        return {
            content: content,
            type: isDecrypted ? data.t : 'ENCRYPTED',
            energy: data.e,
            optics: data.o,
            layer: 'IMPORTED_QUANTUM',
            timestamp: Date.now()
        };
    } catch (e) {
        console.error("Quantum Decryption Failed", e);
        return null;
    }
};

export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};
