
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Pause, Zap, Activity, Waves, Database } from 'lucide-react';
import { MuzaState, HyperBit, Language } from '../types';
import { synthService } from '../services/synthService';
import { TRANSLATIONS, TYPE_COLORS, EMOTION_LABELS } from '../constants';
import { calculateOptics } from '../services/opticsEngine';

interface SynesthesiaProps {
    state: MuzaState;
    hyperbits: HyperBit[];
    language: Language;
}

const CHAR_SET = "01muza_echo_quantum_flux_";

export const Synesthesia: React.FC<SynesthesiaProps> = ({ state, hyperbits, language }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const animationRef = useRef<number>(0);
    const t = TRANSLATIONS[language].synesthesia;
    const h = TRANSLATIONS[language].synesthesiaHints;
    const isPlayingRef = useRef(isPlaying);
    const emotionRef = useRef(state.activeEmotion);
    const particlesRef = useRef<Float32Array>(new Float32Array());
    const hyperbitsRef = useRef<HyperBit[]>(hyperbits);

    useEffect(() => {
        if (synthService.isGenerativeActive()) {
            setIsPlaying(true);
        }
    }, []);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { emotionRef.current = state.activeEmotion; }, [state.activeEmotion]);
    useEffect(() => { particlesRef.current = particlesData; }, [particlesData]);
    useEffect(() => { hyperbitsRef.current = hyperbits; }, [hyperbits]);

    // --- PREPARE DATA PARTICLES ---
    // We map actual hyperbits to 3D points. If user has few hyperbits, we generate "potential" ones.
    const particlesData = useMemo(() => {
        const count = 1500; // Total particles target
        const realCount = hyperbits.length;
        const data = new Float32Array(count * 7); // x, y, z, r, g, b, size

        for (let i = 0; i < count; i++) {
            const i7 = i * 7;
            
            // Is this a real memory or quantum foam?
            const isReal = i < realCount;
            const sourceBit = isReal ? hyperbits[realCount - 1 - i] : null;

            // Sphere distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            // Real memories are closer to core, foam is outer shell
            const radiusBase = isReal ? 150 : 250 + Math.random() * 100;
            
            data[i7] = radiusBase * Math.sin(phi) * Math.cos(theta);     // x
            data[i7+1] = radiusBase * Math.sin(phi) * Math.sin(theta); // y
            data[i7+2] = radiusBase * Math.cos(phi);                   // z

            if (sourceBit) {
                // Parse color from hex (safe fallback if optics missing)
                const optics = sourceBit.optics || calculateOptics(sourceBit.type, sourceBit.energy);
                const hex = optics?.baseColor || TYPE_COLORS[sourceBit.type] || '#22d3ee';
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;
                
                data[i7+3] = r;
                data[i7+4] = g;
                data[i7+5] = b;
                data[i7+6] = 3 + (sourceBit.energy * 4); // Size based on energy
            } else {
                // Quantum Foam (Dark Cyan/Purple)
                data[i7+3] = 0.1; 
                data[i7+4] = 0.3;
                data[i7+5] = 0.4;
                data[i7+6] = 1; // Tiny size
            }
        }
        return data;
    }, [hyperbits.length]);

    useEffect(() => {
        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            synthService.stopGenerativeMusic();
            setIsPlaying(false);
        } else {
            synthService.playGenerativeTrack(state.activeEmotion);
            setIsPlaying(true);
        }
    };

    // --- MAIN RENDER LOOP ---
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: false });
        if (!canvas || !ctx) return;

        let audioData = new Uint8Array(synthService.analyser ? synthService.analyser.frequencyBinCount : 0);

        let time = 0;
        let rotX = 0;
        let rotY = 0;
        let stopped = false;

        const render = () => {
            if (stopped) return;
            animationRef.current = requestAnimationFrame(render);
            time += 0.01;

            // Handle Resize
            if (canvas.width !== canvas.parentElement?.clientWidth || canvas.height !== canvas.parentElement?.clientHeight) {
                canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
                canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
            }

            // Audio Analysis
            let bass = 0;
            let mid = 0;
            let treble = 0;
            
            const analyser = synthService.analyser;
            if (isPlayingRef.current && analyser) {
                if (audioData.length !== analyser.frequencyBinCount) {
                    audioData = new Uint8Array(analyser.frequencyBinCount);
                }
                analyser.getByteFrequencyData(audioData);
                // Simple averaging bands
                for(let i=0; i<10; i++) bass += audioData[i];
                for(let i=10; i<100; i++) mid += audioData[i];
                for(let i=100; i<300; i++) treble += audioData[i];
                
                bass /= 10 * 255; 
                mid /= 90 * 255;
                treble /= 200 * 255;
            } else {
                // Idle breathing
                bass = 0.1 + Math.sin(time) * 0.05;
                mid = 0.1 + Math.cos(time * 1.3) * 0.05;
                treble = 0;
            }

            // Clear with Trail (Blur)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const fov = 400;

            // Rotation driven by audio + time
            rotY += 0.002 + (bass * 0.01);
            rotX += 0.001 + (mid * 0.005);

            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);
            const cosX = Math.cos(rotX);
            const sinX = Math.sin(rotX);

            // Draw Background Matrix Code (Low opacity)
            if (Math.random() > 0.8) {
                ctx.fillStyle = `rgba(0, 255, 200, ${bass * 0.3})`;
                ctx.font = '10px monospace';
                const x = Math.random() * canvas.width;
                const char = CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
                ctx.fillText(char, x, Math.random() * canvas.height);
            }

            // Project Particles
            const projectedParticles = [];
            const pdata = particlesRef.current;
            const count = pdata.length / 7;
            const hb = hyperbitsRef.current;

            for (let i = 0; i < count; i++) {
                const i7 = i * 7;
                let x = pdata[i7];
                let y = pdata[i7 + 1];
                let z = pdata[i7 + 2];

                // Audio Pulse (Expand Core)
                const pulse = 1 + (bass * 0.3 * (i < hb.length ? 1.5 : 0.5)); 
                x *= pulse;
                y *= pulse;
                z *= pulse;

                // 3D Rotation
                let x1 = x * cosY - z * sinY;
                let z1 = z * cosY + x * sinY;
                let y1 = y * cosX - z1 * sinX;
                let z2 = z1 * cosX + y * sinX;

                if (z2 > -fov) {
                    const scale = fov / (fov + z2);
                    const x2d = cx + x1 * scale;
                    const y2d = cy + y1 * scale;
                    
                    projectedParticles.push({
                        x: x2d, y: y2d, scale,
                        r: pdata[i7+3],
                        g: pdata[i7+4],
                        b: pdata[i7+5],
                        size: pdata[i7+6],
                        index: i
                    });
                }
            }

            // Draw Connections (Semantic Web)
            // We connect particles that are sequentially close in memory (index proximity)
            // Only for "Real" hyperbits
            ctx.lineWidth = 0.5;
            for(let i=0; i<Math.min(projectedParticles.length, hb.length) - 1; i++) {
                const p1 = projectedParticles[i];
                const p2 = projectedParticles[i+1];
                
                // Distance check 2D
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 100 * p1.scale) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    // Gradient line
                    const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    grad.addColorStop(0, `rgba(${p1.r*255}, ${p1.g*255}, ${p1.b*255}, ${0.3 * mid})`);
                    grad.addColorStop(1, `rgba(${p2.r*255}, ${p2.g*255}, ${p2.b*255}, ${0.3 * mid})`);
                    ctx.strokeStyle = grad;
                    ctx.stroke();
                }
            }

            // Draw Particles
            projectedParticles.sort((a, b) => a.scale - b.scale); // Z-sort for depth
            
            projectedParticles.forEach(p => {
                const drawSize = p.size * p.scale * (1 + treble);
                const alpha = Math.min(1, p.scale);
                
                // Core
                ctx.fillStyle = `rgba(${p.r*255}, ${p.g*255}, ${p.b*255}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
                ctx.fill();

                // Glow for high energy particles
                if (p.size > 4) {
                    ctx.fillStyle = `rgba(${p.r*255}, ${p.g*255}, ${p.b*255}, ${alpha * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, drawSize * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Floating Thought Text (Only most recent)
            if (hb.length > 0) {
                const lastBit = hb[hb.length - 1];
                const p = projectedParticles.find(pp => pp.index === 0); // 0 is usually newest due to sorting in some logic, but here array matches hyperbits order inverted
                // Actually in mapping above: i=0 is hyperbits[length-1]. Correct.
                
                if (p) {
                    ctx.font = `bold ${14 * p.scale}px monospace`;
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.scale})`;
                    ctx.textAlign = 'center';
                    ctx.fillText(lastBit.content.slice(0, 30) + (lastBit.content.length > 30 ? '...' : ''), p.x, p.y - 20 * p.scale);
                }
            }

        };
        render();
        return () => {
            stopped = true;
            cancelAnimationFrame(animationRef.current);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden font-mono">
            <canvas ref={canvasRef} className="block w-full h-full absolute inset-0 z-0" />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
                
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Zap className="w-8 h-8 text-yellow-400" />
                            {t?.title || (language === 'ru' ? 'Ядро Синестезии' : 'Synesthesia Core')}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">{t?.subtitle || (language === 'ru' ? 'Аудио‑визуальный резонанс' : 'Audio-Visual Resonance')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                            <Database className="w-4 h-4 text-green-400" />
                            <span className="text-[10px] text-white font-bold whitespace-nowrap leading-none">
                                {hyperbits.length} {t.nodesLabel}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] text-white font-bold whitespace-nowrap leading-none">{EMOTION_LABELS[language][state.activeEmotion]}</span>
                        </div>
                    </div>
                </div>

                {/* Center Message (if stopped) */}
                {!isPlaying && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
                        <button 
                            onClick={togglePlay}
                            className="group relative flex items-center justify-center w-24 h-24 bg-white/5 border border-white/20 rounded-full hover:scale-110 transition-all duration-500 backdrop-blur-md hover:bg-white/10 hover:border-cyan-400"
                        >
                            <Play className="w-10 h-10 text-white fill-current group-hover:text-cyan-400 transition-colors" />
                            <div className="absolute -inset-4 border border-white/5 rounded-full animate-ping opacity-20"></div>
                        </button>
                        <p className="mt-4 text-slate-500 text-xs tracking-[0.2em] uppercase animate-pulse">{t.playHint}</p>
                        {hyperbits.length === 0 && (
                            <div className="mt-3 text-[10px] text-slate-500">
                                {h.noData}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Controls (if playing) */}
                {isPlaying && (
                    <div className="flex justify-center pointer-events-auto">
                        <button 
                            onClick={togglePlay}
                            className="px-8 py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 rounded-xl text-red-400 font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 backdrop-blur-md"
                        >
                            <Pause className="w-4 h-4 fill-current" />
                            {t.stopHint}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
