
import { ConsciousnessType, OpticalProperties } from "../types";
import { TYPE_COLORS } from "../constants";

// Flyweight Factory for Optical Properties
// Instead of storing heavy objects in every HyperBit, we generate them runtime.

export const calculateOptics = (type: ConsciousnessType, energy: number): OpticalProperties => {
    const baseColor = TYPE_COLORS[type] || '#ffffff';
    
    // Base properties derived from type
    let refraction = 0.5;
    let reflection = 0.5;
    let scattering = 0.5;
    let saturation = 0.5; // 0 to 1

    switch (type) {
        case ConsciousnessType.LOGIC: // Mapped from CODE/TECHNICAL usually
        case ConsciousnessType.CODE:
        case ConsciousnessType.TECHNICAL:
            refraction = 0.1;
            reflection = 0.9; // Shiny/Metallic
            scattering = 0.1;
            saturation = 0.2;
            break;
        case ConsciousnessType.CREATIVE:
        case ConsciousnessType.MUSICAL:
        case ConsciousnessType.IMAGE:
            refraction = 0.8; // Glassy/Prismatic
            reflection = 0.4;
            scattering = 0.9; // Glowy
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
            scattering = 0.0; // Matte/Dark
            saturation = 0.0;
            break;
        case ConsciousnessType.COLLECTIVE:
            refraction = 0.9;
            reflection = 0.9; // Holographic
            scattering = 0.5;
            saturation = 0.8;
            break;
        default:
            break;
    }

    // Energy Modifiers
    // High energy = More brightness, more scattering (bloom)
    const brightness = 0.3 + (energy * 0.7); 
    
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
