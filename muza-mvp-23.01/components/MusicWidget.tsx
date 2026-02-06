
import React, { useState, useEffect } from 'react';
import { Music, Play, Pause } from 'lucide-react';
import { synthService } from '../services/synthService';
import { EmotionType, MusicTrack } from '../types';

interface MusicWidgetProps {
    // We can pass initial state if needed
}

export const MusicWidget: React.FC<MusicWidgetProps> = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<MusicTrack>({ id: '1', title: 'Neural Genesis', artist: 'Muza Core', source: 'GENERATED', duration: '∞', emotion: EmotionType.CURIOUS });
    const [volume, setVolume] = useState(0.5);

    useEffect(() => {
        synthService.stopGenerativeMusic();
        if (isPlaying) {
            synthService.setMasterVolume(volume);
            synthService.playGenerativeTrack(currentTrack.emotion || EmotionType.NEUTRAL);
        }
        return () => synthService.stopGenerativeMusic();
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        synthService.setMasterVolume(volume);
    }, [volume]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="fixed top-28 left-4 z-[160] w-64">
             <div className="glass-card p-2 flex items-center gap-2 shadow-lg border-white/10 rounded-xl">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <Music className={`w-5 h-5 text-pink-400 ${isPlaying ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-white text-xs font-bold truncate">{currentTrack.title}</p>
                    <p className="text-slate-400 text-[10px] truncate">{currentTrack.artist}</p>
                </div>
                <button onClick={togglePlay} className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white shrink-0">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
            </div>
        </div>
    );
};
