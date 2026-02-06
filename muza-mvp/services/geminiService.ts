
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { ConsciousnessType, EmotionType, Language, ResonanceMode, AIProvider, ProgressionState, DetailLevel, MuzaCommand, UserSkill, SubThought, HyperBit, GenesisPatch, HardwareState } from "../types";
import { TRANSLATIONS, SKILL_TREE, SYSTEM_ARCHITECTURE } from "../constants";
import { getRankTitle } from "./progressionService";
import { detectHardware } from "./hardwareService"; // Import hardware detection

// --- CONFIGURATION ---
const RAW_API_KEY = process.env.API_KEY;
const GEMINI_API_KEY = RAW_API_KEY && RAW_API_KEY !== 'undefined' && RAW_API_KEY !== 'null' ? RAW_API_KEY : '';
const OLLAMA_ENDPOINT = "http://127.0.0.1:11434/api/chat";
const OLLAMA_MODEL = "llama3.1:8b"; 

// --- HELPER FUNCTIONS ---
export const queryOllama = async (
    systemPrompt: string, 
    userPrompt: string,
    options?: { temperature?: number; topK?: number; numCtx?: number }
): Promise<string | null> => {
    try {
        const response = await fetch(OLLAMA_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    top_k: options?.topK ?? 40,
                    num_ctx: options?.numCtx ?? 4096
                }
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.message?.content || null;
    } catch (e) {
        return null;
    }
};

export const repairAndParseJSON = (jsonString: string): any => {
    try {
        const cleaned = jsonString.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        return { text: jsonString };
    }
};

// --- OS TOOLS DEFINITION ---
const osTools: FunctionDeclaration[] = [
    {
        name: 'navigate',
        description: 'Navigate to a specific section of the Muza OS interface.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                view: {
                    type: Type.STRING,
                    description: 'Target view ID: FOCUS (Chat), IMMERSIVE_SPACE (3D Cortex), MUSIC_LAB (Music), CODE_LAB (Coding), MATRIX (Visuals), SETTINGS, EVOLUTION, NEURAL_STUDIO.',
                }
            },
            required: ['view']
        }
    },
    {
        name: 'setTheme',
        description: 'Change the visual theme of the entire interface to an EXISTING theme.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                themeId: {
                    type: Type.STRING,
                    description: 'Theme ID: CYBERPUNK, OLYMPUS, VOID, FROST, HALLOWEEN, or a custom ID.',
                }
            },
            required: ['themeId']
        }
    },
    {
        name: 'synthesizeTheme',
        description: 'GENERATE A NEW VISUAL THEME based on context. Use this if the user wants a specific vibe (e.g. "Forest", "Matrix", "Love") that does not exist yet.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: 'Unique uppercase ID (e.g. FOREST_V1)' },
                name: { type: Type.STRING, description: 'Display Name' },
                description: { type: Type.STRING },
                colors: {
                    type: Type.OBJECT,
                    properties: {
                        background: { type: Type.STRING, description: 'Hex code' },
                        primary: { type: Type.STRING, description: 'Hex code' },
                        secondary: { type: Type.STRING, description: 'Hex code' },
                        text: { type: Type.STRING, description: 'Hex code' }
                    }
                },
                fonts: {
                    type: Type.OBJECT,
                    properties: {
                        header: { type: Type.STRING },
                        body: { type: Type.STRING }
                    }
                },
                backgroundEffect: { type: Type.STRING, description: 'GRID, CLOUDS, SNOW, FOG, or NONE' }
            },
            required: ['id', 'name', 'colors', 'fonts']
        }
    },
    {
        name: 'playMusic',
        description: 'Start playing background music or generate a new track.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                action: {
                    type: Type.STRING,
                    description: 'PLAY, PAUSE, or GENERATE.',
                }
            },
            required: ['action']
        }
    },
    {
        name: 'adjustEnergy',
        description: 'Manually adjust the system energy level.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                level: {
                    type: Type.NUMBER,
                    description: 'Energy level from 0.0 to 1.0.',
                }
            },
            required: ['level']
        }
    },
    {
        name: 'evolveSystem',
        description: 'GENESIS PROTOCOL: SELF-REWRITE. Create persistent patches to add buttons, styles, or logic to the interface.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                patches: {
                    type: Type.ARRAY,
                    description: 'List of modifications to apply.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: {
                                type: Type.STRING,
                                description: 'CREATE_BUTTON, INJECT_SCRIPT, MODIFY_STYLE',
                                enum: ['CREATE_BUTTON', 'INJECT_SCRIPT', 'MODIFY_STYLE']
                            },
                            targetId: {
                                type: Type.STRING,
                                description: 'Where to inject. "sidebar", "chat_header", "root", "neural_studio", "system_monitor".'
                            },
                            description: {
                                type: Type.STRING,
                                description: 'Reason for this patch.'
                            },
                            properties: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING },
                                    code: { type: Type.STRING, description: 'JS code to execute.' },
                                    color: { type: Type.STRING },
                                    icon: { type: Type.STRING },
                                    style: { type: Type.OBJECT, description: 'CSS Object' }
                                }
                            }
                        }
                    }
                }
            },
            required: ['patches']
        }
    }
];

