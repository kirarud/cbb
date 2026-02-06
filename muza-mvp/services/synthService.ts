
import { EmotionType, Language, MuzaState, VoicePreset, VoicePresetName } from "../types";
import { EMOTION_TO_SCALE, SCALES, NOTE_FREQS } from "../constants";

const VOICE_PRESETS: Record<VoicePresetName, VoicePreset> = {
    'NEBULA': { name: 'NEBULA', basePitch: 140, roughness: 5, breathiness: 0.2, formantShift: 1.0, speedMultiplier: 1.0 },
    'CRYSTAL': { name: 'CRYSTAL', basePitch: 220, roughness: 0, breathiness: 0.05, formantShift: 1.5, speedMultiplier: 1.1 },
    'VOID': { name: 'VOID', basePitch: 60, roughness: 20, breathiness: 0.1, formantShift: 0.6, speedMultiplier: 0.8 },
    'GLITCH': { name: 'GLITCH', basePitch: 180, roughness: 50, breathiness: 0.0, formantShift: 0.5, speedMultiplier: 1.5 },
    'HUMAN_MOCK': { name: 'HUMAN_MOCK', basePitch: 120, roughness: 2, breathiness: 0.1, formantShift: 0.9, speedMultiplier: 1.0 },
    'RUSSIAN_SOUL': { name: 'RUSSIAN_SOUL', basePitch: 100, roughness: 3, breathiness: 0.15, formantShift: 0.95, speedMultiplier: 0.95 },
    'USER_CLONE': { name: 'USER_CLONE', basePitch: 100, roughness: 10, breathiness: 0.1, formantShift: 1.0, speedMultiplier: 1.0 },
    'ECO_SYNTH': { name: 'ECO_SYNTH', basePitch: 300, roughness: 0, breathiness: 0.3, formantShift: 1.2, speedMultiplier: 1.1 },
    'ABYSS_WHISPER': { name: 'ABYSS_WHISPER', basePitch: 50, roughness: 80, breathiness: 0.5, formantShift: 0.6, speedMultiplier: 0.7 },
    'BINARY_FRACTURE': { name: 'BINARY_FRACTURE', basePitch: 150, roughness: 40, breathiness: 0.0, formantShift: 0.4, speedMultiplier: 1.3 },
};

class MuzaSynth {
    private ctx: AudioContext | null = null;
    private synthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private masterGain: GainNode | null = null;
    private musicNodes: AudioNode[] = []; // Track loop nodes to stop them
    private musicInterval: any = null;
    private generativeActive = false;
    private generativeEmotion: EmotionType | null = null;

    private f1: BiquadFilterNode | null = null;
    private f2: BiquadFilterNode | null = null;

    public analyser: AnalyserNode | null = null; 

