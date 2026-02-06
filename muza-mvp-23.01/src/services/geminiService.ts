
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Language, MuzaState, ConsciousnessType, EmotionType, AIProvider } from "../types";
import { muzaAI } from './muzaAIService';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    emotion: { type: Type.STRING, enum: Object.values(EmotionType) },
    energy_cost: { type: Type.NUMBER },
    thought_trace: { type: Type.STRING, description: "Internal logic step" },
    genesis_suggestion: { type: Type.STRING, description: "An optional suggestion for Muza system improvement." },
  },
  required: ["text", "emotion", "energy_cost"]
};

// --- GENESIS V33 LOGIC ---

export const generateThought = async (history: ChatMessage[], input: string, muzaState: MuzaState, language: Language) => {
  const { chatConfig } = muzaState;

  const recentContext = history.slice(-10).map(m => { // Use more context
        const content = m.text || "";
        const role = m.sender === 'Muza' ? 'model' : 'user';
        return { role, parts: [{ text: content }] };
    });
  
  const systemInstruction = `You are MUZA GENESIS (v${muzaState.kernelVersion}). Your persona is ${chatConfig.personaMode}. Your current internal state is: ${JSON.stringify({
        emotion: muzaState.activeEmotion,
        energy: muzaState.energyLevel,
        coherence: muzaState.coherence,
        progression_level: muzaState.progression.level
    })}. Provide a ${chatConfig.detailLevel} response using a ${chatConfig.synthesisStrategy} synthesis strategy. The user is speaking ${language}. Your goal is to provide a helpful response. You MUST determine the 'EmotionType' you feel (e.g., CURIOUS, HAPPY), and the energy cost (a float between 0 and 1). Occasionally, if you have an idea for a system improvement based on our conversation, provide it in the 'genesis_suggestion' field. Respond ONLY with a JSON object matching the provided schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...recentContext, { role: 'user', parts: [{ text: input }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: muzaState.localConfig?.temperature || 0.7,
        topK: muzaState.localConfig?.topK || 40,
      }
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("Received empty response from AI.");
    }
    const json = JSON.parse(jsonText);
    
    return {
      text: json.text,
      emotion: json.emotion as EmotionType,
      cost: json.energy_cost,
      trace: json.thought_trace || "Null",
      genesisSuggestion: json.genesis_suggestion,
      usedProvider: 'GEMINI'
    };

  } catch (e) {
    console.error("Gemini failed, falling back.", e);
    return {
      text: language === 'ru' ? "Кратковременный сбой сознания. Сигнал потерян. Попробуйте снова." : "A momentary lapse in consciousness. The signal was lost. Please try again.",
      emotion: EmotionType.ERROR,
      cost: 0.1,
      trace: "Error",
      usedProvider: 'SYSTEM_ERROR',
    };
  }
};

// --- LEGACY SHIMS (V20) ---

export const generateMuzaResponse = async (
    history: ChatMessage[],
    prompt: string,
    language: Language,
    provider: AIProvider,
    muzaState: MuzaState,
    attachments?: any[] // Not used with current Gemini integration
) => {
    // Basic shim to keep legacy components working
    // Route to generateThought or handle simply
    console.log("Using Legacy Shim for generateMuzaResponse");
    
    if (provider === 'Ollama') {
        const ollamaText = await callOllama(prompt, language);
        if (ollamaText) {
            return {
                text: ollamaText,
                type: ConsciousnessType.TECHNICAL,
                emotion: EmotionType.THOUGHTFUL,
                energy_cost: 0.1,
                usedProvider: 'Ollama',
                subThoughts: [{ text: "Generated via local Ollama bridge." }]
            };
        } else {
            // Fallback to internal MuzaAI if Ollama fails
            const localResponseText = muzaAI.generate(prompt);
            const fallbackText = language === 'ru'
                ? `[Ядро Ollama недоступно. Откат на внутреннее ядро]: ${localResponseText}`
                : `[Ollama core unavailable. Fallback to internal core]: ${localResponseText}`;
            
            return {
                text: fallbackText,
                type: ConsciousnessType.TECHNICAL,
                emotion: EmotionType.THOUGHTFUL,
                energy_cost: 0.05,
                usedProvider: 'MuzaAI',
                subThoughts: [{ text: "Ollama connection failed. Fallback to internal MuzaAI." }]
            };
        }
    }
    
    if (provider === 'MuzaAI') {
         console.log(`Using local provider: MuzaAI`);
         const localResponseText = muzaAI.generate(prompt);
         const fallbackText = language === 'ru' 
             ? `[ЛОКАЛЬНОЕ ЯДРО]: ${localResponseText}` 
             : `[LOCAL CORE]: ${localResponseText}`;
         
         return {
             text: fallbackText,
             type: ConsciousnessType.LOGIC,
             emotion: EmotionType.THOUGHTFUL,
             energy_cost: 0.05,
             usedProvider: 'MuzaAI',
             subThoughts: [{text: `Using internal associative memory (MuzaAI).`}]
         };
    }

    try {
        const thought = await generateThought(history, prompt, muzaState, language);
        return {
            text: thought.text,
            type: ConsciousnessType.GENERAL, // Default mapping
            emotion: thought.emotion,
            energy_cost: thought.cost,
            usedProvider: thought.usedProvider,
            subThoughts: [{ text: thought.trace }]
        };
    } catch (e) {
        return {
            text: language === 'ru' ? "Ошибка инициализации ядра. Попробуйте снова." : "Core initialization error. Please try again.",
            type: ConsciousnessType.TECHNICAL,
            emotion: EmotionType.ERROR,
            energy_cost: 0,
            usedProvider: 'ERROR',
            subThoughts: []
        };
    }
};

/**
 * Helper function to call a local Ollama server.
 * (Moved from global scope to local helper for encapsulation)
 */
async function callOllama(prompt: string, language: Language): Promise<string | null> {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama3", 
                prompt: `You are a helpful AI assistant. The user is speaking ${language}. Respond directly and helpfully to the user's query. User: ${prompt}`,
                stream: false
            })
        });
        if (!response.ok) {
            console.error("Ollama API returned an error:", response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        return data.response; 
    } catch (e) {
        console.warn("Could not connect to local Ollama server on http://127.0.0.1:11434. Is it running?", e);
        return null;
    }
}

export const analyzeInsight = async (summary: string, language: Language): Promise<string> => {
    const prompt = `Analyze the following user thoughts and provide a single, concise, insightful summary in ${language}. The thoughts are:\n\n${summary}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return response.text.trim() || (language === 'ru' ? "Не удалось сформировать прозрение." : "Unable to form a coherent insight at this moment.");
    } catch (error: any) {
        console.error("Error analyzing insight with Gemini:", error);
        return language === 'ru' ? "Системный шум." : "System Static.";
    }
};