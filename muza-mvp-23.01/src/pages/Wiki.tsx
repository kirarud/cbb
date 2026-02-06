
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface WikiProps {
  language: Language;
}

export const Wiki: React.FC<WikiProps> = ({ language }) => {
  const t_wiki = TRANSLATIONS[language].wiki;
  return (
    <div className="p-6 md:p-10 h-full flex items-center justify-center bg-slate-950">
      <div className="text-center text-slate-400">
        <h1 className="text-4xl font-bold text-white mb-4">{t_wiki.title}</h1>
        <p className="text-lg">Wiki content coming soon...</p>
      </div>
    </div>
  );
};