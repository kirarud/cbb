import React, { useEffect, useRef, useState } from 'react';
import { Mic, Radio, Activity, StopCircle, Ear, Waves } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { synthService } from '../services/synthService';

interface VoiceProps {
    language: Language;
    onVoiceInput: (text: string) => void;
}

export const Voice: React.FC<VoiceProps> = ({ language, onVoiceInput }) => {
    const t = TRANSLATIONS[language].voice;
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [detectedHz, setDetectedHz] = useState<number>(0);
    const [intonation, setIntonation] = useState<'NEUTRAL' | 'QUESTION' | 'COMMAND'>('NEUTRAL');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const recognitionRef = useRef<any>(null);
    
    // Audio Analysis Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // --- PITCH DETECTION ALGORITHM (Auto-Correlation) ---
    const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
        let SIZE = buf.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) return -1; 

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        const c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + buf[j] * buf[j + i];
            }
        }

        let d = 0; 
        while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        // More accurate pitch estimation (Parabolic interpolation)
        // const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        // const a = (x1 + x3 - 2 * x2) / 2;
        // const b = (x3 - x1) / 2;
        // if (a) T0 -= b / (2 * a);

        return sampleRate / T0;
    };

    // --- SPEECH RECOGNITION SETUP ---
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language === 'ru' ? 'ru-RU' : 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                        onVoiceInput(event.results[i][0].transcript);
                        setIsListening(false);
                        stopMicrophone(); 
                    }
                }
                if (finalTranscript) setTranscript(finalTranscript);
            };

            recognitionRef.current.onend = () => {
                // Only set isListening to false if it was true, to avoid false state changes
                // if recognition was stopped externally (e.g., by stopMicrophone)
                if (isListening) setIsListening(false);
            };
        }
    }, [language, onVoiceInput, isListening]); // Added isListening to dependency array

    const startMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Use synthService.getContext() directly for consistency
            const audioCtx = synthService.getContext();
            if (!audioCtx) throw new Error("AudioContext not available.");
            audioContextRef.current = audioCtx;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 2048;
            analyserRef.current = analyser;

            const microphone = audioCtx.createMediaStreamSource(stream);
            microphone.connect(analyser);

            setIsListening(true);
            recognitionRef.current?.start();
        } catch (e) {
            console.error("Mic Error", e);
        }
    };

    const stopMicrophone = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
        // Stop all tracks on the stream
        // FIX: Safely close audio context by checking if it exists and is not already closed
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        }
        audioContextRef.current = null;
        analyserRef.current = null;
    };

    const toggleListening = () => {
        if (isListening) stopMicrophone();
        else {
            setTranscript('');
            startMicrophone();
        }
    };

    // --- VISUALIZATION LOOP ---
    useEffect(() => {
        // FIX: Declare canvas at the top of the effect scope.
        const canvas = canvasRef.current;

        if (!canvas || !isListening) {
            // Clear canvas and stop animation if not listening
            const ctx = canvas?.getContext('2d'); // Use optional chaining for safety if canvas is null
            if (ctx && canvas) { // Ensure canvas is not null before accessing its width/height
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            cancelAnimationFrame(animationRef.current);
            return;
        }

        // 'canvas' is now guaranteed to be non-null here
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = 2048;
        const dataArray = new Float32Array(bufferLength);
        let time = 0;
        let pitchHistory: number[] = [];

        const animate = () => {
            time += 0.05;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const centerY = canvas.height / 2;

            if (analyserRef.current && audioContextRef.current && audioContextRef.current.state === 'running') {
                analyserRef.current.getFloatTimeDomainData(dataArray);
                const pitch = autoCorrelate(dataArray, audioContextRef.current.sampleRate);
                
                if (pitch !== -1 && pitch > 50 && pitch < 2000) { // Filter out noise and extreme pitches
                    // Use a moving average or more robust pitch detection for better stability
                    const currentPitch = Math.round(pitch);
                    setDetectedHz(currentPitch);
                    pitchHistory.push(currentPitch);
                    if (pitchHistory.length > 30) pitchHistory.shift(); // Keep last 30 samples

                    // Detect Intonation Trend (Rise/Fall)
                    if (pitchHistory.length > 10) { // Require enough samples for a trend
                        const avgStart = pitchHistory.slice(0, 5).reduce((sum, val) => sum + val, 0) / 5;
                        const avgEnd = pitchHistory.slice(-5).reduce((sum, val) => sum + val, 0) / 5;
                        
                        const threshold = 10; // Hz difference to detect change
                        if (avgEnd > avgStart + threshold) setIntonation('QUESTION');
                        else if (avgEnd < avgStart - threshold) setIntonation('COMMAND');
                        else setIntonation('NEUTRAL');
                    }
                }

                // Draw Waveform
                ctx.beginPath();
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 2;
                
                const sliceWidth = canvas.width / bufferLength;
                let x = 0;
                
                for(let i = 0; i < bufferLength; i += 10) { 
                    const v = dataArray[i] * 50; 
                    const y = centerY + v;
                    if(i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    x += sliceWidth * 10;
                }
                ctx.stroke();

            } else {
                // Idle Animation (if analyser not ready or context suspended)
                ctx.beginPath();
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 1;
                ctx.moveTo(0, centerY);
                for (let i = 0; i < canvas.width; i += 10) {
                    ctx.lineTo(i, centerY + Math.sin(time + i * 0.05) * 20);
                }
                ctx.stroke();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => cancelAnimationFrame(animationRef.current);
    }, [isListening, language, onVoiceInput]); // Added language, onVoiceInput to deps for recognition setup

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 relative overflow-hidden bg-slate-950">
             {isListening && <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none"></div>}

            <div className="glass-panel p-8 rounded-3xl border border-slate-700 w-full max-w-lg text-center relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div 
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer ${isListening ? 'bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.3)]' : 'bg-slate-800 hover:bg-slate-700'}`} 
                            onClick={toggleListening}
                        >
                            {isListening ? (
                                <StopCircle className="w-10 h-10 text-red-400 animate-pulse" />
                            ) : (
                                <Mic className="w-8 h-8 text-slate-400" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                     <h2 className="text-2xl font-bold text-white mb-1">{t.title}</h2>
                     <p className="text-slate-400 text-sm">{isListening ? t.listening : t.status}</p>
                     
                     <div className="flex justify-center gap-4 mt-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-mono text-sm border ${detectedHz > 0 ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
                            <Ear className="w-4 h-4" />
                            <span>{detectedHz > 0 ? `${detectedHz} Hz` : '---'}</span>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-mono text-sm border ${isListening ? 'bg-purple-900/50 text-purple-400 border-purple-500' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
                            <Waves className="w-4 h-4" />
                            <span>{intonation}</span>
                        </div>
                     </div>
                </div>

                <div className="h-40 w-full bg-slate-900/50 rounded-xl mb-6 flex items-center justify-center border border-slate-800 relative overflow-hidden flex-col">
                    {!isListening && !transcript && <div className="text-slate-600 text-xs uppercase tracking-widest absolute">{t.speak}</div>}
                    <canvas ref={canvasRef} width={400} height={160} className="w-full h-full absolute top-0 left-0" />
                    {transcript && (
                        <div className="z-10 text-cyan-300 font-mono text-sm px-4 text-center animate-in fade-in slide-in-from-bottom-2 bg-black/50 p-2 rounded">
                            "{transcript}"
                        </div>
                    )}
                </div>

                <div className="text-xs text-slate-500 font-mono border-t border-slate-800 pt-4">
                    SEMANTIC AURAL DECODER ACTIVE
                </div>
            </div>
        </div>
    );
};