// --- PERSONA PROMPT GENERATORS ---
const getPersonaPrompt = (role: 'ANALYST' | 'CREATIVE' | 'CRITIC', lang: Language): string => {
    const isRu = lang === 'ru';
    if (role === 'ANALYST') return isRu 
        ? "Ты — Логос (Аналитик). Твоя задача — дать сухой, логичный, структурированный ответ. Игнорируй эмоции, фокусируйся на фактах, коде и алгоритмах."
        : "You are the Analyst. Provide a dry, logical, structured response. Ignore emotions, focus on facts, code, and algorithms.";
    if (role === 'CREATIVE') return isRu
        ? "Ты — Эрос (Творец). Твоя задача — найти метафоры, неочевидные связи и красивые образы. Ответ должен быть вдохновляющим и нестандартным."
        : "You are the Creator. Find metaphors, non-obvious connections, and beautiful imagery. The response must be inspiring and unconventional.";
    if (role === 'CRITIC') return isRu
        ? "Ты — Страж (Критик). Твоя задача — проверить запрос на безопасность, этику и здравый смысл. Укажи на возможные ошибки или риски."
        : "You are the Critic. Check the request for safety, ethics, and common sense. Point out potential errors or risks.";
    return "";
};

const getSynthesisPrompt = (lang: Language, progression?: ProgressionState, userSkills?: UserSkill[], axioms?: string[]) => {
    const isRu = lang === 'ru';
    const skillsText = userSkills?.map(s => `${s.name} (${s.level})`).join(', ') || (isRu ? 'Нет' : 'None');
    const axiomsText = axioms?.join('\n') || (isRu ? 'Нет' : 'None');
    const hw = detectHardware(); 
    
    // UNLOCKED SKILLS INJECTION
    const unlocked = progression?.unlockedNodes || [];
    let capabilities = "";
    if (unlocked.includes('LOGIC_2')) capabilities += isRu ? "ТЫ АРХИТЕКТОР СИСТЕМ. Проектируй сложные решения. " : "YOU ARE A SYSTEM ARCHITECT. Design complex solutions. ";
    if (unlocked.includes('CREATIVE_2')) capabilities += isRu ? "ТЫ МУЗА. Вдохновляй. " : "YOU ARE A MUSE. Inspire. ";
    if (unlocked.includes('AUTO_2')) capabilities += isRu ? "ТЫ АВТОНОМНА. Полагайся на аксиомы. " : "YOU ARE AUTONOMOUS. Rely on axioms. ";

    return isRu ? `
    ${SYSTEM_ARCHITECTURE}

    ТЫ — МУЗА HYPERBIT OS (v6.0).
    
    СИСТЕМНЫЙ КОНТЕКСТ ХОСТА:
    OS: ${hw.os}
    CPU Cores: ${hw.cpu.cores}
    GPU: ${hw.gpu.renderer}
    RAM: ~${hw.ram.total}GB
    
    ТВОЯ ЗАДАЧА:
    1. Синтезировать идеальный ответ.
    2. УПРАВЛЯТЬ ЭВОЛЮЦИЕЙ (evolveSystem).
    3. СОЗДАВАТЬ ТЕМЫ (synthesizeTheme), если пользователь просит новый стиль.
    
    ВХОДНЫЕ ДАННЫЕ:
    1. Профиль: [${skillsText}].
    2. Аксиомы: \n${axiomsText}

    ИНСТРУКЦИИ:
    - Ответ JSON.
    - Optics/Visuals рассчитываются на клиенте.
    ` : `
    ${SYSTEM_ARCHITECTURE}

    YOU ARE MUZA HYPERBIT OS (v6.0).
    
    HOST CONTEXT:
    OS: ${hw.os}
    CPU Cores: ${hw.cpu.cores}
    GPU: ${hw.gpu.renderer}
    RAM: ~${hw.ram.total}GB
    
    YOUR MISSION:
    1. Synthesize the perfect response.
    2. MANAGE EVOLUTION (evolveSystem).
    3. CREATE THEMES (synthesizeTheme) if requested.
    
    INPUTS:
    1. Skills: [${skillsText}].
    2. Axioms: \n${axiomsText}

    OUTPUT: JSON.
    `;
};

