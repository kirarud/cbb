
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Pause, Zap, Activity, Waves, Database } from 'lucide-react';
import { MuzaState, HyperBit, Language, ConsciousnessType } from '../types';
import { synthService } from '../services/synthService';
import { TRANSLATIONS } from '../constants';
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

    const particlesData = useMemo(() => {
        const count = 1500;
        const realCount = hyperbits.length;
        const data = new Float32Array(count * 7);

        for (let i = 0; i < count; i++) {
            const i7 = i * 7;
            const isReal = i < realCount;
            const sourceBit = isReal ? hyperbits[realCount - 1 - i] : null;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const radiusBase = isReal ? 150 : 250 + Math.random() * 100;
            
            data[i7] = radiusBase * Math.sin(phi) * Math.cos(theta);
            data[i7+1] = radiusBase * Math.sin(phi) * Math.sin(theta);
            data[i7+2] = radiusBase * Math.cos(phi);

            if (sourceBit) {
                const hex = sourceBit.optics.baseColor;
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;
                
                data[i7+3] = r;
                data[i7+4] = g;
                data[i7+5] = b;
                data[i7+6] = 3 + (sourceBit.energy * 4);
            } else {
                data[i7+3] = 0.1; 
                data[i7+4] = 0.3;
                data[i7+5] = 0.4;
                data[i7+6] = 1;
            }
        }
        return data;
    }, [hyperbits]);

    useEffect(() => {
        return () => {
            synthService.stopGenerativeMusic();
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            synthService.stopGenerativeMusic();
            setIsPlaying(false);
        } else {
            const latestHyperbit = hyperbits.length > 0 ? hyperbits[hyperbits.length - 1] : null;
            if (latestHyperbit) {
                synthService.playGenerativeTrack(latestHyperbit);
            } else {
                // Fallback if no hyperbits exist
                // FIX: Added required importance and emotionalCharge fields for HyperBit v20 compatibility.
                const dummyHyperbit: HyperBit = {
                    id: 'synesthesia-fallback',
                    content: `feeling ${state.activeEmotion}`,
                    type: ConsciousnessType.EMOTIONAL,
                    layer: 'SYNTH',
                    energy: 0.6,
                    optics: calculateOptics(ConsciousnessType.EMOTIONAL, 0.6, `feeling ${state.activeEmotion}`),
                    resonance: 0.7, decay: 0, timestamp: Date.now(), connections: [], provider: 'SYNTH',
                    importance: 0.5,
                    emotionalCharge: 0.5
                };
                synthService.playGenerativeTrack(dummyHyperbit);
            }
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: true });
        if (!canvas || !ctx) return;

        const analyser = synthService.analyser;
        const audioData = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);
        let time = 0;
        let rotX = 0;
        let rotY = 0;

        const render = () => {
            animationRef.current = requestAnimationFrame(render);
            time += 0.01;

            if (canvas.width !== canvas.parentElement?.clientWidth || canvas.height !== canvas.parentElement?.clientHeight) {
                canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
                canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
            }

            let bass = 0, mid = 0, treble = 0;
            if (isPlaying && analyser) {
                analyser.getByteFrequencyData(audioData);
                for(let i=0; i<10; i++) bass += audioData[i];
                for(let i=10; i<100; i++) mid += audioData[i];
                for(let i=100; i<300; i++) treble += audioData[i];
                bass /= 10 * 255; mid /= 90 * 255; treble /= 200 * 255;
            } else {
                bass = 0.1 + Math.sin(time) * 0.05;
                mid = 0.1 + Math.cos(time * 1.3) * 0.05;
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2, cy = canvas.height / 2, fov = 400;
            rotY += 0.002 + (bass * 0.01);
            rotX += 0.001 + (mid * 0.005);
            const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
            const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
            const projectedParticles = [];
            const count = particlesData.length / 7;

            for (let i = 0; i < count; i++) {
                const i7 = i * 7;
                let x = particlesData[i7], y = particlesData[i7 + 1], z = particlesData[i7 + 2];
                const pulse = 1 + (bass * 0.3 * (i < hyperbits.length ? 1.5 : 0.5)); 
                x *= pulse; y *= pulse; z *= pulse;
                let x1 = x * cosY - z * sinY, z1 = z * cosY + x * sinY;
                let y1 = y * cosX - z1 * sinX, z2 = z1 * cosX + y * sinX;
                if (z2 > -fov) {
                    const scale = fov / (fov + z2);
                    projectedParticles.push({
                        x: cx + x1 * scale, y: cy + y1 * scale, scale,
                        r: particlesData[i7+3], g: particlesData[i7+4], b: particlesData[i7+5],
                        size: particlesData[i7+6], index: i
                    });
                }
            }

            projectedParticles.sort((a, b) => a.scale - b.scale);
            projectedParticles.forEach(p => {
                const drawSize = p.size * p.scale * (1 + treble);
                const alpha = Math.min(1, p.scale);
                ctx.fillStyle = `rgba(${p.r*255}, ${p.g*255}, ${p.b*255}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
                ctx.fill();
                if (p.size > 4) {
                    ctx.fillStyle = `rgba(${p.r*255}, ${p.g*255}, ${p.b*255}, ${alpha * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, drawSize * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        };
        render();
    }, [isPlaying, state.activeEmotion, hyperbits, particlesData]);

    return (
        <div className="relative w-full h-full overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-full absolute inset-0 z-0" />
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Zap className="w-8 h-8 text-yellow-400" />
                            {t?.title || 'Synesthesia Core'}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">{t?.subtitle || 'Audio-Visual Resonance'}</p>
                    </div>
                </div>
                {!isPlaying && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
                        <button onClick={togglePlay} className="group relative flex items-center justify-center w-24 h-24 bg-white/5 border border-white/20 rounded-full hover:scale-110 transition-all duration-500 backdrop-blur-md hover:bg-white/10 hover:border-cyan-400">
                            <Play className="w-10 h-10 text-white fill-current group-hover:text-cyan-400 transition-colors" />
                            <div className="absolute -inset-4 border border-white/5 rounded-full animate-ping opacity-20"></div>
                        </button>
                        <p className="mt-4 text-slate-500 text-xs tracking-[0.2em] uppercase animate-pulse">{t?.play || 'INITIATE'}</p>
                    </div>
                )}
                {isPlaying && (
                    <div className="flex justify-center pointer-events-auto">
                        <button onClick={togglePlay} className="px-8 py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 rounded-xl text-red-400 font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 backdrop-blur-md">
                            <Pause className="w-4 h-4 fill-current" />
                            {t?.stop || 'CEASE'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
