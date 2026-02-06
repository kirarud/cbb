
import React from 'react';
import { MuzaState, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Palette } from 'lucide-react';

interface DesignStudioProps {
    state: MuzaState;
    setMuzaState: React.Dispatch<React.SetStateAction<MuzaState>>;
    language: Language;
    onLog: (msg: string) => void;
}

export const DesignStudio: React.FC<DesignStudioProps> = ({ state, setMuzaState, language, onLog }) => {
    // Reusing store translations for now, as Design Studio will have similar context
    const t = TRANSLATIONS[language].store; 

    return (
        <div className="p-6 md:p-10 h-full flex items-center justify-center bg-slate-950">
            <div className="text-center text-slate-400">
                <Palette className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h1 className="text-4xl font-bold text-white mb-4">Design Studio</h1>
                <p className="text-lg">This module is currently under construction.</p>
                <p className="text-sm mt-2">New UI/UX customization options are evolving.</p>
            </div>
        </div>
    );
};
