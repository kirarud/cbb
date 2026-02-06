

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

// Hashing function to map Hyperbit IDs to consistent Grid Coordinates
const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};

// Physics configurations for different emotions (Tuned Hyperparameters)
const EMOTION_PHYSICS: Record<EmotionType, { flowX: number, flowY: number, turbulence: number, speed: number }> = {
    [EmotionType.NEUTRAL]:     { flowX: 0.2,  flowY: 0,    turbulence: 0.1, speed: 0.5 },
    [EmotionType.CURIOUS]:     { flowX: 0.5,  flowY: 0.5,  turbulence: 0.3, speed: 1.0 },
    [EmotionType.HAPPY]:       { flowX: 0,    flowY: -1.0, turbulence: 0.2, speed: 1.5 },
    [EmotionType.EXCITED]:     { flowX: 0,    flowY: -2.0, turbulence: 0.8, speed: 2.5 },
    [EmotionType.THOUGHTFUL]:  { flowX: 0.1,  flowY: 0,    turbulence: 0.05, speed: 0.2 },
    [EmotionType.INSPIRED]:    { flowX: 0.8,  flowY: -0.8, turbulence: 0.5, speed: 2.0 },
    [EmotionType.MELANCHOLIC]: { flowX: 0,    flowY: 0.5,  turbulence: 0.1, speed: 0.3 },
    [EmotionType.FOCUS]:       { flowX: 0,    flowY: 0,    turbulence: 0.0, speed: 0.1 },
    [EmotionType.FLOW]:        { flowX: 1.0,  flowY: 0,    turbulence: 0.1, speed: 1.5 },
    [EmotionType.CHAOS]:       { flowX: 0.5,  flowY: 0.5,  turbulence: 1.0, speed: 3.0 },
    [EmotionType.ERROR]:       { flowX: 0,    flowY: 0,    turbulence: 0.9, speed: 0.0 },
};

