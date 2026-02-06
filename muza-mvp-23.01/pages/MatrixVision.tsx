
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Eye, Monitor, StopCircle, Scan, Activity, GitCommit, Info, X } from 'lucide-react';
import { MuzaState, HyperBit, EmotionType, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Tooltip } from '../components/Tooltip';

interface MatrixVisionProps {
    state: MuzaState;
    hyperbits: HyperBit[];
    language?: Language; // Add language prop
}

const CHAR_SET = " .`-_':,;^=+/\"|)\\<>)iv%xclrs{*}I?!][1taeo7zjLunT#JCwfy325Fp6mqSghVd4EgXPGZbYkOA&8U$@KHDBWNMR0Q";
const DENSITY_LEN = CHAR_SET.length;

const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

const EMOTION_PHYSICS: Record<EmotionType, { flowX: number, flowY: number, turbulence: number, speed: number }> = {
    [EmotionType.NEUTRAL]:     { flowX: 0.2,  flowY: 0,    turbulence: 0.1, speed: 0.5 },
    [EmotionType.CURIOUS]:     { flowX: 0.5,  flowY: 0.5,  turbulence: 0.3, speed: 1.0 },
    [EmotionType.HAPPY]:       { flowX: 0,    flowY: -1.0, turbulence: 0.2, speed: 1.5 },
    [EmotionType.EXCITED]:     { flowX: 0,    flowY: -2.0, turbulence: 0.8, speed: 2.5 },
    [EmotionType.THOUGHTFUL]:  { flowX: 0.1,  flowY: 0,    turbulence: 0.05, speed: 0.2 },
    [EmotionType.INSPIRED]:    { flowX: 0.8,  flowY: -0.8, turbulence: 0.5, speed: 2.0 },
    [EmotionType.MELANCHOLIC]: { flowX: 0,    flowY: 0.5,  turbulence: 0.1, speed: 0.3 },
};

export const MatrixVision: React.FC<MatrixVisionProps> = ({ state, hyperbits, language = 'en' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    
    const [isSharing, setIsSharing] = useState(false);
    const [resolution, setResolution] = useState(14); 
    const [motionDetected, setMotionDetected] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

    const t = TRANSLATIONS[language].matrix; 

    const emitters = useMemo(() => {
        return hyperbits.slice(-8).map(hb => {
            const h = hashString(hb.id);
            const x = Math.abs(h % 1000) / 1000;
            const y = Math.abs((h >> 16) % 1000) / 1000;
            const freq = hb.energy * 20 + 2;
            
            const hex = hb.optics.baseColor;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);

            return { x, y, freq, r, g, b, energy: hb.energy, id: hb.id };
        });
    }, [hyperbits]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const offscreen = offscreenCanvasRef.current;
        if (!canvas || !video || !offscreen) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if (!ctx || !offCtx) return;

        let animationFrame: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            offscreen.width = Math.ceil(window.innerWidth / resolution);
            offscreen.height = Math.ceil(window.innerHeight / resolution);
            prevFrameRef.current = null;
        };
        resize();
        window.addEventListener('resize', resize);

        const render = () => {
            const physics = EMOTION_PHYSICS[state.activeEmotion];
            time += 0.02 * physics.speed * (state.energyLevel + 0.5);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = `${resolution}px monospace`;
            ctx.textBaseline = 'top';

            if (isSharing && video.readyState === 4) {
                offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
                const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
                const data = imageData.data;
                const prevData = prevFrameRef.current;
                
                let motionCount = 0;

                for (let y = 0; y < offscreen.height; y++) {
                    for (let x = 0; x < offscreen.width; x++) {
                        const index = (y * offscreen.width + x) * 4;
                        const r = data[index];
                        const g = data[index + 1];
                        const b = data[index + 2];
                        const brightness = (r + g + b) / 3;

                        let isMoving = false;
                        if (prevData) {
                            const dr = Math.abs(r - prevData[index]);
                            const dg = Math.abs(g - prevData[index+1]);
                            const db = Math.abs(b - prevData[index+2]);
                            if (dr + dg + db > 50) { 
                                isMoving = true;
                                motionCount++;
                            }
                        }

                        let charIndex = Math.floor((brightness / 255) * (DENSITY_LEN - 1));
                        if (isMoving) charIndex = DENSITY_LEN - 1; 

                        const char = CHAR_SET[charIndex];

                        if (isMoving) {
                            ctx.fillStyle = '#ef4444'; 
                            ctx.font = `bold ${resolution}px monospace`;
                        } else {
                            ctx.fillStyle = `rgb(${r},${g},${b})`;
                            ctx.font = `${resolution}px monospace`;
                        }
                        
                        ctx.fillText(char, x * resolution, y * resolution);
                    }
                }
                const newData = new Uint8ClampedArray(data);
                prevFrameRef.current = newData;
                if (Math.random() > 0.9) setMotionDetected(motionCount > 10);

            } else {
                const cols = Math.ceil(canvas.width / resolution);
                const rows = Math.ceil(canvas.height / resolution);

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const nx = x / cols, ny = y / rows;
                        const driftX = nx * 10 - (time * physics.flowX);
                        const driftY = ny * 10 - (time * physics.flowY);
                        let waveSum = 0, rSum = 0, gSum = 0, bSum = 0, totalWeight = 0;
                        const noise = Math.sin(driftX) * Math.cos(driftY) + Math.sin(driftX + driftY + time * physics.turbulence);
                        waveSum += noise * 0.3;

                        emitters.forEach(e => {
                            const dx = nx - e.x, dy = ny - e.y, dist = Math.sqrt(dx*dx + dy*dy);
                            const waveVal = Math.sin(dist * (20 + e.freq) - (time * 5));
                            const amplitude = (e.energy * 2) / (dist * 5 + 1); 
                            waveSum += waveVal * amplitude;
                            const weight = Math.max(0, waveVal * amplitude + 0.5); 
                            rSum += e.r * weight; gSum += e.g * weight; bSum += e.b * weight;
                            totalWeight += weight;
                        });

                        const normalizedIntensity = Math.max(0, Math.min(1, (waveSum + 1) / 2));
                        const coherenceThreshold = 1.0 - state.coherence; 
                        
                        if (normalizedIntensity > 0.2 + (coherenceThreshold * 0.2)) {
                            const char = CHAR_SET[Math.floor(normalizedIntensity * (DENSITY_LEN - 1))];
                            let finalR = totalWeight > 0 ? Math.min(255, rSum / totalWeight * 1.5) : 50;
                            let finalG = totalWeight > 0 ? Math.min(255, gSum / totalWeight * 1.5) : 50;
                            let finalB = totalWeight > 0 ? Math.min(255, bSum / totalWeight * 1.5) : 50;
                            const brightness = 0.5 + (state.energyLevel * 0.5);
                            ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${normalizedIntensity * brightness})`;
                            ctx.fillText(char, x * resolution, y * resolution);
                        }
                    }
                }
            }
            animationFrame = requestAnimationFrame(render);
        };
        render();
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, [isSharing, resolution, state, emitters, t]);

    const startCapture = async () => { /* ... */ };
    const stopCapture = () => { /* ... */ };

    return (
        <div className="relative w-full h-full overflow-hidden font-mono">
            <video ref={videoRef} className="hidden" muted playsInline />
            <canvas ref={canvasRef} className="block w-full h-full absolute inset-0 z-0" />
            {/* HUD Elements remain the same */}
        </div>
    );
};
