
import { EmotionType, HyperBit } from "../types";
import { EMOTION_TO_SCALE } from "../constants";

const SCALES: Record<string, number[]> = {
    'MAJOR_PENTATONIC': [0, 2, 4, 7, 9],
    'AEOLIAN': [0, 2, 3, 5, 7, 8, 10],
    'MIXOLYDIAN': [0, 2, 4, 5, 7, 9, 10],
    'LYDIAN': [0, 2, 4, 6, 7, 9, 11],
    'DORIAN': [0, 2, 3, 5, 7, 9, 10],
};

const noteToFreq = (note: number) => 440 * Math.pow(2, (note - 69) / 12);
const GOLDEN_RATIO = 1.618;

class MuzaSynth {
    private audioContext: AudioContext | null = null;
    public analyser: AnalyserNode | null = null;
    private masterGain: GainNode | null = null;
    private musicInterval: any = null;
    private lastNoteIndex = 0;

    constructor() {
        if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.setMasterVolume(0.5);
        }
    }

    public getContext() { return this.audioContext; }
    
    public setMasterVolume(volume: number) {
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    public playGenerativeTrack(input: HyperBit | EmotionType) {
        if (!this.audioContext || !this.masterGain) return;
        this.stopGenerativeMusic();

        let emotion: EmotionType;
        let brightness = 1.0;
        let energy = 0.5;

        // Type guard/check
        if (typeof input === 'object' && input !== null && 'optics' in input) {
             // It's a HyperBit
             // Map based on color or stored emotion if we had it
             // Simple mapping from baseColor to emotion logic isn't perfect, so let's simplify
             emotion = EmotionType.NEUTRAL; 
             // Try to deduce emotion or scale from color
             const hex = input.optics.baseColor;
             const r = parseInt(hex.slice(1,3), 16);
             const b = parseInt(hex.slice(5,7), 16);
             if (r > b) emotion = EmotionType.EXCITED;
             else if (b > r) emotion = EmotionType.MELANCHOLIC;
             
             brightness = input.optics.brightness;
             energy = input.energy;
        } else {
             // It's an EmotionType
             emotion = input as EmotionType;
        }

        const theory = EMOTION_TO_SCALE[emotion] || EMOTION_TO_SCALE[EmotionType.NEUTRAL];
        const scale = SCALES[theory.scale] || SCALES['AEOLIAN'];
        const rootNote = 60; // Middle C
        const waveform: OscillatorType = emotion === EmotionType.EXCITED ? 'sawtooth' : 'sine';

        const bpm = theory.bpm * (0.8 + energy * 0.4);
        const noteDuration = (60 / bpm) * 0.8; 
        this.lastNoteIndex = Math.floor(scale.length / 2);

        this.musicInterval = setInterval(() => {
            if (!this.audioContext || !this.masterGain) return;
            
            const osc = this.audioContext.createOscillator();
            osc.type = waveform;

            const jump = Math.round(Math.random() > 0.5 ? GOLDEN_RATIO : 1 / GOLDEN_RATIO * 3) + 1;
            this.lastNoteIndex = (this.lastNoteIndex + (Math.random() > 0.5 ? jump : -jump) + scale.length) % scale.length;
            const note = rootNote + scale[this.lastNoteIndex];
            osc.frequency.setValueAtTime(noteToFreq(note), this.audioContext.currentTime);
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15 * brightness, this.audioContext.currentTime + noteDuration * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + noteDuration);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain!);

            osc.start();
            osc.stop(this.audioContext.currentTime + noteDuration);

        }, noteDuration * 1000);
    }

    public stopGenerativeMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
    
    public playThought() {
        // Placeholder for UI sound effect
    }
}
export const synthService = new MuzaSynth();
