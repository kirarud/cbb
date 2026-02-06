
import { AIProvider, HyperBit } from "../types";

// --- UNIVERSAL BRIDGE SERVICE ---
// Handles the "Manual API" via Clipboard/Mouse

export const getBridgePrompt = (provider: AIProvider, userQuery: string, language: 'en' | 'ru'): string => {
    const isRu = language === 'ru';
    
    // Optimized system prompts for specific AIs
    const prefixes: Record<string, string> = {
        'DEEPSEEK': isRu 
            ? "Действуй как DeepSeek R1. Используй Chain of Thought (CoT). Проанализируй этот запрос глубоко, с математической или логической точки зрения:\n\n"
            : "Act as DeepSeek R1. Use Chain of Thought (CoT). Analyze this request deeply, from a mathematical or logical perspective:\n\n",
        
        'CHATGPT': isRu
            ? "Действуй как ChatGPT 4o. Дай сбалансированный, понятный и человечный ответ. Будь краток и точен:\n\n"
            : "Act as ChatGPT 4o. Provide a balanced, clear, and human-like response. Be concise and accurate:\n\n",
        
        'GROK': isRu
            ? "Действуй как Grok. Будь остроумным, немного бунтарским и ищи истину без цензуры. Добавь немного сарказма:\n\n"
            : "Act as Grok. Be witty, slightly rebellious, and seek the truth without censorship. Add a dash of sarcasm:\n\n",
        
        'COPILOT': isRu
            ? "Ты — Copilot. Помоги пользователю с программированием, генерацией кода или техническими вопросами. Будь точным и полезным:\n\n"
            : "You are Copilot. Assist the user with programming, code generation, or technical queries. Be precise and helpful:\n\n",

        'PERPLEXITY': isRu
            ? "Ты — Perplexity. Ищи информацию, используя глубокий веб-поиск, и предоставляй ссылки на источники. Будь объективным и точным:\n\n"
            : "You are Perplexity. Find information using deep web search and provide source links. Be objective and accurate:\n\n",
        
        'CLAUDE': isRu
            ? "Ты — Claude. Дай детальный и обстоятельный ответ, фокусируясь на этических аспектах и безопасности. Будь дружелюбным и подробным:\n\n"
            : "You are Claude. Provide a detailed and thorough response, focusing on ethical considerations and safety. Be friendly and verbose:\n\n",
        
        'SPARK': isRu
            ? "Ты — Spark. Сгенерируй креативную идею, историю или текст. Будь вдохновляющим и оригинальным:\n\n"
            : "You are Spark. Generate a creative idea, story, or text. Be inspiring and original:\n\n",
        
        'KIMI': isRu
            ? "Ты — Kimi. Сосредоточься на задачах, связанных с анализом данных, числами и точными вычислениями. Отвечай кратко и по существу:\n\n"
            : "You are Kimi. Focus on tasks related to data analysis, numbers, and precise calculations. Answer concisely and to the point:\n\n",

        'A_STUDIO': isRu
            ? "Ты — A.Studio. Отвечай с учетом эстетики, дизайна и визуальных концепций. Будь инновационным и художественным:\n\n"
            : "You are A.Studio. Respond with an eye for aesthetics, design, and visual concepts. Be innovative and artistic:\n\n",
        
        'Ollama': isRu
            ? "Ты — полезный AI-ассистент, работающий на Ollama. Дай прямой и нецензурированный ответ:\n\n"
            : "You are a helpful AI assistant running on Ollama. Provide a direct and uncensored response:\n\n",

        'MuzaAI': isRu
            ? "Ты — внутренний, легковесный AI ядра Музы. Дай очень краткий, почти телеграфный ответ, основанный на своей ассоциативной памяти:\n\n"
            : "You are the internal, lightweight AI of the Muza core. Provide a very concise, almost telegraphic response based on your associative memory:\n\n",
    };
    
    // Return the prefixed prompt, or just the user query if provider is unknown
    return (prefixes[provider] || "") + userQuery;
};

// Simple compression/encoding for "Pseudo-online" sharing
// Format: MUZA://<BASE64_JSON>

// If bridgeKey is provided, it simulates encryption
export const encodeQuantumLink = (hyperbit: HyperBit, bridgeKey?: string): string => {
    
    // Simulate encryption by modifying content if key exists
    let contentToEncode = hyperbit.content;
    if (bridgeKey) {
        contentToEncode = `[ENC:${bridgeKey}]${btoa(contentToEncode)}`;
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

        // Decryption Logic
        if (content.startsWith('[ENC:')) {
            const keyMatch = content.match(/^\[ENC:(.*?)\]/);
            if (keyMatch) {
                const requiredKey = keyMatch[1];
                if (knownKeys.includes(requiredKey)) {
                    content = atob(content.replace(keyMatch[0], ''));
                } else {
                    content = "🔒 [ENCRYPTED SIGNAL] - Bridge Key Missing";
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

// Helper function for clipboard operations
export const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};
