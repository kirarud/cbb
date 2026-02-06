
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { HyperBit, Language, ConsciousnessType, EmotionType } from '../types';
import { TRANSLATIONS, EMOTION_COLORS } from '../constants';
import { calculateOptics } from '../services/opticsEngine';

interface VisualCortexProps {
  hyperbits: HyperBit[];
  language: Language;
  expanded?: boolean;
  isThinking?: boolean; 
  activeEmotion: EmotionType;
  coherence: number;
  energyLevel: number;
}

export const VisualCortex = React.memo<VisualCortexProps>(({ 
  hyperbits, 
  language, 
  expanded = false, 
  isThinking = false, 
  activeEmotion,
  coherence,
  energyLevel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{
        x: number, y: number, z: number, 
        x2d: number, y2d: number, scale: number,
        hyperbit: HyperBit,
        optics: any,
        targetR: number
  }[]>([]);

  const activeHyperbits = useMemo(() => {
      return hyperbits.slice(-100); 
  }, [hyperbits]);

  useEffect(() => {
      const currentPoints = pointsRef.current;
      const baseR = expanded ? 400 : 150;

      const newPoints = activeHyperbits.map((hb) => {
          const existing = currentPoints.find(p => p.hyperbit.id === hb.id);
          const optics = calculateOptics(hb.type, hb.energy, hb.content);

          if (existing) {
              existing.targetR = isThinking ? baseR * 0.3 : baseR * (0.6 + Math.random() * 0.8);
              return { ...existing, hyperbit: hb, optics };
          }

          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const r = baseR * (0.8 + Math.random() * 0.5);
          
          return {
              x: r * Math.sin(phi) * Math.cos(theta),
              y: r * Math.sin(phi) * Math.sin(theta),
              z: r * Math.cos(phi),
              x2d: 0, y2d: 0, scale: 0,
              hyperbit: hb,
              optics,
              targetR: r
          };
      });

      pointsRef.current = newPoints;
  }, [activeHyperbits, expanded, isThinking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }); 
    if (!ctx) return;

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let angleX = 0;
    let angleY = 0;
    let animationFrameId: number;
    let time = 0;

    const render = () => {
        time += 0.01;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Динамическое размытие (защита от NaN)
        const safeCoherence = Number.isFinite(coherence) ? coherence : 0.95;
        const blurAmount = Math.max(0, (1 - safeCoherence) * 15);
        canvas.style.filter = `blur(${blurAmount}px)`;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const fov = 600;

        const safeEnergy = Number.isFinite(energyLevel) ? energyLevel : 0.85;
        const rotationSpeed = 0.001 * (0.5 + safeEnergy);
        angleX += rotationSpeed;
        angleY += rotationSpeed * 1.5;

        // Эмбиент
        const emoColor = EMOTION_COLORS[activeEmotion] || '#22d3ee';
        if (Number.isFinite(cx) && Number.isFinite(cy) && canvas.width > 0) {
            try {
                const ambientGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.8);
                ambientGlow.addColorStop(0, `${emoColor}11`);
                ambientGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = ambientGlow;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } catch(e) {}
        }

        const points = pointsRef.current;
        points.forEach(p => {
            const currentR = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
            const rDiff = p.targetR - currentR;
            if (Math.abs(rDiff) > 1) {
                const factor = 1 + (rDiff * 0.02);
                p.x *= factor; p.y *= factor; p.z *= factor;
            }

            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);

            let x1 = p.x * cosY - p.z * sinY;
            let z1 = p.z * cosY + p.x * sinY;
            let y1 = p.y * cosX - z1 * sinX;
            let z2 = z1 * cosX + p.y * sinX;

            const safeZ = fov + z2;
            if (safeZ <= 1) {
                p.scale = -1;
            } else {
                const scale = fov / safeZ;
                p.x2d = cx + x1 * scale;
                p.y2d = cy + y1 * scale;
                p.scale = scale;
            }
        });

        points.sort((a, b) => a.scale - b.scale);

        points.forEach(p => {
            if (p.scale <= 0 || p.scale > 20 || !Number.isFinite(p.x2d) || !Number.isFinite(p.y2d)) return;

            const baseAlpha = isThinking ? 0.2 : 0.6;
            const alpha = Math.max(0.05, Math.min(1, baseAlpha * p.scale * safeEnergy));
            ctx.globalAlpha = alpha;
            
            const size = (2 + (p.hyperbit.energy * 6)) * p.scale;
            const color = p.optics.baseColor;

            if (isThinking || p.hyperbit.energy > 0.8) {
                const pulse = 1 + Math.sin(time * 10) * 0.3;
                const glowSize = Math.max(0.1, size * 6 * pulse);
                if (Number.isFinite(glowSize) && Number.isFinite(p.x2d) && Number.isFinite(p.y2d)) {
                    try {
                        const glow = ctx.createRadialGradient(p.x2d, p.y2d, 0, p.x2d, p.y2d, glowSize);
                        glow.addColorStop(0, `${color}44`);
                        glow.addColorStop(1, 'transparent');
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(p.x2d, p.y2d, glowSize, 0, Math.PI*2);
                        ctx.fill();
                    } catch(e) {}
                }
            }

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x2d, p.y2d, Math.max(0.1, size), 0, Math.PI*2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [isThinking, coherence, energyLevel, activeEmotion]);

  return <canvas ref={canvasRef} className="block w-full h-full pointer-events-none fixed inset-0 z-0" />;
});
