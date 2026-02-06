
import { ConsciousnessType, OpticalProperties } from "../types";
import { TYPE_COLORS } from "../constants";

// Semantic Analysis Dictionaries
const SEMANTIC_MAP: Record<string, { color: string, refraction: number, scattering: number, brightness: number }> = {
    // FIRE / HOT
    'fire': { color: '#ff4500', refraction: 0.9, scattering: 0.9, brightness: 1.0 },
    'burn': { color: '#dc2626', refraction: 0.8, scattering: 0.8, brightness: 0.9 },
    'hot': { color: '#f97316', refraction: 0.7, scattering: 0.6, brightness: 0.8 },
    'sun': { color: '#fbbf24', refraction: 0.6, scattering: 1.0, brightness: 1.0 },
    'orange': { color: '#f97316', refraction: 0.5, scattering: 0.5, brightness: 0.7 },
    
    // WATER / LIQUID
    'water': { color: '#0ea5e9', refraction: 0.8, scattering: 0.4, brightness: 0.8 },
    'ocean': { color: '#0369a1', refraction: 0.9, scattering: 0.3, brightness: 0.6 },
    'blue': { color: '#3b82f6', refraction: 0.5, scattering: 0.5, brightness: 0.7 },
    'rain': { color: '#94a3b8', refraction: 0.7, scattering: 0.5, brightness: 0.5 },
    'ice': { color: '#cffafe', refraction: 1.0, scattering: 0.9, brightness: 0.9 },

    // NATURE / LIFE
    'tree': { color: '#16a34a', refraction: 0.3, scattering: 0.4, brightness: 0.6 },
    'grass': { color: '#4ade80', refraction: 0.2, scattering: 0.3, brightness: 0.7 },
    'flower': { color: '#f472b6', refraction: 0.5, scattering: 0.7, brightness: 0.8 },
    'earth': { color: '#78350f', refraction: 0.1, scattering: 0.1, brightness: 0.4 },

    // SKY / AETHER
    'sky': { color: '#7dd3fc', refraction: 0.2, scattering: 0.9, brightness: 0.9 },
    'cloud': { color: '#f1f5f9', refraction: 0.4, scattering: 1.0, brightness: 0.9 },
    'wind': { color: '#e2e8f0', refraction: 0.6, scattering: 0.8, brightness: 0.7 },

    // VOID / DARK
    'void': { color: '#0f172a', refraction: 0.0, scattering: 0.0, brightness: 0.1 },
    'dark': { color: '#000000', refraction: 0.0, scattering: 0.0, brightness: 0.0 },
    'shadow': { color: '#334155', refraction: 0.1, scattering: 0.1, brightness: 0.2 },

    // MAGIC / QUANTUM
    'magic': { color: '#d8b4fe', refraction: 0.9, scattering: 1.0, brightness: 1.0 },
    'quantum': { color: '#22d3ee', refraction: 1.0, scattering: 0.8, brightness: 0.9 },
    'love': { color: '#ec4899', refraction: 0.6, scattering: 0.9, brightness: 0.9 }
};

export const calculateOptics = (type: ConsciousnessType, energy: number, content: string = ""): OpticalProperties => {
    let baseColor = TYPE_COLORS[type] || '#ffffff';
    
    // Base properties derived from type
    let refraction = 0.5;
    let reflection = 0.5;
    let scattering = 0.5;
    let saturation = 0.5; // 0 to 1
    let brightness = 0.3 + (energy * 0.7);

    // 1. Semantic Analysis: Override based on content keywords
    const lowerContent = content.toLowerCase();
    let semanticMatch = null;
    
    // Check for semantic matches (Simple keyword search)
    for (const [keyword, props] of Object.entries(SEMANTIC_MAP)) {
        if (lowerContent.includes(keyword)) {
            semanticMatch = props;
            break; // First match dominance
        }
    }

    if (semanticMatch) {
        baseColor = semanticMatch.color;
        refraction = semanticMatch.refraction;
        scattering = semanticMatch.scattering;
        brightness = semanticMatch.brightness * energy; // Scale by energy
        reflection = 0.5; // Default for semantic overrides
        saturation = 0.8;
    } else {
        // Fallback to Consciousness Type Logic using string matching for enum
        switch (type) {
            case ConsciousnessType.LOGIC:
            case ConsciousnessType.CODE:
            case ConsciousnessType.TECHNICAL:
                refraction = 0.1;
                reflection = 0.9;
                scattering = 0.1;
                saturation = 0.2;
                break;
            case ConsciousnessType.CREATIVE:
            case ConsciousnessType.MUSICAL:
            case ConsciousnessType.IMAGE:
                refraction = 0.8;
                reflection = 0.4;
                scattering = 0.9;
                saturation = 1.0;
                break;
            case ConsciousnessType.EMOTIONAL:
                refraction = 0.6;
                reflection = 0.2;
                scattering = 0.8;
                saturation = 0.9;
                break;
            case ConsciousnessType.ENCRYPTED:
                refraction = 0.0;
                reflection = 0.0;
                scattering = 0.0;
                saturation = 0.0;
                break;
            case ConsciousnessType.COLLECTIVE:
                refraction = 0.9;
                reflection = 0.9;
                scattering = 0.5;
                saturation = 0.8;
                break;
            default:
                break;
        }
    }

    return {
        baseColor,
        brightness,
        refraction,
        reflection,
        scattering: Math.min(1, scattering + energy * 0.2),
        absorption: 1 - brightness,
        saturation
    };
};
