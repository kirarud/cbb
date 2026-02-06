
import React, { useEffect, useRef } from 'react';
import { EmotionType } from '../types';

interface MuzaAvatarProps {
  emotion: EmotionType;
  isThinking: boolean;
  isSpeaking: boolean;
  scale?: number;
}

export const MuzaAvatar: React.FC<MuzaAvatarProps> = ({ emotion, isThinking, isSpeaking, scale = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Divine Color Palette
  const getColors = (emo: EmotionType): [string, string] => {
    switch (emo) {
      case EmotionType.HAPPY: return ['#fbbf24', '#f59e0b']; // Gold/Amber (Radiance)
      case EmotionType.EXCITED: return ['#f43f5e', '#e11d48']; // Rose/Red (Passion)
      case EmotionType.CURIOUS: return ['#22d3ee', '#0ea5e9']; // Cyan/Sky (Aether)
      case EmotionType.THOUGHTFUL: return ['#818cf8', '#6366f1']; // Indigo (Deep Space)
      case EmotionType.MELANCHOLIC: return ['#94a3b8', '#64748b']; // Silver/Slate (Rain)
      case EmotionType.INSPIRED: return ['#d8b4fe', '#c084fc']; // Lavender (Divinity)
      default: return ['#fbbf24', '#fcd34d']; // Default Gold
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    
    const [primary, secondary] = getColors(emotion);
    
    // Convert hex to rgb for opacity handling
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 215, b: 0 };
    }

    const c1 = hexToRgb(primary);
    const c2 = hexToRgb(secondary);

    const particles: {x: number, y: number, z: number, theta: number, phi: number, speed: number}[] = [];
    const particleCount = 80;
    const radius = 60;

    for(let i=0; i<particleCount; i++) {
        particles.push({
            x: 0, y: 0, z: 0,
            theta: Math.random() * Math.PI * 2,
            phi: Math.acos((Math.random() * 2) - 1),
            speed: 0.005 + Math.random() * 0.01
        });
    }

    const render = () => {
        // Speed up when thinking or speaking
        const speedMultiplier = isThinking ? 4 : (isSpeaking ? 2 : 1);
        time += 0.01 * speedMultiplier;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        particles.sort((a, b) => b.z - a.z); // Simple z-sort

        particles.forEach((p, i) => {
            // Rotate particles
            p.theta += p.speed * speedMultiplier;
            
            // "Breathing" radius - gentle pulse
            const r = radius + Math.sin(time * 1.5 + p.phi * 3) * (isSpeaking ? 10 : 3);

            p.x = r * Math.sin(p.phi) * Math.cos(p.theta);
            p.y = r * Math.sin(p.phi) * Math.sin(p.theta);
            p.z = r * Math.cos(p.phi);

            // Project 3D to 2D
            const perspective = 300;
            const scaleFactor = perspective / (perspective + p.z);
            const x2d = cx + p.x * scaleFactor;
            const y2d = cy + p.y * scaleFactor;
            const size = Math.max(0.1, (isThinking ? 4 : 2.5) * scaleFactor);

            const alpha = (p.z + radius) / (2 * radius); // Fade back particles

            ctx.beginPath();
            ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
            // Gradient fill
            const grad = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, Math.max(0.1, size * 3));
            grad.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${alpha})`);
            grad.addColorStop(1, `rgba(${c2.r}, ${c2.g}, ${c2.b}, 0)`);
            ctx.fillStyle = grad;
            ctx.fill();
            
            // Connect lines if close (Constellation effect)
            if (!isThinking) {
                 particles.slice(i+1, i+4).forEach(p2 => {
                     const dx = p.x - p2.x;
                     const dy = p.y - p2.y;
                     const dz = p.z - p2.z;
                     const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                     if (dist < 45) {
                        const s2 = perspective / (perspective + p2.z);
                        const x2d2 = cx + p2.x * s2;
                        const y2d2 = cy + p2.y * s2;
                        
                        ctx.beginPath();
                        ctx.moveTo(x2d, y2d);
                        ctx.lineTo(x2d2, y2d2);
                        ctx.strokeStyle = `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${0.15 * alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                     }
                 });
            }
        });

        // Core glow (Halo)
        const glowSize = Math.max(0.1, (radius * 1.8) + Math.sin(time * 2) * 5);
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, glowSize);
        grad.addColorStop(0, `rgba(${c1.r}, ${c1.g}, ${c1.b}, ${isSpeaking ? 0.3 : 0.05})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0,0, canvas.width, canvas.height);

        animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [emotion, isThinking, isSpeaking]);

  return (
    <div className="relative flex items-center justify-center transition-transform duration-500" style={{ transform: `scale(${scale})` }}>
        <canvas ref={canvasRef} width={200} height={200} className="w-[200px] h-[200px]" />
    </div>
  );
};