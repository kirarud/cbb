import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, SkipForward, SkipBack, Activity, Disc, Volume2, Plus } from 'lucide-react';
import { Language, MusicTrack, EmotionType } from '../types';
import { synthService } from '../services/synthService';
import { EMOTION_TO_SCALE, TRANSLATIONS } from '../constants';

interface MusicLabProps {
    language: Language;
    onLog: (msg: string) => void;
}

export const MusicLab: React.FC<MusicLabProps> = ({ language, onLog }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [externalLink, setExternalLink] = useState('');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    const [playlist, setPlaylist] = useState<MusicTrack[]>([
        { id: '1', title: 'Neural Genesis', artist: 'Muza Core', source: 'GENERATED', duration: '∞', emotion: EmotionType.CURIOUS },
        { id: '2', title: 'Void Echoes', artist: 'Muza (Deep Mode)', source: 'GENERATED', duration: '∞', emotion: EmotionType.MELANCHOLIC }
    ]);

    const currentTrack = playlist[currentTrackIndex];
    const theoryInfo = currentTrack.source === 'GENERATED' ? EMOTION_TO_SCALE[currentTrack.emotion] : null;

    // --- AUDIO HANDLING ---
    useEffect(() => {
        synthService.stopGenerativeMusic();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        if (isPlaying) {
            // FIX: Pass volume argument
            synthService.setMasterVolume(volume);
            if (currentTrack.source === 'GENERATED') {
                // FIX: Pass emotion argument
                synthService.playGenerativeTrack(currentTrack.emotion || EmotionType.NEUTRAL);
            } else if (currentTrack.source === 'EXTERNAL_LINK' && currentTrack.url) {
                if (!audioRef.current) audioRef.current = new Audio(currentTrack.url);
                else audioRef.current.src = currentTrack.url;
                
                audioRef.current.volume = volume;
                audioRef.current.play().catch(e => {
                    onLog("Error playing external link.");
                    setIsPlaying(false);
                });
            }
        }

        return () => {
            synthService.stopGenerativeMusic();
            if (audioRef.current) audioRef.current.pause();
        };
    }, [currentTrack, isPlaying, volume, onLog]);

    useEffect(() => {
        // Update volume in real-time
        // FIX: Pass volume argument
        synthService.setMasterVolume(volume);
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // --- VISUALIZATION ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;
        // FIX: synthService.analyser is now available
        const analyser = synthService.analyser;
        const bufferLength = analyser ? analyser.frequencyBinCount : 0;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            time += isPlaying ? 0.05 : 0.01;
            
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }

            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#020617');
            gradient.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (isPlaying && analyser) {
                analyser.getByteFrequencyData(dataArray);
                const barWidth = (canvas.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for(let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] * 1.2;
                    ctx.fillStyle = `hsl(${i + time * 10}, 80%, 50%)`;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            } else {
                const cx = canvas.width/2;
                const cy = canvas.height/2;
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for(let i=0; i<3; i++) {
                    ctx.arc(cx, cy, 50 + i*30 + Math.sin(time + i)*10, 0, Math.PI*2);
                }
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationRef.current);
    }, [isPlaying]);

    // --- CONTROLS ---
    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        setIsPlaying(false);
        setTimeout(() => {
            setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
            setIsPlaying(true);
        }, 100);
    };

    const prevTrack = () => {
        setIsPlaying(false);
        setTimeout(() => {
            setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
            setIsPlaying(true);
        }, 100);
    };

    const generateNewTrack = () => {
        const emotions = Object.values(EmotionType);
        const randomEmo = emotions[Math.floor(Math.random() * emotions.length)];
        const newTrack: MusicTrack = {
            id: Date.now().toString(),
            title: `Neural Opus #${Math.floor(Math.random() * 1000)}`,
            artist: 'Muza AI',
            source: 'GENERATED',
            duration: '∞',
            emotion: randomEmo
        };
        setPlaylist([...playlist, newTrack]);
        onLog(`Generated new track with emotion: ${randomEmo}`);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 p-0 overflow-hidden relative">
            <div className="flex-1 relative bg-black">
                <canvas ref={canvasRef} className="w-full h-full block" />
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mix-blend-difference">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase opacity-80 animate-pulse">
                        {isPlaying ? currentTrack.title : "PAUSED"}
                    </h2>
                    <p className="text-xl text-slate-300 font-light mt-2 tracking-widest">{currentTrack.artist}</p>
                    
                    {isPlaying && theoryInfo && (
                        <div className="mt-4 p-2 border border-white/20 rounded-lg inline-block bg-black/40 backdrop-blur-sm">
                            <div className="text-xs text-cyan-400 font-mono">THEORY ACTIVE</div>
                            <div className="text-sm text-white font-bold">{theoryInfo.scale} SCALE • {theoryInfo.bpm} BPM</div>
                        </div>
                    )}
                </div>

                {/* Playlist Sidebar */}
                <div className="absolute top-0 right-0 h-full w-80 bg-slate-900/80 backdrop-blur-md border-l border-slate-700 transform translate-x-full hover:translate-x-0 transition-transform duration-300 z-10 flex flex-col">
                    <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Queue</span>
                        <span className="text-xs text-slate-600">{playlist.length} tracks</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {playlist.map((track, idx) => (
                            <div 
                                key={track.id}
                                onClick={() => { setIsPlaying(false); setTimeout(() => { setCurrentTrackIndex(idx); setIsPlaying(true); }, 50); }}
                                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group ${idx === currentTrackIndex ? 'bg-pink-900/20 border border-pink-500/30' : 'hover:bg-slate-800 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${idx === currentTrackIndex ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                        <Music className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-xs font-bold truncate ${idx === currentTrackIndex ? 'text-pink-300' : 'text-slate-300'}`}>{track.title}</span>
                                        <span className="text-xs text-slate-500 truncate">{track.artist}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-slate-700 bg-slate-900">
                        <button onClick={generateNewTrack} className="w-full py-2 bg-pink-900/20 hover:bg-pink-900/40 text-pink-400 border border-pink-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                            <Activity className="w-3 h-3" /> GENERATE NEW
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="h-24 bg-slate-950 border-t border-slate-800 flex items-center px-6 gap-6 shrink-0 z-20">
                <div className="w-1/4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
                        <Disc className={`w-6 h-6 text-slate-500 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white truncate max-w-[150px]">{currentTrack.title}</span>
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">{currentTrack.artist}</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-6">
                        <button onClick={prevTrack} className="text-slate-400 hover:text-white transition-colors"><SkipBack className="w-6 h-6" /></button>
                        <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/20">
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>
                        <button onClick={nextTrack} className="text-slate-400 hover:text-white transition-colors"><SkipForward className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="w-1/4 flex items-center justify-end gap-4">
                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <Volume2 className="w-4 h-4 text-slate-400" />
                        <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500" 
                        />
                        <span className="text-xs text-slate-500 font-mono w-8 text-right">{(volume * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
