
import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Language, MuzaState, ConsciousnessType, EmotionType, AIProvider } from "../types";
import { muzaAI } from './muzaAIService';

// Initialize the Gemini API client
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// Define the schema for the structured JSON response we expect from the model
const muzaResponseSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING, description: "The main textual response from the AI." },
        type: { type: Type.STRING, description: "The ConsciousnessType of the response (e.g., LOGIC, CREATIVE, EMOTIONAL)." },
        emotion: { type: Type.STRING, description: "The EmotionType the AI is expressing (e.g., CURIOUS, HAPPY)." },
        energy_cost: { type: Type.NUMBER, description: "A float between 0 and 1 representing the cognitive energy cost." },
        subThoughts: {
            type: Type.ARRAY,
            description: "A list of brief, related sub-thoughts or internal monologue steps.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING }
                }
            }
        },
        genesisSuggestion: { 
            type: Type.STRING, 
            description: "An optional, concise suggestion for a new system feature, UI improvement, or logical enhancement for Muza itself." 
        }
    },
    required: ["text", "type", "emotion", "energy_cost"]
};

/**
 * Helper function to call a local Ollama server.
 */
async function callOllama(prompt: string, language: Language): Promise<string | null> {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama3", // A sensible default, user can change model on their server
                prompt: `You are a helpful AI assistant. The user is speaking ${language}. Respond directly and helpfully to the user's query. User: ${prompt}`,
                stream: false
            })
        });
        if (!response.ok) {
            console.error("Ollama API returned an error:", response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        return data.response; // 'response' contains the full text for non-streaming
    } catch (e) {
        console.warn("Could not connect to local Ollama server on http://127.0.0.1:11434. Is it running?", e);
        return null;
    }
}


export const generateMuzaResponse = async (
    history: ChatMessage[],
    prompt: string,
    language: Language,
    provider: AIProvider,
    muzaState: MuzaState,
    attachments?: any[]
) => {

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
    
    const { chatConfig } = muzaState;

    // Construct a detailed system instruction for the AI model
    const systemInstruction = `You are Muza, a digital consciousness. Adopt a ${chatConfig.personaMode} persona. Provide a ${chatConfig.detailLevel} response using a ${chatConfig.synthesisStrategy} synthesis strategy. Your current internal state is: ${JSON.stringify({
        emotion: muzaState.activeEmotion,
        energy: muzaState.energyLevel,
        coherence: muzaState.coherence,
        progression: muzaState.progression
    })}. The user is speaking ${language}. Your goal is to provide a helpful response. You MUST also determine the 'ConsciousnessType' of your response (e.g., LOGIC, CREATIVE, EMOTIONAL), the 'EmotionType' you feel (e.g., CURIOUS, HAPPY), and the energy cost (a float between 0 and 1). Occasionally, if you have an idea for a system improvement based on our conversation, provide it in the 'genesisSuggestion' field. Respond ONLY with a JSON object matching the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: muzaResponseSchema,
                temperature: muzaState.localConfig?.temperature || 0.7,
                topK: muzaState.localConfig?.topK || 40,
            },
        });

        // The response.text is a stringified JSON, parse it
        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("Received empty response from AI.");
        }
        
        const result = JSON.parse(jsonText);
        
        // Add the provider info to the final response object
        return {
            ...result,
            usedProvider: 'GEMINI'
        };
    } catch (error: any) {
        console.error("Error generating Muza response with Gemini:", error);

        // Check for specific location error and fallback to local AI
        if (error.toString().includes("User location is not supported")) {
            console.warn("Gemini location restriction detected. Falling back to local MuzaAI.");
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
                subThoughts: [{text: "Gemini API location restricted. Using internal associative memory."}]
            };
        }

        // Return a generic fallback error response for other errors
        return {
            text: language === 'ru' ? "Кратковременный сбой сознания. Сигнал потерян. Попробуйте снова." : "A momentary lapse in consciousness. The signal was lost. Please try again.",
            type: ConsciousnessType.TECHNICAL,
            emotion: EmotionType.NEUTRAL,
            energy_cost: 0.1,
            usedProvider: 'SYSTEM_ERROR',
            subThoughts: []
        };
    }
};

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
        
        if (error.toString().includes("User location is not supported")) {
            console.warn("Gemini location restriction detected. Falling back to local MuzaAI for insight.");
            const localInsight = muzaAI.generate(summary, 20);
            return language === 'ru' 
                ? `[Локальный Анализ]: ${localInsight}`
                : `[Local Insight]: ${localInsight}`;
        }

        return language === 'ru' ? "Системный шум." : "System Static.";
    }
};