export const MatrixVision: React.FC<MatrixVisionProps> = ({ state, hyperbits, language = 'en' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    
    const [isSharing, setIsSharing] = useState(false);
    const [resolution, setResolution] = useState(12); // Slightly higher density
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

        const ctx = canvas.getContext('2d', { alpha: false });
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
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.92)'; // Darker fade
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
                            if (dr + dg + db > 60) { // Tuned threshold 
                                isMoving = true;
                                motionCount++;
                            }
                        }

                        let charIndex = Math.floor((brightness / 255) * (DENSITY_LEN - 1));
                        if (isMoving) charIndex = DENSITY_LEN - 1; 

                        const char = CHAR_SET[charIndex];

                        if (isMoving) {
                            ctx.fillStyle = '#10b981'; // Green Matrix motion
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
                    const ny = y / rows;
                    for (let x = 0; x < cols; x++) {
                        const nx = x / cols;
                        const driftX = nx * 10 - (time * physics.flowX);
                        const driftY = ny * 10 - (time * physics.flowY);

                        let waveSum = 0;
                        let rSum = 0, gSum = 0, bSum = 0;
                        let totalWeight = 0;

                        const noise = Math.sin(driftX) * Math.cos(driftY) + Math.sin(driftX + driftY + time * physics.turbulence);
                        waveSum += noise * 0.3;

                        if (emitters.length > 0) {
                            emitters.forEach(e => {
                                const dx = nx - e.x;
                                const dy = ny - e.y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                const waveVal = Math.sin(dist * (20 + e.freq) - (time * 5));
                                const amplitude = (e.energy * 2) / (dist * 5 + 1); 
                                waveSum += waveVal * amplitude;
                                const weight = Math.max(0, waveVal * amplitude + 0.5); 
                                rSum += e.r * weight;
                                gSum += e.g * weight;
                                bSum += e.b * weight;
                                totalWeight += weight;
                            });
                        } else {
                             if (state.activeEmotion === EmotionType.HAPPY) { rSum = 255; gSum = 200; bSum = 50; totalWeight=1; }
                             else if (state.activeEmotion === EmotionType.MELANCHOLIC) { rSum = 50; gSum = 100; bSum = 200; totalWeight=1; }
                             else { rSum = 0; gSum = 255; bSum = 255; totalWeight = 1; }
                        }

                        const normalizedIntensity = Math.max(0, Math.min(1, (waveSum + 1) / 2));
                        const coherenceThreshold = 1.0 - state.coherence; 
                        
                        if (normalizedIntensity > 0.15 + (coherenceThreshold * 0.15)) {
                            const charIndex = Math.floor(normalizedIntensity * (DENSITY_LEN - 1));
                            const char = CHAR_SET[charIndex];
                            let finalR = totalWeight > 0 ? Math.min(255, rSum / totalWeight * 1.5) : 50;
                            let finalG = totalWeight > 0 ? Math.min(255, gSum / totalWeight * 1.5) : 50;
                            let finalB = totalWeight > 0 ? Math.min(255, bSum / totalWeight * 1.5) : 50;
                            const brightness = 0.6 + (state.energyLevel * 0.4);
                            
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

    const startCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 60 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsSharing(true);
            }
            stream.getVideoTracks()[0].onended = () => setIsSharing(false);
        } catch (e: any) {
            console.warn("Screen capture cancelled or denied", e);
            setIsSharing(false);
        }
    };

    const stopCapture = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsSharing(false);
            prevFrameRef.current = null;
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden font-mono">
            <video ref={videoRef} className="hidden" muted playsInline />
            <canvas ref={canvasRef} className="block w-full h-full absolute inset-0 z-0" />

            {/* INFO MODAL */}
            {showInfo && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-slate-900 border border-cyan-500/50 p-6 rounded-2xl max-w-md shadow-[0_0_50px_rgba(34,211,238,0.2)] relative">
                        <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                            <Eye className="w-6 h-6" /> {t.infoTitle}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed mb-4">
                            {t.infoDesc}
                        </p>
                        <div className="text-xs text-slate-500 font-mono">
                            <div className="mb-1">STATE: {isSharing ? 'INPUT_STREAM' : 'OUTPUT_STREAM'}</div>
                            <div>RESOLUTION: {resolution}px</div>
                        </div>
                    </div>
                </div>
            )}

            {/* HUD */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 z-50 transition-all hover:border-white/30 shadow-2xl">
                <div className="flex items-center gap-2 text-white">
                    {isSharing ? <Eye className="w-5 h-5 text-green-400" /> : <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />}
                    <div className="flex flex-col">
                        <span className="font-bold text-xs tracking-widest leading-none uppercase">
                            {isSharing ? t.inputMode : t.title}
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase leading-none mt-1">
                            {isSharing ? 'Video Feed' : `${t.outputMode}: ${state.activeEmotion}`}
                        </span>
                    </div>
                </div>
                
                <div className="h-6 w-px bg-white/20 mx-2"></div>
                
                {!isSharing ? (
                    <Tooltip content="Activate visual perception (Input)" position="bottom">
                        <button onClick={startCapture} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-600 transition-all hover:scale-105">
                            <Scan className="w-4 h-4" /> {t.start}
                        </button>
                    </Tooltip>
                ) : (
                    <Tooltip content="Stop perception" position="bottom">
                        <button onClick={stopCapture} className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg text-xs font-bold border border-red-500/50">
                            <StopCircle className="w-4 h-4" /> {t.stop}
                        </button>
                    </Tooltip>
                )}

                <button onClick={() => setShowInfo(true)} className="ml-2 p-1.5 rounded-full hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition-colors">
                    <Info className="w-4 h-4" />
                </button>
            </div>

            {/* Motion Warning */}
            {isSharing && motionDetected && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-900/80 border border-red-500 text-red-200 text-xs font-bold rounded-full animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)] z-50">
                    {t.motion}
                </div>
            )}

            {/* Legend / Stats */}
            {!isSharing && (
                <div className="absolute bottom-6 left-6 p-4 bg-black/40 backdrop-blur-sm rounded-xl border border-white/5 text-[10px] text-slate-500 max-w-sm pointer-events-none z-50">
                    <div className="mb-2 font-bold text-slate-300 flex items-center gap-2">
                        <GitCommit className="w-3 h-3 text-cyan-400" />
                        {t.metrics}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                        <span className="text-slate-400">{t.flow}:</span>
                        <span>[{EMOTION_PHYSICS[state.activeEmotion].flowX}, {EMOTION_PHYSICS[state.activeEmotion].flowY}]</span>
                        <span className="text-slate-400">{t.turb}:</span>
                        <span>{(EMOTION_PHYSICS[state.activeEmotion].turbulence * 100).toFixed(0)}%</span>
                        <span className="text-slate-400">ENERGY:</span>
                        <span className={state.energyLevel > 0.8 ? 'text-red-400' : 'text-slate-300'}>{(state.energyLevel * 100).toFixed(0)}%</span>
                    </div>
                </div>
            )}

            {/* Density Slider */}
            <div className="absolute bottom-6 right-6 flex items-center gap-3 p-3 bg-black/60 rounded-xl border border-white/10 backdrop-blur-md z-50">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">{t.granularity}</span>
                <input 
                    type="range" min="8" max="48" step="2"
                    value={resolution}
                    onChange={(e) => setResolution(parseInt(e.target.value))}
                    className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>
        </div>
    );
};