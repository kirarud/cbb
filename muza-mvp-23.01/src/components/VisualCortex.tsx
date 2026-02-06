

import React, { useEffect, useRef, useMemo } from 'react';
import { HyperBit, Language, EmotionType } from '../types';
import { EMOTION_COLORS } from '../constants';
import { calculateOptics } from '../services/opticsEngine';

interface VisualCortexProps {
  hyperbits: HyperBit[];
  language?: Language;
  expanded?: boolean;
  isThinking?: boolean; 
  activeEmotion: EmotionType;
  coherence?: number;
  energyLevel?: number;
}

export const VisualCortex = React.memo<VisualCortexProps>(({ 
  hyperbits, 
  language, 
  expanded = false, 
  isThinking = false, 
  activeEmotion,
  coherence = 0.95,
  energyLevel = 0.85
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{
        x: number, y: number, z: number, 
        x2d: number, y2d: number, scale: number,
        hyperbit: HyperBit,
        optics: any,
        targetR: number
  }[]>([]);

  // Filter only recent relevant hyperbits to keep performance high
  const activeHyperbits = useMemo(() => {
      return hyperbits.slice(-60); 
  }, [hyperbits]);

  useEffect(() => {
      const currentPoints = pointsRef.current;
      const baseR = expanded ? 400 : 200;

      // Sync points with hyperbits
      const newPoints = activeHyperbits.map((hb) => {
          const existing = currentPoints.find(p => p.hyperbit.id === hb.id);
          const optics = calculateOptics(hb.type, hb.energy, hb.content);

          if (existing) {
              // Pulse effect when thinking
              existing.targetR = isThinking ? baseR * 0.5 : baseR * (0.8 + Math.random() * 0.4);
              return { ...existing, hyperbit: hb, optics };
          }

          // Distribute new points on a sphere
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
        
        // Dynamic Blur based on Coherence (Low coherence = blurry vision)
        const safeCoherence = Number.isFinite(coherence) ? coherence : 0.95;
        const blurAmount = Math.max(0, (1 - safeCoherence) * 8);
        canvas.style.filter = `blur(${blurAmount}px)`;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const fov = 600;

        const safeEnergy = Number.isFinite(energyLevel) ? energyLevel : 0.85;
        // Rotation speed depends on Energy
        const rotationSpeed = 0.002 * (0.5 + safeEnergy);
        angleX += rotationSpeed;
        angleY += rotationSpeed * 1.2;

        // Ambient Background Aura
        const emoColor = EMOTION_COLORS[activeEmotion] || '#22d3ee';
        if (Number.isFinite(cx) && Number.isFinite(cy) && canvas.width > 0) {
            try {
                const ambientGlow = ctx.createRadialGradient(cx, cy, 50, cx, cy, canvas.width * 0.6);
                ambientGlow.addColorStop(0, `${emoColor}15`); // Very faint core
                ambientGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = ambientGlow;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } catch(e) {}
        }

        const points = pointsRef.current;
        points.forEach(p => {
            // Elasticity: Move towards target radius
            const currentR = Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z);
            const rDiff = p.targetR - currentR;
            if (Math.abs(rDiff) > 1) {
                const factor = 1 + (rDiff * 0.05); // Spring force
                p.x *= factor; p.y *= factor; p.z *= factor;
            }

            // 3D Rotation Matrix
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);

            let x1 = p.x * cosY - p.z * sinY;
            let z1 = p.z * cosY + p.x * sinY;
            let y1 = p.y * cosX - z1 * sinX;
            let z2 = z1 * cosX + p.y * sinX;

            // Perspective Projection
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

        // Sort by Z-index (scale) for correct depth rendering
        points.sort((a, b) => a.scale - b.scale);

        // Draw Connections (Neural Pathways)
        ctx.lineWidth = 1;
        points.forEach((p, i) => {
            if (p.scale <= 0 || !Number.isFinite(p.x2d) || !Number.isFinite(p.y2d)) return; // Skip invalid points
            // Connect to nearby points if thinking
            if (isThinking && i < points.length - 1) {
                const nextP = points[i+1];
                if (nextP.scale > 0 && Math.random() > 0.85 && Number.isFinite(nextP.x2d) && Number.isFinite(nextP.y2d)) {
                    ctx.beginPath();
                    ctx.moveTo(p.x2d, p.y2d);
                    ctx.lineTo(nextP.x2d, nextP.y2d);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * p.hyperbit.energy})`;
                    ctx.stroke();
                }
            }
        });

        // Draw Nodes
        points.forEach(p => {
            if (p.scale <= 0 || p.scale > 20 || !Number.isFinite(p.x2d) || !Number.isFinite(p.y2d)) return;

            const baseAlpha = isThinking ? 0.3 : 0.7;
            const alpha = Math.max(0.1, Math.min(1, baseAlpha * p.scale * safeEnergy));
            ctx.globalAlpha = alpha;
            
            const size = (3 + (p.hyperbit.energy * 8)) * p.scale;
            const color = p.optics.baseColor;

            // Glow effect for high energy thoughts
            if (isThinking || p.hyperbit.energy > 0.8) {
                const pulse = 1 + Math.sin(time * 8) * 0.2;
                const glowSize = Math.max(0.1, size * 4 * pulse);
                if (Number.isFinite(glowSize) && glowSize > 0) {
                    try {
                        const glow = ctx.createRadialGradient(p.x2d, p.y2d, 0, p.x2d, p.y2d, glowSize);
                        glow.addColorStop(0, `${color}66`);
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
            ctx.arc(p.x2d, p.y2d, Math.max(0.5, size), 0, Math.PI*2);
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
  }, [isThinking, coherence, energyLevel, activeEmotion, hyperbits]); // Added hyperbits to dependencies

  return <canvas ref={canvasRef} className="block w-full h-full pointer-events-none fixed inset-0 z-0" />;
});