    constructor() {
        this.synthesis = window.speechSynthesis;
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
            };
            this.voices = this.synthesis.getVoices();
        }
    }

    public getContext(): AudioContext | null {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    private initQuantumAudio() {
        if (!this.ctx) this.getContext();
        if (!this.ctx) return;
        
        if (!this.masterGain) {
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5; // Default volume
            
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 2048;

            this.f1 = this.ctx.createBiquadFilter();
            this.f1.type = 'bandpass';
            this.f1.Q.value = 6;

            this.f2 = this.ctx.createBiquadFilter();
            this.f2.type = 'bandpass';
            this.f2.Q.value = 6;

            this.f1.connect(this.masterGain);
            this.f2.connect(this.masterGain);
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);
        }
    }

    public setMasterVolume(val: number) {
        if (this.masterGain && Number.isFinite(val)) {
            // Linear ramp for smooth volume change
            this.masterGain.gain.cancelScheduledValues(0);
            this.masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, val)), this.ctx!.currentTime + 0.1);
        }
    }

    public stopGenerativeMusic() {
        if (this.musicInterval) clearInterval(this.musicInterval);
        this.musicNodes.forEach(node => {
            try { (node as any).stop(); } catch(e) {}
            try { node.disconnect(); } catch(e) {}
        });
        this.musicNodes = [];
        this.generativeActive = false;
        this.generativeEmotion = null;
    }

    // Procedural Music Generation based on Emotion using Music Theory
    public async playGenerativeTrack(emotion: EmotionType) {
        this.initQuantumAudio();
        if (!this.ctx || !this.masterGain) return;
        this.stopGenerativeMusic(); 
        await this.ctx.resume();
        this.generativeActive = true;
        this.generativeEmotion = emotion;

        const config = EMOTION_TO_SCALE[emotion];
        const scaleNotes = SCALES[config.scale];
        const bpm = config.bpm;
        const noteDuration = 60 / bpm; // Seconds per beat

        const now = this.ctx.currentTime;
        
        // --- 1. DRONE (Root Note) ---
        const rootNote = scaleNotes[0];
        const rootFreq = NOTE_FREQS[rootNote];
        
        if (Number.isFinite(rootFreq)) {
            const bass = this.ctx.createOscillator();
            bass.type = 'triangle';
            bass.frequency.value = rootFreq / 2; // Sub-octave
            const bassGain = this.ctx.createGain();
            bassGain.gain.value = 0.2;
            bass.connect(bassGain);
            bassGain.connect(this.masterGain);
            bass.start(now);
            this.musicNodes.push(bass);
        }

        // --- 2. MELODY SEQUENCER ---
        const playNote = (time: number, freq: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
            if (!Number.isFinite(freq)) return;

            const osc = this.ctx!.createOscillator();
            osc.type = type;
            osc.frequency.value = freq;
            
            const env = this.ctx!.createGain();
            env.gain.setValueAtTime(0, time);
            env.gain.linearRampToValueAtTime(volume, time + 0.05); // Attack
            env.gain.exponentialRampToValueAtTime(0.001, time + noteDuration); // Decay

            osc.connect(env);
            env.connect(this.masterGain!);
            osc.start(time);
            osc.stop(time + noteDuration + 0.1);
            
            // Cleanup visually only, nodes garbage collect themselves after stop
        };

        let beat = 0;
        this.musicInterval = setInterval(() => {
            const lookahead = 0.1;
            const nextTime = this.ctx!.currentTime + lookahead;
            
            // Choose a random note from the scale
            const noteIdx = Math.floor(Math.random() * scaleNotes.length);
            const freq = NOTE_FREQS[scaleNotes[noteIdx]];
            
            // Rhythm Logic based on emotion
            const isBusy = emotion === EmotionType.EXCITED || emotion === EmotionType.HAPPY;
            const chance = isBusy ? 0.8 : 0.4;

            if (Math.random() < chance) {
                playNote(nextTime, freq, 'sine', 0.15);
            }

            // Occasional Chord/Pad
            if (beat % 4 === 0) {
                const thirdIdx = (noteIdx + 2) % scaleNotes.length;
                playNote(nextTime, NOTE_FREQS[scaleNotes[thirdIdx]], 'triangle', 0.05);
            }

            beat++;
        }, noteDuration * 1000); 
    }

    public isGenerativeActive() {
        return this.generativeActive;
    }

    public getGenerativeEmotion() {
        return this.generativeEmotion;
    }

    private playNative(text: string, state: MuzaState, language: Language) {
        if (!this.synthesis) return;
        this.synthesis.cancel();

        const cleanText = text.replace(/```[\s\S]*?```/g, "").replace(/[*#_`]/g, '').trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const isRussian = language === 'ru';
        utterance.lang = isRussian ? 'ru-RU' : 'en-US';
        
        let voice = this.voices.find(v => v.lang.includes(isRussian ? 'ru' : 'en'));
        if (voice) utterance.voice = voice;

        const preset = VOICE_PRESETS[state.voicePreset] || VOICE_PRESETS['NEBULA'];
        utterance.pitch = Math.max(0.1, Math.min(2, preset.basePitch / 120)); 
        utterance.rate = preset.speedMultiplier;

        this.synthesis.speak(utterance);
    }

    public async playThought(text: string, state: MuzaState, language: Language) {
        this.initQuantumAudio();
        this.playNative(text, state, language);
    }

    public async playTrainingSession(audioBlob: Blob, emotion: EmotionType, synchronization: number) {
        // Implementation for training playback (simplified for this update)
    }
}

export const synthService = new MuzaSynth();