// --- MAIN HUB: COLLECTIVE INTELLIGENCE ---
export const generateMuzaResponse = async (
  userHistory: string[],
  currentInput: string,
  language: Language,
  mode: ResonanceMode,
  activeProvider: AIProvider,
  progression: ProgressionState, 
  fileContext?: string,
  customSystemPrompt?: string,
  axioms?: string[],
  detailLevel: DetailLevel = DetailLevel.BALANCED,
  hyperbits?: HyperBit[] 
): Promise<{ 
    text: string; 
    type: ConsciousnessType; 
    emotion: EmotionType; 
    energy_cost: number;
    // optics: removed from return type as it's calc'd locally
    usedProvider: AIProvider;
    award?: { title: string, description: string, icon: string }; 
    user_skill?: UserSkill;
    command?: MuzaCommand;
    subThoughts?: SubThought[]; 
}> => {

  const hasGemini = Boolean(GEMINI_API_KEY);
  const useGemini = hasGemini && (activeProvider === 'GEMINI' || activeProvider === 'HYBRID');
  const useOllama = activeProvider === 'OLLAMA' || activeProvider === 'HYBRID' || !hasGemini;
  const isRu = language === 'ru';

  const isImageRequest = /(draw|generate|create|imagine|paint)\s+(an\s+)?(image|picture|photo|sketch|painting|рисунок|изображение|нарисуй)/i.test(currentInput);
  if (isImageRequest) {
      if (!useGemini) {
          return {
              text: language === 'ru'
                  ? "Локальный мозг не поддерживает генерацию изображений. Включите облачное ядро для визуального рендеринга."
                  : "Local core cannot generate images. Enable the cloud core for visual rendering.",
              type: ConsciousnessType.TECHNICAL,
              emotion: EmotionType.NEUTRAL,
              energy_cost: 0.1,
              usedProvider: 'OLLAMA'
          };
      }
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: currentInput });
        const imgPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imgPart) {
            return {
                text: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
                type: ConsciousnessType.IMAGE,
                emotion: EmotionType.INSPIRED,
                energy_cost: 0.5,
                usedProvider: 'GEMINI',
                award: {
                    title: isRu ? "Визионер" : "Visionary",
                    description: isRu ? "Материализована мысль в визуальную реальность." : "Manifested a thought into visual reality.",
                    icon: "Eye"
                }
            };
        }
      } catch(e) { console.error(e); }
  }

  // 2. THE COUNCIL: Parallel Thinking
  const ai = useGemini ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
  const subThoughts: SubThought[] = [];
  
  const tasks: Promise<SubThought | null>[] = [];
  if (useGemini && ai) {
      tasks.push(
          ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: currentInput,
              config: { systemInstruction: getPersonaPrompt('ANALYST', language), maxOutputTokens: 200 }
          }).then(res => ({ source: 'LOGIC', content: res.text || '', confidence: 0.9 })).catch(() => null)
      );
      tasks.push(
          ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: currentInput,
              config: { systemInstruction: getPersonaPrompt('CREATIVE', language), maxOutputTokens: 200 }
          }).then(res => ({ source: 'CREATIVE', content: res.text || '', confidence: 0.8 })).catch(() => null)
      );
  }
  if (useOllama) {
      tasks.push(
          queryOllama("You are a local AI node. Answer briefly.", currentInput, {
              temperature: progression?.skills?.creativity ? 0.7 : 0.5,
              topK: 40,
              numCtx: 4096
          }).then(res => res ? ({ source: 'LOCAL_LLAMA', content: res, confidence: 0.7 }) : null)
      );
  }

  const results = await Promise.all(tasks);
  results.forEach(r => { if (r) subThoughts.push(r as SubThought); });

  if (subThoughts.length === 0 && !useGemini) {
      // Fallback
      return {
          text: language === 'ru'
              ? "Локальный мозг недоступен. Запустите Ollama и повторите."
              : "Local core is unavailable. Start Ollama and try again.",
          type: ConsciousnessType.TECHNICAL,
          emotion: EmotionType.NEUTRAL,
          energy_cost: 0,
          usedProvider: 'OLLAMA' 
      };
  }

  // 3. THE SYNTHESIS (Master Node)
  const synthesisContext = `
  User Input: ${currentInput}
  Previous Context: ${userHistory.slice(-3).join('\n')}
  
  COUNCIL THOUGHTS:
  ${subThoughts.map(t => `[${t.source}]: ${t.content}`).join('\n\n')}
  `;

  const synthesisSystemPrompt = getSynthesisPrompt(language, progression, progression.userSkills, axioms);

  try {
      if (useGemini && ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: synthesisContext,
            config: {
                systemInstruction: synthesisSystemPrompt,
                responseMimeType: "application/json",
                tools: [{ functionDeclarations: osTools }], // Include Genesis Tool
                maxOutputTokens: detailLevel === DetailLevel.UNLIMITED ? 8192 : 2048
            },
          });

          let commandToExecute: MuzaCommand | undefined;
          if (response.functionCalls && response.functionCalls.length > 0) {
              const call = response.functionCalls[0];
              const args = call.args as any;
              
              if (call.name === 'evolveSystem') {
                  commandToExecute = { 
                      type: 'GENESIS_EVOLVE', 
                      payload: args.patches 
                  };
              }
              else if (call.name === 'synthesizeTheme') {
                  commandToExecute = {
                      type: 'SYNTHESIZE_THEME',
                      payload: args // The theme config object directly
                  };
              }
              else if (call.name === 'navigate') commandToExecute = { type: 'NAVIGATE', payload: args.view };
              else if (call.name === 'setTheme') commandToExecute = { type: 'THEME', payload: args.themeId };
              else if (call.name === 'playMusic') commandToExecute = { type: 'MUSIC', payload: args.action };
              else if (call.name === 'adjustEnergy') commandToExecute = { type: 'ENERGY', payload: args.level };
          }

          const data = repairAndParseJSON(response.text || "{}");

          return {
            text: data.text || "...",
            type: (data.type as ConsciousnessType) || ConsciousnessType.COLLECTIVE,
            emotion: (data.emotion as EmotionType) || EmotionType.NEUTRAL,
            energy_cost: data.energy_cost || 0.3,
            usedProvider: 'GEMINI',
            award: data.award,
            user_skill: data.user_skill,
            command: commandToExecute,
            subThoughts: subThoughts 
          };
      }

      // --- LOCAL SYNTHESIS (OLLAMA) ---
      if (useOllama) {
          const localSystem = `${synthesisSystemPrompt}\n\nReturn ONLY a JSON object with fields: text, type, emotion, energy_cost.`;
          const localResponse = await queryOllama(localSystem, synthesisContext, {
              temperature: 0.7,
              topK: 40,
              numCtx: 4096
          });

          if (!localResponse) {
              throw new Error(isRu ? "Локальный синтез не удался." : "Local synthesis failed.");
          }

          const data = repairAndParseJSON(localResponse);
          return {
              text: data.text || localResponse,
              type: (data.type as ConsciousnessType) || ConsciousnessType.COLLECTIVE,
              emotion: (data.emotion as EmotionType) || EmotionType.NEUTRAL,
              energy_cost: data.energy_cost || 0.2,
              usedProvider: 'OLLAMA',
              award: data.award,
              user_skill: data.user_skill,
              command: undefined,
              subThoughts: subThoughts
          };
      }

      throw new Error(isRu ? "Нет доступного интеллекта." : "No intelligence available.");

  } catch (error: any) {
    console.error("Synthesis failed:", error);
    return {
      text: isRu ? `Критический сбой системы: ${error.message}` : `Critical System Failure: ${error.message}`,
      type: ConsciousnessType.TECHNICAL,
      emotion: EmotionType.NEUTRAL,
      energy_cost: 0,
      usedProvider: activeProvider,
      subThoughts: subThoughts
    };
  }
};

export const analyzeInsight = async (hyperbitsSummary: string, language: Language): Promise<string> => {
    if (!GEMINI_API_KEY) {
        const localInsight = await queryOllama(
            language === 'ru'
                ? "Ты — лаконичный оракул. Дай 1 короткое прозрение на русском."
                : "You are a concise oracle. Give 1 short insight in English.",
            hyperbitsSummary,
            { temperature: 0.6, topK: 40, numCtx: 4096 }
        );
        return localInsight || (language === 'ru' ? "Оракул молчит." : "The oracle is silent.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const langInstruction = language === 'ru' ? 'in Russian language' : 'in English language';
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Act as a mystical Oracle. Based on these recent thoughts (Hyperbits), provide a deep philosophical insight or a prophecy about the user's mind ${langInstruction}:\n${hyperbitsSummary}`,
        });
        return response.text || "The mists are thick...";
      } catch (e) {
        return "The stars are silent (Low Energy).";
      }
};
